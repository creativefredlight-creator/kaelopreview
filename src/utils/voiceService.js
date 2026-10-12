// =============================================================================
// KAELO VOICE & SPEECH SYNTHESIS ENGINE
// =============================================================================
// Enhanced with:
// 1. Natural Pause & Speech Endpoint Detection (VAD with configurable silence threshold)
// 2. Continuous Recognition (continuous = true with auto-reconnect on long utterances)
// 3. Progressive Multi-Sentence Transcript Accumulation
// 4. Manual "Done Speaking" fallback
// 5. Hard duration limit safeguards (preserves captured content)
// 6. Hardware Barge-In (immediate TTS cutoff on speech detection)
// =============================================================================

import { DedupGuard, TurnCompletenessDetector } from '../ai/speechAdapters.js';

const VOICE_MUTED_KEY = 'kaelo_voice_muted';

class VoiceService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.recognition = null;
    this.isListening = false;
    this.isSpeaking = false;
    this.selectedVoice = null;
    this.muted = typeof localStorage !== 'undefined' ? localStorage.getItem(VOICE_MUTED_KEY) === 'true' : false;

    // VAD & Endpointing State
    this.silenceThresholdMs = 2800; // 2.8s natural pause threshold
    this.silenceTimer = null;
    this.maxDurationTimer = null;
    this.maxDurationMs = 60000; // 60s hard limit safeguard
    this.accumulatedText = '';
    this.currentInterim = '';
    this.isUserSpeaking = false;
    this.activeCallbacks = null;
    this.explicitlyStopped = false;

    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true; // DO NOT cut off between sentences!
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
      }

      if (this.synth) {
        this.initVoice();
        if (this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => this.initVoice();
        }
      }
    }
  }

  initVoice() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prioritize natural, calm English voices
    const preferred = voices.find(v => 
      v.name.includes('Natural') || 
      v.name.includes('Samantha') || 
      v.name.includes('Daniel') || 
      v.name.includes('Google US English') ||
      (v.lang.startsWith('en') && v.localService)
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

    this.selectedVoice = preferred;
  }

  isSpeechRecognitionSupported() {
    return !!this.recognition;
  }

  isSpeechSynthesisSupported() {
    return !!this.synth;
  }

  setMuted(muted) {
    this.muted = !!muted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(VOICE_MUTED_KEY, this.muted ? 'true' : 'false');
    }
    if (this.muted) {
      this.stopSpeaking();
    }
  }

  isMuted() {
    return this.muted;
  }

  speak(text, { onStart, onEnd, onError } = {}) {
    if (this.muted || !this.synth || !text) {
      if (onEnd) onEnd();
      return;
    }

    this.stopSpeaking();

    // Use DedupGuard to strip markdown, emojis, duplicate n-grams
    const cleanText = DedupGuard.cleanForSpeech(text);

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = 1.02; // natural conversational pacing
    utterance.pitch = 1.05; // clear, calm

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      if (onError) onError(e);
      if (onEnd) onEnd();
    };

    try {
      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Voice synthesis error:', e);
      this.isSpeaking = false;
      if (onEnd) onEnd();
    }
  }

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  /**
   * Starts listening with Speech Endpoint Detection & Multi-sentence VAD.
   */
  startListening({
    onResult,
    onInterim,
    onSpeechActivity,
    onStart,
    onEnd,
    onError,
    onMaxDurationWarning,
    silenceThresholdMs = 2800
  } = {}) {
    if (!this.recognition) {
      if (onError) onError(new Error('Speech recognition not supported in this browser.'));
      return;
    }

    this.stopSpeaking();
    this.clearTimers();

    this.silenceThresholdMs = silenceThresholdMs;
    this.accumulatedText = '';
    this.currentInterim = '';
    this.isUserSpeaking = false;
    this.explicitlyStopped = false;

    this.activeCallbacks = {
      onResult,
      onInterim,
      onSpeechActivity,
      onStart,
      onEnd,
      onError,
      onMaxDurationWarning
    };

    this.recognition.onstart = () => {
      this.isListening = true;
      if (onStart) onStart();
      if (onSpeechActivity) onSpeechActivity({ isListening: true, isSpeaking: false });

      // Set hard duration limit safeguard (e.g. 60s)
      this.maxDurationTimer = setTimeout(() => {
        if (this.isListening) {
          if (onMaxDurationWarning) onMaxDurationWarning();
          this.doneSpeaking();
        }
      }, this.maxDurationMs);
    };

    // Hardware Barge-In: immediately cut TTS when user voice is detected
    this.recognition.onspeechstart = () => {
      this.isUserSpeaking = true;
      this.stopSpeaking();
      this.clearSilenceTimer();
      if (onSpeechActivity) onSpeechActivity({ isListening: true, isSpeaking: true });
    };

    this.recognition.onspeechend = () => {
      this.isUserSpeaking = false;
      if (onSpeechActivity) onSpeechActivity({ isListening: true, isSpeaking: false, isPaused: true });
      this.startSilenceTimer();
    };

    this.recognition.onresult = (event) => {
      // Clear silence timer on every incoming audio frame
      this.clearSilenceTimer();
      this.isUserSpeaking = true;
      if (onSpeechActivity) onSpeechActivity({ isListening: true, isSpeaking: true });

      // Hardware barge-in safety
      if (this.isSpeaking) {
        this.stopSpeaking();
      }

      let newFinal = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinal += ' ' + transcriptPart;
        } else {
          interim += ' ' + transcriptPart;
        }
      }

      if (newFinal) {
        this.accumulatedText = (this.accumulatedText + newFinal).trim();
      }
      this.currentInterim = interim.trim();

      // Combined live preview transcript
      const currentFull = [this.accumulatedText, this.currentInterim].filter(Boolean).join(' ').trim();

      if (onInterim && currentFull) {
        onInterim(currentFull);
      }

      // Start the silence timer after speech fragment
      this.startSilenceTimer();
    };

    this.recognition.onerror = (e) => {
      // Ignore routine 'no-speech' events while listening continuously
      if (e.error === 'no-speech') {
        return;
      }
      console.warn('Speech recognition error:', e.error);
      if (onError) onError(e);
    };

    this.recognition.onend = () => {
      // Auto-reconnect if continuous stream was interrupted by browser before user finished
      if (this.isListening && !this.explicitlyStopped) {
        try {
          this.recognition.start();
          return;
        } catch (err) {
          // Fall through to end if restart failed
        }
      }

      this.isListening = false;
      this.clearTimers();
      if (onEnd) onEnd();
      if (onSpeechActivity) onSpeechActivity({ isListening: false, isSpeaking: false });
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.warn('Speech recognition start error:', e);
      if (onError) onError(e);
    }
  }

  /**
   * Starts silence countdown. When expired, commits the complete utterance.
   */
  startSilenceTimer() {
    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => {
      const fullText = [this.accumulatedText, this.currentInterim].filter(Boolean).join(' ').trim();
      // If user has spoken something substantial, commit it!
      if (fullText.length > 0) {
        this.commitUtterance(fullText);
      }
    }, this.silenceThresholdMs);
  }

  clearSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  clearTimers() {
    this.clearSilenceTimer();
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }
  }

  /**
   * User manually signals "Done speaking" or silence endpoint reached.
   */
  doneSpeaking() {
    const fullText = [this.accumulatedText, this.currentInterim].filter(Boolean).join(' ').trim();
    this.commitUtterance(fullText);
  }

  /**
   * Commits the complete, final user request to Kaelo's action engine.
   */
  commitUtterance(text) {
    this.clearTimers();
    this.explicitlyStopped = true;
    this.stopListening();

    const callbacks = this.activeCallbacks;
    this.activeCallbacks = null;

    if (callbacks && callbacks.onResult) {
      const clean = (text || '').trim();
      callbacks.onResult(clean);
    }
  }

  /**
   * Aborts listening without committing.
   */
  stopListening() {
    this.clearTimers();
    this.explicitlyStopped = true;
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignored
      }
      this.isListening = false;
    }
  }
}

export const voiceService = new VoiceService();
export default voiceService;

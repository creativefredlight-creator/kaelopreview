// -----------------------------------------------------------------------------
// KAELO SPEECH ADAPTERS & PIPELINE CONTROLLERS (Part A of Build Brief)
// Pluggable ASR, TTS, Barge-In, Dedup Guard, and Turn-Completeness Detection
// -----------------------------------------------------------------------------

/**
 * Base Abstract ASR Adapter Interface
 */
export class ASRAdapter {
  constructor(config = {}) {
    this.config = config;
    this.customVocabulary = new Set();
  }

  setCustomVocabulary(words) {
    words.forEach(w => this.customVocabulary.add(w));
  }

  // Returns { transcript, confidence, wordConfidence, alternates, endpointReason }
  async startStreaming(callbacks) {
    throw new Error('startStreaming must be implemented by concrete ASR adapter');
  }

  stopStreaming() {
    throw new Error('stopStreaming must be implemented');
  }
}

/**
 * Web Speech API ASR Adapter (In-browser default)
 */
export class WebSpeechASRAdapter extends ASRAdapter {
  constructor(config = {}) {
    super(config);
    this.recognition = null;
    this.isListening = false;
  }

  startStreaming({ onInterim, onFinal, onEndpoint, onError }) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (onError) onError(new Error('Speech recognition not supported in this browser.'));
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.config.lang || 'en-US';

    this.recognition.onresult = (event) => {
      let interim = '';
      let finalTranscript = '';
      let confidence = 0.9;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalTranscript += res[0].transcript;
          confidence = res[0].confidence || 0.88;
        } else {
          interim += res[0].transcript;
        }
      }

      if (finalTranscript && onFinal) {
        onFinal({
          transcript: finalTranscript.trim(),
          confidence,
          alternates: []
        });
      } else if (interim && onInterim) {
        onInterim(interim.trim());
      }
    };

    this.recognition.onerror = (err) => {
      if (onError) onError(err);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (onEndpoint) onEndpoint('silence');
    };

    this.recognition.start();
    this.isListening = true;
  }

  stopStreaming() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

/**
 * Base Abstract TTS Adapter Interface
 */
export class TTSAdapter {
  constructor(config = {}) {
    this.config = config;
  }

  async synthesizeStream(sentence, callbacks) {
    throw new Error('synthesizeStream must be implemented');
  }

  cancel() {
    throw new Error('cancel must be implemented');
  }
}

/**
 * Web Speech API TTS Adapter (In-browser default)
 */
export class WebSpeechTTSAdapter extends TTSAdapter {
  constructor(config = {}) {
    super(config);
    this.currentUtterance = null;
  }

  synthesizeStream(sentence, { onStart, onEnd, onError }) {
    if (!('speechSynthesis' in window)) {
      if (onError) onError(new Error('Speech synthesis unsupported'));
      return;
    }

    this.cancel();

    const cleanText = DedupGuard.cleanForSpeech(sentence);
    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = this.config.rate || 1.05;
    utterance.pitch = this.config.pitch || 1.0;
    utterance.lang = this.config.lang || 'en-US';

    utterance.onstart = () => { if (onStart) onStart(); };
    utterance.onend = () => { if (onEnd) onEnd(); };
    utterance.onerror = (e) => { if (onError) onError(e); };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  cancel() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }
}

/**
 * DEDUP GUARD:
 * Before TTS, drop repeated sentences, repeated n-grams, markdown, and customer service openers.
 */
export class DedupGuard {
  static cleanForSpeech(rawText) {
    if (!rawText) return '';

    // 1. Strip markdown, emojis, asterisks, brackets, hashes
    let clean = rawText
      .replace(/[*_#`~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[^\w\s.,!?'"-]/g, '')
      .trim();

    // 2. Drop filler openers forbidden by standard: "Sure!", "Absolutely!", "Great question!"
    clean = clean.replace(/^(Sure[!,.]?|Absolutely[!,.]?|Great question[!,.]?|Definitely[!,.]?)\s*/i, '');

    // 3. Drop repeated consecutive sentences or phrases
    const sentences = clean.split(/(?<=[.!?])\s+/);
    const seenSentences = new Set();
    const uniqueSentences = [];

    for (const s of sentences) {
      const normalized = s.toLowerCase().trim().replace(/[.!?]+$/, '');
      if (normalized && !seenSentences.has(normalized)) {
        seenSentences.add(normalized);
        uniqueSentences.push(s.trim());
      }
    }

    clean = uniqueSentences.join(' ');

    // 4. Drop repeated adjacent n-grams (e.g. "done done", "tomorrow tomorrow")
    clean = clean.replace(/\b(\w+)\s+\1\b/gi, '$1');

    return clean.trim();
  }
}

/**
 * BARGE-IN CONTROLLER:
 * On user speech, cancel TTS & generation immediately, and tell the model what was and wasn't spoken.
 */
export class BargeInController {
  constructor(ttsAdapter) {
    this.ttsAdapter = ttsAdapter;
    this.spokenSoFar = '';
    this.fullPreparedReply = '';
    this.isBargeInActive = false;
  }

  startTurn(fullReply) {
    this.spokenSoFar = '';
    this.fullPreparedReply = fullReply;
    this.isBargeInActive = false;
  }

  recordSpoken(sentence) {
    this.spokenSoFar += (this.spokenSoFar ? ' ' : '') + sentence;
  }

  onUserSpeechDetected() {
    this.isBargeInActive = true;
    if (this.ttsAdapter) {
      this.ttsAdapter.cancel();
    }
    return {
      interrupted: true,
      assistantSpokenSoFar: this.spokenSoFar,
      unspokenRemainder: this.fullPreparedReply.slice(this.spokenSoFar.length).trim()
    };
  }
}

/**
 * TURN COMPLETENESS CHECK:
 * Don't respond to a trailing-off fragment (e.g. "Can you move the... um...").
 */
export class TurnCompletenessDetector {
  static isCompleteTurn(transcript, options = {}) {
    const text = (transcript || '').trim();
    if (!text) return false;

    // Trailing pauses with ellipsis or hesitation markers
    if (text.endsWith('...') || text.endsWith('um...') || text.endsWith('uh...')) {
      return false;
    }

    if (options.endpointReason === 'pause_detected' && /(the|my|a|an|at|in|on|to|for|with)\.\.\.$/i.test(text)) {
      return false;
    }

    // Incomplete trailing prepositions/articles
    if (/\b(the|to|for|with|about|and|or)\s*$/i.test(text) && text.split(/\s+/).length <= 4) {
      return false;
    }

    return true;
  }
}

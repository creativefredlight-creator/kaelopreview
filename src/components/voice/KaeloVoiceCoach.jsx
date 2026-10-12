import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  Zap, 
  Wrench, 
  ArrowRight, 
  Sparkles,
  RotateCcw,
  Square,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import voiceService from '../../utils/voiceService';
import KaeloMascot from '../illustrations/KaeloMascot';
import KaeloLogo from '../ui/KaeloLogo';
import ListingDraftCard from './ListingDraftCard';
import styles from './KaeloVoiceCoach.module.css';

const QUICK_VOICE_PROMPTS = [
  "List 2-bed apartment in Lekki",
  "Actually make price ₦180,000",
  "Add 1 hour study tonight",
  "Move website task to tomorrow",
  "What's next?",
  "Fix my day",
  "Lock me in"
];

const KaeloVoiceCoach = () => {
  const { state, dispatch } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(voiceService.isMuted());
  const [transcript, setTranscript] = useState('');
  const [lastPrompt, setLastPrompt] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const messages = state.chatMessages || [];
  const latestAiMessage = messages.filter(m => m.sender === 'kaelo').slice(-1)[0] || {
    text: "Hey, I'm listening. Tell me what's on your mind or what you're working toward today.",
    spokenText: "Hey, I'm listening. Tell me what's on your mind or what you're working toward today.",
    actions: ['WHAT_NEXT', 'REBALANCE']
  };

  const isRecognitionSupported = voiceService.isSpeechRecognitionSupported();
  const pendingSpeechRef = useRef(false);
  const prevMsgIdRef = useRef(latestAiMessage?.id);

  useEffect(() => {
    // When the voice coach opens, speak greeting or latest response if not muted
    if (!voiceService.isMuted() && latestAiMessage) {
      setIsSpeaking(true);
      const textToSpeak = latestAiMessage.spokenText || latestAiMessage.text;
      voiceService.speak(textToSpeak, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }

    return () => {
      voiceService.stopListening();
      voiceService.stopSpeaking();
    };
  }, []);

  // Reactively speak the new AI response when it arrives from state dispatch
  useEffect(() => {
    if (pendingSpeechRef.current && latestAiMessage && latestAiMessage.id !== prevMsgIdRef.current) {
      pendingSpeechRef.current = false;
      prevMsgIdRef.current = latestAiMessage.id;
      if (!isMuted) {
        setIsSpeaking(true);
        const textToSpeak = latestAiMessage.spokenText || latestAiMessage.text;
        voiceService.speak(textToSpeak, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false)
        });
      }
    }
  }, [latestAiMessage, isMuted]);

  const handleDoneSpeaking = () => {
    if (isListening) {
      voiceService.doneSpeaking();
    }
  };

  const handleToggleMic = () => {
    if (isListening) {
      voiceService.doneSpeaking();
    } else {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
      setTranscript('');
      setErrorMsg(null);

      voiceService.startListening({
        onStart: () => setIsListening(true),
        onInterim: (interim) => setTranscript(interim),
        onResult: (finalText) => {
          setIsListening(false);
          setTranscript(finalText);
          submitUserSpeech(finalText);
        },
        onError: (err) => {
          setIsListening(false);
          setErrorMsg("Couldn't hear you clearly. Tap the mic to try again.");
        },
        onEnd: () => setIsListening(false),
      });
    }
  };

  const submitUserSpeech = (text) => {
    if (!text.trim()) return;
    setLastPrompt(text);
    voiceService.stopSpeaking();
    setIsSpeaking(false);
    pendingSpeechRef.current = true;

    dispatch({
      type: 'SEND_AI_MESSAGE',
      payload: { text: text.trim() }
    });
  };

  const handleQuickPrompt = (promptText) => {
    voiceService.stopSpeaking();
    setIsSpeaking(false);
    voiceService.stopListening();
    setIsListening(false);
    setTranscript(promptText);
    submitUserSpeech(promptText);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    voiceService.setMuted(nextMuted);
    if (nextMuted) {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
    }
  };

  const handleStopSpeaking = () => {
    voiceService.stopSpeaking();
    setIsSpeaking(false);
  };

  const handleActionClick = (action) => {
    voiceService.stopSpeaking();
    setIsSpeaking(false);

    if (action === 'START_NEXT') {
      const pending = state.tasks?.find(t => t.status !== 'completed');
      if (pending) {
        dispatch({ type: 'SET_ACTIVE_FOCUS', payload: pending });
        dispatch({ type: 'CLOSE_VOICE_COACH' });
      }
    } else if (action === 'REBALANCE') {
      dispatch({ type: 'APPLY_AI_REBALANCE' });
    } else if (action === 'SCHEDULE_FITTING') {
      submitUserSpeech("Schedule fitting time");
    } else if (action === 'SCHEDULE_ANYWAY') {
      submitUserSpeech("Schedule full duration anyway");
    } else if (action === 'SHOW_WHY') {
      submitUserSpeech("Why did you prioritize those specific tasks?");
    } else if (action === 'CREATE_QUEST') {
      submitUserSpeech("Break down this goal into a realistic quest.");
    } else if (action === 'CONFIRM_LISTING') {
      submitUserSpeech("Yes, create it");
    } else if (action === 'CANCEL_LISTING') {
      submitUserSpeech("Cancel");
    }
  };

  const handleClose = () => {
    voiceService.stopListening();
    voiceService.stopSpeaking();
    dispatch({ type: 'CLOSE_VOICE_COACH' });
  };

  return (
    <AnimatePresence>
      <motion.div 
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className={styles.ambientBackdrop} />

        {/* Top Control Bar */}
        <header className={styles.topBar}>
          <div className={styles.coachBrand} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--kaelo-purple)" />
            <KaeloLogo size={16} showAI={true} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary, #9CA3AF)', letterSpacing: '0.04em' }}>VOICE COACH</span>
          </div>

          <div className={styles.topActions}>
            <button 
              className={styles.iconBtn} 
              onClick={handleToggleMute}
              title={isMuted ? 'Unmute voice' : 'Mute voice'}
              aria-label={isMuted ? 'Unmute voice' : 'Mute voice'}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button 
              className={styles.iconBtn} 
              onClick={handleClose}
              title="Close Voice Coach"
              aria-label="Close Voice Coach"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Center Mascot & Wave Stage */}
        <main className={styles.mainStage}>
          <div className={styles.orbStage}>
            {/* Visual Aura Pulses */}
            <motion.div 
              className={`${styles.haloRing} ${isListening ? styles.listeningHalo : isSpeaking ? styles.speakingHalo : styles.idleHalo}`}
              animate={{
                scale: isListening ? [1, 1.25, 1] : isSpeaking ? [1, 1.15, 1] : [1, 1.05, 1],
                opacity: isListening ? [0.6, 1, 0.6] : isSpeaking ? [0.5, 0.9, 0.5] : [0.3, 0.5, 0.3]
              }}
              transition={{ repeat: Infinity, duration: isListening ? 1.4 : isSpeaking ? 1.8 : 3.2 }}
            />

            <div className={styles.mascotHolder}>
              <KaeloMascot 
                variant={isSpeaking ? "celebrate" : isListening ? "focus" : "avatar"} 
                size={100} 
              />
            </div>
          </div>

          {/* Status Label */}
          <div className={styles.statusLabelRow}>
            {isListening && (
              <span className={styles.listeningStatus}>
                <span className={styles.pulseDot} /> Listening... Speak naturally (you can pause to think)
              </span>
            )}
            {isSpeaking && (
              <span className={styles.speakingStatus}>
                <Volume2 size={14} className={styles.audioIcon} /> Kaelo speaking
              </span>
            )}
            {!isListening && !isSpeaking && (
              <span className={styles.idleStatus}>
                Tap microphone to talk to Kaelo
              </span>
            )}
          </div>

          {/* Audio Waveform Visualization when speaking */}
          {isSpeaking && (
            <div className={styles.waveformRow}>
              {[0.4, 0.8, 1.2, 0.6, 1.0, 0.5, 0.9, 0.3].map((delay, idx) => (
                <motion.span 
                  key={idx}
                  className={styles.waveformBar}
                  animate={{ scaleY: [0.3, 1.2, 0.3] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: delay * 0.2 }}
                />
              ))}
            </div>
          )}

          {/* Transcript / AI Response Bubble */}
          <div className={styles.conversationCard}>
            {transcript && (
              <p className={styles.userTranscript}>
                "{transcript}"
              </p>
            )}

            <p className={styles.aiResponseText}>
              {latestAiMessage.text}
            </p>

            {/* Structured Real Estate Listing Draft Card */}
            {state.activeListingDraft && (
              <ListingDraftCard 
                draft={state.activeListingDraft}
                onConfirm={() => submitUserSpeech("Yes, create it")}
                onCancel={() => submitUserSpeech("Cancel")}
              />
            )}

            {/* Contextual Action Buttons */}
            {latestAiMessage.actions && latestAiMessage.actions.length > 0 && (
              <div className={styles.actionPillsRow}>
                {latestAiMessage.actions.includes('SCHEDULE_FITTING') && (
                  <button 
                    className={`${styles.actionBtn} ${styles.primaryActionBtn}`}
                    onClick={() => handleActionClick('SCHEDULE_FITTING')}
                  >
                    <Zap size={14} /> SCHEDULE FITTING TIME
                  </button>
                )}
                {latestAiMessage.actions.includes('SCHEDULE_ANYWAY') && (
                  <button 
                    className={styles.actionBtn}
                    onClick={() => handleActionClick('SCHEDULE_ANYWAY')}
                  >
                    SCHEDULE ANYWAY
                  </button>
                )}
                {latestAiMessage.actions.includes('START_NEXT') && (
                  <button 
                    className={`${styles.actionBtn} ${styles.primaryActionBtn}`}
                    onClick={() => handleActionClick('START_NEXT')}
                  >
                    <Zap size={14} /> [ START MISSION ]
                  </button>
                )}
                {latestAiMessage.actions.includes('REBALANCE') && (
                  <button 
                    className={`${styles.actionBtn} ${styles.rebalanceActionBtn}`}
                    onClick={() => handleActionClick('REBALANCE')}
                  >
                    <Wrench size={14} /> FIX MY DAY
                  </button>
                )}
                {latestAiMessage.actions.includes('SHOW_WHY') && (
                  <button 
                    className={styles.actionBtn}
                    onClick={() => handleActionClick('SHOW_WHY')}
                  >
                    SHOW ME WHY
                  </button>
                )}
              </div>
            )}
          </div>

          {errorMsg && (
            <div className={styles.errorNotice}>
              <span>{errorMsg}</span>
            </div>
          )}
        </main>

        {/* Bottom Control Dock & Prompts */}
        <footer className={styles.bottomDock}>
          {/* Quick Prompts Carousel */}
          <div className={styles.promptsCarousel}>
            {QUICK_VOICE_PROMPTS.map((prompt, idx) => (
              <button 
                key={idx}
                className={styles.promptChip}
                onClick={() => handleQuickPrompt(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Central Microphone Button & Stop Button */}
          <div className={styles.micControlRow}>
            {isSpeaking && (
              <button 
                className={styles.stopSpeechBtn}
                onClick={handleStopSpeaking}
                title="Stop speaking"
              >
                <Square size={16} /> Stop
              </button>
            )}

            {isListening && (
              <button 
                className={styles.doneSpeakingBtn}
                onClick={handleDoneSpeaking}
                title="Done speaking"
              >
                <Check size={16} /> Done Speaking
              </button>
            )}

            <motion.button 
              className={`${styles.micButton} ${isListening ? styles.micActive : ''}`}
              onClick={handleToggleMic}
              whileTap={{ scale: 0.92 }}
              animate={isListening ? { scale: [1, 1.08, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.2 }}
              title={isListening ? "Listening... Tap to send" : "Tap to speak to Kaelo"}
              aria-label="Toggle microphone"
            >
              {isListening ? (
                <MicOff size={28} color="#111111" />
              ) : (
                <Mic size={28} color="#111111" />
              )}
            </motion.button>
          </div>

          <p className={styles.micHint}>
            {isListening ? "Listening... Speak naturally" : "Press microphone to talk"}
          </p>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
};

export default KaeloVoiceCoach;

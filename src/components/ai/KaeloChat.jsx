import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  ArrowRight, 
  Zap, 
  RotateCcw, 
  HelpCircle, 
  Check, 
  Target,
  Clock,
  Flame,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { QUICK_AI_ACTIONS } from '../../data/constants';
import voiceService from '../../utils/voiceService';
import KaeloMascot from '../illustrations/KaeloMascot';
import KaeloLogo from '../ui/KaeloLogo';
import styles from './KaeloChat.module.css';

const KaeloChat = () => {
  const { state, dispatch } = useApp();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const messagesEndRef = useRef(null);

  const messages = state.chatMessages || [];
  const momentum = state.user?.momentum || 84;
  const capacity = state.capacity?.dailyCapacity || 3.3;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      voiceService.stopListening();
      voiceService.stopSpeaking();
    };
  }, []);

  const handleSpeakMessage = (msg) => {
    if (speakingMsgId === msg.id) {
      voiceService.stopSpeaking();
      setSpeakingMsgId(null);
    } else {
      voiceService.stopSpeaking();
      const textToSpeak = msg.spokenText || msg.text;
      voiceService.speak(textToSpeak, {
        onStart: () => setSpeakingMsgId(msg.id),
        onEnd: () => setSpeakingMsgId(null),
        onError: () => setSpeakingMsgId(null),
      });
    }
  };

  const toggleDictation = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    } else {
      if (!voiceService.isSpeechRecognitionSupported()) {
        dispatch({
          type: 'SHOW_TOAST',
          payload: {
            title: 'Mic Not Available',
            message: 'Voice dictation is supported in Chrome, Edge, and Safari.',
            type: 'info'
          }
        });
        return;
      }
      setIsListening(true);
      voiceService.startListening({
        onStart: () => setIsListening(true),
        onInterim: (text) => setInputText(text),
        onResult: (text) => {
          setInputText(text);
          setIsListening(false);
        },
        onEnd: () => setIsListening(false),
        onError: (err) => {
          setIsListening(false);
          console.warn('Speech error:', err);
        }
      });
    }
  };

  const handleSend = (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    setInputText('');
    setIsTyping(true);

    // Simulate realistic AI thought processing before replying
    setTimeout(() => {
      dispatch({
        type: 'SEND_AI_MESSAGE',
        payload: { text: text.trim() }
      });
      setIsTyping(false);
    }, 450);
  };

  const handleActionClick = (action) => {
    if (action === 'REBALANCE') {
      dispatch({ type: 'APPLY_AI_REBALANCE' });
    } else if (action === 'SCHEDULE_FITTING') {
      handleSend("Schedule fitting time");
    } else if (action === 'SCHEDULE_ANYWAY') {
      handleSend("Schedule full duration anyway");
    } else if (action === 'SHOW_WHY') {
      handleSend("Why did you prioritize those specific tasks?");
    } else if (action === 'WHAT_NEXT') {
      handleSend("What should I do next right now?");
    } else if (action === 'KEEP_PLAN') {
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          title: 'Plan Retained',
          message: 'Keeping your planned schedule. Protecting your realistic capacity.',
          type: 'info'
        }
      });
    } else if (action === 'CREATE_QUEST') {
      handleSend("Break down my portfolio ambition into milestones.");
    } else if (action === 'START_NEXT') {
      const pending = state.tasks?.find(t => t.status !== 'completed');
      if (pending) {
        dispatch({ type: 'SET_ACTIVE_FOCUS', payload: pending });
      } else {
        dispatch({
          type: 'SHOW_TOAST',
          payload: {
            title: 'All Clear!',
            message: 'No pending tasks left for today. High momentum achieved!',
            type: 'achievement'
          }
        });
      }
    }
  };

  const handleClearChat = () => {
    dispatch({ type: 'CLEAR_CHAT' });
    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        title: 'Chat Reset',
        message: 'Started a fresh conversation with Kaelo.',
        type: 'info'
      }
    });
  };

  return (
    <div className={styles.container}>
      {/* AI Assistant Header */}
      <header className={styles.header}>
        <div className={styles.aiIdentity}>
          <div className={styles.mascotAvatarWrapper}>
            <KaeloMascot variant="avatar" size={40} />
            <span className={styles.pulseDot} />
          </div>
          <div className={styles.titleInfo}>
            <div className={styles.titleRow} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <KaeloLogo size={22} showAI={true} />
              <span className={styles.aiBadge}>COPILOT</span>
            </div>
            <p className={styles.status}>
              Knows your day &middot; <span className={styles.momentumBadge}><Flame size={10} /> {momentum} Momentum</span>
            </p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.capacityPill}>
            <Clock size={12} className={styles.capacityIcon} />
            <span>{capacity}h</span>
          </div>

          <button 
            className={styles.voiceCoachBtn}
            onClick={() => dispatch({ type: 'OPEN_VOICE_COACH' })}
            title="Open Kaelo Voice Coach"
            aria-label="Open Kaelo Voice Coach"
          >
            <Mic size={13} className={styles.voiceCoachIcon} />
            <span>VOICE</span>
          </button>

          <button 
            className={styles.resetBtn}
            onClick={handleClearChat}
            title="Reset conversation"
            aria-label="Reset conversation"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </header>

      {/* Messages Thread */}
      <div className={styles.messagesContainer}>
        <div className={styles.thread}>
          {/* Welcome Info Card when starting out */}
          {messages.length <= 1 && (
            <div className={styles.welcomeCard}>
              <div className={styles.welcomeHeader}>
                <Sparkles size={16} className={styles.welcomeIcon} />
                <span>REALISTIC EXECUTION COPILOT</span>
              </div>
              <p className={styles.welcomeText}>
                I track your sleep, work, and commitments to protect your <strong>{capacity}h daily capacity</strong>. Ask me to rebalance your day, plan missions, or explain priorities.
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isKaelo = msg.sender === 'kaelo';
            return (
              <motion.div
                key={msg.id}
                className={`${styles.messageWrapper} ${isKaelo ? styles.kaeloWrapper : styles.userWrapper}`}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {isKaelo && (
                  <div className={styles.senderHeader}>
                    <div className={styles.senderBadge}>
                      <KaeloLogo size={14} showAI={true} />
                      <span className={styles.onlineDot} />
                    </div>
                    <div className={styles.senderControls}>
                      <button
                        className={`${styles.speakBtn} ${speakingMsgId === msg.id ? styles.speakBtnActive : ''}`}
                        onClick={() => handleSpeakMessage(msg)}
                        title={speakingMsgId === msg.id ? "Stop voice" : "Read aloud"}
                        aria-label={speakingMsgId === msg.id ? "Stop voice" : "Read aloud"}
                      >
                        {speakingMsgId === msg.id ? <VolumeX size={12} /> : <Volume2 size={12} />}
                      </button>
                      {msg.timestamp && (
                        <span className={styles.timestamp}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className={`${styles.bubble} ${isKaelo ? styles.kaeloBubble : styles.userBubble}`}>
                  <p className={styles.text}>{msg.text}</p>
                </div>

                {!isKaelo && msg.timestamp && (
                  <span className={styles.userTimestamp}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}

                {/* Contextual Action Buttons */}
                {isKaelo && msg.actions && msg.actions.length > 0 && (
                  <div className={styles.actionButtonsRow}>
                    {msg.actions.includes('SCHEDULE_FITTING') && (
                      <button 
                        className={`${styles.actionBtn} ${styles.rebalanceBtn}`}
                        onClick={() => handleActionClick('SCHEDULE_FITTING')}
                      >
                        <Zap size={13} /> SCHEDULE FITTING TIME
                      </button>
                    )}
                    {msg.actions.includes('SCHEDULE_ANYWAY') && (
                      <button 
                        className={`${styles.actionBtn} ${styles.ghostBtn}`}
                        onClick={() => handleActionClick('SCHEDULE_ANYWAY')}
                      >
                        SCHEDULE ANYWAY
                      </button>
                    )}
                    {msg.actions.includes('REBALANCE') && (
                      <button 
                        className={`${styles.actionBtn} ${styles.rebalanceBtn}`}
                        onClick={() => handleActionClick('REBALANCE')}
                      >
                        <Zap size={13} /> REBALANCE PLAN
                      </button>
                    )}
                    {msg.actions.includes('SHOW_WHY') && (
                      <button 
                        className={`${styles.actionBtn} ${styles.whyBtn}`}
                        onClick={() => handleActionClick('SHOW_WHY')}
                      >
                        <HelpCircle size={13} /> SHOW ME WHY
                      </button>
                    )}
                    {msg.actions.includes('WHAT_NEXT') && (
                      <button 
                        className={`${styles.actionBtn} ${styles.highlightBtn}`}
                        onClick={() => handleActionClick('WHAT_NEXT')}
                      >
                        <ArrowRight size={13} /> WHAT'S NEXT?
                      </button>
                    )}
                    {msg.actions.includes('KEEP_PLAN') && (
                      <button 
                        className={`${styles.actionBtn} ${styles.ghostBtn}`}
                        onClick={() => handleActionClick('KEEP_PLAN')}
                      >
                        <Check size={13} /> KEEP MY PLAN
                      </button>
                    )}
                    {msg.actions.includes('START_NEXT') && (
                      <button 
                        className={`${styles.actionBtn} ${styles.startBtn}`}
                        onClick={() => handleActionClick('START_NEXT')}
                      >
                        <Target size={13} /> START MISSION
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Animated Typing Indicator */}
          {isTyping && (
            <motion.div
              className={`${styles.messageWrapper} ${styles.kaeloWrapper}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className={styles.senderHeader}>
                <div className={styles.senderBadge}>
                  <span className={styles.senderName}>KAELO</span>
                  <span className={styles.thinkingText}>analyzing plan...</span>
                </div>
              </div>
              <div className={`${styles.bubble} ${styles.kaeloBubble} ${styles.typingBubble}`}>
                <span className={styles.typingDot} style={{ animationDelay: '0ms' }} />
                <span className={styles.typingDot} style={{ animationDelay: '180ms' }} />
                <span className={styles.typingDot} style={{ animationDelay: '360ms' }} />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick AI Action Pills */}
      <div className={styles.quickActionsContainer}>
        <div className={styles.quickActionsScroll}>
          {QUICK_AI_ACTIONS.map(action => (
            <button
              key={action.id}
              className={styles.quickPill}
              onClick={() => handleSend(action.prompt)}
            >
              <Sparkles size={11} className={styles.pillSparkle} />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className={styles.inputArea}>
        <form 
          className={styles.inputForm}
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            className={styles.input}
            placeholder={isListening ? "Listening to your voice..." : "Ask Kaelo to adjust, prioritize, or plan..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            type="button"
            className={`${styles.micButton} ${isListening ? styles.micButtonActive : ''}`}
            onClick={toggleDictation}
            title={isListening ? "Stop listening" : "Dictate message"}
            aria-label={isListening ? "Stop listening" : "Dictate message"}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button 
            type="submit" 
            className={styles.sendButton} 
            disabled={!inputText.trim() || isTyping}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default KaeloChat;

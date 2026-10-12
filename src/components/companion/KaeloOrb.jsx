import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Sparkles, 
  Mic, 
  Plus, 
  X, 
  Wrench, 
  HelpCircle, 
  Check,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getRecommendedNextAction, getToday, formatMinutes } from '../../utils/helpers';
import voiceService from '../../utils/voiceService';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import AddTaskModal from '../today/AddTaskModal';
import styles from './KaeloOrb.module.css';

const KaeloOrb = () => {
  const { state, dispatch } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [showNextModal, setShowNextModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isListeningQuick, setIsListeningQuick] = useState(false);
  const [quickTranscript, setQuickTranscript] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const orbRef = useRef(null);

  const todayStr = getToday();
  const todayTasks = (state.tasks || []).filter(t => 
    t.date === 'today' || t.scheduledDate === todayStr || (!t.date && !t.scheduledDate)
  );
  const totalCapacityMinutes = Math.round((state.capacity?.dailyCapacity || 3.3) * 60);
  const usedMinutes = todayTasks.reduce((s, t) => s + (t.estimatedMinutes || t.duration || 30), 0);
  const isOver = usedMinutes > totalCapacityMinutes;

  const hasMissedTasks = (state.tasks || []).some(t => t.status === 'missed');
  const hasOverdueGoals = (state.goals || []).some(g => g.status === 'behind' || g.status === 'at_risk');
  const isBehindTarget = isOver || state.streakRisk === true || hasMissedTasks || hasOverdueGoals;

  const nextAction = getRecommendedNextAction(todayTasks, totalCapacityMinutes, state.goals || []);

  const orbState = state.orbState || (isBehindTarget ? 'important' : 'idle');

  // Don't render Orb if toggled off in settings or during Focus Mode
  if (state.orbVisible === false || state.activeFocus) {
    return null;
  }

  const handleOrbClick = () => {
    setIsOpen(prev => !prev);
  };

  const handleStartNextFocus = () => {
    if (nextAction.task) {
      dispatch({ type: 'SET_ACTIVE_FOCUS', payload: nextAction.task });
      setIsOpen(false);
      setShowNextModal(false);
    }
  };

  const handleOpenVoice = () => {
    dispatch({ type: 'OPEN_VOICE_COACH' });
    setIsOpen(false);
  };

  const handleStartQuickVoice = () => {
    if (isListeningQuick) {
      voiceService.stopListening();
      setIsListeningQuick(false);
      dispatch({ type: 'SET_ORB_STATE', payload: 'idle' });
      return;
    }

    if (!voiceService.isSpeechRecognitionSupported()) {
      handleOpenVoice();
      return;
    }

    setIsListeningQuick(true);
    setQuickTranscript('');
    dispatch({ type: 'SET_ORB_STATE', payload: 'listening' });

    voiceService.startListening({
      onStart: () => setIsListeningQuick(true),
      onInterim: (text) => setQuickTranscript(text),
      onResult: (text) => {
        setIsListeningQuick(false);
        setQuickTranscript(text);
        dispatch({ type: 'SET_ORB_STATE', payload: 'thinking' });

        // Execute action command through Kaelo intelligence!
        dispatch({ type: 'SEND_AI_MESSAGE', payload: { text } });

        setTimeout(() => {
          setIsOpen(false);
          dispatch({ type: 'SET_ORB_STATE', payload: 'idle' });
        }, 1200);
      },
      onEnd: () => {
        setIsListeningQuick(false);
        dispatch({ type: 'SET_ORB_STATE', payload: 'idle' });
      },
      onError: () => {
        setIsListeningQuick(false);
        dispatch({ type: 'SET_ORB_STATE', payload: 'idle' });
      }
    });
  };

  const handleFixDay = () => {
    dispatch({ type: 'APPLY_AI_REBALANCE' });
    setIsOpen(false);
  };

  return (
    <>
      <div className={styles.orbPortal}>
        {/* Floating Draggable Orb */}
        <motion.div
          ref={orbRef}
          className={`${styles.orbWrapper} ${styles[orbState] || styles.idle} ${isBehindTarget ? styles.behindAura : ''}`}
          drag
          dragConstraints={{ left: -260, right: 20, top: -450, bottom: 60 }}
          dragElastic={0.1}
          dragMomentum={false}
          whileTap={{ scale: 0.93 }}
          onClick={handleOrbClick}
          aria-label="Kaelo Companion Orb"
        >
          {/* Ambient State Glow Rings */}
          <div className={styles.outerAura} />
          <div className={styles.innerAura} />

          {/* Center Mascot Sphere: Purple default, Red ONLY when falling behind target */}
          <div className={styles.mascotCore}>
            <img 
              src={isBehindTarget ? "/assets/kaelo-avatar-red.png" : "/assets/kaelo-avatar.png"} 
              alt={isBehindTarget ? "Kaelo Warning Orb" : "Kaelo Orb"} 
              className={styles.avatarImg}
              draggable="false"
            />
          </div>

          {/* Attention Badge for Over Capacity or Upcoming Action */}
          {(isOver || isBehindTarget) && !isOpen && (
            <span className={styles.alertDot} title={isOver ? "Over capacity - tap to fix" : "Target needs attention"} />
          )}

          {orbState === 'speaking' && (
            <div className={styles.speakingWave}>
              <span className={styles.waveBar} />
              <span className={styles.waveBar} />
              <span className={styles.waveBar} />
            </div>
          )}
        </motion.div>

        {/* Compact Quick Actions Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              className={styles.menuCard}
              initial={{ opacity: 0, scale: 0.85, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 15 }}
              transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            >
              <div className={styles.menuHeader}>
                <div className={styles.headerTitleRow}>
                  <Sparkles size={13} color="var(--kaelo-purple)" />
                  <span className={styles.menuTitle}>KAELO QUICK ACTIONS</span>
                </div>
                <button 
                  className={styles.menuCloseBtn} 
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Status Context Pill */}
              <div className={styles.contextPill}>
                <span className={styles.statusDot} />
                <span>
                  {isOver 
                    ? `Over capacity (+${formatMinutes(usedMinutes - totalCapacityMinutes)})`
                    : `${(usedMinutes/60).toFixed(1)}h / ${(totalCapacityMinutes/60).toFixed(1)}h planned`}
                </span>
              </div>

              {/* Quick Voice Command Bar */}
              <div className={styles.quickVoiceBar}>
                <button 
                  className={`${styles.quickVoiceBtn} ${isListeningQuick ? styles.quickVoiceBtnActive : ''}`}
                  onClick={handleStartQuickVoice}
                  title={isListeningQuick ? "Listening... speak command" : "Speak command to Kaelo"}
                  aria-label="Speak command to Kaelo"
                >
                  <Mic size={15} />
                  <span>{isListeningQuick ? (quickTranscript || "Listening...") : "Speak a command..."}</span>
                </button>
                <button 
                  className={styles.fullVoiceBtn}
                  onClick={handleOpenVoice}
                  title="Open Voice Coach"
                  aria-label="Open Voice Coach"
                >
                  <Sparkles size={14} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className={styles.actionsList}>
                {/* 1. What's Next? */}
                <button 
                  className={styles.actionItem}
                  onClick={() => {
                    setShowNextModal(true);
                    setIsOpen(false);
                  }}
                >
                  <div className={`${styles.actionIconBox} ${styles.iconLime}`}>
                    <Zap size={16} />
                  </div>
                  <div className={styles.actionText}>
                    <span className={styles.actionLabel}>What's Next?</span>
                    <span className={styles.actionSub}>Single best priority move</span>
                  </div>
                  <ChevronRight size={14} className={styles.actionArrow} />
                </button>

                {/* 2. Lock Me In (Focus) */}
                <button 
                  className={styles.actionItem}
                  onClick={handleStartNextFocus}
                  disabled={!nextAction.task}
                >
                  <div className={`${styles.actionIconBox} ${styles.iconPurple}`}>
                    <Sparkles size={16} />
                  </div>
                  <div className={styles.actionText}>
                    <span className={styles.actionLabel}>Lock Me In</span>
                    <span className={styles.actionSub}>
                      {nextAction.task ? `Start ${nextAction.task.title.slice(0, 18)}...` : 'All missions done'}
                    </span>
                  </div>
                  <ChevronRight size={14} className={styles.actionArrow} />
                </button>

                {/* 3. Talk to Kaelo (Voice Coach) */}
                <button 
                  className={styles.actionItem}
                  onClick={handleOpenVoice}
                >
                  <div className={`${styles.actionIconBox} ${styles.iconBlue}`}>
                    <Mic size={16} />
                  </div>
                  <div className={styles.actionText}>
                    <span className={styles.actionLabel}>Talk to Kaelo</span>
                    <span className={styles.actionSub}>Natural voice conversation</span>
                  </div>
                  <ChevronRight size={14} className={styles.actionArrow} />
                </button>

                {/* 4. Add Mission */}
                <button 
                  className={styles.actionItem}
                  onClick={() => {
                    setShowAddModal(true);
                    setIsOpen(false);
                  }}
                >
                  <div className={`${styles.actionIconBox} ${styles.iconOrange}`}>
                    <Plus size={16} />
                  </div>
                  <div className={styles.actionText}>
                    <span className={styles.actionLabel}>Add Mission</span>
                    <span className={styles.actionSub}>Quick capacity check</span>
                  </div>
                  <ChevronRight size={14} className={styles.actionArrow} />
                </button>

                {/* 5. Fix My Day (if overloaded) */}
                {isOver && (
                  <button 
                    className={`${styles.actionItem} ${styles.fixItem}`}
                    onClick={handleFixDay}
                  >
                    <div className={`${styles.actionIconBox} ${styles.iconDanger}`}>
                      <Wrench size={16} />
                    </div>
                    <div className={styles.actionText}>
                      <span className={styles.actionLabel}>Fix My Day</span>
                      <span className={styles.actionSub}>Restore realistic capacity</span>
                    </div>
                    <ChevronRight size={14} className={styles.actionArrow} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* QUICK WHAT'S NEXT MODAL FROM ORB */}
      <AnimatePresence>
        {showNextModal && (
          <Modal isOpen={true} onClose={() => setShowNextModal(false)} title="Your Next Move">
            <div style={{ padding: '8px 0' }}>
              {nextAction.task ? (
                <>
                  <div style={{
                    background: 'var(--bg-card-subtle, #f6f6f2)',
                    padding: '16px',
                    borderRadius: '18px',
                    border: '1px solid var(--border-color, #e8e8e3)',
                    marginBottom: '16px'
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--kaelo-purple)', textTransform: 'uppercase' }}>
                      {nextAction.task.category || 'High Impact'}
                    </span>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '6px 0', color: 'var(--text-primary)' }}>
                      Complete your {nextAction.task.title}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                      {nextAction.task.estimatedMinutes || 30} mins &middot; {nextAction.task.importance?.toUpperCase() || 'HIGH'} PRIORITY
                    </p>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.4 }}>
                    {nextAction.reason}
                  </p>

                  <Button variant="primary" fullWidth size="lg" onClick={handleStartNextFocus}>
                    <Zap size={18} /> [ START MISSION ]
                  </Button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    All missions for today are executed. Great work!
                  </p>
                  <Button variant="dark" fullWidth onClick={() => setShowNextModal(false)}>
                    Close
                  </Button>
                </div>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* QUICK ADD TASK MODAL FROM ORB */}
      {showAddModal && (
        <AddTaskModal isOpen={true} onClose={() => setShowAddModal(false)} />
      )}
    </>
  );
};

export default KaeloOrb;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Check, Zap, Clock, Flame, Target, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Button from '../ui/Button';
import FocusTimer from './FocusTimer';
import KaeloMascot from '../illustrations/KaeloMascot';
import analytics, { AnalyticsEvents } from '../../utils/analytics';
import styles from './FocusMode.module.css';

const FocusMode = () => {
  const { state, dispatch } = useApp();
  const task = state.activeFocus;
  
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [lockState, setLockState] = useState('locking'); // 'locking' -> 'locked' -> 'ready'

  useEffect(() => {
    if (task) {
      const duration = (task.estimatedMinutes || 25) * 60;
      setTimeRemaining(duration);
      setTotalTime(duration);
      setIsPaused(false);
      setIsCompleted(false);
      setSessionStartTime(Date.now());
      setLockState('locking');

      analytics.track(AnalyticsEvents.LOCK_IN_STARTED, { taskId: task.id, duration: task.estimatedMinutes || 25 });

      const t1 = setTimeout(() => {
        setLockState('locked');
      }, 1000);

      const t2 = setTimeout(() => {
        setLockState('ready');
      }, 1500);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [task]);

  useEffect(() => {
    let interval;
    if (task && lockState === 'ready' && !isPaused && !isCompleted && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && !isCompleted && task) {
      setIsPaused(true);
    }
    
    return () => clearInterval(interval);
  }, [task, lockState, isPaused, isCompleted, timeRemaining]);

  useEffect(() => {
    if (state.focusControl) {
      const { action } = state.focusControl;
      if (action === 'PAUSE') {
        setIsPaused(true);
      } else if (action === 'RESUME') {
        setIsPaused(false);
      } else if (action === 'EXTEND_5') {
        setTimeRemaining(prev => prev + 5 * 60);
        setTotalTime(prev => prev + 5 * 60);
        setIsPaused(false);
      } else if (action === 'COMPLETE') {
        handleComplete();
      }
      dispatch({ type: 'CLEAR_FOCUS_CONTROL' });
    }
  }, [state.focusControl]);

  if (!task) return null;

  const handleComplete = () => {
    setIsCompleted(true);
    
    const elapsedMinutes = Math.round((Date.now() - sessionStartTime) / 1000 / 60);
    const duration = Math.max(1, elapsedMinutes || task.estimatedMinutes || 25);

    analytics.track(AnalyticsEvents.LOCK_IN_COMPLETED, { taskId: task.id, duration });

    if (state.squad) {
      dispatch({
        type: 'UPDATE_SQUAD',
        payload: {
          currentWeeklyFocusMinutes: (state.squad.currentWeeklyFocusMinutes || 485) + duration
        }
      });
    }
    
    dispatch({ type: 'COMPLETE_TASK', payload: task.id });
    dispatch({ 
      type: 'ADD_FOCUS_SESSION', 
      payload: { 
        taskId: task.id, 
        duration,
        timestamp: Date.now(),
        completedAt: new Date().toISOString(),
      } 
    });
  };

  const handleExitToToday = () => {
    dispatch({ type: 'SET_ACTIVE_FOCUS', payload: null });
  };

  const handleStartNext = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nextTask = (state.tasks || []).find(t => 
      t.id !== task.id && 
      t.status !== 'completed' && 
      (t.date === 'today' || t.scheduledDate === todayStr || (!t.date && !t.scheduledDate))
    );

    if (nextTask) {
      dispatch({ type: 'SET_ACTIVE_FOCUS', payload: nextTask });
    } else {
      dispatch({ type: 'SET_ACTIVE_FOCUS', payload: null });
    }
  };

  const handleExit = () => {
    if (timeRemaining < totalTime && !isCompleted) {
      setShowExitConfirm(true);
      setIsPaused(true);
    } else {
      dispatch({ type: 'SET_ACTIVE_FOCUS', payload: null });
    }
  };

  const confirmExit = () => {
    dispatch({ type: 'SET_ACTIVE_FOCUS', payload: null });
    setShowExitConfirm(false);
  };

  const extendTime = () => {
    setTimeRemaining(prev => prev + 5 * 60);
    setTotalTime(prev => prev + 5 * 60);
    setIsPaused(false);
  };

  return (
    <AnimatePresence>
      <motion.div 
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.glow} />

        <AnimatePresence>
          {lockState !== 'ready' && (
            <motion.div 
              className={styles.lockinOverlay}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div style={{ marginBottom: 20 }}>
                <KaeloMascot variant="focus" size={80} />
              </div>
              <motion.h2 
                className={styles.lockinTitle}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                key={lockState}
              >
                {lockState === 'locking' ? 'LOCKING IN...' : "YOU'RE IN."}
              </motion.h2>
              <p className={styles.lockinSubtitle}>
                {lockState === 'locking' ? 'Eliminating distractions · Protecting capacity' : 'Ready to execute'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        <header className={styles.header}>
          <span className={styles.sessionLabel}>Focus Session</span>
          <button className={styles.closeButton} onClick={handleExit}>
            <X size={24} color="#fff" />
          </button>
        </header>

        <main className={styles.main}>
          <motion.div 
            className={styles.taskInfo}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {task.category && (
                <span className={styles.categoryBadge}>{task.category}</span>
              )}
              {state.activePerks?.xpMultiplierUntil && new Date(state.activePerks.xpMultiplierUntil).getTime() > Date.now() && (
                <span style={{ fontSize: '10px', fontWeight: 900, background: 'var(--kaelo-lime, #C7FF35)', color: '#111111', padding: '2px 8px', borderRadius: '6px' }}>
                  2X XP ACTIVE
                </span>
              )}
            </div>
            <h2 className={styles.taskTitle}>{task.title}</h2>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <FocusTimer 
              timeRemaining={timeRemaining} 
              totalTime={totalTime} 
              isPaused={isPaused} 
            />
          </motion.div>

          {timeRemaining === 0 && !isCompleted && (
            <motion.div 
              className={styles.timesUp}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3>Time's up!</h3>
              <p>Great job staying focused.</p>
            </motion.div>
          )}

          <motion.div 
            className={styles.controls}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {!isCompleted && timeRemaining > 0 && (
              <Button 
                variant="outline" 
                className={styles.pauseBtn}
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <><Play size={18} /> RESUME</> : <><Pause size={18} /> PAUSE</>}
              </Button>
            )}
            
            {timeRemaining === 0 && !isCompleted && (
              <Button 
                variant="outline" 
                className={styles.pauseBtn}
                onClick={extendTime}
              >
                EXTEND 5 MIN
              </Button>
            )}

            {!isCompleted && (
              <Button 
                variant="primary" 
                className={styles.completeBtn}
                onClick={handleComplete}
              >
                <Check size={18} /> COMPLETE TASK
              </Button>
            )}
          </motion.div>
        </main>

        {showExitConfirm && (
          <div className={styles.dialogOverlay}>
            <div className={styles.dialog}>
              <h3>End session early?</h3>
              <p>Your progress won't be saved as a completed session.</p>
              <div className={styles.dialogActions}>
                <Button variant="outline" onClick={() => { setShowExitConfirm(false); setIsPaused(false); }}>Keep Going</Button>
                <Button variant="danger" onClick={confirmExit}>End Session</Button>
              </div>
            </div>
          </div>
        )}
        
        {isCompleted && (
          <motion.div 
            className={styles.missionCompleteOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className={styles.celebrationCard}
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 220 }}
            >
              <div className={styles.mascotBadge}>
                <KaeloMascot variant="celebrate" size={80} />
              </div>

              <span className={styles.missionCompleteTag}>MISSION ACCOMPLISHED</span>
              <h2 className={styles.missionCompleteTitle}>LOCKED IN & EXECUTED</h2>
              <p className={styles.missionCompleteDesc}>
                "{task.title}" has been completed within realistic capacity.
              </p>

              {/* 4 REWARD / IMPACT STATS */}
              <div className={styles.impactGrid}>
                <div className={styles.impactCard}>
                  <div className={styles.impactIconLime}>
                    <Zap size={16} />
                  </div>
                  <div className={styles.impactData}>
                    <span className={styles.impactVal}>+{task.xp || 120} XP</span>
                    <span className={styles.impactLabel}>Earned</span>
                  </div>
                </div>

                <div className={styles.impactCard}>
                  <div className={styles.impactIconPurple}>
                    <Clock size={16} />
                  </div>
                  <div className={styles.impactData}>
                    <span className={styles.impactVal}>{task.estimatedMinutes || 25}m</span>
                    <span className={styles.impactLabel}>Time Focused</span>
                  </div>
                </div>

                <div className={styles.impactCard}>
                  <div className={styles.impactIconOrange}>
                    <Flame size={16} />
                  </div>
                  <div className={styles.impactData}>
                    <span className={styles.impactVal}>Day {state.user?.streak || 1}</span>
                    <span className={styles.impactLabel}>Streak Alive</span>
                  </div>
                </div>

                <div className={styles.impactCard}>
                  <div className={styles.impactIconBlue}>
                    <Target size={16} />
                  </div>
                  <div className={styles.impactData}>
                    <span className={styles.impactVal}>
                      {task.goalId 
                        ? (state.goals?.find(g => g.id === task.goalId)?.title?.slice(0, 10) + '.. +12%')
                        : '+4 Momentum'}
                    </span>
                    <span className={styles.impactLabel}>Quest Impact</span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className={styles.celebrateActions}>
                {(state.tasks || []).some(t => 
                  t.id !== task.id && 
                  t.status !== 'completed' && 
                  (t.date === 'today' || t.scheduledDate === new Date().toISOString().split('T')[0] || (!t.date && !t.scheduledDate))
                ) && (
                  <Button 
                    variant="primary" 
                    fullWidth 
                    size="lg"
                    onClick={handleStartNext}
                  >
                    <Zap size={18} /> [ START NEXT MISSION ]
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  fullWidth 
                  onClick={handleExitToToday}
                >
                  [ BACK TO TODAY ]
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default FocusMode;

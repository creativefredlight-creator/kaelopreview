import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Clock, Zap, HelpCircle, Calendar, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { explainTaskPriority } from '../../utils/helpers';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { KaeloMascot, StickerIcon } from '../illustrations';
import styles from './TaskCard.module.css';

const TaskCard = ({ task, index = 0, onToggle, onClick }) => {
  const { state, dispatch } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  const isCompleted = task.status === 'completed';
  const missionNumber = String(index + 1).padStart(2, '0');

  const handleStart = (e) => {
    e.stopPropagation();
    dispatch({ type: 'SET_ACTIVE_FOCUS', payload: task });
  };

  const handleMoveTomorrow = (e) => {
    e.stopPropagation();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    dispatch({
      type: 'UPDATE_TASK',
      payload: {
        id: task.id,
        scheduledDate: tomorrowStr,
        date: tomorrowStr,
      }
    });

    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        title: 'Mission Rescheduled',
        message: `Moved "${task.title}" to tomorrow.`,
        type: 'info'
      }
    });
  };

  const toggleWhy = (e) => {
    e.stopPropagation();
    setShowWhy(!showWhy);
  };

  return (
    <motion.div 
      className={`${styles.card} ${isCompleted ? styles.completed : ''} ${expanded ? styles.expanded : ''}`}
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className={styles.topRow}>
        <div className={styles.numberBadge}>
          {missionNumber}
        </div>

        <div 
          className={`${styles.checkbox} ${isCompleted ? styles.checked : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.id);
          }}
          aria-label={isCompleted ? "Mark incomplete" : "Mark mission done"}
        >
          {isCompleted && <Check size={16} strokeWidth={3} color="var(--kaelo-black, #111)" />}
        </div>
        
        <div className={styles.content}>
          <h4 className={styles.title}>{task.title}</h4>
          <div className={styles.meta}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <StickerIcon name={task.category?.toLowerCase()} size={16} />
              <span className={styles.categoryBadge}>{task.category || 'Focus'}</span>
            </div>
            <span className={styles.time}>{task.estimatedMinutes || task.duration || 30} min</span>
            <div className={styles.xp}>
              <Sparkles size={12} />
              <span>+{task.xp || 100} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Interactive Tray */}
      <AnimatePresence>
        {expanded && (
          <motion.div 
            className={styles.expandedTray}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.trayDetails}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Priority Level</span>
                <span className={styles.detailValue}>
                  {task.importance ? task.importance.toUpperCase() : 'MEDIUM'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Connected Ambition</span>
                <span className={styles.detailValue}>
                  {task.goalId ? (state.goals.find(g => g.id === task.goalId)?.title || 'Active Quest') : 'Standalone Priority'}
                </span>
              </div>
            </div>

            {showWhy && (
              <div className={styles.whyBox}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <KaeloMascot variant="avatar" size={18} />
                  <span className={styles.whyLabel}>KAELO'S REASONING:</span>
                </div>
                <p className={styles.whyText}>
                  {explainTaskPriority(task, state.goals || [])}
                </p>
              </div>
            )}

            <div className={styles.trayActions}>
              {!isCompleted ? (
                <button 
                  className={styles.startBtn} 
                  onClick={handleStart}
                >
                  <Zap size={15} /> START
                </button>
              ) : (
                <span className={styles.doneLabel}>
                  <Check size={14} strokeWidth={3} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  Done. +{task.xp || 100} XP
                </span>
              )}

              <button 
                className={styles.secondaryBtn}
                onClick={toggleWhy}
              >
                <HelpCircle size={14} /> {showWhy ? 'Hide Reason' : 'Why?'}
              </button>

              {!isCompleted && (
                <button 
                  className={styles.secondaryBtn}
                  onClick={handleMoveTomorrow}
                >
                  <Calendar size={14} /> Move it?
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TaskCard;

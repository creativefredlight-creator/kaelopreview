import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Clock, 
  Flame, 
  Zap, 
  ArrowRight, 
  Calendar, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getToday } from '../../utils/helpers';
import Modal from '../ui/Modal';
import KaeloMascot from '../illustrations/KaeloMascot';
import styles from './DayRecapModal.module.css';

const DayRecapModal = ({ isOpen, onClose }) => {
  const { state, dispatch } = useApp();

  const todayStr = getToday();
  const todayTasks = (state.tasks || []).filter(t => 
    t.date === 'today' || t.scheduledDate === todayStr || (!t.date && !t.scheduledDate)
  );

  const completed = todayTasks.filter(t => t.status === 'completed');
  const pending = todayTasks.filter(t => t.status !== 'completed');

  const totalCapacityHours = state.capacity?.dailyCapacity || 3.3;
  const usedMinutes = todayTasks.reduce((s, t) => s + (t.estimatedMinutes || t.duration || 30), 0);
  const usedHours = (usedMinutes / 60).toFixed(1);

  const handleRollToTomorrow = () => {
    dispatch({ type: 'APPLY_AI_REBALANCE' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="END OF DAY RECAP">
      <div className={styles.container}>
        {/* Hero Celebration */}
        <div className={styles.heroSection}>
          <KaeloMascot variant={completed.length >= 2 ? 'celebrate' : 'focus'} size={60} />
          <h3 className={styles.heroHeading}>
            {completed.length >= todayTasks.length && todayTasks.length > 0 
              ? 'Flawless Execution Today!' 
              : 'Consistent Day In The Books.'}
          </h3>
          <p className={styles.heroSub}>
            Execution compounds. Here is your honest quantitative breakdown for today.
          </p>
        </div>

        {/* 2x2 Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>MISSIONS EXECUTED</span>
            <div className={styles.statValRow}>
              <span className={styles.statValMain}>{completed.length}</span>
              <span className={styles.statValTotal}>/ {todayTasks.length}</span>
            </div>
            <span className={styles.statNote}>
              {completed.length === todayTasks.length ? '100% completion rate' : `${pending.length} remaining`}
            </span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>CAPACITY RESPECTED</span>
            <div className={styles.statValRow}>
              <span className={styles.statValMain}>{usedHours}h</span>
              <span className={styles.statValTotal}>/ {totalCapacityHours}h</span>
            </div>
            <span className={`${styles.statNote} ${usedMinutes <= totalCapacityHours * 60 ? styles.noteSuccess : styles.noteOver}`}>
              {usedMinutes <= totalCapacityHours * 60 ? 'Healthy execution budget' : 'Exceeded capacity limit'}
            </span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>MOMENTUM SCORE</span>
            <div className={styles.statValRow}>
              <Flame size={18} className={styles.flameIcon} />
              <span className={styles.statValMain}>{state.user?.momentum || 84}</span>
            </div>
            <span className={styles.statNote}>Consistent execution level</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>ACTIVE STREAK</span>
            <div className={styles.statValRow}>
              <span className={styles.statValMain}>{state.user?.streak || 8}</span>
              <span className={styles.statValTotal}>Days</span>
            </div>
            <span className={styles.statNote}>Streak safe & intact</span>
          </div>
        </div>

        {/* Action if pending tasks remain */}
        {pending.length > 0 ? (
          <div className={styles.pendingActionBox}>
            <div className={styles.pendingInfo}>
              <span className={styles.pendingTitle}>
                {pending.length} mission{pending.length > 1 ? 's' : ''} left on today's list
              </span>
              <span className={styles.pendingDesc}>
                Protect your sleep. Move unfinished missions to tomorrow cleanly.
              </span>
            </div>
            <button className={styles.rollBtn} onClick={handleRollToTomorrow}>
              <Calendar size={13} /> MOVE TO TOMORROW
            </button>
          </div>
        ) : (
          <div className={styles.allClearCard}>
            <CheckCircle2 size={18} className={styles.clearIcon} />
            <span>Zero unfinished obligations. Rest well and recharge your capacity.</span>
          </div>
        )}

        {/* Share Button */}
        <button 
          className={styles.shareBtn}
          onClick={() => {
            onClose();
            dispatch({
              type: 'OPEN_SHARE_MODAL',
              payload: {
                title: 'Daily Execution Complete',
                description: `Executed ${completed.length}/${todayTasks.length} missions within ${usedHours}h capacity.`
              }
            });
          }}
        >
          <Sparkles size={14} /> SHARE EXECUTION STATS
        </button>
      </div>
    </Modal>
  );
};

export default DayRecapModal;

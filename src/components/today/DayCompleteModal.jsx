import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Flame, Trophy, CheckCircle, ArrowRight, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Button from '../ui/Button';
import KaeloMascot from '../illustrations/KaeloMascot';
import styles from './DayCompleteModal.module.css';

const DayCompleteModal = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const handleClose = () => {
    dispatch({ type: 'DISMISS_DAY_COMPLETE' });
  };

  const handleSeeJourney = () => {
    dispatch({ type: 'DISMISS_DAY_COMPLETE' });
    navigate('/journey');
  };

  const completedTasks = state.tasks.filter(t => t.status === 'completed');
  const totalTasks = state.tasks.filter(t => t.date === 'today' || !t.date);
  const earnedXP = completedTasks.reduce((s, t) => s + (t.xp || 100), 0);

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <motion.div 
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <button className={styles.closeBtn} onClick={handleClose}>
          <X size={20} />
        </button>

        <div className={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <KaeloMascot variant="celebrate" size={84} />
          </div>
          <span className={styles.tag}>DAY COMPLETE</span>
          <h2 className={styles.title}>YOU SHOWED UP.</h2>
          <p className={styles.quote}>
            "That's what progress looks like. Not endless fantasy lists, but real execution."
          </p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>XP EARNED</span>
            <div className={styles.statValue}>
              <Zap size={16} color="var(--kaelo-purple)" />
              <span>+{earnedXP}</span>
            </div>
          </div>

          <div className={styles.statBox}>
            <span className={styles.statLabel}>MOMENTUM</span>
            <div className={styles.statValue}>
              <span className={styles.limeText}>+{completedTasks.length * 4 || 4}</span>
              <span className={styles.subtext}>({state.user?.momentum || 84})</span>
            </div>
          </div>

          <div className={styles.statBox}>
            <span className={styles.statLabel}>STREAK</span>
            <div className={styles.statValue}>
              <Flame size={16} color="#f97316" />
              <span>{state.user?.streak || 1} {state.user?.streak === 1 ? 'DAY' : 'DAYS'}</span>
            </div>
          </div>

          <div className={styles.statBox}>
            <span className={styles.statLabel}>EXECUTION</span>
            <div className={styles.statValue}>
              <CheckCircle size={16} color="var(--kaelo-lime-dark)" />
              <span>{completedTasks.length}/{totalTasks.length}</span>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <Button variant="primary" fullWidth size="lg" onClick={handleSeeJourney}>
            SEE MY JOURNEY <ArrowRight size={18} />
          </Button>
          <Button variant="ghost" fullWidth onClick={handleClose}>
            Done for today
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default DayCompleteModal;

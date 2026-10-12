import React from 'react';
import { motion } from 'framer-motion';
import styles from './FocusTimer.module.css';

const FocusTimer = ({ timeRemaining, totalTime, isPaused }) => {
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const percentage = (timeRemaining / totalTime) * 100;
  const isLowTime = percentage < 20;
  
  const strokeColor = isLowTime ? 'var(--color-purple-500)' : 'var(--color-lime-500)';

  return (
    <div className={styles.timerContainer}>
      <svg className={styles.svg} viewBox="0 0 100 100">
        <circle
          className={styles.bgRing}
          cx="50"
          cy="50"
          r="45"
        />
        <motion.circle
          className={styles.progressRing}
          cx="50"
          cy="50"
          r="45"
          stroke={strokeColor}
          initial={{ pathLength: 1 }}
          animate={{ pathLength: percentage / 100 }}
          transition={{ duration: 1, ease: 'linear' }}
          style={{
            strokeDasharray: '283', // 2 * pi * 45 ≈ 283
            strokeDashoffset: isPaused ? undefined : 0,
          }}
        />
      </svg>
      <div className={styles.timeDisplay}>
        <span className={styles.time}>{formatTime(timeRemaining)}</span>
        <span className={styles.label}>remaining</span>
      </div>
      {isPaused && <div className={styles.pausedLabel}>PAUSED</div>}
    </div>
  );
};

export default FocusTimer;

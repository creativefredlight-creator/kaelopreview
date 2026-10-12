import React from 'react';
import { useApp } from '../../context/AppContext';
import { getLevelFromXP } from '../../utils/helpers';
import ProgressBar from '../ui/ProgressBar';
import styles from './XPProgress.module.css';

const XPProgress = () => {
  const { state } = useApp();
  const currentXP = state.user?.xp || 0;
  const levelInfo = getLevelFromXP(currentXP);

  const nextLevelTitle = levelInfo.nextLevel?.title || 'Relentless';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.xpInfo}>
          <span className={styles.xpNumber}>{currentXP.toLocaleString()}</span>
          <span className={styles.xpLabel}>XP</span>
        </div>
        <div className={styles.levelInfo}>
          <div className={styles.levelBadge}>LVL {levelInfo.level}</div>
          <div className={styles.levelTitle}>{levelInfo.title}</div>
        </div>
      </div>
      
      <div className={styles.progressSection}>
        <ProgressBar value={levelInfo.progress} color="lime" height={10} />
        <div className={styles.progressText}>
          {levelInfo.nextLevel 
            ? `${levelInfo.xpToNext.toLocaleString()} XP until ${nextLevelTitle}`
            : 'Maximum level achieved'}
        </div>
      </div>
    </div>
  );
};

export default XPProgress;

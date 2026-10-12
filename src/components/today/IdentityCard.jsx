import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';
import { getLevelFromXP } from '../../utils/helpers';
import styles from './IdentityCard.module.css';

const IdentityCard = ({ user }) => {
  const xp = user?.xp || 0;
  const levelInfo = getLevelFromXP(xp);

  const currentLevelTitle = levelInfo.title?.toUpperCase() || 'STARTER';
  const nextLevelTitle = levelInfo.nextLevel?.title || 'Relentless';
  const targetXP = levelInfo.nextLevel ? levelInfo.nextLevel.xpRequired : levelInfo.xpRequired;

  return (
    <Card variant="elevated" className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.eyebrow}>IDENTITY MILESTONE</span>
          <h2 className={styles.title}>{currentLevelTitle}</h2>
        </div>
        <Badge variant="lime" size="sm">Level {levelInfo.level}</Badge>
      </div>

      <div className={styles.progressContainer}>
        <div className={styles.labels}>
          <span className={styles.xpText}>{xp.toLocaleString()} / {targetXP.toLocaleString()} XP</span>
        </div>
        <ProgressBar value={levelInfo.progress} color="lime" height={10} />
        <div className={styles.footerRow}>
          <p className={styles.subtext}>
            {levelInfo.nextLevel 
              ? `${levelInfo.xpToNext.toLocaleString()} XP until ${nextLevelTitle}`
              : 'Maximum level achieved'
            }
          </p>
        </div>
      </div>

      {user?.identity && (
        <div className={styles.identityStatement}>
          "{user.identity}"
        </div>
      )}
    </Card>
  );
};

export default IdentityCard;

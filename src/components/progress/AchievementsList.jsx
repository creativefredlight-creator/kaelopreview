import React from 'react';
import { useApp } from '../../context/AppContext';
import { ACHIEVEMENTS } from '../../data/constants';
import { StickerIcon } from '../illustrations';
import styles from './AchievementsList.module.css';

const AchievementsList = () => {
  const { state } = useApp();
  const unlockedIds = state.achievements || state.user?.achievements || [];

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Achievements</h3>
      <div className={styles.grid}>
        {ACHIEVEMENTS.map(ach => {
          const isUnlocked = unlockedIds.includes(ach.id);
          return (
            <div 
              key={ach.id} 
              className={`${styles.card} ${isUnlocked ? styles.unlocked : styles.locked}`}
            >
              <div className={styles.iconWrapper}>
                <StickerIcon name={ach.sticker || ach.id} size={30} fallbackEmoji={ach.icon} />
              </div>
              <div className={styles.info}>
                <div className={styles.achTitle}>{ach.title}</div>
                <div className={styles.achDesc}>{ach.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementsList;

import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { formatISODate } from '../../utils/helpers';
import StickerIcon from '../illustrations/StickerIcon';
import { Flame, ShieldCheck } from 'lucide-react';
import styles from './StreakDisplay.module.css';

const StreakDisplay = () => {
  const { state } = useApp();
  const streakCount = state.user?.streak || 0;
  const formattedStreak = String(streakCount).padStart(2, '0');
  
  // Last 14 days
  const today = new Date();
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 13 + i);
    return d;
  });

  return (
    <div className={styles.container}>
      {/* Duolingo Neon Dark Ambient Glow (Reference 1) */}
      <div className={styles.glow} />
      
      <div className={styles.heroContent}>
        {/* Flame Mascot Sticker Illustration */}
        <div className={styles.flameWrapper}>
          <StickerIcon type="streak" size={56} />
        </div>

        <div className={styles.streakNumberContainer}>
          <span className={styles.streakNumber}>{formattedStreak}</span>
          <div className={styles.streakLabelCol}>
            <span className={styles.daysText}>DAY STREAK!</span>
            <span className={styles.streakSubtext}>Consistency is your unfair advantage</span>
          </div>
        </div>
      </div>

      {/* 14-Day Node Track */}
      <div className={styles.trackSection}>
        <div className={styles.trackHeader}>
          <span className={styles.trackLabel}>Last 14 Days</span>
          <span className={styles.trackCount}>{streakCount} days active</span>
        </div>
        <div className={styles.dotsContainer}>
          {last14Days.map((date, i) => {
            const dateStr = formatISODate(date);
            const isToday = i === 13;
            const dayData = (Array.isArray(state.progress)
              ? state.progress.find(p => p.date === dateStr)
              : state.progress?.[dateStr]) || {};
            const planned = dayData.tasksPlanned ?? dayData.planned ?? 0;
            const completed = dayData.tasksCompleted ?? dayData.completed ?? 0;
            const isCompleted = completed > 0 && completed >= planned;
            
            return (
              <div 
                key={dateStr}
                className={`
                  ${styles.dot} 
                  ${isCompleted ? styles.filled : styles.empty}
                  ${isToday ? styles.pulsing : ''}
                `}
                title={`${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${isCompleted ? 'Completed' : 'Missed'}`}
              />
            );
          })}
        </div>
      </div>

      {/* Reference 1 Neo-Gaming Milestone Pills */}
      <div className={styles.milestoneRow}>
        <div className={styles.milestonePill}>
          <Flame size={12} className={styles.milestoneIconOrange} />
          <span>Status: <strong>Locked In</strong></span>
        </div>
        <div className={styles.milestonePill}>
          <ShieldCheck size={12} className={styles.milestoneIconLime} />
          <span>Streak Freeze: <strong>Active</strong></span>
        </div>
      </div>
    </div>
  );
};

export default StreakDisplay;

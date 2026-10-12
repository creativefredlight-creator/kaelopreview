import React from 'react';
import { motion } from 'framer-motion';
import { CATEGORIES } from '../../data/constants';
import { getDaysRemaining, calculateGoalDaily } from '../../utils/helpers';
import { ProgressRing } from '../ui/ProgressRing'; // Assuming this exists or falls back
import { StickerIcon } from '../illustrations';
import styles from './GoalCard.module.css';

export default function GoalCard({ goal, onClick }) {
  const category = CATEGORIES.find(c => c.id === goal.categoryId) || CATEGORIES[0];
  
  const daysRemaining = getDaysRemaining(goal.deadline);
  const currentProgress = goal.progress ?? goal.currentProgress ?? 0;
  const target = Math.max(1, goal.target || 1);
  const dailyRequired = calculateGoalDaily(target - currentProgress, daysRemaining);
  const percent = Math.min(100, Math.round((currentProgress / target) * 100)) || 0;
  
  let status = 'On track';
  let statusClass = styles.statusOnTrack;
  
  if (percent >= 100) {
    status = 'Completed';
    statusClass = styles.statusCompleted;
  } else if (daysRemaining <= 0 && percent < 100) {
    status = 'Behind';
    statusClass = styles.statusBehind;
  } else if (dailyRequired > (goal.capacityPerDay || 4)) {
    status = 'At risk';
    statusClass = styles.statusAtRisk;
  }

  return (
    <motion.div 
      className={styles.card}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <div className={styles.category}>
            <StickerIcon name={category.sticker || category.id} size={18} fallbackEmoji={category.emoji} />
            <span>{category.label || category.name}</span>
          </div>
          <h3 className={styles.title}>{goal.title}</h3>
          {goal.currentObjective && (
            <div className={styles.objectiveBadge}>
              <span>Current: {goal.currentObjective}</span>
              {goal.objectiveXP && <span className={styles.objectiveXp}>+{goal.objectiveXP} XP</span>}
            </div>
          )}
        </div>
        <div className={styles.progressRingContainer}>
          {/* Simple circle if ProgressRing is missing */}
          <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="var(--neutral-light, #F1F1ED)"
              strokeWidth="4"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={category.color}
              strokeWidth="4"
              strokeDasharray={`${percent}, 100`}
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
            <text x="18" y="20.35" fill="var(--black, #111111)" fontSize="10" fontWeight="bold" textAnchor="middle">
              {percent}%
            </text>
          </svg>
        </div>
      </div>

      {goal.milestones && goal.milestones.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: 'var(--kaelo-gray-500)', marginBottom: 6 }}>
            <span>Milestones</span>
            <span>{goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} done</span>
          </div>
          <div className={styles.milestonesRow}>
            {goal.milestones.map((m, idx) => (
              <div 
                key={m.id || idx} 
                className={`${styles.milestoneSegment} ${m.completed ? styles.milestoneSegmentDone : m.current ? styles.milestoneSegmentCurrent : ''}`} 
              />
            ))}
          </div>
        </div>
      )}

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Left</span>
          <span className={styles.statValue}>{Math.max(0, daysRemaining)} days</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Required</span>
          <span className={styles.statValue}>{dailyRequired} {goal.unit}/day</span>
        </div>
      </div>

      <div className={styles.footer}>
        <span className={`${styles.status} ${statusClass}`}>{status}</span>
      </div>
    </motion.div>
  );
}

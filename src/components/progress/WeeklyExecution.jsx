import React from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Star, Flame } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getWeekDates, formatISODate } from '../../utils/helpers';
import styles from './WeeklyExecution.module.css';

const WeeklyExecution = () => {
  const { state } = useApp();
  const weekDates = getWeekDates(new Date());
  
  // Calculate execution
  let totalTasks = 0;
  let completedTasks = 0;
  
  const weekData = weekDates.map(date => {
    const dateStr = formatISODate(date);
    const dayProgress = (Array.isArray(state.progress)
      ? state.progress.find(p => p.date === dateStr)
      : state.progress?.[dateStr]) || {};
    const planned = dayProgress.tasksPlanned ?? dayProgress.planned ?? 0;
    const completed = dayProgress.tasksCompleted ?? dayProgress.completed ?? 0;
    totalTasks += planned;
    completedTasks += completed;
    
    let status = 'future';
    const today = new Date();
    today.setHours(0,0,0,0);
    const isToday = date.getTime() === today.getTime();
    
    if (date > today) {
      status = 'future';
    } else if (planned > 0 && completed >= planned) {
      status = 'completed';
    } else if (planned > 0) {
      status = 'partial';
    } else if (date < today) {
      status = 'missed';
    }

    return {
      date,
      dateStr,
      dayShort: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: date.getDate(),
      status,
      isToday,
      percent: planned > 0 ? Math.round((completed / planned) * 100) : 0
    };
  });

  const executionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const userLevel = state.user?.level || 1;
  const userStreak = state.user?.streak || 0;

  return (
    <div className={styles.container}>
      {/* Top Header & Stat Pills Row (Reference 2 vlad_forget Style) */}
      <div className={styles.headerRow}>
        <div className={styles.statPillsGroup}>
          <div className={styles.statPill}>
            <Zap size={13} className={styles.statPillIconLime} />
            <span className={styles.statPillText}>Exec <strong>{executionPercent}%</strong></span>
          </div>
          <div className={styles.statPill}>
            <Star size={13} className={styles.statPillIconPurple} />
            <span className={styles.statPillText}>Lvl <strong>{userLevel}</strong></span>
          </div>
          <div className={styles.statPill}>
            <Flame size={13} className={styles.statPillIconOrange} />
            <span className={styles.statPillText}>Streak <strong>{userStreak}d</strong></span>
          </div>
        </div>
      </div>

      <div className={styles.heroSection}>
        <span className={styles.heroLabel}>Weekly Execution</span>
        <div className={styles.heroMetric}>
          {executionPercent}<span className={styles.percentSymbol}>%</span>
        </div>
      </div>
      
      {/* 7-Day Vertical Capsule Calendar Strip (Reference 2 Style) */}
      <div className={styles.pillsRow}>
        {weekData.map((day) => (
          <div 
            key={day.dateStr} 
            className={`${styles.dayPill} ${day.isToday ? styles.todayPill : ''} ${styles['status_' + day.status]}`}
          >
            <span className={styles.dayPillName}>{day.dayShort}</span>
            <span className={styles.dayPillNumber}>{day.dayNumber}</span>
            <div className={styles.dayPillDotContainer}>
              {day.status === 'completed' && <Check size={11} strokeWidth={3} className={styles.checkIcon} />}
              {day.isToday && day.status !== 'completed' && (
                <div className={styles.tripleDots}>
                  <span className={styles.miniDot} />
                  <span className={styles.miniDot} />
                  <span className={styles.miniDot} />
                </div>
              )}
              {!day.isToday && day.status === 'partial' && <span className={styles.partialDot} />}
              {!day.isToday && day.status !== 'completed' && day.status !== 'partial' && (
                <span className={styles.inactiveDash}>·</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyExecution;

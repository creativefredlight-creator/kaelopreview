import React from 'react';
import { useApp } from '../../context/AppContext';
import { getWeekDates, formatISODate } from '../../utils/helpers';
import styles from './WeeklySummary.module.css';

const WeeklySummary = () => {
  const { state } = useApp();
  const weekDates = getWeekDates(new Date());
  
  let planned = 0;
  let completed = 0;
  let xpEarned = 0;
  let daysRespectingCapacity = 0;
  let activeDays = 0;

  const weekDateStrings = weekDates.map(d => formatISODate(d));

  weekDateStrings.forEach(dateStr => {
    const dayData = (Array.isArray(state.progress)
      ? state.progress.find(p => p.date === dateStr)
      : state.progress?.[dateStr]) || null;

    if (dayData) {
      activeDays++;
      const p = dayData.tasksPlanned ?? dayData.planned ?? 0;
      const c = dayData.tasksCompleted ?? dayData.completed ?? 0;
      planned += p;
      completed += c;
      xpEarned += dayData.xpEarned ?? (c * 100);

      const cap = (state.capacity?.dailyCapacity || 4) * 60;
      if ((dayData.capacityUsed || 0) <= cap) {
        daysRespectingCapacity++;
      }
    }
  });

  // Calculate actual focus time in minutes for this week
  const weekFocusMinutes = (state.focusSessions || []).filter(f => {
    if (!f.completedAt && !f.timestamp) return false;
    const sessionDate = formatISODate(f.completedAt || f.timestamp);
    return weekDateStrings.includes(sessionDate);
  }).reduce((sum, f) => sum + (f.duration || 25), 0);

  const focusHours = Math.floor(weekFocusMinutes / 60);
  const focusRemMinutes = weekFocusMinutes % 60;
  const focusTimeString = focusHours > 0 ? `${focusHours}h ${focusRemMinutes}m` : `${focusRemMinutes}m`;

  const completionPercent = planned > 0 ? Math.round((completed / planned) * 100) : 0;
  const capacityRespected = activeDays > 0 ? Math.round((daysRespectingCapacity / activeDays) * 100) : 100;

  const stats = [
    { label: 'Tasks Planned', value: planned },
    { label: 'Completed', value: completed },
    { label: 'Completion', value: `${completionPercent}%` },
    { label: 'Capacity Respected', value: `${capacityRespected}%` },
    { label: 'Focus Time', value: focusTimeString },
    { label: 'XP Earned', value: `+${xpEarned}` },
  ];

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Weekly Summary</h3>
      <div className={styles.grid}>
        {stats.map((stat, i) => (
          <div key={i} className={styles.statBox}>
            <div className={styles.value}>{stat.value}</div>
            <div className={styles.label}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklySummary;

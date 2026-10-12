import React from 'react';
import { Sparkles, AlertCircle, Flame, CheckCircle, Brain } from 'lucide-react';
import Card from '../ui/Card';
import { useApp } from '../../context/AppContext';
import { getToday } from '../../utils/helpers';
import styles from './CoachCard.module.css';

const CoachCard = () => {
  const { state } = useApp();
  const todayStr = getToday();

  const todayTasks = (state.tasks || []).filter(t => 
    t.date === 'today' || t.scheduledDate === todayStr || (!t.date && !t.scheduledDate)
  );
  const pendingTasks = todayTasks.filter(t => t.status !== 'completed');
  const highPriorityPending = pendingTasks.filter(t => t.importance === 'high' || t.importance === 'critical');

  const totalCapacityHours = Number(state.capacity?.dailyCapacity || 4.5);
  const totalCapacityMinutes = Math.round(totalCapacityHours * 60);
  const usedMinutes = todayTasks.reduce((sum, t) => sum + (Number(t.estimatedMinutes) || Number(t.duration) || 30), 0);
  const isOverCapacity = usedMinutes > totalCapacityMinutes;

  // Recent focus sessions this week
  const weekSessions = (state.focusSessions || []).length;

  // Determine dynamic insight
  let message = "Let's make today count. Focus on realistic execution.";
  let Icon = Sparkles;
  let tone = 'purple';

  if (isOverCapacity) {
    message = "Your capacity is getting tight today. Tap 'Fix My Day' above to rebalance your plan.";
    Icon = AlertCircle;
    tone = 'danger';
  } else if (todayTasks.length > 0 && pendingTasks.length === 0) {
    message = "You executed what you planned today. That's true consistency.";
    Icon = CheckCircle;
    tone = 'lime';
  } else if (highPriorityPending.length > 0) {
    const count = highPriorityPending.length;
    message = `You have ${count} high-priority task${count > 1 ? 's' : ''} left today. Knock ${count > 1 ? 'one' : 'it'} out first.`;
    Icon = Brain;
    tone = 'purple';
  } else if (weekSessions >= 3) {
    message = `You've completed ${weekSessions} focused sessions this week. Momentum is on your side.`;
    Icon = Flame;
    tone = 'purple';
  } else if (state.user?.streak > 0 && todayTasks.some(t => t.status === 'completed')) {
    message = `Streak alive at ${state.user.streak} days! Great execution rhythm.`;
    Icon = Flame;
    tone = 'lime';
  }

  return (
    <Card className={`${styles.card} ${styles[tone]}`}>
      <div className={styles.iconContainer}>
        <Icon size={18} className={styles.icon} />
      </div>
      <div className={styles.body}>
        <span className={styles.label}>EXECUTION INTELLIGENCE</span>
        <p className={styles.message}>{message}</p>
      </div>
    </Card>
  );
};

export default CoachCard;

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Card from '../ui/Card';
import styles from './MomentumCard.module.css';

const MomentumCard = () => {
  const { state } = useApp();
  const momentum = state.user?.momentum || 84;
  
  // Calculate stroke dashoffset for ring
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (momentum / 100) * circumference;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = (state.tasks || []).filter(t => 
    t.date === 'today' || t.scheduledDate === todayStr || (!t.date && !t.scheduledDate)
  );
  const completedToday = todayTasks.filter(t => t.status === 'completed').length;
  const consistencyPercent = todayTasks.length > 0 
    ? Math.round((completedToday / todayTasks.length) * 100) 
    : 100;
  const streakDays = state.user?.streak || 0;
  const momentumGain = completedToday > 0 ? `+${completedToday * 4}` : '+0';

  return (
    <Card className={styles.card}>
      <div className={styles.left}>
        <div className={styles.ringWrapper}>
          <svg className={styles.svg} width="80" height="80" viewBox="0 0 80 80">
            <circle
              className={styles.track}
              cx="40"
              cy="40"
              r={radius}
              strokeWidth="6"
            />
            <motion.circle
              className={styles.indicator}
              cx="40"
              cy="40"
              r={radius}
              strokeWidth="6"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          </svg>
          <div className={styles.ringContent}>
            <span className={styles.number}>{momentum}</span>
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.header}>
          <span className={styles.badge}>
            <TrendingUp size={12} /> {momentumGain} TODAY
          </span>
          <h3 className={styles.title}>TODAY'S MOMENTUM</h3>
        </div>
        <p className={styles.desc}>
          {completedToday > 0 
            ? 'Strong execution rhythm. Your completed missions are actively compounding momentum.'
            : 'Protect your capacity. Executing your primary daily missions will boost momentum.'}
        </p>
        <div className={styles.metricsRow}>
          <span className={styles.submetric}><ShieldCheck size={12} color="var(--kaelo-lime)" /> {consistencyPercent}% Consistency</span>
          <span className={styles.submetric}><Zap size={12} color="var(--kaelo-purple)" /> {streakDays}d Streak</span>
        </div>
      </div>
    </Card>
  );
};

export default MomentumCard;

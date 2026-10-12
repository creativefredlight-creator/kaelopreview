import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getToday } from '../../utils/helpers';
import KaeloMascot from '../illustrations/KaeloMascot';
import Card from '../ui/Card';
import styles from './AIBriefCard.module.css';

const AIBriefCard = ({ onScrollToMissions }) => {
  const { state } = useApp();
  const todayStr = getToday();

  const totalCapacityHours = Number(state.capacity?.dailyCapacity || 3.3);
  const todayTasks = (state.tasks || []).filter(t => 
    t.date === 'today' || t.scheduledDate === todayStr || (!t.date && !t.scheduledDate)
  );

  const hours = Math.floor(totalCapacityHours);
  const minutes = Math.round((totalCapacityHours - hours) * 60);
  const capacityFormatted = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;

  const missionCount = todayTasks.length;

  const primaryTask = todayTasks.find(t => t.importance === 'critical') || 
                      todayTasks.find(t => t.importance === 'high') || 
                      todayTasks[0];
  const primaryGoal = primaryTask?.goalId 
    ? (state.goals || []).find(g => g.id === primaryTask.goalId) 
    : (state.goals || [])[0];
  const secondaryTask = todayTasks.find(t => t.id !== primaryTask?.id);

  let dynamicBrief = "";
  if (primaryTask && primaryGoal) {
    dynamicBrief = `Your ${primaryTask.title} is your primary focus for "${primaryGoal.title}", while ${secondaryTask ? `${secondaryTask.title} needs ${secondaryTask.estimatedMinutes || 30} minutes` : 'your remaining goals stay protected'}.`;
  } else if (primaryTask) {
    dynamicBrief = `Your ${primaryTask.title} is your primary focus for today, calibrated to fit smoothly into your schedule.`;
  } else {
    dynamicBrief = `Your schedule is completely clear. You have space to recharge or seed a new ambition.`;
  }

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div className={styles.tag}>
          <KaeloMascot variant="avatar" size={20} />
          <span>KAELO'S TAKE</span>
        </div>
        <span className={styles.protectedBadge}>
          <ShieldCheck size={12} /> Capacity Protected
        </span>
      </div>

      <div className={styles.content}>
        <p className={styles.briefText}>
          You have <strong>{capacityFormatted}</strong> of realistic capacity today. {dynamicBrief}
        </p>
        <p className={styles.subText}>
          I've narrowed today's execution plan to <strong>{missionCount} priorities</strong> so you execute what actually matters.
        </p>
      </div>

      <button className={styles.cta} onClick={onScrollToMissions}>
        <span>SEE TODAY'S MISSIONS</span>
        <ArrowRight size={14} />
      </button>
    </Card>
  );
};

export default AIBriefCard;

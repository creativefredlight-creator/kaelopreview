import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import TodayHeader from './TodayHeader';
import RecoveryBanner from '../recovery/RecoveryBanner';
import MomentumCard from './MomentumCard';
import AIBriefCard from './AIBriefCard';
import CapacityCard from './CapacityCard';
import WhatsNextButton from './WhatsNextButton';
import TaskList from './TaskList';
import CoachCard from './CoachCard';
import styles from './TodayScreen.module.css';

const TodayScreen = () => {
  const { state } = useApp();
  const { user } = state;

  const scrollToMissions = () => {
    const el = document.getElementById('today-missions-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <TodayHeader user={user} />
      <RecoveryBanner />
      <MomentumCard />
      <AIBriefCard onScrollToMissions={scrollToMissions} />
      <CapacityCard />
      <WhatsNextButton />
      <TaskList />
      <CoachCard />
    </motion.div>
  );
};

export default TodayScreen;


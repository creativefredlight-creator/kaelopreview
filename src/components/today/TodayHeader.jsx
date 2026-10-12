import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { getGreeting, getLevelFromXP } from '../../utils/helpers';
import KaeloMascot from '../illustrations/KaeloMascot';
import ThemeSwitcher from '../ui/ThemeSwitcher';
import styles from './TodayHeader.module.css';

const TodayHeader = ({ user }) => {
  const levelInfo = getLevelFromXP(user?.xp || 0);
  const [showSpeech, setShowSpeech] = useState(false);

  const { state, dispatch } = useApp();
  const isTempPro = Boolean(state.activePerks?.proUntil && new Date(state.activePerks.proUntil).getTime() > Date.now());
  const effectiveTier = isTempPro ? 'pro' : (user?.tier || 'free');

  const hasMissedTasks = (state.tasks || []).some(t => t.status === 'missed');
  const hasOverdueGoals = (state.goals || []).some(g => g.status === 'behind' || g.status === 'at_risk');
  const isBehind = state.capacityState === 'OVER' || state.streakRisk || hasMissedTasks || hasOverdueGoals;

  return (
    <motion.div 
      className={styles.header}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className={styles.info}>
        <h1 className={styles.greeting}>{getGreeting()}, {user?.name || 'Fred'}</h1>
        <p className={styles.identity}>
          {levelInfo.title} &middot; Level {levelInfo.level}
          <button 
            onClick={() => dispatch({ type: 'OPEN_SUBSCRIPTION_MODAL' })}
            style={{
              marginLeft: '8px',
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '9px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              border: effectiveTier === 'pro' 
                ? '1px solid #A982FF' 
                : effectiveTier === 'plus' 
                ? '1px solid var(--accent-lime)' 
                : '1px solid var(--border-color)',
              background: effectiveTier === 'pro' 
                ? '#A982FF' 
                : effectiveTier === 'plus' 
                ? 'var(--kaelo-lime, #C7FF35)' 
                : 'var(--bg-card-subtle)',
              color: effectiveTier === 'pro' 
                ? '#FFFFFF' 
                : effectiveTier === 'plus' 
                ? '#111111' 
                : 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            {effectiveTier.toUpperCase()}
          </button>
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ThemeSwitcher compact={true} />
        <div 
          className={styles.mascotWrapper} 
          onClick={() => setShowSpeech(!showSpeech)}
          title="Tap Kaelo"
        >
          <KaeloMascot 
            variant="avatar" 
            size={44} 
            speech={showSpeech ? (isBehind ? "Let's fix your day and get back on target!" : "Ready to lock in?") : null} 
            speechDirection="left"
          />
          <div className={styles.onlinePip} style={{ background: isBehind ? '#FF3B30' : 'var(--kaelo-lime, #C7FF35)' }} />
        </div>
      </div>
    </motion.div>
  );
};

export default TodayHeader;

import React from 'react';
import { Sparkles, Users, Share2, Crown, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import WeeklyExecution from './WeeklyExecution';
import JourneyProgressionRoad from './JourneyProgressionRoad';
import KaeloPatternsCard from './KaeloPatternsCard';
import PersonalGrowthTimeline from './PersonalGrowthTimeline';
import AchievementsList from './AchievementsList';
import styles from './ProgressScreen.module.css';

const ProgressScreen = () => {
  const { state, dispatch } = useApp();
  const user = state.user || {};
  const activePerks = state.activePerks || {};

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>YOUR JOURNEY</h1>
        <p className={styles.subtitle}>Execution compounds into identity.</p>
      </header>

      <div className={styles.content}>
        {/* Top Hero Stats Bar */}
        <div className={styles.heroStats}>
          <div className={styles.heroStatItem}>
            <span className={styles.heroStatVal}>Lvl {user.level ?? 1}</span>
            <span className={styles.heroStatLabel}>Focused</span>
          </div>
          <div 
            className={styles.heroStatItem}
            onClick={() => dispatch({ type: 'OPEN_REWARDS_MODAL' })}
            style={{ cursor: 'pointer' }}
            title="Open XP Perks Shop"
          >
            <span className={styles.heroStatVal}>{(user.xp ?? 0).toLocaleString()}</span>
            <span className={styles.heroStatLabel} style={{ color: 'var(--kaelo-lime-dark, #8EB81E)', fontWeight: 800 }}>
              XP Perks &rsaquo;
            </span>
          </div>
          <div className={styles.heroStatItem}>
            <span className={styles.heroStatVal} style={{ color: '#4F8CF7' }}>{user.momentum ?? 75}</span>
            <span className={styles.heroStatLabel}>Momentum</span>
          </div>
          <div className={styles.heroStatItem}>
            <span className={styles.heroStatVal} style={{ color: '#EAB308' }}>{user.streak ?? 0}d</span>
            <span className={styles.heroStatLabel}>Streak</span>
          </div>
        </div>

        {/* Growth & Economy Action Chips */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          <button
            onClick={() => dispatch({ type: 'OPEN_REWARDS_MODAL' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 800,
              border: 'none',
              background: 'var(--kaelo-lime, #C7FF35)',
              color: '#111111',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Sparkles size={13} /> REDEEM XP
          </button>

          <button
            onClick={() => dispatch({ type: 'OPEN_SQUAD_MODAL' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 800,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Users size={13} /> {state.squad?.name || 'SQUAD'}
          </button>

          <button
            onClick={() => dispatch({ 
              type: 'OPEN_SHARE_MODAL',
              payload: {
                title: `${user.identityTitle || 'Focused Builder'} · Level ${user.level || 4}`,
                description: `Maintaining an ${user.streak || 8}-day execution streak with ${user.momentum || 84} Momentum.`
              }
            })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 800,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Share2 size={13} /> SHARE CARD
          </button>

          <button
            onClick={() => dispatch({ type: 'OPEN_SUBSCRIPTION_MODAL' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 800,
              border: '1px solid rgba(169, 130, 255, 0.4)',
              background: 'rgba(169, 130, 255, 0.12)',
              color: 'var(--accent-purple, #A982FF)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Crown size={13} /> PRO PERKS
          </button>
        </div>

        {/* 3D Gamified Progression Road (Inspired by Duolingo / Reference) */}
        <JourneyProgressionRoad />

        {/* Weekly Execution Engine */}
        <WeeklyExecution />

        {/* Behavioral Intelligence from Kaelo */}
        <KaeloPatternsCard />

        {/* Story Progression Timeline */}
        <PersonalGrowthTimeline />

        {/* Unlocked & Next Achievements */}
        <AchievementsList />
      </div>
    </div>
  );
};

export default ProgressScreen;

import React from 'react';
import { useApp } from '../../context/AppContext';
import { getLevelFromXP } from '../../utils/helpers';
import Badge from '../ui/Badge';
import { KaeloMascot } from '../illustrations';
import styles from './ProfileHeader.module.css';

const ProfileHeader = () => {
  const { state, dispatch } = useApp();
  const user = state.user || {};
  const xp = user.xp || 0;
  const streak = user.streak || 0;
  const levelInfo = getLevelFromXP(xp);

  const totalPlanned = (state.progress || []).reduce((sum, p) => sum + (p.tasksPlanned || p.planned || 0), 0);
  const totalCompleted = (state.progress || []).reduce((sum, p) => sum + (p.tasksCompleted || p.completed || 0), 0);
  const executionScore = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : (xp > 0 ? 100 : 0);

  const isTempPro = Boolean(state.activePerks?.proUntil && new Date(state.activePerks.proUntil).getTime() > Date.now());
  const effectiveTier = isTempPro ? 'pro' : (user.tier || 'free');

  return (
    <div className={styles.container}>
      <div className={styles.avatarContainer}>
        <KaeloMascot variant="full" size={88} speech={`Level ${levelInfo.level} Executor`} speechDirection="top" />
        <div className={styles.levelBadgeWrapper}>
          <Badge variant="lime" size="sm">LVL {levelInfo.level} · {levelInfo.title}</Badge>
        </div>
      </div>
      
      <div className={styles.userInfo}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <h1 className={styles.name}>{user.name || 'Builder'}</h1>
          <button 
            onClick={() => dispatch({ type: 'OPEN_SUBSCRIPTION_MODAL' })}
            style={{
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '0.06em',
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
        </div>
        <p className={styles.identity}>"{user.identity || 'Becoming a consistent executor'}"</p>
      </div>

      <div className={styles.statsRow}>
        <div 
          className={styles.statItem} 
          onClick={() => dispatch({ type: 'OPEN_REWARDS_MODAL' })}
          style={{ cursor: 'pointer' }}
          title="Redeem Perks"
        >
          <div className={styles.statValue}>{xp.toLocaleString()}</div>
          <div className={styles.statLabel} style={{ color: 'var(--kaelo-lime-dark, #8EB81E)', fontWeight: 800 }}>XP Perks &rsaquo;</div>
        </div>
        <div className={styles.divider} />
        <div className={styles.statItem}>
          <div className={styles.statValue}>{streak}</div>
          <div className={styles.statLabel}>Day Streak</div>
        </div>
        <div className={styles.divider} />
        <div className={styles.statItem}>
          <div className={styles.statValue}>{executionScore}%</div>
          <div className={styles.statLabel}>Execution</div>
        </div>
      </div>

      {/* Referral & Squad Quick Row */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '14px', width: '100%', justifyContent: 'center' }}>
        <button
          onClick={() => dispatch({ 
            type: 'OPEN_SHARE_MODAL',
            payload: {
              title: `Kaelo Executor: ${user.name}`,
              description: `Building consistent habits. Level ${levelInfo.level} · ${streak}d streak.`
            }
          })}
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 800,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card-subtle)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          Referral: {state.referralCode || 'FRED84'} (+250 XP)
        </button>

        <button
          onClick={() => dispatch({ type: 'OPEN_SQUAD_MODAL' })}
          style={{
            padding: '9px 14px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 800,
            border: 'none',
            background: 'var(--kaelo-lime, #C7FF35)',
            color: '#111111',
            cursor: 'pointer'
          }}
        >
          {state.squad?.name ? 'Squad' : 'Join Squad'}
        </button>
      </div>
    </div>
  );
};

export default ProfileHeader;

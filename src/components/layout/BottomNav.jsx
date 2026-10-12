import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Target, Sparkles, TrendingUp, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './BottomNav.module.css';

const navItems = [
  { path: '/today', icon: LayoutDashboard, label: 'Today' },
  { path: '/quests', icon: Target, label: 'Quests' },
  { path: '/ai', isAI: true, icon: Sparkles, label: 'Kaelo' },
  { path: '/journey', icon: TrendingUp, label: 'Journey' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const BottomNav = () => {
  let isBehind = false;
  try {
    const { state } = useApp();
    const hasMissedTasks = (state?.tasks || []).some(t => t.status === 'missed');
    const hasOverdueGoals = (state?.goals || []).some(g => g.status === 'behind' || g.status === 'at_risk');
    isBehind = Boolean(
      state?.capacityState === 'OVER' || 
      state?.streakRisk === true || 
      hasMissedTasks || 
      hasOverdueGoals
    );
  } catch (e) {
    // Context unavailable
  }

  return (
    <nav className={styles.bottomNav}>
      {navItems.map(({ path, icon: Icon, label, isAI }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) => 
            `${styles.navItem} ${isAI ? styles.aiNavItem : ''} ${isActive ? styles.active : ''}`
          }
        >
          {({ isActive }) => (
            <>
              {isAI ? (
                <div className={`${styles.aiOrb} ${isActive ? styles.aiOrbActive : ''} ${isBehind ? styles.aiOrbBehind : ''}`}>
                  <div className={`${styles.aiOrbGlow} ${isBehind ? styles.aiOrbGlowBehind : ''}`} />
                  <img 
                    src={isBehind ? "/assets/kaelo-avatar-red.png" : "/assets/kaelo-avatar.png"} 
                    alt={isBehind ? "Kaelo Alert" : "Kaelo"} 
                    className={styles.aiAvatarImg} 
                  />
                </div>
              ) : (
                <div className={styles.iconWrapper}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
              )}
              <span className={`${styles.label} ${isAI ? (isBehind ? styles.aiLabelBehind : styles.aiLabel) : ''}`}>{label}</span>
              {isActive && !isAI && <div className={styles.indicator} />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './ThemeSwitcher.module.css';

const THEMES = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'night', label: 'Night', icon: Sparkles },
  { id: 'dark', label: 'Dark', icon: Moon }
];

const ThemeSwitcher = ({ compact = false, className = '' }) => {
  const { state, dispatch } = useApp();
  const currentTheme = state.theme || 'light';

  const handleSelect = (themeId) => {
    dispatch({ type: 'SET_THEME', payload: themeId });
  };

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''} ${className}`}>
      {THEMES.map(({ id, label, icon: Icon }) => {
        const isActive = currentTheme === id;
        return (
          <button
            key={id}
            type="button"
            className={`${styles.themeBtn} ${isActive ? styles.themeBtnActive : ''} ${compact ? styles.iconOnly : ''}`}
            onClick={() => handleSelect(id)}
            title={`${label} Mode`}
            aria-label={`${label} Mode`}
          >
            {isActive && (
              <motion.div
                layoutId="activeThemePill"
                className={styles.activeIndicator}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
            <Icon size={14} strokeWidth={isActive ? 2.5 : 2} style={{ zIndex: 2 }} />
            {!compact && <span style={{ zIndex: 2 }}>{label}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default ThemeSwitcher;

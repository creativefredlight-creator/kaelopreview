import React from 'react';
import styles from './StickerIcon.module.css';

/**
 * Gen-Z Neo-Pop Illustrated Stickers with expressive cartoon eyes,
 * inspired by Kaelo and the Mellow brand creative illustration style.
 * 100% custom SVG illustrations — ZERO native/system emojis!
 */
export const STICKERS = {
  // --- Categories ---
  academic: {
    name: 'Study Buddy',
    color: '#4F8CF7',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <rect x="6" y="8" width="28" height="24" rx="6" fill="#4F8CF7" stroke="#111" strokeWidth="2.5" />
        <path d="M6 14 H34" stroke="#111" strokeWidth="2" strokeDasharray="2 2" />
        {/* Cartoon Eyes */}
        <ellipse cx="16" cy="22" rx="4" ry="4.5" fill="#FFF" stroke="#111" strokeWidth="2" />
        <circle cx="17.5" cy="22" r="2" fill="#111" />
        <circle cx="18" cy="21" r="0.8" fill="#FFF" />
        
        <ellipse cx="24" cy="22" rx="4" ry="4.5" fill="#FFF" stroke="#111" strokeWidth="2" />
        <circle cx="25.5" cy="22" r="2" fill="#111" />
        <circle cx="26" cy="21" r="0.8" fill="#FFF" />
        {/* Bookmark ribbon */}
        <path d="M12 6 V12 L15 10 L18 12 V6" fill="#C7FF35" stroke="#111" strokeWidth="2" />
      </svg>
    )
  },

  business: {
    name: 'Vault Bot',
    color: '#F7A34F',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <rect x="7" y="10" width="26" height="22" rx="7" fill="#F7A34F" stroke="#111" strokeWidth="2.5" />
        <path d="M15 10 V6 C15 4.5 17 4 20 4 C23 4 25 4.5 25 6 V10" fill="none" stroke="#111" strokeWidth="2.5" />
        {/* Big cartoon eyes */}
        <circle cx="15" cy="20" r="4.5" fill="#FFF" stroke="#111" strokeWidth="2" />
        <circle cx="16.5" cy="20" r="2.2" fill="#111" />
        <circle cx="17" cy="19" r="0.9" fill="#FFF" />
        
        <circle cx="25" cy="20" r="4.5" fill="#FFF" stroke="#111" strokeWidth="2" />
        <circle cx="26.5" cy="20" r="2.2" fill="#111" />
        <circle cx="27" cy="19" r="0.9" fill="#FFF" />
        {/* Coin badge */}
        <circle cx="20" cy="27" r="2" fill="#C7FF35" stroke="#111" strokeWidth="1.5" />
      </svg>
    )
  },

  career: {
    name: 'Spiky Sparky',
    color: '#FF5E5E',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <path 
          d="M20 3 L24 12 L33 9 L29 18 L38 22 L29 26 L33 35 L24 31 L20 39 L16 31 L7 35 L11 26 L2 22 L11 18 L7 9 L16 12 Z" 
          fill="#FF5E5E" 
          stroke="#111" 
          strokeWidth="2.5" 
          strokeLinejoin="round"
        />
        {/* Big sideways curious eyes */}
        <ellipse cx="17" cy="22" rx="3.5" ry="4" fill="#FFF" stroke="#111" strokeWidth="2" />
        <circle cx="18.5" cy="22" r="1.8" fill="#111" />
        <ellipse cx="23" cy="22" rx="3.5" ry="4" fill="#FFF" stroke="#111" strokeWidth="2" />
        <circle cx="24.5" cy="22" r="1.8" fill="#111" />
      </svg>
    )
  },

  freelancing: {
    name: 'Pixel Pal',
    color: '#34D399',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <rect x="8" y="9" width="24" height="17" rx="4" fill="#34D399" stroke="#111" strokeWidth="2.5" />
        <path d="M4 27 H36 L34 32 H6 Z" fill="#111" stroke="#111" strokeWidth="1.5" />
        {/* Screen eyes */}
        <ellipse cx="16" cy="17" rx="3.5" ry="4" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="17.2" cy="17" r="1.8" fill="#111" />
        <circle cx="17.5" cy="16.2" r="0.7" fill="#FFF" />
        
        <ellipse cx="24" cy="17" rx="3.5" ry="4" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="25.2" cy="17" r="1.8" fill="#111" />
        <circle cx="25.5" cy="16.2" r="0.7" fill="#FFF" />
      </svg>
    )
  },

  skills: {
    name: 'Brain Spark',
    color: '#A982FF',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <path 
          d="M13 14 C10 14 8 17 8 20 C8 25 12 28 17 28 H23 C28 28 32 25 32 20 C32 17 30 14 27 14 C27 10 23 8 20 8 C17 8 13 10 13 14 Z" 
          fill="#A982FF" 
          stroke="#111" 
          strokeWidth="2.5" 
        />
        <path d="M19 3 L16 9 H22 L19 14" fill="#C7FF35" stroke="#111" strokeWidth="1.8" />
        <circle cx="16" cy="20" r="3.5" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="17" cy="20" r="1.7" fill="#111" />
        <circle cx="24" cy="20" r="3.5" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="25" cy="20" r="1.7" fill="#111" />
      </svg>
    )
  },

  personal: {
    name: 'Star Boy',
    color: '#FBBF24',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <path 
          d="M20 5 L24 15 L35 16 L27 24 L29 35 L20 29 L11 35 L13 24 L5 16 L16 15 Z" 
          fill="#FBBF24" 
          stroke="#111" 
          strokeWidth="2.5" 
          strokeLinejoin="round"
        />
        <circle cx="17" cy="20" r="3" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="18" cy="20" r="1.5" fill="#111" />
        <circle cx="23" cy="20" r="3" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="24" cy="20" r="1.5" fill="#111" />
        <ellipse cx="14" cy="23" rx="1.5" ry="1" fill="#FF8A8A" />
        <ellipse cx="26" cy="23" rx="1.5" ry="1" fill="#FF8A8A" />
      </svg>
    )
  },

  health: {
    name: 'Zen Cloud',
    color: '#FF7AC6',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <path 
          d="M12 24 C8 24 6 20 8 16 C9 13 13 12 15 14 C16 10 20 8 24 10 C27 11 29 14 28 17 C32 17 34 21 33 24 C31 28 27 28 25 28 C23 31 18 31 15 28 C13 28 12 26 12 24 Z" 
          fill="#FF7AC6" 
          stroke="#111" 
          strokeWidth="2.5" 
        />
        <ellipse cx="17" cy="20" rx="3.8" ry="4.2" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="18.5" cy="20" r="2" fill="#111" />
        <ellipse cx="23.5" cy="20" rx="3.8" ry="4.2" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="25" cy="20" r="2" fill="#111" />
      </svg>
    )
  },

  creative: {
    name: 'Art Spark',
    color: '#60A5FA',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <path 
          d="M8 20 C8 12 14 6 22 6 C29 6 34 11 34 18 C34 23 30 26 26 26 C24 26 24 28 24 30 C24 33 21 35 18 35 C12 35 8 29 8 20 Z" 
          fill="#60A5FA" 
          stroke="#111" 
          strokeWidth="2.5" 
        />
        <circle cx="15" cy="18" r="3.5" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="16.2" cy="18" r="1.8" fill="#111" />
        <circle cx="23" cy="18" r="3.5" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="24.2" cy="18" r="1.8" fill="#111" />
        <circle cx="14" cy="26" r="2" fill="#C7FF35" stroke="#111" strokeWidth="1" />
        <circle cx="27" cy="14" r="2" fill="#FF5E5E" stroke="#111" strokeWidth="1" />
      </svg>
    )
  },

  // --- Blockers ---
  overload: {
    name: 'Swirl Brain',
    color: '#F43F5E',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <circle cx="20" cy="20" r="14" fill="#F43F5E" stroke="#111" strokeWidth="2.5" />
        <path d="M12 18 A 3 3 0 0 1 17 18 A 2 2 0 0 1 14 18" fill="none" stroke="#FFF" strokeWidth="1.8" />
        <path d="M22 18 A 3 3 0 0 1 27 18 A 2 2 0 0 1 24 18" fill="none" stroke="#FFF" strokeWidth="1.8" />
        <path d="M14 26 Q17 24 20 26 Q23 28 26 26" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  },

  procrastination: {
    name: 'Melting Clock',
    color: '#FB923C',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <path d="M10 14 C10 8 15 6 20 6 C26 6 30 10 30 16 C30 24 26 28 25 34 C24 36 21 37 19 35 C17 33 16 30 14 28 C10 26 10 20 10 14 Z" fill="#FB923C" stroke="#111" strokeWidth="2.5" />
        <ellipse cx="16" cy="16" rx="3.5" ry="2" fill="#FFF" stroke="#111" strokeWidth="1.6" />
        <circle cx="16.5" cy="16.5" r="1.2" fill="#111" />
        <ellipse cx="23" cy="16" rx="3.5" ry="2" fill="#FFF" stroke="#111" strokeWidth="1.6" />
        <circle cx="23.5" cy="16.5" r="1.2" fill="#111" />
        <path d="M19 22 L22 25" stroke="#111" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  },

  distractions: {
    name: 'Screen Zombie',
    color: '#818CF8',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <rect x="11" y="6" width="18" height="28" rx="5" fill="#818CF8" stroke="#111" strokeWidth="2.5" />
        <circle cx="16" cy="18" r="3.5" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="16" cy="18" r="1.8" fill="#111" />
        <circle cx="24" cy="18" r="3.5" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="24" cy="18" r="1.8" fill="#111" />
        <path d="M20 6 V2 M17 2 H23" stroke="#111" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  },

  planning: {
    name: 'Loop Scroll',
    color: '#CBD5E1',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <rect x="9" y="8" width="22" height="26" rx="4" fill="#CBD5E1" stroke="#111" strokeWidth="2.5" />
        <path d="M14 13 H26 M14 18 H26 M14 23 H21" stroke="#111" strokeWidth="2" strokeLinecap="round" />
        <circle cx="23" cy="26" r="3.5" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="24" cy="25" r="1.6" fill="#111" />
      </svg>
    )
  },

  inconsistency: {
    name: 'Rollercoaster',
    color: '#F472B6',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <path d="M6 30 Q12 10 20 22 T34 12" fill="none" stroke="#F472B6" strokeWidth="4" strokeLinecap="round" />
        <path d="M6 30 Q12 10 20 22 T34 12" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="3 3" />
        <circle cx="20" cy="20" r="6" fill="#C7FF35" stroke="#111" strokeWidth="2" />
        <circle cx="19" cy="19" r="1.5" fill="#111" />
        <circle cx="22" cy="19" r="1.5" fill="#111" />
      </svg>
    )
  },

  priority: {
    name: 'Question Mark Blob',
    color: '#A78BFA',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <circle cx="20" cy="20" r="14" fill="#A78BFA" stroke="#111" strokeWidth="2.5" />
        <circle cx="15" cy="18" r="4.2" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="15" cy="19" r="2" fill="#111" />
        <circle cx="24" cy="18" r="2.8" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="24" cy="19" r="1.4" fill="#111" />
        <path d="M19 25 Q20 27 21 27" stroke="#111" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  },

  // --- Commitments & Daily Fixed Times ---
  sleep: {
    name: 'Night Sleep Buddy',
    color: '#6366F1',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        {/* Crescent moon shape with nightcap */}
        <path d="M22 6 C13 7 7 14 7 23 C7 31 14 37 23 37 C27 37 31 35 34 32 C26 33 19 26 19 18 C19 13 22 8 26 6 C24.6 6 23.3 6 22 6 Z" fill="#6366F1" stroke="#111" strokeWidth="2.5" />
        {/* Sleeping curved eyelashes */}
        <path d="M14 20 Q16 23 18 20" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
        <path d="M13 23 L12 25 M16 23 L16 25 M19 22 L20 24" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
        {/* Small floating Z */}
        <path d="M28 11 H32 L28 16 H32" fill="none" stroke="#C7FF35" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  },

  work: {
    name: 'Work Bot',
    color: '#F97316',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <rect x="7" y="11" width="26" height="20" rx="5" fill="#F97316" stroke="#111" strokeWidth="2.5" />
        <path d="M14 11 V7 C14 5.5 16 5 20 5 C24 5 26 5.5 26 7 V11" fill="none" stroke="#111" strokeWidth="2.5" />
        {/* Focused robot eyes */}
        <rect x="12" y="17" width="6" height="5" rx="1.5" fill="#FFF" stroke="#111" strokeWidth="1.5" />
        <circle cx="15" cy="19.5" r="1.3" fill="#111" />
        <rect x="22" y="17" width="6" height="5" rx="1.5" fill="#FFF" stroke="#111" strokeWidth="1.5" />
        <circle cx="25" cy="19.5" r="1.3" fill="#111" />
        <path d="M17 26 H23" stroke="#111" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  },

  school: {
    name: 'Study Pencil',
    color: '#3B82F6',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <path d="M8 8 L32 8 L28 32 L12 32 Z" fill="#3B82F6" stroke="#111" strokeWidth="2.5" />
        <path d="M12 32 L20 38 L28 32 Z" fill="#FCD34D" stroke="#111" strokeWidth="2" />
        {/* Big curious eyes */}
        <circle cx="16" cy="18" r="3.5" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="17" cy="18" r="1.7" fill="#111" />
        <circle cx="24" cy="18" r="3.5" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="25" cy="18" r="1.7" fill="#111" />
      </svg>
    )
  },

  commute: {
    name: 'Transit Cruiser',
    color: '#06B6D4',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <rect x="6" y="12" width="28" height="17" rx="5" fill="#06B6D4" stroke="#111" strokeWidth="2.5" />
        {/* Wheels */}
        <circle cx="12" cy="29" r="3.5" fill="#111" />
        <circle cx="12" cy="29" r="1.2" fill="#C7FF35" />
        <circle cx="28" cy="29" r="3.5" fill="#111" />
        <circle cx="28" cy="29" r="1.2" fill="#C7FF35" />
        {/* Headlight eyes */}
        <circle cx="15" cy="19" r="3.2" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="16.5" cy="19" r="1.6" fill="#111" />
        <circle cx="25" cy="19" r="3.2" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="26.5" cy="19" r="1.6" fill="#111" />
      </svg>
    )
  },

  family: {
    name: 'Heart Buddy',
    color: '#EC4899',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <path 
          d="M20 34 C12 28 6 22 6 15 C6 9 11 6 16 6 C18.5 6 20 7.5 20 7.5 C20 7.5 21.5 6 24 6 C29 6 34 9 34 15 C34 22 28 28 20 34 Z" 
          fill="#EC4899" 
          stroke="#111" 
          strokeWidth="2.5" 
          strokeLinejoin="round"
        />
        <circle cx="15" cy="16" r="3.2" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="15.8" cy="16" r="1.6" fill="#111" />
        <circle cx="25" cy="16" r="3.2" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="24.2" cy="16" r="1.6" fill="#111" />
        <path d="M18 21 Q20 23 22 21" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },

  other: {
    name: 'Spark Orb',
    color: '#8B5CF6',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <circle cx="20" cy="20" r="14" fill="#8B5CF6" stroke="#111" strokeWidth="2.5" />
        <circle cx="15" cy="18" r="3.5" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="16" cy="18" r="1.7" fill="#111" />
        <circle cx="25" cy="18" r="3.5" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="26" cy="18" r="1.7" fill="#111" />
        <path d="M16 24 Q20 27 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },

  // --- Achievements ---
  first_mission: {
    name: 'Sprout Buddy',
    color: '#22C55E',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        {/* Pot */}
        <path d="M12 22 L14 34 H26 L28 22 Z" fill="#F97316" stroke="#111" strokeWidth="2.2" />
        {/* Sprout leaf */}
        <path d="M20 22 V14 C20 10 26 8 28 12 C30 16 24 18 20 18" fill="#22C55E" stroke="#111" strokeWidth="2" />
        <path d="M20 17 C16 17 12 14 13 10 C14 7 19 8 20 12" fill="#86EFAC" stroke="#111" strokeWidth="2" />
        {/* Pot eyes */}
        <circle cx="17" cy="27" r="2.2" fill="#FFF" stroke="#111" strokeWidth="1.4" />
        <circle cx="17.6" cy="27" r="1.1" fill="#111" />
        <circle cx="23" cy="27" r="2.2" fill="#FFF" stroke="#111" strokeWidth="1.4" />
        <circle cx="23.6" cy="27" r="1.1" fill="#111" />
      </svg>
    )
  },

  finisher: {
    name: 'Bullseye Champ',
    color: '#EF4444',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <circle cx="20" cy="20" r="15" fill="#EF4444" stroke="#111" strokeWidth="2.5" />
        <circle cx="20" cy="20" r="10" fill="#FFF" stroke="#111" strokeWidth="2" />
        <circle cx="20" cy="20" r="5" fill="#EF4444" stroke="#111" strokeWidth="1.8" />
        {/* Eyes on inner circle */}
        <circle cx="18" cy="19.5" r="1.4" fill="#111" />
        <circle cx="22" cy="19.5" r="1.4" fill="#111" />
      </svg>
    )
  },

  streak: {
    name: 'Flame Buddy',
    color: '#FF6433',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <path 
          d="M20 4 C20 4 27 12 27 20 C27 27 23 33 17 33 C11 33 7 28 8 23 C9 18 13 16 14 11 C15 17 19 18 19 18 C19 18 17 14 20 4 Z" 
          fill="#FF6433" 
          stroke="#111" 
          strokeWidth="2.5" 
          strokeLinejoin="round"
        />
        <path d="M18 22 C18 22 22 24 22 28 C22 30 20 32 18 32 C15 32 14 30 15 28 C15 26 18 22 18 22 Z" fill="#C7FF35" />
        <circle cx="16" cy="21" r="2.5" fill="#FFF" stroke="#111" strokeWidth="1.5" />
        <circle cx="16.5" cy="21" r="1.2" fill="#111" />
        <circle cx="22" cy="21" r="2.5" fill="#FFF" stroke="#111" strokeWidth="1.5" />
        <circle cx="22.5" cy="21" r="1.2" fill="#111" />
      </svg>
    )
  },

  week_warrior: {
    name: 'Week Warrior Flame',
    color: '#FF6433',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <path 
          d="M20 3 C20 3 29 11 29 20 C29 28 24 34 18 34 C11 34 6 29 7 23 C8 17 13 15 14 10 C15 16 20 17 20 17 C20 17 18 13 20 3 Z" 
          fill="#FF6433" 
          stroke="#111" 
          strokeWidth="2.5" 
          strokeLinejoin="round"
        />
        <circle cx="16" cy="21" r="3" fill="#FFF" stroke="#111" strokeWidth="1.6" />
        <circle cx="17" cy="21" r="1.5" fill="#111" />
        <circle cx="23" cy="21" r="3" fill="#FFF" stroke="#111" strokeWidth="1.6" />
        <circle cx="24" cy="21" r="1.5" fill="#111" />
      </svg>
    )
  },

  locked_in: {
    name: 'Lock-In Champ',
    color: '#C7FF35',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <path d="M14 18 V12 C14 8 17 6 20 6 C23 6 26 8 26 12 V18" fill="none" stroke="#111" strokeWidth="3" />
        <rect x="9" y="16" width="22" height="18" rx="6" fill="#C7FF35" stroke="#111" strokeWidth="2.5" />
        <ellipse cx="16" cy="24" rx="3.5" ry="3.8" fill="#111" />
        <circle cx="15.5" cy="23" r="1.2" fill="#FFF" />
        <ellipse cx="24" cy="24" rx="3.5" ry="3.8" fill="#111" />
        <circle cx="23.5" cy="23" r="1.2" fill="#FFF" />
      </svg>
    )
  },

  capacity_master: {
    name: 'Balance Scale',
    color: '#10B981',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <path d="M20 8 V32 M12 32 H28" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M8 14 H32" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
        {/* Pans */}
        <path d="M6 14 L8 24 H14 L16 14" fill="#10B981" stroke="#111" strokeWidth="2" />
        <path d="M24 14 L26 24 H32 L34 14" fill="#C7FF35" stroke="#111" strokeWidth="2" />
        {/* Balance eyes */}
        <circle cx="18" cy="11" r="1.8" fill="#111" />
        <circle cx="22" cy="11" r="1.8" fill="#111" />
      </svg>
    )
  },

  momentum_beast: {
    name: 'Volt Bolt',
    color: '#C7FF35',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <path d="M22 3 L10 21 H20 L16 37 L30 18 H20 Z" fill="#C7FF35" stroke="#111" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="18" cy="15" r="2" fill="#111" />
        <circle cx="23" cy="15" r="2" fill="#111" />
      </svg>
    )
  },

  lightning: {
    name: 'Volt Bolt',
    color: '#C7FF35',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <path d="M22 3 L10 21 H20 L16 37 L30 18 H20 Z" fill="#C7FF35" stroke="#111" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="18" cy="15" r="2" fill="#111" />
        <circle cx="23" cy="15" r="2" fill="#111" />
      </svg>
    )
  },

  trophy: {
    name: 'Cup of Win',
    color: '#FFD700',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <path d="M11 9 H29 V18 C29 23 25 26 20 26 C15 26 11 23 11 18 Z" fill="#FFD700" stroke="#111" strokeWidth="2.5" />
        <path d="M11 12 H7 C5.5 12 5 15 6 17 C7 19 9 20 11 20" fill="none" stroke="#111" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M29 12 H33 C34.5 12 35 15 34 17 C33 19 31 20 29 20" fill="none" stroke="#111" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M20 26 V31 M14 31 H26" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="16" cy="16" r="2.8" fill="#111" />
        <circle cx="15.5" cy="15.2" r="1" fill="#FFF" />
        <circle cx="24" cy="16" r="2.8" fill="#111" />
        <circle cx="23.5" cy="15.2" r="1" fill="#FFF" />
      </svg>
    )
  },

  quest_complete: {
    name: 'Cup of Win',
    color: '#FFD700',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <path d="M11 9 H29 V18 C29 23 25 26 20 26 C15 26 11 23 11 18 Z" fill="#FFD700" stroke="#111" strokeWidth="2.5" />
        <path d="M11 12 H7 C5.5 12 5 15 6 17 C7 19 9 20 11 20" fill="none" stroke="#111" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M29 12 H33 C34.5 12 35 15 34 17 C33 19 31 20 29 20" fill="none" stroke="#111" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M20 26 V31 M14 31 H26" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="16" cy="16" r="2.8" fill="#111" />
        <circle cx="15.5" cy="15.2" r="1" fill="#FFF" />
        <circle cx="24" cy="16" r="2.8" fill="#111" />
        <circle cx="23.5" cy="15.2" r="1" fill="#FFF" />
      </svg>
    )
  },

  comeback: {
    name: 'Loop Boomerang',
    color: '#A855F7',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <path d="M20 8 A 12 12 0 1 1 9 20" fill="none" stroke="#A855F7" strokeWidth="4" strokeLinecap="round" />
        <path d="M6 14 L9 20 L15 17" fill="#C7FF35" stroke="#111" strokeWidth="2" strokeLinejoin="round" />
        {/* Winking buddy in center */}
        <circle cx="20" cy="20" r="6" fill="#C7FF35" stroke="#111" strokeWidth="2" />
        <path d="M17 19 L19 19" stroke="#111" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="23" cy="19" r="1.3" fill="#111" />
      </svg>
    )
  },

  deep_flow: {
    name: 'Wave Rider',
    color: '#06B6D4',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <path d="M6 25 Q12 12 20 20 T34 16 L34 32 H6 Z" fill="#06B6D4" stroke="#111" strokeWidth="2.2" />
        <path d="M12 22 Q16 16 20 22" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
        {/* Cool sunglasses eyes */}
        <rect x="14" y="18" width="5" height="3.5" rx="1" fill="#111" />
        <rect x="21" y="18" width="5" height="3.5" rx="1" fill="#111" />
        <path d="M19 19.5 H21" stroke="#111" strokeWidth="1.5" />
      </svg>
    )
  },

  default: {
    name: 'Kaelo Buddy',
    color: '#C7FF35',
    render: () => (
      <svg viewBox="0 0 40 40" className={styles.svg}>
        <rect x="6" y="6" width="28" height="28" rx="10" fill="#C7FF35" stroke="#111" strokeWidth="2.5" />
        <circle cx="15" cy="18" r="3.5" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="16" cy="18" r="1.8" fill="#111" />
        <circle cx="25" cy="18" r="3.5" fill="#FFF" stroke="#111" strokeWidth="1.8" />
        <circle cx="26" cy="18" r="1.8" fill="#111" />
        <path d="M16 25 Q20 28 24 25" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
};

const ALIAS_MAP = {
  study: 'academic',
  books: 'academic',
  job: 'business',
  finance: 'business',
  tech: 'freelancing',
  laptop: 'freelancing',
  brain: 'skills',
  learn: 'skills',
  fitness: 'health',
  gym: 'health',
  art: 'creative',
  design: 'creative',
  flame: 'streak',
  fire: 'streak',
  trophy_icon: 'trophy',
  bolt: 'lightning',
  star: 'personal'
};

const StickerIcon = ({ name, size = 36, className = '', fallbackEmoji = null }) => {
  const cleanKey = (name || '').toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
  const sticker = STICKERS[cleanKey] || 
                  STICKERS[ALIAS_MAP[cleanKey]] || 
                  STICKERS['default'];

  return (
    <div 
      className={`${styles.container} ${className}`} 
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      title={sticker?.name || 'Kaelo Custom Sticker'}
    >
      {sticker.render()}
    </div>
  );
};

export default StickerIcon;

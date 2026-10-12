import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import styles from './KaeloInteractiveFace.module.css';

/**
 * KaeloInteractiveFace
 * The interactive character face of Kaelo.
 * - DEFAULT: The official PURPLE mascot.
 * - WARNING / BEHIND: Switches to RED mascot ONLY when the user is not keeping up with their target.
 * Includes mouse-tracking pupils, responsive facial emotions, and speech bubbles.
 */
const KaeloInteractiveFace = ({
  mood = 'curious', // 'curious' | 'happy' | 'focused' | 'shocked' | 'sleepy' | 'warning'
  size = 180,
  peeking = false,
  speech = null,
  trackMouse = true,
  color = null, // optional manual override
  isBehindTarget = undefined,
  className = ''
}) => {
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

  let appContext = null;
  try {
    appContext = useApp();
  } catch (e) {
    // Context unavailable
  }

  const state = appContext?.state;

  // Determine whether user is behind target
  const isBehind = isBehindTarget !== undefined 
    ? Boolean(isBehindTarget) 
    : Boolean(
        mood === 'warning' ||
        state?.capacityState === 'OVER' ||
        state?.streakRisk === true ||
        (state?.streak === 0 && (state?.tasks || []).some(t => t.status === 'missed')) ||
        (state?.tasks || []).some(t => t.status === 'missed') ||
        (state?.goals || []).some(g => g.status === 'behind' || g.status === 'at_risk')
      );

  // Active colors: Purple default, Red ONLY when falling behind target
  const activeColor = color || (isBehind ? '#FF3B30' : '#9F66FC');
  const gradStart = isBehind ? '#FF6B5E' : '#C4B0FF';
  const gradMid = activeColor;
  const gradEnd = isBehind ? '#C51C1C' : '#7C3AED';

  useEffect(() => {
    if (!trackMouse) return;

    const updateCoords = (clientX, clientY) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (clientX - cx) / cx;
      const dy = (clientY - cy) / cy;

      setPupilOffset({
        x: Math.max(-8, Math.min(8, dx * 8)),
        y: Math.max(-7, Math.min(7, dy * 7))
      });
    };

    const handleMouseMove = (e) => {
      updateCoords(e.clientX, e.clientY);
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        updateCoords(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [trackMouse]);

  // Adjust pupil and eyelid coordinates based on mood
  const getEyeExpression = () => {
    if (isBehind) {
      return { eyeScaleY: 1.15, pupilScale: 1.2, eyeY: -3 };
    }

    switch (mood) {
      case 'happy':
        return { eyeScaleY: 0.88, pupilScale: 1.1, eyeY: -2 };
      case 'shocked':
        return { eyeScaleY: 1.18, pupilScale: 1.25, eyeY: -4 };
      case 'focused':
        return { eyeScaleY: 0.78, pupilScale: 0.95, eyeY: 1 };
      case 'sleepy':
        return { eyeScaleY: 0.45, pupilScale: 0.85, eyeY: 4 };
      default: // curious
        return { eyeScaleY: 1, pupilScale: 1, eyeY: 0 };
    }
  };

  const expr = getEyeExpression();

  return (
    <div 
      className={`${styles.container} ${peeking ? styles.peeking : ''} ${className}`}
      style={{ 
        width: typeof size === 'number' ? `${size}px` : size, 
        height: peeking ? (typeof size === 'number' ? `${size * 0.65}px` : 'auto') : (typeof size === 'number' ? `${size}px` : 'auto'),
        maxWidth: '100%',
        maxHeight: '100%'
      }}
    >
      {speech && (
        <motion.div 
          className={`${styles.speechBubble} ${isBehind ? styles.alertBubble : ''}`}
          initial={{ opacity: 0, scale: 0.85, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <span>{speech}</span>
        </motion.div>
      )}

      <svg 
        viewBox="0 0 200 160" 
        className={styles.svg}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id={`mascotBodyGrad_${isBehind ? 'red' : 'purple'}`} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor={gradStart} />
            <stop offset="55%" stopColor={gradMid} />
            <stop offset="100%" stopColor={gradEnd} />
          </radialGradient>
        </defs>

        {/* Side arms (visible when not in peeking mode) */}
        {!peeking && (
          <g>
            <ellipse 
              cx="22" 
              cy="104" 
              rx="12" 
              ry="18" 
              fill={activeColor} 
              stroke="#111111" 
              strokeWidth="5" 
              transform="rotate(22 22 104)" 
            />
            <ellipse 
              cx="178" 
              cy="104" 
              rx="12" 
              ry="18" 
              fill={activeColor} 
              stroke="#111111" 
              strokeWidth="5" 
              transform="rotate(-22 178 104)" 
            />
          </g>
        )}

        {/* Main Character Body */}
        {peeking ? (
          <path 
            d="M 16 160 C 16 60, 48 16, 100 16 C 152 16, 184 60, 184 160 Z" 
            fill={`url(#mascotBodyGrad_${isBehind ? 'red' : 'purple'})`} 
            stroke="#111111" 
            strokeWidth="6" 
            strokeLinejoin="round"
          />
        ) : (
          <ellipse 
            cx="100" 
            cy="84" 
            rx="78" 
            ry="72" 
            fill={`url(#mascotBodyGrad_${isBehind ? 'red' : 'purple'})`} 
            stroke="#111111" 
            strokeWidth="6" 
          />
        )}

        {/* Glossy Cartoon Specular Highlight */}
        <path 
          d="M 44 44 C 54 28, 76 22, 98 22" 
          fill="none" 
          stroke="#FFFFFF" 
          strokeWidth="6.5" 
          strokeLinecap="round" 
          opacity="0.9"
        />
        <ellipse 
          cx="46" 
          cy="48" 
          rx="7" 
          ry="4" 
          transform="rotate(-30 46 48)" 
          fill="#FFFFFF" 
          opacity="0.95" 
        />

        {/* Eyebrows (Arched, cartoon style) */}
        <motion.g animate={{ y: isBehind ? -6 : mood === 'shocked' ? -7 : mood === 'focused' ? 3 : 0 }}>
          <path 
            d={isBehind ? "M 52 44 Q 66 36 80 47" : "M 52 48 Q 66 40 80 47"} 
            fill="none" 
            stroke="#111111" 
            strokeWidth="4.5" 
            strokeLinecap="round" 
          />
          <path 
            d={isBehind ? "M 120 47 Q 134 36 148 44" : mood === 'curious' ? "M 120 44 Q 134 36 148 45" : "M 120 48 Q 134 40 148 47"} 
            fill="none" 
            stroke="#111111" 
            strokeWidth="4.5" 
            strokeLinecap="round" 
          />
        </motion.g>

        {/* Left Eye White */}
        <motion.g animate={{ scaleY: expr.eyeScaleY, y: expr.eyeY }} transition={{ type: 'spring', damping: 15 }}>
          <ellipse 
            cx="68" 
            cy="80" 
            rx="27" 
            ry="30" 
            fill="#FFFFFF" 
            stroke="#111111" 
            strokeWidth="5.5" 
          />
          {/* Left Pupil */}
          <motion.g 
            animate={{ 
              x: pupilOffset.x + (mood === 'curious' ? 3 : 0), 
              y: pupilOffset.y + (mood === 'curious' ? -3 : 0),
              scale: expr.pupilScale 
            }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          >
            <ellipse cx="70" cy="82" rx="15" ry="17" fill="#111111" />
            <circle cx="65" cy="76" r="6.5" fill="#FFFFFF" />
            <circle cx="75" cy="88" r="3" fill="#FFFFFF" />
          </motion.g>
        </motion.g>

        {/* Right Eye White */}
        <motion.g animate={{ scaleY: expr.eyeScaleY, y: expr.eyeY }} transition={{ type: 'spring', damping: 15 }}>
          <ellipse 
            cx="132" 
            cy="80" 
            rx="27" 
            ry="30" 
            fill="#FFFFFF" 
            stroke="#111111" 
            strokeWidth="5.5" 
          />
          {/* Right Pupil */}
          <motion.g 
            animate={{ 
              x: pupilOffset.x + (mood === 'curious' ? 3 : 0), 
              y: pupilOffset.y + (mood === 'curious' ? -3 : 0),
              scale: expr.pupilScale 
            }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          >
            <ellipse cx="130" cy="82" rx="15" ry="17" fill="#111111" />
            <circle cx="125" cy="76" r="6.5" fill="#FFFFFF" />
            <circle cx="135" cy="88" r="3" fill="#FFFFFF" />
          </motion.g>
        </motion.g>

        {/* Mouth */}
        {isBehind ? (
          <ellipse cx="100" cy="126" rx="7" ry="9" fill="#111111" />
        ) : mood === 'happy' ? (
          <path 
            d="M 88 122 Q 100 134 112 122" 
            fill="none" 
            stroke="#111111" 
            strokeWidth="4" 
            strokeLinecap="round" 
          />
        ) : mood === 'shocked' ? (
          <ellipse cx="100" cy="126" rx="7" ry="9" fill="#111111" />
        ) : mood === 'focused' ? (
          <path 
            d="M 92 124 L 108 124" 
            fill="none" 
            stroke="#111111" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
          />
        ) : (
          <path 
            d="M 92 124 Q 100 130 108 124" 
            fill="none" 
            stroke="#111111" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
          />
        )}
      </svg>
    </div>
  );
};

export default KaeloInteractiveFace;

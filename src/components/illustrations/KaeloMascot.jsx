import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import styles from './KaeloMascot.module.css';

/**
 * KaeloMascot - The official mascot and visual identity of Kaelo.
 * - DEFAULT / NORMAL: The official PURPLE mascot (celebrate, focus, peek, full, avatar).
 * - WARNING / BEHIND: The RED mascot is used ONLY when the user is not keeping up with their target.
 */
const KaeloMascot = ({
  variant = 'avatar', // 'avatar' | 'full' | 'peek' | 'celebrate' | 'focus' | 'warning'
  size = 48,
  speech = null,
  speechDirection = 'right',
  className = '',
  onClick = null,
  isBehindTarget = undefined, // explicit boolean override
  forceRed = false,
  forcePurple = false
}) => {
  let appContext = null;
  try {
    appContext = useApp();
  } catch (e) {
    // Context unavailable, rely on props
  }

  const state = appContext?.state;

  // Evaluate whether the user is falling behind or missing their target
  const isBehind = forcePurple 
    ? false 
    : forceRed || (isBehindTarget !== undefined 
      ? Boolean(isBehindTarget) 
      : Boolean(
          variant === 'warning' ||
          variant === 'alert' ||
          state?.capacityState === 'OVER' ||
          state?.streakRisk === true ||
          (state?.streak === 0 && (state?.tasks || []).some(t => t.status === 'missed')) ||
          (state?.tasks || []).some(t => t.status === 'missed') ||
          (state?.goals || []).some(g => g.status === 'behind' || g.status === 'at_risk')
        ));

  const isFull = variant === 'full' || variant === 'celebrate' || variant === 'warning';

  let imgSrc;
  if (isBehind) {
    // ONLY use the RED mascot when falling behind the target
    imgSrc = isFull ? '/assets/kaelo-mascot-red.png' : '/assets/kaelo-avatar-red.png';
  } else {
    // Default is the official PURPLE mascot
    if (variant === 'celebrate') {
      imgSrc = '/assets/kaelo-celebrate.png';
    } else if (isFull) {
      imgSrc = '/assets/kaelo-mascot.png';
    } else {
      imgSrc = '/assets/kaelo-avatar.png';
    }
  }

  const getAnimation = () => {
    if (isBehind) {
      // Urgent alert breathing / wiggle when behind target
      return {
        scale: [1, 1.05, 1],
        rotate: [0, -3, 3, 0],
        transition: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }
      };
    }

    switch (variant) {
      case 'celebrate':
        return {
          y: [0, -12, 0, -8, 0],
          rotate: [0, -4, 4, -2, 0],
          transition: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' }
        };
      case 'focus':
        return {
          scale: [1, 1.04, 1],
          transition: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' }
        };
      case 'peek':
        return {
          y: [4, 0, 4],
          transition: { repeat: Infinity, duration: 3, ease: 'easeInOut' }
        };
      default:
        return {
          y: [0, -3, 0],
          transition: { repeat: Infinity, duration: 3.5, ease: 'easeInOut' }
        };
    }
  };

  return (
    <div 
      className={`${styles.container} ${styles[variant]} ${isBehind ? styles.behindTarget : styles.onTarget} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      title={isBehind ? "Kaelo Alert: Target needs attention!" : "Kaelo Coach"}
    >
      {speech && (
        <motion.div 
          className={`${styles.speechBubble} ${styles[`speech_${speechDirection}`]} ${isBehind ? styles.alertSpeech : ''}`}
          initial={{ opacity: 0, scale: 0.9, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
        >
          <span>{speech}</span>
        </motion.div>
      )}

      <motion.div 
        className={styles.imageWrapper}
        animate={getAnimation()}
        style={{ width: size, height: size }}
      >
        <img 
          src={imgSrc} 
          alt={isBehind ? "Kaelo Warning Mascot" : "Kaelo Mascot"} 
          className={styles.image}
          draggable="false"
        />
        {variant === 'focus' && !isBehind && (
          <div className={styles.focusRing} />
        )}
        {variant === 'celebrate' && !isBehind && (
          <div className={styles.celebrateBurst} />
        )}
        {isBehind && (
          <div className={styles.warningGlow} />
        )}
      </motion.div>
    </div>
  );
};

export default KaeloMascot;

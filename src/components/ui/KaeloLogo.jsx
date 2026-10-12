import React from 'react';
import styles from './KaeloLogo.module.css';

/**
 * KaeloLogo
 * Official KaeloAI brand logo with:
 * - Electric Lime "Kael"
 * - Custom circular "o" with black 4-point star/sparkle inside
 * - Electric Purple "AI"
 * 
 * Supports variants: 'inline', 'banner', 'compact', 'glow', 'image'
 */
const KaeloLogo = ({ 
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl' | number
  variant = 'text', // 'text' | 'image' | 'badge'
  showAI = true,
  className = '',
  onClick = null
}) => {
  if (variant === 'image') {
    return (
      <div 
        className={`${styles.imageWrapper} ${styles[size] || ''} ${className}`}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        <img 
          src="/assets/kaelo-logo.png" 
          alt="KaeloAI" 
          className={styles.logoImage} 
        />
      </div>
    );
  }

  const customStyle = typeof size === 'number' ? { fontSize: `${size}px` } : {};

  if (variant === 'badge') {
    return (
      <div 
        className={`${styles.badgeWrapper} ${styles[size] || ''} ${className}`}
        style={customStyle}
        onClick={onClick}
      >
        <span className={styles.limeText}>Kael</span>
        <span className={styles.oWrapper}>
          <span className={styles.oRing} />
          <svg 
            viewBox="0 0 24 24" 
            className={styles.starIcon} 
            aria-hidden="true"
          >
            <path 
              d="M 12 2 Q 12 10 4 12 Q 12 14 12 22 Q 12 14 20 12 Q 12 10 12 2 Z" 
              fill="#111111" 
            />
          </svg>
        </span>
        {showAI && (
          <span className={styles.purpleAI}>AI</span>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`${styles.logoContainer} ${styles[size] || styles.md} ${className}`}
      style={customStyle}
      onClick={onClick}
    >
      <span className={styles.limeText}>Kael</span>
      <span className={styles.oWrapper}>
        <span className={styles.oRing} />
        <svg 
          viewBox="0 0 24 24" 
          className={styles.starIcon} 
          aria-hidden="true"
        >
          {/* Sharp 4-point sparkle star matching the reference */}
          <path 
            d="M 12 2 Q 12 10 4 12 Q 12 14 12 22 Q 12 14 20 12 Q 12 10 12 2 Z" 
            fill="#111111" 
          />
        </svg>
      </span>
      {showAI && (
        <span className={styles.purpleAI}>AI</span>
      )}
    </div>
  );
};

export default KaeloLogo;

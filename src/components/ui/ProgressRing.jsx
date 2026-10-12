import React from 'react';
import { motion } from 'framer-motion';
import styles from './ProgressRing.module.css';

const ProgressRing = ({
  value = 0,
  size = 'md',
  color = 'lime',
  strokeWidth = 8,
  showValue = false,
  children,
  className = '',
}) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  
  const sizeMap = {
    sm: 48,
    md: 80,
    lg: 120
  };
  
  const pixelSize = sizeMap[size] || sizeMap.md;
  const center = pixelSize / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedValue / 100) * circumference;
  
  const colorClass = styles[`color-${color}`];

  return (
    <div 
      className={`${styles.container} ${className}`} 
      style={{ width: pixelSize, height: pixelSize }}
    >
      <svg
        className={styles.svg}
        width={pixelSize}
        height={pixelSize}
        viewBox={`0 0 ${pixelSize} ${pixelSize}`}
      >
        <circle
          className={styles.background}
          strokeWidth={strokeWidth}
          cx={center}
          cy={center}
          r={radius}
        />
        <motion.circle
          className={`${styles.progress} ${colorClass}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          strokeLinecap="round"
          cx={center}
          cy={center}
          r={radius}
        />
      </svg>
      <div className={styles.content}>
        {showValue && !children && (
          <span className={styles.valueText}>{clampedValue}%</span>
        )}
        {children}
      </div>
    </div>
  );
};

export { ProgressRing };
export default ProgressRing;

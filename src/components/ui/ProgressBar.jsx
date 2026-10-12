import React from 'react';
import { motion } from 'framer-motion';
import styles from './ProgressBar.module.css';

const ProgressBar = ({
  value,
  progress,
  color = 'lime',
  height = 'md',
  showLabel = false,
  animated = true,
  className = '',
  style = {},
}) => {
  const actualValue = value !== undefined ? value : (progress !== undefined ? progress : 0);
  const clampedValue = Math.min(Math.max(actualValue, 0), 100);
  
  const isNumericHeight = typeof height === 'number';
  const heightClass = !isNumericHeight ? (styles[`height-${height}`] || styles['height-md']) : '';
  const colorClass = styles[`color-${color}`] || '';
  const customColorStyle = !colorClass && color ? { backgroundColor: color } : {};

  return (
    <div className={`${styles.wrapper} ${className}`} style={style}>
      {showLabel && (
        <div className={styles.labelContainer}>
          <span className={styles.value}>{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div 
        className={`${styles.container} ${heightClass}`}
        style={isNumericHeight ? { height: `${height}px` } : {}}
      >
        <motion.div
          className={`${styles.fill} ${colorClass}`}
          style={customColorStyle}
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: animated ? 0.5 : 0, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export { ProgressBar };
export default ProgressBar;

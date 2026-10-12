import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import styles from './XPBadge.module.css';

const XPBadge = ({ amount, className = '' }) => {
  return (
    <motion.div
      className={`${styles.xpBadge} ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 15, stiffness: 300 }}
    >
      <Zap size={14} className={styles.icon} />
      <span>+{amount} XP</span>
    </motion.div>
  );
};

export { XPBadge };
export default XPBadge;

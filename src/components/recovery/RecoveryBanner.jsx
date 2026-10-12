import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import KaeloMascot from '../illustrations/KaeloMascot';
import styles from './RecoveryBanner.module.css';

const RecoveryBanner = () => {
  const { state, dispatch } = useApp();
  const { recoveryState, user } = state;

  if (!recoveryState?.needsRecovery || recoveryState?.dismissed) {
    return null;
  }

  const staleCount = recoveryState.staleTasks?.length || 2;

  const handleApplyRecovery = () => {
    dispatch({ type: 'APPLY_RECOVERY_PLAN' });
  };

  const handleDismiss = () => {
    dispatch({ type: 'DISMISS_RECOVERY' });
  };

  return (
    <motion.div 
      className={styles.banner}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className={styles.bannerTop}>
        <div className={styles.mascotWrapper}>
          <KaeloMascot variant="peek" size={38} forceRed={true} />
        </div>
        <div className={styles.messageContent}>
          <div className={styles.titleRow}>
            <span className={styles.badge}>FRESH START</span>
            <span className={styles.timeTag}>RECOVERY FLOW</span>
          </div>
          <h4 className={styles.heading}>
            Welcome back, {user.name || 'Fred'}. Let's reset your plate.
          </h4>
          <p className={styles.text}>
            You have {staleCount} unfinished missions from earlier. No guilt — let's reschedule the excess so your daily capacity stays realistic.
          </p>
        </div>
        <button 
          className={styles.dismissBtn} 
          onClick={handleDismiss}
          title="Dismiss recovery prompt"
          aria-label="Dismiss recovery prompt"
        >
          <X size={15} />
        </button>
      </div>

      <div className={styles.actionRow}>
        <button className={styles.resetBtn} onClick={handleApplyRecovery}>
          <RefreshCw size={13} /> RESET & PROTECT CAPACITY
        </button>
        <button className={styles.keepBtn} onClick={handleDismiss}>
          KEEP AS IS
        </button>
      </div>
    </motion.div>
  );
};

export default RecoveryBanner;

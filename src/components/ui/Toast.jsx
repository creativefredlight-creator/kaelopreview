import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, XCircle, Zap, Trophy } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './Toast.module.css';

const ICONS = {
  xp: Zap,
  achievement: Trophy,
  info: Info,
  warning: AlertCircle,
  error: XCircle,
  success: CheckCircle,
};

const Toast = () => {
  const { state, dispatch } = useApp();
  const { toast } = state;

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        dispatch({ type: 'HIDE_TOAST' });
      }, toast.duration || 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, dispatch]);

  if (!toast) return null;

  const Icon = ICONS[toast.type] || ICONS.info;
  const variantClass = styles[`variant-${toast.type}`] || styles['variant-info'];

  return (
    <AnimatePresence>
      <motion.div
        className={styles.container}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <div className={`${styles.toast} ${variantClass}`}>
          <Icon className={styles.icon} size={20} />
          <div className={styles.content}>
            {toast.title && <h4 className={styles.title}>{toast.title}</h4>}
            <p className={styles.message}>{toast.message}</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export { Toast };
export default Toast;

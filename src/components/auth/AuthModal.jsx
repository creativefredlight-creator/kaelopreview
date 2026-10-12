import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import styles from './AuthModal.module.css';
import { useApp, ACTIONS } from '../../context/AppContext';
import { storage } from '../../utils/helpers';
import KaeloLogo from '../ui/KaeloLogo';
import KaeloMascot from '../illustrations/KaeloMascot';

// Helper to save collected email to localStorage for lead capture & sync
export function recordCollectedEmail(email, provider = 'email', name = '', source = 'auth_modal') {
  if (!email || !email.includes('@')) return false;
  try {
    const list = storage.get('collected_emails') || [];
    const normalized = email.trim().toLowerCase();
    const existingIndex = list.findIndex(item => item.email.toLowerCase() === normalized);
    
    const record = {
      email: normalized,
      provider,
      name: name || normalized.split('@')[0],
      source,
      collectedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...record };
    } else {
      list.unshift(record);
    }
    
    storage.set('collected_emails', list);
    return true;
  } catch (err) {
    console.error('Failed to store collected email:', err);
    return false;
  }
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  initialMode = 'google', 
  initialAuthType = 'signup', 
  onSuccess 
}) {
  const { state, dispatch } = useApp();
  const [authType, setAuthType] = useState(initialAuthType); // 'signup' | 'signin'
  const [mode, setMode] = useState(initialMode); // 'google' | 'email'
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [googleStep, setGoogleStep] = useState('select'); // 'select' | 'custom'
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setAuthType(initialAuthType || 'signup');
      setMode(initialMode || 'google');
      setErrorMessage('');
    }
  }, [isOpen, initialAuthType, initialMode]);

  if (!isOpen) return null;

  const handleGoogleSignIn = (selectedEmail, selectedName = 'Builder') => {
    setIsSubmitting(true);
    setErrorMessage('');

    setTimeout(() => {
      const email = selectedEmail || 'fred@kaelo.app';
      const name = selectedName || (email.split('@')[0]);

      // Record lead in collected emails
      recordCollectedEmail(email, 'google', name, 'google_signin');

      // Update app state
      dispatch({
        type: ACTIONS.UPDATE_USER,
        payload: {
          email,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          authProvider: 'google',
          onboarded: true,
        }
      });

      dispatch({
        type: ACTIONS.SHOW_TOAST,
        payload: {
          title: authType === 'signup' ? 'Account Created' : 'Connected with Google',
          message: `Welcome back, ${name}! Your execution data is synced.`,
          type: 'xp'
        }
      });

      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        if (onSuccess) onSuccess({ email, provider: 'google', name });
      }, 700);
    }, 600);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    setTimeout(() => {
      const name = nameInput.trim() || cleanEmail.split('@')[0];

      // Record lead in collected emails
      recordCollectedEmail(cleanEmail, 'email', name, 'email_magiclink');

      dispatch({
        type: ACTIONS.UPDATE_USER,
        payload: {
          email: cleanEmail,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          authProvider: 'email',
          onboarded: true,
        }
      });

      dispatch({
        type: ACTIONS.SHOW_TOAST,
        payload: {
          title: authType === 'signup' ? 'Account Created' : 'Sign In Successful',
          message: `Logged in as ${cleanEmail}. Ready to build!`,
          type: 'info'
        }
      });

      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        if (onSuccess) onSuccess({ email: cleanEmail, provider: 'email', name });
      }, 700);
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className={styles.backdrop} onClick={onClose}>
        <motion.div 
          className={styles.modalCard}
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} strokeWidth={2.5} />
          </button>

          {/* Top brand branding & purple mascot in high-contrast capsule */}
          <div className={styles.modalHeader}>
            <div className={styles.brandBadge}>
              <KaeloMascot variant="avatar" size={32} forcePurple={true} />
              <KaeloLogo size={22} showAI={true} />
            </div>
            
            <h2 className={styles.headline}>
              {isSuccess 
                ? "You're Locked In!" 
                : authType === 'signup' 
                ? "Create Your Account" 
                : "Welcome Back"}
            </h2>
            <p className={styles.subheadline}>
              {authType === 'signup'
                ? "Lock in your daily capacity, execution habits, and streaks across all devices."
                : "Sync your capacity, streaks, and custom daily plan across all devices."}
            </p>
          </div>

          {/* Top Auth Type Toggle: Create Account vs Sign In */}
          {!isSuccess && (
            <div className={styles.authTypeTabs}>
              <button 
                type="button"
                className={`${styles.authTypeBtn} ${authType === 'signup' ? styles.authTypeActive : ''}`}
                onClick={() => { setAuthType('signup'); setErrorMessage(''); }}
              >
                Create Account
              </button>
              <button 
                type="button"
                className={`${styles.authTypeBtn} ${authType === 'signin' ? styles.authTypeActive : ''}`}
                onClick={() => { setAuthType('signin'); setErrorMessage(''); }}
              >
                Sign In
              </button>
            </div>
          )}

          {/* Tabs for Google vs Email */}
          {!isSuccess && (
            <div className={styles.modeTabs}>
              <button 
                type="button"
                className={`${styles.tabBtn} ${mode === 'google' ? styles.tabActive : ''}`}
                onClick={() => { setMode('google'); setErrorMessage(''); }}
              >
                <svg className={styles.googleIconSvg} viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google</span>
              </button>

              <button 
                type="button"
                className={`${styles.tabBtn} ${mode === 'email' ? styles.tabActive : ''}`}
                onClick={() => { setMode('email'); setErrorMessage(''); }}
              >
                <Mail size={16} />
                <span>Email Magic Link</span>
              </button>
            </div>
          )}

          {/* Success State */}
          {isSuccess && (
            <div className={styles.successBox}>
              <CheckCircle2 size={48} className={styles.successIcon} />
              <p className={styles.successMessage}>Authentication verified! Loading your personal engine...</p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className={styles.errorAlert}>
              {errorMessage}
            </div>
          )}

          {/* Google Flow */}
          {!isSuccess && mode === 'google' && (
            <div className={styles.googleContent}>
              <div className={styles.accountSelector}>
                <button 
                  type="button"
                  className={styles.accountItem}
                  onClick={() => handleGoogleSignIn('alex.builder@gmail.com', 'Alex')}
                  disabled={isSubmitting}
                >
                  <div className={styles.accountAvatar}>A</div>
                  <div className={styles.accountInfo}>
                    <div className={styles.accountName}>Alex Builder</div>
                    <div className={styles.accountEmail}>alex.builder@gmail.com</div>
                  </div>
                  <ArrowRight size={16} className={styles.accountArrow} />
                </button>

                <button 
                  type="button"
                  className={styles.accountItem}
                  onClick={() => handleGoogleSignIn('fred@kaelo.app', 'Fred')}
                  disabled={isSubmitting}
                >
                  <div className={styles.accountAvatar} style={{ background: '#A982FF' }}>F</div>
                  <div className={styles.accountInfo}>
                    <div className={styles.accountName}>Fred (Master Demo)</div>
                    <div className={styles.accountEmail}>fred@kaelo.app</div>
                  </div>
                  <ArrowRight size={16} className={styles.accountArrow} />
                </button>
              </div>

              {googleStep === 'select' ? (
                <button 
                  type="button"
                  className={styles.switchAccountBtn}
                  onClick={() => setGoogleStep('custom')}
                >
                  Use another Google account
                </button>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!customGoogleEmail.includes('@')) {
                      setErrorMessage('Please enter a valid Google email.');
                      return;
                    }
                    handleGoogleSignIn(customGoogleEmail);
                  }}
                  className={styles.customGoogleForm}
                >
                  <input 
                    type="email"
                    className={styles.inputField}
                    placeholder="Enter your Gmail address"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <button 
                    type="submit" 
                    className={styles.submitBtn}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Verifying...' : authType === 'signup' ? 'Create Account with Google' : 'Sign In with This Account'}
                  </button>
                  <button 
                    type="button"
                    className={styles.cancelTextBtn}
                    onClick={() => setGoogleStep('select')}
                  >
                    Back to fast selector
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Email Magic Link Flow */}
          {!isSuccess && mode === 'email' && (
            <form onSubmit={handleEmailSubmit} className={styles.emailForm}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>{authType === 'signup' ? 'YOUR NAME' : 'YOUR NAME (OPTIONAL)'}</label>
                <input 
                  type="text"
                  className={styles.inputField}
                  placeholder="e.g. Jordan"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>EMAIL ADDRESS</label>
                <input 
                  type="email"
                  className={styles.inputField}
                  placeholder="you@domain.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button 
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending Link...' : authType === 'signup' ? 'Create Account with Email' : 'Sign In with Email'}
              </button>
            </form>
          )}

          {/* Bottom Auth Switch */}
          {!isSuccess && (
            <div className={styles.bottomAuthSwitch}>
              {authType === 'signup' ? (
                <span>
                  Already have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => { setAuthType('signin'); setErrorMessage(''); }}
                  >
                    Sign In
                  </button>
                </span>
              ) : (
                <span>
                  New to Kaelo?{' '}
                  <button 
                    type="button" 
                    onClick={() => { setAuthType('signup'); setErrorMessage(''); }}
                  >
                    Create Account
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Privacy & Trust Footer */}
          <div className={styles.modalFooter}>
            <div className={styles.trustBadge}>
              <ShieldCheck size={14} className={styles.trustIcon} />
              <span>Zero spam &bull; Encrypted &bull; Strictly execution notifications</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

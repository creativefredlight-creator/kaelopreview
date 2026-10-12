import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Minus, Plus, Mail, Zap, Target, Trophy, ShieldCheck, Sparkles, Check } from 'lucide-react';
import styles from './Onboarding.module.css';

import { useApp } from '../../context/AppContext';
import { CATEGORIES, EXECUTION_BLOCKERS } from '../../data/constants';
import { calculateDailyCapacity } from '../../utils/helpers';
import { KaeloInteractiveFace, StickerIcon } from '../illustrations';
import ThemeSwitcher from '../ui/ThemeSwitcher';
import KaeloLogo from '../ui/KaeloLogo';
import AuthModal, { recordCollectedEmail } from '../auth/AuthModal';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3,
};

const staggerVariants = {
  animate: {
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

// -------------------------------------------------------------
// 1. WELCOME SCREEN (Directly Faithful to Reference 2 & Editorial Style)
// -------------------------------------------------------------
const WelcomeScreen = ({ onNext, onDemoLoad, onGoogleSignIn, onEmailSignIn }) => (
  <motion.div 
    className={styles.welcomeWrapper} 
    variants={staggerVariants} 
    initial="initial" 
    animate="animate" 
    exit="exit"
  >
    {/* Main Hero Card with High-Contrast Lime Aesthetic */}
    <div className={styles.heroCard}>
      {/* Top Editorial Sticker Badge - Centered & Clean (2026 badge removed) */}
      <div className={styles.stickerPillRow} style={{ justifyContent: 'center' }}>
        <motion.div 
          className={styles.stickerBadgeLeft}
          whileHover={{ scale: 1.05, rotate: -2 }}
        >
          <img src="/assets/buddy-red.png" alt="Buddy" className={styles.buddyBadgeImg} />
          <span>LET'S GOOOOO?!</span>
        </motion.div>
      </div>

      {/* Brand Title: KaeloAI */}
      <div className={styles.heroBrand}>
        <KaeloLogo size={48} showAI={true} />
      </div>

      {/* Editorial Tagline */}
      <p className={styles.heroTagline}>
        Pick who you're becoming. Everything else lines up behind it.
      </p>

      {/* Centered Mascot Stage with Uploaded Sticker Buddies (No speech bubble to prevent overlap) */}
      <div className={styles.mascotStage}>
        <motion.img 
          src="/assets/buddy-white.png" 
          alt="White Buddy" 
          className={styles.mascotBuddyLeft}
          animate={{ y: [0, -6, 0], rotate: [-2, 3, -2] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />

        <KaeloInteractiveFace 
          size={140} 
          mood="happy" 
        />

        <motion.img 
          src="/assets/buddy-black.png" 
          alt="Black Buddy" 
          className={styles.mascotBuddyRight}
          animate={{ y: [0, 5, 0], rotate: [2, -3, 2] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* 3 Core Trust Badges - Custom Vector Icons (Zero raw emojis) */}
      <div className={styles.trustPillRow}>
        <span className={styles.trustPill}>
          <Zap size={13} strokeWidth={2.5} />
          Reality-first
        </span>
        <span className={styles.trustPill}>
          <Target size={13} strokeWidth={2.5} />
          Capacity-locked
        </span>
        <span className={styles.trustPill}>
          <Trophy size={13} strokeWidth={2.5} />
          Visible progress
        </span>
      </div>
    </div>

    {/* Unified Action Stack - Google Sign-In Prominent & Primary */}
    <div className={styles.welcomeActionStack}>
      {/* 1. Google 1-Click Sign In (Front and Center) */}
      <button className={styles.googleActionBtn} onClick={onGoogleSignIn}>
        <svg className={styles.googleIconSvg} viewBox="0 0 24 24" width="18" height="18">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span>Continue with Google</span>
      </button>

      {/* 2. Start Questionnaire / Capacity Calculation */}
      <button className={styles.primaryActionBtn} onClick={onNext}>
        <span>Start Capacity Setup</span>
        <ChevronRight size={18} strokeWidth={3} />
      </button>

      {/* 3. Email Magic Link Sign In */}
      <button className={styles.emailActionBtn} onClick={onEmailSignIn}>
        <Mail size={16} />
        <span>Sign in with Email</span>
      </button>

      {/* 4. Instant Demo Mode */}
      <button className={styles.demoActionBtn} onClick={onDemoLoad}>
        Explore Master Demo (Fred · Level 4)
      </button>

      {/* Micro Reassurance */}
      <div className={styles.trustFooterNote}>
        <ShieldCheck size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
        <span>Zero spam &bull; Protected capacity &bull; No fantasy 14h days</span>
      </div>
    </div>
  </motion.div>
);

// -------------------------------------------------------------
// 2. CATEGORIES SCREEN (STEP 1 OF 6)
// -------------------------------------------------------------
const CategoryScreen = ({ onNext, data, updateData }) => {
  const toggleCategory = (id) => {
    const isSelected = data.categories.includes(id);
    const newCategories = isSelected
      ? data.categories.filter(c => c !== id)
      : [...data.categories, id];
    updateData({ categories: newCategories });
  };

  return (
    <motion.div className={styles.screenContainer} variants={staggerVariants} initial="initial" animate="animate" exit="exit">
      <div className={styles.stepBadge}>
        <span className={styles.stepDot} />
        <span>STEP 1 OF 6</span>
      </div>
      <motion.h2 className={styles.title} variants={itemVariants}>What are you currently building?</motion.h2>
      <motion.p className={styles.subtitle} variants={itemVariants}>
        Select everything on your plate. Kaelo protects your energy across all domains.
      </motion.p>
      
      <motion.div className={styles.grid} variants={itemVariants}>
        {CATEGORIES?.map(cat => (
          <div 
            key={cat.id}
            className={`${styles.pill} ${data.categories.includes(cat.id) ? styles.pillSelected : ''}`}
            onClick={() => toggleCategory(cat.id)}
          >
            <StickerIcon name={cat.sticker || cat.id} size={32} fallbackEmoji={cat.emoji} />
            <span className={styles.label}>{cat.label}</span>
          </div>
        ))}
      </motion.div>

      <motion.div className={styles.footer} variants={itemVariants}>
        <button 
          className={styles.primaryActionBtn} 
          style={{ 
            width: '100%', 
            opacity: data.categories.length === 0 ? 0.5 : 1, 
            pointerEvents: data.categories.length === 0 ? 'none' : 'auto' 
          }}
          onClick={onNext}
        >
          <span>CONTINUE</span>
          <ChevronRight size={18} strokeWidth={3} />
        </button>
      </motion.div>
    </motion.div>
  );
};

// -------------------------------------------------------------
// 3. REALITY PHILOSOPHY SCREEN (STEP 2 OF 6)
// -------------------------------------------------------------
const TimeScreen = ({ onNext }) => (
  <motion.div className={styles.screenContainer} variants={staggerVariants} initial="initial" animate="animate" exit="exit">
    <div className={styles.stepBadge}>
      <span className={styles.stepDot} />
      <span>STEP 2 OF 6</span>
    </div>
    <motion.h2 className={styles.title} variants={itemVariants}>How much time do you actually have?</motion.h2>
    <motion.p className={styles.subtitle} variants={itemVariants}>
      Most schedules fail because they assume 14-hour fantasy days. Next, we'll calculate your true available bandwidth from your real commitments.
    </motion.p>
    
    <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0 8px' }}>
      <KaeloInteractiveFace 
        size={165} 
        mood="curious" 
        speech="No fake hustle schedules. Let's do the math!" 
      />
    </div>

    <div className={styles.realityCallout}>
      <div className={styles.realityRow}>
        <div className={styles.realityDot} />
        <span>Sleep & recovery: Protected first</span>
      </div>
      <div className={styles.realityRow}>
        <div className={styles.realityDot} />
        <span>Fixed commitments: Fully accounted for</span>
      </div>
      <div className={styles.realityRow}>
        <div className={styles.realityDot} />
        <span>Execution window: 100% realistic & sustainable</span>
      </div>
    </div>

    <motion.div className={styles.footer} variants={itemVariants}>
      <button className={styles.primaryActionBtn} style={{ width: '100%' }} onClick={onNext}>
        <span>CALCULATE MY REAL CAPACITY</span>
        <ChevronRight size={18} strokeWidth={3} />
      </button>
    </motion.div>
  </motion.div>
);

// -------------------------------------------------------------
// 4. SLEEP SCREEN (STEP 3 OF 6)
// -------------------------------------------------------------
const SleepScreen = ({ onNext, data, updateData }) => {
  const getSleepReaction = (hours) => {
    if (hours < 6) return { mood: 'shocked', speech: "Under 6 hours?! Your brain runs on fumes. Let's aim for sustainable output." };
    if (hours <= 8) return { mood: 'happy', speech: "Sweet spot! 7–8 hours keeps your focus sharp and execution consistent." };
    return { mood: 'sleepy', speech: "Full recharge! Just make sure you still have waking hours for your goals." };
  };

  const { mood, speech } = getSleepReaction(data.sleepHours);

  return (
    <motion.div className={styles.screenContainer} variants={staggerVariants} initial="initial" animate="animate" exit="exit">
      <div className={styles.stepBadge}>
        <span className={styles.stepDot} />
        <span>STEP 3 OF 6</span>
      </div>
      <motion.h2 className={styles.title} variants={itemVariants}>How many hours do you sleep each night?</motion.h2>
      <motion.p className={styles.subtitle} variants={itemVariants}>
        Sleep is your execution fuel. Be honest—we plan around reality, not wishful thinking.
      </motion.p>
      
      <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 12px' }}>
        <KaeloInteractiveFace 
          size={155} 
          mood={mood} 
          speech={speech} 
        />
      </div>

      <motion.div className={styles.sliderContainer} variants={itemVariants}>
        <div className={styles.sliderValue}>
          {data.sleepHours}<span className={styles.sliderUnit}>h / night</span>
        </div>
        <input 
          type="range" 
          min="5" 
          max="10" 
          step="0.5" 
          value={data.sleepHours} 
          onChange={(e) => updateData({ sleepHours: parseFloat(e.target.value) })}
          className={styles.slider}
        />
      </motion.div>

      <motion.div className={styles.footer} variants={itemVariants}>
        <button className={styles.primaryActionBtn} style={{ width: '100%' }} onClick={onNext}>
          <span>CONTINUE</span>
          <ChevronRight size={18} strokeWidth={3} />
        </button>
      </motion.div>
    </motion.div>
  );
};

// -------------------------------------------------------------
// 5. COMMITMENTS SCREEN (STEP 4 OF 6)
// -------------------------------------------------------------
const CommitmentsScreen = ({ onNext, data, updateData }) => {
  const updateCommitment = (key, val) => {
    updateData({ commitments: { ...data.commitments, [key]: val } });
  };

  const labels = {
    work: "Work / Job",
    school: "School / Classes",
    commute: "Commute & Transit",
    family: "Family & Errands",
    other: "Other Fixed Time"
  };

  const sublabels = {
    work: "Work shifts & employment",
    school: "Lectures, classes & study",
    commute: "Travel & daily transit",
    family: "Family responsibilities & life admin",
    other: "Unavoidable routines"
  };

  const keys = Object.keys(data.commitments);
  const totalCommitments = Object.values(data.commitments).reduce((a, b) => a + b, 0);

  return (
    <motion.div className={styles.screenContainer} variants={staggerVariants} initial="initial" animate="animate" exit="exit">
      <div className={styles.stepBadge}>
        <span className={styles.stepDot} />
        <span>STEP 4 OF 6</span>
      </div>
      <motion.h2 className={styles.title} variants={itemVariants}>What already owns your time?</motion.h2>
      <motion.p className={styles.subtitle} variants={itemVariants}>
        Estimate your non-negotiable daily hours spent on fixed commitments.
      </motion.p>

      <div className={styles.commitmentsSummary}>
        <span>Total Fixed Time Accounted For:</span>
        <span style={{ fontSize: '15px' }}>{totalCommitments}h / day</span>
      </div>
      
      <motion.div className={styles.stepperContainer} variants={itemVariants}>
        {keys.map(key => (
          <div key={key} className={styles.stepperItem}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <StickerIcon name={key} size={28} />
                <span className={styles.stepperLabel}>{labels[key]}</span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-secondary, #374151)', paddingLeft: 38, fontWeight: 500 }}>
                {sublabels[key]}
              </span>
            </div>
            <div className={styles.stepperControls}>
              <button 
                type="button"
                className={styles.stepperBtn} 
                onClick={() => updateCommitment(key, Math.max(0, data.commitments[key] - 1))}
              >
                <Minus size={16} strokeWidth={2.5} />
              </button>
              <span className={styles.stepperValue}>{data.commitments[key]}h</span>
              <button 
                type="button"
                className={styles.stepperBtn} 
                onClick={() => updateCommitment(key, Math.min(12, data.commitments[key] + 1))}
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div className={styles.footer} variants={itemVariants}>
        <button className={styles.primaryActionBtn} style={{ width: '100%' }} onClick={onNext}>
          <span>CONTINUE</span>
          <ChevronRight size={18} strokeWidth={3} />
        </button>
      </motion.div>
    </motion.div>
  );
};

// -------------------------------------------------------------
// 6. BLOCKERS SCREEN (STEP 5 OF 6)
// -------------------------------------------------------------
const BlockersScreen = ({ onNext, data, updateData }) => {
  const toggleBlocker = (id) => {
    const isSelected = data.blockers.includes(id);
    const newBlockers = isSelected
      ? data.blockers.filter(b => b !== id)
      : [...data.blockers, id];
    updateData({ blockers: newBlockers });
  };

  return (
    <motion.div className={styles.screenContainer} variants={staggerVariants} initial="initial" animate="animate" exit="exit">
      <div className={styles.stepBadge}>
        <span className={styles.stepDot} />
        <span>STEP 5 OF 6</span>
      </div>
      <motion.h2 className={styles.title} variants={itemVariants}>What usually gets in your way?</motion.h2>
      <motion.p className={styles.subtitle} variants={itemVariants}>
        Select your biggest execution friction points. Kaelo will proactively intervene when they happen.
      </motion.p>
      
      <motion.div className={styles.grid} variants={itemVariants}>
        {EXECUTION_BLOCKERS?.map(blocker => (
          <div 
            key={blocker.id}
            className={`${styles.pill} ${data.blockers.includes(blocker.id) ? styles.pillSelected : ''}`}
            onClick={() => toggleBlocker(blocker.id)}
          >
            <StickerIcon name={blocker.sticker || blocker.id} size={30} fallbackEmoji={blocker.emoji} />
            <span className={styles.label}>{blocker.label}</span>
          </div>
        ))}
      </motion.div>

      <motion.div className={styles.footer} variants={itemVariants}>
        <button className={styles.primaryActionBtn} style={{ width: '100%' }} onClick={onNext}>
          <span>CONTINUE</span>
          <ChevronRight size={18} strokeWidth={3} />
        </button>
      </motion.div>
    </motion.div>
  );
};

// -------------------------------------------------------------
// 7. IDENTITY SCREEN (STEP 6 OF 6)
// -------------------------------------------------------------
const IdentityScreen = ({ onNext, data, updateData, onGoogleSignIn }) => {
  const identitySuggestions = [
    "Consistent Builder",
    "Elite Founder",
    "Focused Creator",
    "Disciplined Scholar",
    "Execution Machine"
  ];

  const handleApplySuggestion = (sug) => {
    updateData({ identity: `I'm becoming a ${sug.toLowerCase()}.` });
  };

  const isEmailValid = Boolean(
    data.email && 
    data.email.trim().includes('@') && 
    data.email.trim().includes('.')
  );
  const canAdvance = Boolean(data.name?.trim() && data.identity?.trim() && isEmailValid);

  const handleAdvance = () => {
    if (!canAdvance) return;
    if (data.email) {
      recordCollectedEmail(data.email, data.authProvider || 'email', data.name, 'identity_step');
    }
    onNext();
  };

  return (
    <motion.div className={styles.screenContainer} variants={staggerVariants} initial="initial" animate="animate" exit="exit">
      <div className={styles.stepBadge}>
        <span className={styles.stepDot} />
        <span>STEP 6 OF 6</span>
      </div>
      <motion.h2 className={styles.title} variants={itemVariants}>Who are you becoming?</motion.h2>
      <motion.p className={styles.subtitle} variants={itemVariants}>
        True consistency comes from identity, not just a task checklist. Set the standard you're holding yourself to.
      </motion.p>
      
      <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 14px' }}>
        <KaeloInteractiveFace 
          peeking={true}
          size={155} 
          mood={data.name ? 'happy' : 'curious'} 
          speech={data.name ? `Let's build this together, ${data.name}!` : "Who am I building with?"} 
        />
      </div>

      <motion.div className={styles.inputGroup} variants={itemVariants}>
        <label className={styles.inputLabel}>WHAT SHOULD KAELO CALL YOU?</label>
        <input 
          className={styles.input} 
          placeholder="e.g. Alex or Jordan" 
          value={data.name} 
          onChange={(e) => updateData({ name: e.target.value })} 
        />
      </motion.div>

      <motion.div className={styles.inputGroup} variants={itemVariants}>
        <label className={styles.inputLabel}>YOUR TARGET IDENTITY STATEMENT</label>
        <input 
          className={styles.input} 
          placeholder="e.g. I'm becoming a consistent builder." 
          value={data.identity} 
          onChange={(e) => updateData({ identity: e.target.value })} 
        />
        <div className={styles.identitySuggestions}>
          {identitySuggestions.map(sug => (
            <button 
              type="button"
              key={sug} 
              className={styles.suggestionPill}
              onClick={() => handleApplySuggestion(sug)}
            >
              + {sug}
            </button>
          ))}
        </div>
      </motion.div>

      {/* 1-Click Google Autofill Option */}
      <motion.div className={styles.googleAutofillCard} variants={itemVariants}>
        <button 
          type="button" 
          className={styles.googleAutofillBtn} 
          onClick={onGoogleSignIn}
        >
          <svg className={styles.googleIconSvg} viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Quick Autofill with Google</span>
        </button>
        <div className={styles.orDivider}>
          <span>OR ENTER EMAIL MANUALLY</span>
        </div>
      </motion.div>

      <motion.div className={styles.inputGroup} variants={itemVariants}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className={styles.inputLabel}>YOUR EMAIL (SYNC STREAKS & PROGRESS)</label>
          <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 800 }}>* REQUIRED</span>
        </div>
        <input 
          type="email"
          className={styles.input} 
          placeholder="e.g. you@domain.com" 
          value={data.email || ''} 
          onChange={(e) => updateData({ email: e.target.value })} 
        />
      </motion.div>

      {!isEmailValid && (
        <div className={styles.requiredNotice}>
          <ShieldCheck size={14} color="#EF4444" />
          <span>A valid email or Google account is required to lock in your capacity.</span>
        </div>
      )}

      <motion.div className={styles.footer} variants={itemVariants}>
        <button 
          className={styles.primaryActionBtn} 
          style={{ 
            width: '100%', 
            opacity: !canAdvance ? 0.5 : 1, 
            pointerEvents: !canAdvance ? 'none' : 'auto' 
          }} 
          onClick={handleAdvance}
        >
          <span>REVEAL MY CAPACITY</span>
          <ChevronRight size={18} strokeWidth={3} />
        </button>
      </motion.div>
    </motion.div>
  );
};

// -------------------------------------------------------------
// 8. CAPACITY SCREEN (FINAL REVEAL — TEEN-FRIENDLY VISUAL MATH)
// -------------------------------------------------------------
const CapacityScreen = ({ data, onFinish }) => {
  const commitmentsArr = Object.values(data.commitments);
  let capacity = 0;

  if (typeof calculateDailyCapacity === 'function') {
    capacity = calculateDailyCapacity(24, data.sleepHours, commitmentsArr);
  } else {
    const totalCommitments = commitmentsArr.reduce((a, b) => a + b, 0);
    const totalBusy = data.sleepHours + totalCommitments;
    capacity = Math.max(0, 24 - totalBusy);
  }

  const [showResult, setShowResult] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowResult(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const sleepHours = Number(data.sleepHours || 7);
  const workHours = Number(data.commitments?.work || 0);
  const schoolHours = Number(data.commitments?.school || 0);
  const workAndSchoolHours = workHours + schoolHours;
  const commuteHours = Number(data.commitments?.commute || 0);
  const familyHours = Number(data.commitments?.family || 0);
  const otherHours = Number(data.commitments?.other || 0);
  const lifeHours = commuteHours + familyHours + otherHours;
  const dailyCapacity = capacity;

  // Percentage allocations for the visual 24-hour day bar
  const sleepPercent = Math.max(0, (sleepHours / 24) * 100);
  const workSchoolPercent = Math.max(0, (workAndSchoolHours / 24) * 100);
  const lifePercent = Math.max(0, (lifeHours / 24) * 100);
  const capacityPercent = Math.max(0, (dailyCapacity / 24) * 100);

  return (
    <motion.div className={styles.screenContainer} variants={staggerVariants} initial="initial" animate="animate" exit="exit">
      <motion.h2 className={styles.title} variants={itemVariants}>
        {showResult ? "Your daily capacity is locked in." : "Calculating your real daily capacity..."}
      </motion.h2>
      <motion.p className={styles.subtitle} variants={itemVariants}>
        {showResult 
          ? "This is your true daily execution window. Kaelo strictly protects it so you never overcommit again."
          : "Analyzing your non-negotiable commitments against 24 daily hours..."
        }
      </motion.p>
      
      {/* 1. Intuitive Math Equation Banner */}
      <motion.div className={styles.mathEquationHeader} variants={itemVariants}>
        <span>24h IN A DAY &minus; NON-NEGOTIABLES = YOUR REAL TIME</span>
      </motion.div>

      {/* 2. Visual Segmented 24-Hour Day Bar (Teen-Friendly Budget Bar) */}
      <motion.div className={styles.dayBarContainer} variants={itemVariants}>
        <div className={styles.dayBarHeader}>
          <span>Visual 24-Hour Day Budget</span>
          <span>100% of Your Day</span>
        </div>

        <div className={styles.segmentedDayBar}>
          <div 
            className={styles.dayBarSegment} 
            style={{ width: `${sleepPercent}%`, backgroundColor: '#6366F1' }}
            title={`Sleep: ${sleepHours.toFixed(1)}h`}
          >
            {sleepPercent >= 12 && <span>{sleepHours.toFixed(1)}h</span>}
          </div>

          {workSchoolPercent > 0 && (
            <div 
              className={styles.dayBarSegment} 
              style={{ width: `${workSchoolPercent}%`, backgroundColor: '#F97316' }}
              title={`Work & School: ${workAndSchoolHours.toFixed(1)}h`}
            >
              {workSchoolPercent >= 12 && <span>{workAndSchoolHours.toFixed(1)}h</span>}
            </div>
          )}

          {lifePercent > 0 && (
            <div 
              className={styles.dayBarSegment} 
              style={{ width: `${lifePercent}%`, backgroundColor: '#A855F7' }}
              title={`Transit & Life: ${lifeHours.toFixed(1)}h`}
            >
              {lifePercent >= 12 && <span>{lifeHours.toFixed(1)}h</span>}
            </div>
          )}

          <div 
            className={styles.dayBarSegment} 
            style={{ 
              width: `${capacityPercent}%`, 
              backgroundColor: '#C7FF35',
              color: '#111111',
              fontWeight: 900
            }}
            title={`Real Time to Build: ${dailyCapacity.toFixed(1)}h`}
          >
            {capacityPercent >= 12 && <span>{dailyCapacity.toFixed(1)}h</span>}
          </div>
        </div>

        {/* Legend */}
        <div className={styles.dayBarLegend}>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ backgroundColor: '#6366F1' }} />
            <span>Sleep ({sleepHours.toFixed(1)}h)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ backgroundColor: '#F97316' }} />
            <span>Work & School ({workAndSchoolHours.toFixed(1)}h)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ backgroundColor: '#A855F7' }} />
            <span>Transit & Life ({lifeHours.toFixed(1)}h)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ backgroundColor: '#C7FF35' }} />
            <span style={{ fontWeight: 800 }}>Real Time ({dailyCapacity.toFixed(1)}h)</span>
          </div>
        </div>
      </motion.div>

      {/* 3. Step-by-Step Teen-Friendly Subtraction Breakdown */}
      <motion.div className={styles.mathBreakdownCard} variants={itemVariants}>
        <div className={styles.mathStepRow}>
          <div className={styles.mathStepLabel}>
            <span>1. Total Hours in a Day</span>
            <span className={styles.mathStepSub}>Everyone on Earth starts with 24 hours. No more, no less.</span>
          </div>
          <div className={styles.mathStepNum}>24.0h</div>
        </div>

        <div className={styles.mathStepRow}>
          <div className={styles.mathStepLabel}>
            <span>2. Minus Sleep & Rest</span>
            <span className={styles.mathStepSub}>Brain fuel: 24h &minus; {sleepHours.toFixed(1)}h = {(24 - sleepHours).toFixed(1)}h waking hours left.</span>
          </div>
          <div className={`${styles.mathStepNum} ${styles.mathStepNumDeduct}`}>&minus;{sleepHours.toFixed(1)}h</div>
        </div>

        {workAndSchoolHours > 0 && (
          <div className={styles.mathStepRow}>
            <div className={styles.mathStepLabel}>
              <span>3. Minus School & Work</span>
              <span className={styles.mathStepSub}>Lectures, study, shifts & jobs already claim this block.</span>
            </div>
            <div className={`${styles.mathStepNum} ${styles.mathStepNumDeduct}`}>&minus;{workAndSchoolHours.toFixed(1)}h</div>
          </div>
        )}

        {lifeHours > 0 && (
          <div className={styles.mathStepRow}>
            <div className={styles.mathStepLabel}>
              <span>4. Minus Transit & Life Admin</span>
              <span className={styles.mathStepSub}>Commute, meals, errands, and family commitments.</span>
            </div>
            <div className={`${styles.mathStepNum} ${styles.mathStepNumDeduct}`}>&minus;{lifeHours.toFixed(1)}h</div>
          </div>
        )}

        <div className={styles.mathStepRow} style={{ background: 'var(--bg-card)', border: '2px solid var(--border-strong)' }}>
          <div className={styles.mathStepLabel}>
            <span style={{ fontWeight: 900, color: 'var(--text-primary)' }}>5. Your Real Time To Build</span>
            <span className={styles.mathStepSub}>What's genuinely available for your goals and ambitions.</span>
          </div>
          <div className={`${styles.mathStepNum} ${styles.mathStepNumResult}`}>
            = {dailyCapacity.toFixed(1)}h / day
          </div>
        </div>
      </motion.div>

      {/* 4. Final Animated Result Container */}
      {showResult && (
        <motion.div 
          className={styles.resultContainer} 
          initial={{ opacity: 0, scale: 0.9, y: 10 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          transition={{ type: 'spring', bounce: 0.45 }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <KaeloInteractiveFace 
              size={130} 
              mood="happy" 
              speech="Protected & ready to execute!" 
            />
          </div>
          <div className={styles.resultLabel}>YOUR PROTECTED DAILY CAPACITY</div>
          <div className={styles.resultValue}>
            {dailyCapacity.toFixed(1)}h
            <span style={{ fontSize: '20px', color: 'var(--text-muted)', fontWeight: 600 }}> / day</span>
          </div>

          <div className={styles.teenInsightCard}>
            <div className={styles.teenInsightHeader}>
              <Sparkles size={14} />
              <span>Why this math changes everything:</span>
            </div>
            <p className={styles.teenInsightText}>
              Fake hustle tells people to plan fantasy 12&ndash;14 hour days, leading straight to burnout, guilt, and quitting.
              In reality, once your non-negotiables take their cut, you have exactly <strong>{dailyCapacity.toFixed(1)} hours</strong>.
              When you protect this window every day, you make steady, unstoppable progress.
            </p>
          </div>
        </motion.div>
      )}

      <motion.div className={styles.footer} variants={itemVariants}>
        <button 
          className={styles.primaryActionBtn} 
          style={{ width: '100%', opacity: !showResult ? 0.5 : 1, pointerEvents: !showResult ? 'none' : 'auto' }} 
          onClick={() => onFinish(dailyCapacity)}
        >
          <span>LOCK IN MY {dailyCapacity.toFixed(1)}H SYSTEM</span>
          <ChevronRight size={18} strokeWidth={3} />
        </button>
      </motion.div>
    </motion.div>
  );
};

// -------------------------------------------------------------
// MAIN ONBOARDING CONTROLLER
// -------------------------------------------------------------
export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { dispatch } = useApp();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState('google');
  const [authType, setAuthType] = useState('signup');

  const [data, setData] = useState({
    categories: [],
    sleepHours: 7,
    commitments: {
      work: 8,
      school: 0,
      commute: 1,
      family: 2,
      other: 1
    },
    blockers: [],
    name: '',
    identity: '',
    email: '',
    authProvider: 'email'
  });

  const updateData = (newData) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handleAuthSuccess = ({ email, provider, name }) => {
    const assignedName = name || email.split('@')[0];
    const capitalized = assignedName.charAt(0).toUpperCase() + assignedName.slice(1);

    setData(prev => ({
      ...prev,
      email,
      name: prev.name || capitalized,
      authProvider: provider
    }));

    if (step === 0) {
      navigate('/today');
    } else {
      // If triggered from inside onboarding (e.g. Identity screen), seamlessly advance to capacity calculation!
      setStep(7);
    }
  };

  const handleLoadDemo = () => {
    const today = new Date().toISOString().split('T')[0];

    dispatch({
      type: 'SET_USER',
      payload: {
        id: 'user_fred',
        name: 'Fred',
        email: 'fred@kaelo.app',
        authProvider: 'demo',
        identity: "I'm becoming someone who finishes what they start.",
        identityTitle: 'Focused Builder',
        level: 4,
        xp: 2480,
        momentum: 84,
        streak: 8,
        onboarded: true,
      }
    });

    dispatch({
      type: 'SET_CAPACITY',
      payload: {
        sleepHours: 7,
        workHours: 8,
        schoolHours: 3.5,
        fixedCommitments: 2,
        dailyCapacity: 3.5,
      }
    });

    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        title: 'Master Demo Initialized',
        message: 'Welcome back Fred! Level 4 Focused Builder system is ready.',
        type: 'info'
      }
    });

    navigate('/today');
  };

  const handleFinish = (capacity) => {
    const today = new Date().toISOString().split('T')[0];
    const userName = data.name.trim() || 'Builder';
    const userIdentity = data.identity.trim() || "I'm becoming a consistent builder.";
    const userEmail = data.email ? data.email.trim() : 'builder@kaelo.app';

    if (data.email && data.email.includes('@')) {
      recordCollectedEmail(data.email, data.authProvider || 'email', userName, 'onboarding_finish');
    }

    dispatch({ 
      type: 'SET_USER', 
      payload: { 
        id: 'user_new',
        onboarded: true, 
        name: userName, 
        email: userEmail,
        authProvider: data.authProvider || 'guest',
        identity: userIdentity, 
        identityTitle: 'Starter',
        level: 1, 
        xp: 0, 
        momentum: 60,
        streak: 1 
      } 
    });
    
    dispatch({ 
      type: 'SET_CAPACITY', 
      payload: {
        sleepHours: data.sleepHours,
        workHours: data.commitments.work || 0,
        schoolHours: data.commitments.school || 0,
        fixedCommitments: (data.commitments.commute || 0) + (data.commitments.family || 0) + (data.commitments.other || 0),
        dailyCapacity: capacity
      }
    });

    const firstCat = data.categories[0] || 'skills';
    const catLabel = CATEGORIES.find(c => c.id === firstCat)?.label || 'Skills';

    dispatch({
      type: 'ADD_TASK',
      payload: {
        id: 'task_initial_1',
        title: `Plan ${catLabel} Execution Strategy`,
        category: catLabel,
        estimatedMinutes: 45,
        duration: 45,
        difficulty: 'medium',
        importance: 'high',
        xp: 120,
        status: 'pending',
        date: 'today',
        scheduledDate: today,
      }
    });

    dispatch({
      type: 'ADD_TASK',
      payload: {
        id: 'task_initial_2',
        title: 'Daily Execution Review & Reflection',
        category: 'Personal',
        estimatedMinutes: 20,
        duration: 20,
        difficulty: 'easy',
        importance: 'medium',
        xp: 60,
        status: 'pending',
        date: 'today',
        scheduledDate: today,
      }
    });

    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        title: 'System Online',
        message: `Welcome ${userName}! Today's realistic plan is generated.`,
        type: 'info'
      }
    });

    navigate('/today');
  };

  const screens = [
    <WelcomeScreen 
      key="welcome" 
      onNext={handleNext} 
      onDemoLoad={handleLoadDemo} 
      onGoogleSignIn={() => { setAuthType('signup'); setAuthInitialMode('google'); setIsAuthModalOpen(true); }}
      onEmailSignIn={() => { setAuthType('signup'); setAuthInitialMode('email'); setIsAuthModalOpen(true); }}
    />,
    <CategoryScreen key="categories" onNext={handleNext} data={data} updateData={updateData} />,
    <TimeScreen key="time" onNext={handleNext} />,
    <SleepScreen key="sleep" onNext={handleNext} data={data} updateData={updateData} />,
    <CommitmentsScreen key="commitments" onNext={handleNext} data={data} updateData={updateData} />,
    <BlockersScreen key="blockers" onNext={handleNext} data={data} updateData={updateData} />,
    <IdentityScreen 
      key="identity" 
      onNext={handleNext} 
      data={data} 
      updateData={updateData} 
      onGoogleSignIn={() => { setAuthType('signup'); setAuthInitialMode('google'); setIsAuthModalOpen(true); }}
    />,
    <CapacityScreen key="capacity" data={data} onFinish={handleFinish} />
  ];

  const showDots = step > 0 && step < screens.length - 1;

  return (
    <div className={styles.container}>
      {/* Top Bar with Brand, Step Dots, and Quick Sign-In + Theme Switcher */}
      <div className={styles.topBar}>
        <div className={styles.brandPip}>
          <KaeloLogo size={18} showAI={true} variant="badge" />
        </div>

        {showDots && (
          <div className={styles.progressDots}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div 
                key={i} 
                className={`${styles.dot} ${step >= i ? styles.dotActive : ''}`} 
              />
            ))}
          </div>
        )}

        <div className={styles.topRightActions}>
          <button 
            type="button"
            className={styles.topSignInBtn}
            onClick={() => { setAuthType('signin'); setAuthInitialMode('google'); setIsAuthModalOpen(true); }}
          >
            Sign In
          </button>
          <ThemeSwitcher compact={true} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
          style={{ display: 'flex', flex: 1, flexDirection: 'column', height: '100%' }}
        >
          {screens[step]}
        </motion.div>
      </AnimatePresence>

      {/* Global Auth Modal for Lead Collection & Sign In */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode={authInitialMode}
        initialAuthType={authType}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

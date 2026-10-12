import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CATEGORIES } from '../../data/constants';
import { generateId, calculateGoalDaily } from '../../utils/helpers';
import { StickerIcon } from '../illustrations';
import styles from './CreateGoal.module.css';

export default function CreateGoal({ onClose }) {
  const { state, dispatch } = useApp();
  const [step, setStep] = useState(1);
  
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id);
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('hours');
  const [days, setDays] = useState(30);
  const [progress, setProgress] = useState(0);

  const totalSteps = 6;
  
  const dailyRequired = calculateGoalDaily(Number(target) - Number(progress), days);
  const availableCapacity = Number(state.capacity?.dailyCapacity || 4.5);
  const fits = dailyRequired <= availableCapacity;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCreate = () => {
    const goalId = generateId();
    const categoryObj = CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
    const milestones = [
      { id: generateId(), title: `01: Research & Outline for ${title}`, completed: false, current: true, xp: 150 },
      { id: generateId(), title: `02: Core Execution & Build`, completed: false, xp: 250 },
      { id: generateId(), title: `03: Review, Polish & Ship`, completed: false, xp: 350 },
    ];
    const newGoal = {
      id: goalId,
      title,
      categoryId,
      categoryName: categoryObj.label,
      target: Number(target),
      unit,
      progress: Number(progress),
      currentProgress: Number(progress),
      deadline: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
      capacityPerDay: availableCapacity,
      status: 'active',
      currentObjective: `01: Research & Outline for ${title}`,
      objectiveXP: 150,
      milestones,
      createdAt: new Date().toISOString()
    };
    
    dispatch({ type: 'ADD_GOAL', payload: newGoal });
    
    // Auto-generate a task for today
    const taskMinutes = unit === 'hours' ? Math.min(120, Math.max(15, Math.round(dailyRequired * 60))) : 45;
    dispatch({
      type: 'ADD_TASK',
      payload: {
        id: generateId(),
        goalId: goalId,
        title: `Work on ${title}`,
        category: categoryObj.label,
        estimatedMinutes: taskMinutes,
        duration: taskMinutes,
        difficulty: 'medium',
        importance: 'high',
        status: 'pending',
        date: 'today',
        scheduledDate: new Date().toISOString().split('T')[0]
      }
    });

    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        title: 'Goal Activated',
        message: `Created "${title}" with daily execution planned.`,
        type: 'info'
      }
    });

    onClose();
  };

  const slideVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  return (
    <div className={styles.modal}>
      <header className={styles.header}>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={24} />
        </button>
        <div className={styles.progress}>Step {step} of {totalSteps}</div>
        <div style={{ width: 24 }} /> {/* Spacer */}
      </header>

      <div className={styles.content}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" className={styles.step} variants={slideVariants} initial="enter" animate="center" exit="exit">
              <h2 className={styles.question}>What are you trying to achieve?</h2>
              <div className={styles.inputGroup}>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="e.g. Learn React Native, Read 10 books..." 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  autoFocus
                />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" className={styles.step} variants={slideVariants} initial="enter" animate="center" exit="exit">
              <h2 className={styles.question}>Select a category</h2>
              <div className={styles.categoryGrid}>
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat.id}
                    className={`${styles.categoryBtn} ${categoryId === cat.id ? styles.selected : ''}`}
                    onClick={() => setCategoryId(cat.id)}
                  >
                    <StickerIcon name={cat.sticker || cat.id} size={32} fallbackEmoji={cat.emoji} />
                    <span className={styles.categoryName}>{cat.label || cat.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" className={styles.step} variants={slideVariants} initial="enter" animate="center" exit="exit">
              <h2 className={styles.question}>What's your target?</h2>
              <div className={styles.row}>
                <input 
                  type="number" 
                  className={styles.input} 
                  style={{ flex: 1 }}
                  placeholder="0" 
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  autoFocus
                />
                <input 
                  type="text" 
                  className={styles.input} 
                  style={{ flex: 2 }}
                  placeholder="Unit (e.g. hours, pages)" 
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                />
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" className={styles.step} variants={slideVariants} initial="enter" animate="center" exit="exit">
              <h2 className={styles.question}>When do you want to achieve it?</h2>
              <div className={styles.dateGrid}>
                {[7, 14, 30, 60, 90, 180].map(d => (
                  <button 
                    key={d}
                    className={`${styles.dateBtn} ${days === d ? styles.selected : ''}`}
                    onClick={() => setDays(d)}
                  >
                    {d} days
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" className={styles.step} variants={slideVariants} initial="enter" animate="center" exit="exit">
              <h2 className={styles.question}>How much have you completed so far?</h2>
              <div className={styles.inputGroup}>
                <input 
                  type="number" 
                  className={styles.input} 
                  placeholder="0" 
                  value={progress}
                  onChange={e => setProgress(e.target.value)}
                  autoFocus
                />
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div key="step6" className={styles.step} variants={slideVariants} initial="enter" animate="center" exit="exit">
              <h2 className={styles.question}>Capacity Check</h2>
              
              <div className={styles.capacityCard}>
                <div className={styles.capacityStat}>{dailyRequired} {unit}/day</div>
                <div className={styles.capacitySub}>for {days} days</div>
                
                <div className={`${styles.statusBox} ${fits ? styles.fits : styles.warning}`}>
                  {fits ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                  <div className={styles.statusText}>
                    {fits 
                      ? 'This goal fits your current capacity.' 
                      : 'This goal will push you over capacity.'}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={styles.footer}>
        {step > 1 && (
          <button className={styles.backBtn} onClick={handleBack}>
            Back
          </button>
        )}
        <button 
          className={styles.nextBtn} 
          onClick={step === totalSteps ? handleCreate : handleNext}
          disabled={
            (step === 1 && !title) || 
            (step === 3 && (!target || !unit))
          }
        >
          {step === totalSteps ? 'CREATE GOAL' : 'Next'}
        </button>
      </div>
    </div>
  );
}

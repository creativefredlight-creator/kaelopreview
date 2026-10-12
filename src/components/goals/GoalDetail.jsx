import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Plus, AlertCircle, CheckCircle2, Circle, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CATEGORIES } from '../../data/constants';
import { getDaysRemaining, calculateGoalDaily, generateId, getToday } from '../../utils/helpers';
import Button from '../ui/Button';
import { StickerIcon } from '../illustrations';
import styles from './GoalDetail.module.css';

export default function GoalDetail({ goal, onClose }) {
  const { state, dispatch } = useApp();
  const [addingTask, setAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskMinutes, setTaskMinutes] = useState(30);

  const category = CATEGORIES.find(c => c.id === goal.categoryId) || CATEGORIES[0];
  
  const daysRemaining = getDaysRemaining(goal.deadline);
  const dailyRequired = calculateGoalDaily(goal.target - (goal.progress ?? goal.currentProgress ?? 0), daysRemaining);
  const currentProgress = goal.progress ?? goal.currentProgress ?? 0;
  const percent = Math.min(100, Math.round((currentProgress / goal.target) * 100)) || 0;

  const isBehind = daysRemaining <= 0 && percent < 100;
  const relatedTasks = (state.tasks || []).filter(t => t.goalId === goal.id);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this goal? All related tasks will also be removed.')) {
      dispatch({ type: 'DELETE_GOAL', payload: goal.id });
      onClose();
    }
  };

  const handleUpdateProgress = () => {
    const amount = prompt(`Enter new progress (total ${goal.unit || 'units'}):`, currentProgress);
    if (amount !== null && !isNaN(Number(amount))) {
      dispatch({ 
        type: 'UPDATE_GOAL_PROGRESS', 
        payload: { id: goal.id, progress: Number(amount) } 
      });
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          title: 'Goal Updated',
          message: `Progress updated to ${amount} ${goal.unit || ''}`,
          type: 'info'
        }
      });
    }
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    dispatch({
      type: 'ADD_TASK',
      payload: {
        id: generateId(),
        goalId: goal.id,
        title: taskTitle.trim(),
        category: category.label,
        estimatedMinutes: Number(taskMinutes),
        duration: Number(taskMinutes),
        difficulty: 'medium',
        importance: 'medium',
        status: 'pending',
        date: 'today',
        scheduledDate: getToday()
      }
    });

    setTaskTitle('');
    setAddingTask(false);
    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        title: 'Task Created',
        message: `Task added to today's execution plan.`,
        type: 'info'
      }
    });
  };

  const handleToggleTask = (taskId) => {
    dispatch({ type: 'TOGGLE_TASK', payload: taskId });
  };

  return (
    <motion.div 
      className={styles.container}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <header className={styles.header}>
        <button className={styles.backButton} onClick={onClose}>
          <ArrowLeft size={24} />
        </button>
        <div className={styles.actions}>
          <button className={`${styles.iconButton} ${styles.delete}`} onClick={handleDelete} title="Delete Goal">
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <div className={styles.heroCard}>
        <div className={styles.category} style={{ color: category.color }}>
          <StickerIcon name={category.sticker || category.id} size={20} fallbackEmoji={category.emoji} />
          {category.label || category.name}
        </div>
        <h1 className={styles.title}>{goal.title}</h1>

        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <div className={styles.progressValue}>
              {currentProgress} <span className={styles.progressTarget}>/ {goal.target} {goal.unit}</span>
            </div>
            <div className={styles.progressPercent}>{percent}%</div>
          </div>
          <div className={styles.barContainer}>
            <div className={styles.barFill} style={{ width: `${percent}%` }} />
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Days Left</div>
            <div className={styles.statValue}>{Math.max(0, daysRemaining)}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Daily Target</div>
            <div className={styles.statValue}>{dailyRequired} {goal.unit}</div>
          </div>
        </div>
      </div>

      {isBehind && (
        <div className={styles.recalcAlert}>
          <AlertCircle size={20} className={styles.recalcIcon} />
          <div className={styles.recalcContent}>
            <strong>Falling behind reality</strong>
            New required target is {dailyRequired} {goal.unit}/day. Consider extending the deadline if capacity is tight.
          </div>
        </div>
      )}

      <button className={styles.updateBtn} onClick={handleUpdateProgress}>
        Update Progress
      </button>

      {goal.milestones && goal.milestones.length > 0 && (
        <div style={{ marginTop: 24, marginBottom: 24 }}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: 12 }}>
            Quest Milestones ({goal.milestones.filter(m => m.completed).length}/{goal.milestones.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {goal.milestones.map((milestone, idx) => {
              const isDone = milestone.completed;
              const isCurrent = milestone.current;
              const alreadyInToday = (state.tasks || []).some(t => 
                t.title.toLowerCase() === milestone.title.toLowerCase() &&
                (t.date === 'today' || t.scheduledDate === getToday())
              );

              return (
                <div 
                  key={milestone.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: 16,
                    background: isCurrent ? 'rgba(169, 130, 255, 0.12)' : 'var(--bg-card)',
                    border: isCurrent ? '1.5px solid var(--accent-purple)' : '1px solid var(--border-color)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    gap: 10
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                    <button 
                      onClick={() => !isDone && dispatch({
                        type: 'COMPLETE_MILESTONE',
                        payload: { goalId: goal.id, milestoneId: milestone.id || `m_${idx}` }
                      })}
                      title={isDone ? 'Completed' : 'Click to complete milestone'}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: isDone ? 'var(--accent-lime)' : isCurrent ? 'var(--accent-purple)' : 'var(--bg-card-subtle)',
                        color: isDone ? '#111' : !isCurrent ? 'var(--text-primary)' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 800,
                        border: 'none',
                        cursor: isDone ? 'default' : 'pointer',
                        flexShrink: 0
                      }}
                    >
                      {isDone ? <Check size={14} strokeWidth={3} /> : idx + 1}
                    </button>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: isDone ? 'line-through' : 'none',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {milestone.title}
                      </div>
                      {isCurrent && (
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-purple)', marginTop: 2 }}>
                          CURRENT OBJECTIVE
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {!isDone && (
                      <button
                        onClick={() => {
                          if (alreadyInToday) return;
                          dispatch({
                            type: 'ADD_TASK',
                            payload: {
                              id: generateId(),
                              goalId: goal.id,
                              title: milestone.title,
                              category: category.label,
                              estimatedMinutes: 45,
                              duration: 45,
                              difficulty: 'medium',
                              importance: isCurrent ? 'critical' : 'high',
                              status: 'pending',
                              date: 'today',
                              scheduledDate: getToday(),
                              xp: milestone.xp || 150
                            }
                          });
                          dispatch({
                            type: 'SHOW_TOAST',
                            payload: {
                              title: 'Scheduled on Today',
                              message: `"${milestone.title}" added to daily capacity.`,
                              type: 'info'
                            }
                          });
                        }}
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: alreadyInToday ? 'var(--bg-card-subtle)' : 'var(--accent-purple)',
                          color: alreadyInToday ? 'var(--text-muted)' : '#ffffff',
                          padding: '4px 8px',
                          borderRadius: 8,
                          border: 'none',
                          cursor: alreadyInToday ? 'default' : 'pointer'
                        }}
                      >
                        {alreadyInToday ? 'In Today' : '+ Today'}
                      </button>
                    )}

                    {milestone.xp && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        background: 'var(--accent-lime)',
                        color: '#111',
                        padding: '3px 7px',
                        borderRadius: 8
                      }}>
                        +{milestone.xp} XP
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.tasksSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
            Connected Tasks ({relatedTasks.length})
          </h2>
          <button className={styles.addTaskBtn} onClick={() => setAddingTask(!addingTask)}>
            <Plus size={16} style={{ marginRight: 4 }} /> Add Task
          </button>
        </div>

        {addingTask && (
          <form onSubmit={handleAddTask} style={{ background: 'var(--bg-card-subtle)', padding: 14, borderRadius: 16, marginBottom: 16, border: '1px solid var(--border-color)' }}>
            <input 
              type="text" 
              placeholder="Task name for this goal..."
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              autoFocus
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <input 
                type="number" 
                placeholder="Minutes"
                value={taskMinutes}
                onChange={e => setTaskMinutes(e.target.value)}
                style={{ width: 80, padding: '10px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
              />
              <Button type="submit" variant="primary" size="sm" disabled={!taskTitle.trim()}>
                Save Task
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setAddingTask(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className={styles.tasksList}>
          {relatedTasks.length > 0 ? (
            relatedTasks.map(t => {
              const isDone = t.status === 'completed';
              return (
                <div 
                  key={t.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 16,
                    marginBottom: 8,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleToggleTask(t.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {isDone ? (
                      <CheckCircle2 size={20} color="var(--accent-lime, #A8D92E)" />
                    ) : (
                      <Circle size={20} color="var(--text-muted)" />
                    )}
                    <span style={{ 
                      fontSize: 14, 
                      fontWeight: 600, 
                      textDecoration: isDone ? 'line-through' : 'none',
                      color: isDone ? 'var(--text-muted)' : 'var(--text-primary)' 
                    }}>
                      {t.title}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    {t.estimatedMinutes || 30}m
                  </span>
                </div>
              );
            })
          ) : (
            <div style={{ padding: 16, background: 'var(--bg-card)', borderRadius: 16, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
              No tasks added yet. Tap "+ Add Task" to schedule execution.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

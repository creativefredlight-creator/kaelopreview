import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { CATEGORIES } from '../../data/constants';
import { calculateTaskXP, getToday, formatMinutes } from '../../utils/helpers';
import styles from './AddTaskModal.module.css';

const AddTaskModal = ({ onClose }) => {
  const { state, dispatch } = useApp();
  const todayStr = getToday();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]?.label || 'Academic');
  const [minutes, setMinutes] = useState(30);
  const [difficulty, setDifficulty] = useState('medium');
  const [importance, setImportance] = useState('medium');
  const [goalId, setGoalId] = useState('');

  const xpReward = calculateTaskXP(difficulty, importance);

  // Check capacity impact
  const totalCapacityHours = Number(state.capacity?.dailyCapacity || 4.5);
  const totalCapacityMinutes = Math.round(totalCapacityHours * 60);
  const todayTasks = (state.tasks || []).filter(t => 
    t.date === 'today' || t.scheduledDate === todayStr || (!t.date && !t.scheduledDate)
  );
  const currentUsedMinutes = todayTasks.reduce((sum, t) => sum + (Number(t.estimatedMinutes) || Number(t.duration) || 30), 0);
  const newUsedMinutes = currentUsedMinutes + minutes;
  const willBeOver = newUsedMinutes > totalCapacityMinutes;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask = {
      title: title.trim(),
      category,
      estimatedMinutes: minutes,
      difficulty,
      importance,
      xp: xpReward,
      status: 'pending',
      date: 'today',
      scheduledDate: todayStr,
      goalId: goalId || null,
    };

    dispatch({ type: 'ADD_TASK', payload: newTask });
    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        title: 'Task Added',
        message: `"${newTask.title}" added to today (+${xpReward} XP).`,
        type: 'info'
      }
    });
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="New Task">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Task Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            autoFocus
            className={styles.input}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={styles.select}>
              {CATEGORIES.map(c => {
                const val = typeof c === 'object' ? c.label : c;
                return (
                  <option key={typeof c === 'object' ? c.id : c} value={val}>
                    {val}
                  </option>
                );
              })}
            </select>
          </div>
          
          <div className={styles.field}>
            <label>Est. Minutes</label>
            <input 
              type="number" 
              value={minutes}
              onChange={(e) => setMinutes(Math.max(5, Number(e.target.value)))}
              step="15"
              min="5"
              max="240"
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label>Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={styles.select}>
              <option value="easy">Easy (50 XP)</option>
              <option value="medium">Medium (100 XP)</option>
              <option value="hard">Hard (150 XP)</option>
            </select>
          </div>
          
          <div className={styles.field}>
            <label>Importance</label>
            <select value={importance} onChange={(e) => setImportance(e.target.value)} className={styles.select}>
              <option value="low">Low (1x)</option>
              <option value="medium">Medium (1.2x)</option>
              <option value="high">High (1.5x)</option>
              <option value="critical">Critical (2x)</option>
            </select>
          </div>
        </div>

        {state.goals && state.goals.length > 0 && (
          <div className={styles.field}>
            <label>Connect to Goal (Optional)</label>
            <select value={goalId} onChange={(e) => setGoalId(e.target.value)} className={styles.select}>
              <option value="">None</option>
              {state.goals.map(g => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </div>
        )}

        {willBeOver && (
          <div style={{
            fontSize: '12px',
            color: 'var(--kaelo-danger, #F87171)',
            background: 'rgba(248, 113, 113, 0.1)',
            padding: '10px 12px',
            borderRadius: '12px',
            marginBottom: '12px',
            fontWeight: 500,
          }}>
            Warning: Adding this task pushes you to {(newUsedMinutes / 60).toFixed(1)}h / {totalCapacityHours}h, exceeding your daily capacity.
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.xpPreview}>
            +{xpReward} XP
          </div>
          <Button type="submit" variant="primary" disabled={!title.trim()}>
            ADD TASK
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTaskModal;

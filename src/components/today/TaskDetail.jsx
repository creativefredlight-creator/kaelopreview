import React from 'react';
import { useApp } from '../../context/AppContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Sparkles, Clock, Target, AlertCircle } from 'lucide-react';
import styles from './TaskDetail.module.css';

const TaskDetail = ({ task, onClose }) => {
  const { dispatch } = useApp();

  const handleStart = () => {
    dispatch({ type: 'SET_ACTIVE_FOCUS', payload: task });
    onClose();
  };

  const handleReschedule = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    dispatch({
      type: 'UPDATE_TASK',
      payload: {
        id: task.id,
        scheduledDate: tomorrowStr,
        date: tomorrowStr,
      }
    });
    dispatch({
      type: 'SHOW_TOAST',
      payload: {
        title: 'Plan Adjusted',
        message: `"${task.title}" rescheduled to tomorrow.`,
        type: 'info'
      }
    });
    onClose();
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_TASK', payload: task.id });
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Task Detail">
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.title}>{task.title}</h2>
          <div className={styles.badges}>
            <Badge>{task.category || 'Focus'}</Badge>
            {task.difficulty && <Badge variant="outline">{task.difficulty}</Badge>}
          </div>
        </div>

        <div className={styles.detailsList}>
          <div className={styles.detailRow}>
            <Clock size={16} />
            <span>{task.estimatedMinutes || task.duration || 30} minutes</span>
          </div>
          <div className={styles.detailRow}>
            <Sparkles size={16} color="var(--secondary-purple, #A982FF)" />
            <span className={styles.xpText}>+{task.xp || 100} XP reward</span>
          </div>
          {task.goalId && (
            <div className={styles.detailRow}>
              <Target size={16} />
              <span>Connected to goal</span>
            </div>
          )}
          {task.importance === 'high' || task.importance === 'critical' ? (
            <div className={styles.detailRow}>
              <AlertCircle size={16} color="#FF5252" />
              <span>High Importance</span>
            </div>
          ) : null}
        </div>

        <div className={styles.actions}>
          <Button variant="primary" className={styles.startButton} onClick={handleStart}>
            START TASK
          </Button>
          <div className={styles.secondaryActions}>
            <Button variant="outline" onClick={handleReschedule}>Reschedule</Button>
            <Button variant="ghost" onClick={handleDelete} className={styles.deleteButton}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetail;

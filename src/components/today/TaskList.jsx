import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import TaskCard from './TaskCard';
import Button from '../ui/Button';
import AddTaskModal from './AddTaskModal';
import TaskDetail from './TaskDetail';
import { CheckCircle2, Plus } from 'lucide-react';
import { KaeloMascot } from '../illustrations';
import styles from './TaskList.module.css';

import { getToday } from '../../utils/helpers';

const TaskList = () => {
  const { state, dispatch } = useApp();
  const todayStr = getToday();
  const tasks = (state.tasks || []).filter(t => 
    t.date === 'today' || t.scheduledDate === todayStr || (!t.date && !t.scheduledDate)
  );
  
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    return 0;
  });

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const allCompleted = tasks.length > 0 && completedCount === tasks.length;

  const handleToggle = (taskId) => {
    dispatch({ type: 'TOGGLE_TASK', payload: taskId });
  };

  const handleTriggerDayWrap = () => {
    dispatch({ type: 'TRIGGER_DAY_COMPLETE' });
  };

  return (
    <div className={styles.container} id="today-missions-section">
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>
            TODAY'S MISSIONS <span className={styles.count}>{tasks.length}</span>
          </h3>
          <p className={styles.subtext}>
            {completedCount}/{tasks.length} executed &middot; What actually moves your life forward.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)}>
          <Plus size={16} /> Add
        </Button>
      </div>

      {allCompleted && (
        <motion.div 
          className={styles.allDoneBanner}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.bannerLeft}>
            <CheckCircle2 size={20} color="var(--kaelo-black)" />
            <span>All planned priorities executed today.</span>
          </div>
          <button className={styles.wrapButton} onClick={handleTriggerDayWrap}>
            DAY RECAP
          </button>
        </motion.div>
      )}

      <div className={styles.list}>
        <AnimatePresence>
          {sortedTasks.length === 0 ? (
            <motion.div 
              className={styles.emptyCard}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <KaeloMascot variant="full" size={90} speech="All clear!" speechDirection="top" />
              </div>
              <h4 className={styles.emptyTitle}>YOU'RE CLEAR.</h4>
              <p className={styles.emptyDesc}>
                Nothing urgent is waiting for you. Protect your capacity or create an intentional mission.
              </p>
              <Button variant="primary" size="sm" onClick={() => setIsAdding(true)}>
                PLAN A MISSION
              </Button>
            </motion.div>
          ) : (
            sortedTasks.map((task, idx) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                index={idx}
                onToggle={handleToggle}
                onClick={setSelectedTask}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      <Button variant="outline" fullWidth className={styles.addButton} onClick={() => setIsAdding(true)}>
        + ADD ANOTHER MISSION
      </Button>

      {isAdding && (
        <AddTaskModal onClose={() => setIsAdding(false)} />
      )}
      
      {selectedTask && (
        <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
};

export default TaskList;

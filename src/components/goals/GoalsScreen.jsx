import React, { useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import GoalCard from './GoalCard';
import CreateGoal from './CreateGoal';
import GoalDetail from './GoalDetail';
import styles from './GoalsScreen.module.css';

export default function GoalsScreen() {
  const { state } = useApp();
  const [filter, setFilter] = useState('active'); // active | completed
  const [isCreating, setIsCreating] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);

  const goals = state.goals || [];
  
  const filteredGoals = goals.filter(goal => {
    if (filter === 'completed') return goal.progress >= goal.target;
    return goal.progress < goal.target;
  });

  if (selectedGoalId) {
    const goal = goals.find(g => g.id === selectedGoalId);
    if (goal) {
      return <GoalDetail goal={goal} onClose={() => setSelectedGoalId(null)} />;
    } else {
      setSelectedGoalId(null);
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>ACTIVE QUESTS <span className={styles.count}>{goals.length}</span></h1>
          <p style={{ fontSize: 13, color: 'var(--kaelo-gray-500)', marginTop: 4 }}>
            Break big ambitions into executable milestones.
          </p>
        </div>
        <button className={styles.addButton} onClick={() => setIsCreating(true)}>
          <Plus size={24} />
        </button>
      </header>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${filter === 'active' ? styles.tabActive : ''}`}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button 
          className={`${styles.tab} ${filter === 'completed' ? styles.tabActive : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      <div className={styles.list}>
        {filteredGoals.length > 0 ? (
          filteredGoals.map(goal => (
            <GoalCard 
              key={goal.id} 
              goal={goal} 
              onClick={() => setSelectedGoalId(goal.id)} 
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <Target size={48} color="var(--purple, #A982FF)" style={{ marginBottom: 16 }} />
            <h3 className={styles.emptyTitle}>What are you building?</h3>
            <p className={styles.emptyDesc}>
              Create your first goal and Kaelo will turn it into a realistic execution plan.
            </p>
            <button 
              className={styles.createGoalBtn}
              onClick={() => setIsCreating(true)}
            >
              CREATE GOAL
            </button>
          </div>
        )}
      </div>

      {isCreating && <CreateGoal onClose={() => setIsCreating(false)} />}
    </div>
  );
}

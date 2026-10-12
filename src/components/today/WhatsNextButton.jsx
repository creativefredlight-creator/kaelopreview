import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Zap, X, HelpCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getRecommendedNextAction, explainTaskPriority, getToday } from '../../utils/helpers';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import KaeloMascot from '../illustrations/KaeloMascot';
import styles from './WhatsNextButton.module.css';

const WhatsNextButton = () => {
  const { state, dispatch } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  const todayStr = getToday();
  const todayTasks = (state.tasks || []).filter(t => 
    t.date === 'today' || t.scheduledDate === todayStr || (!t.date && !t.scheduledDate)
  );
  const totalCapacityMinutes = Math.round((state.capacity?.dailyCapacity || 3.3) * 60);

  const recommendation = getRecommendedNextAction(todayTasks, totalCapacityMinutes, state.goals || []);

  const handleStartMission = () => {
    if (recommendation.task) {
      dispatch({ type: 'SET_ACTIVE_FOCUS', payload: recommendation.task });
      setShowModal(false);
    }
  };

  return (
    <>
      <div className={styles.container}>
        <motion.button 
          className={styles.button}
          onClick={() => setShowModal(true)}
          whileTap={{ scale: 0.97 }}
        >
          <div className={styles.inner}>
            <div className={styles.orb}>
              <KaeloMascot variant="avatar" size={32} />
            </div>
            <div className={styles.labels}>
              <span className={styles.title}>DECISION ASSISTANT</span>
              <span className={styles.actionPrompt}>WHAT SHOULD I DO NEXT?</span>
            </div>
            <ArrowRight size={18} className={styles.arrow} />
          </div>
        </motion.button>
      </div>

      <AnimatePresence>
        {showModal && (
          <Modal isOpen={true} onClose={() => setShowModal(false)} title="Your Next Move">
            <div className={styles.modalContent}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <KaeloMascot variant="full" size={52} />
                <div className={styles.aiTag}>
                  <Sparkles size={14} color="var(--kaelo-purple)" />
                  <span>Kaelo says: Zero Decision Fatigue</span>
                </div>
              </div>

              {recommendation.task ? (
                <>
                  <div className={styles.recommendationCard}>
                    <span className={styles.recCategory}>
                      {recommendation.task.category || 'Priority Mission'}
                    </span>
                    <h3 className={styles.recTitle}>
                      Complete your {recommendation.task.title}
                    </h3>
                    <div className={styles.recMeta}>
                      <span className={styles.metaPill}>
                        {recommendation.task.estimatedMinutes || 45} min
                      </span>
                      <span className={`${styles.metaPill} ${styles.xpPill}`}>
                        +{recommendation.task.xp || 100} XP
                      </span>
                      <span className={styles.metaPill}>
                        {recommendation.task.importance?.toUpperCase() || 'HIGH'} PRIORITY
                      </span>
                    </div>
                  </div>

                  <p className={styles.reasonText}>
                    {recommendation.reason}
                  </p>

                  {showWhy && (
                    <motion.div 
                      className={styles.whyBox}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <h4 className={styles.whyTitle}>Why this mission?</h4>
                      <p className={styles.whyDetail}>
                        {explainTaskPriority(recommendation.task, state.goals || [])}
                      </p>
                    </motion.div>
                  )}

                  <div className={styles.modalButtons}>
                    <Button 
                      variant="primary" 
                      fullWidth 
                      size="lg"
                      onClick={handleStartMission}
                    >
                      <Zap size={18} /> [ START MISSION ]
                    </Button>
                    <button 
                      className={styles.whyBtn}
                      onClick={() => setShowWhy(!showWhy)}
                    >
                      <HelpCircle size={14} /> {showWhy ? 'Hide Reason' : 'Show Me Why'}
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.emptyClear}>
                  <p className={styles.clearText}>
                    All planned missions for today are complete! Enjoy your recovered time or wrap up your day.
                  </p>
                  <Button variant="dark" fullWidth onClick={() => setShowModal(false)}>
                    Close
                  </Button>
                </div>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
};

export default WhatsNextButton;

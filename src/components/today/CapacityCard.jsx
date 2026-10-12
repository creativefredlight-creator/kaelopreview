import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { getToday, formatMinutes, rebalanceDailyPlan } from '../../utils/helpers';
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Check, Clock } from 'lucide-react';
import KaeloMascot from '../illustrations/KaeloMascot';
import styles from './CapacityCard.module.css';

const CapacityCard = () => {
  const { state, dispatch } = useApp();
  const [showFixModal, setShowFixModal] = useState(false);

  const todayStr = getToday();
  const totalCapacityHours = Number(state.capacity?.dailyCapacity || 3.3);
  const totalCapacityMinutes = Math.round(totalCapacityHours * 60);

  // Filter tasks planned for today
  const todayTasks = (state.tasks || []).filter(t => 
    t.date === 'today' || t.scheduledDate === todayStr || (!t.date && !t.scheduledDate)
  );

  const usedMinutes = todayTasks.reduce((sum, t) => sum + (Number(t.estimatedMinutes) || Number(t.duration) || 30), 0);
  const usedHours = Number((usedMinutes / 60).toFixed(1));
  const remainingMinutes = Math.max(0, totalCapacityMinutes - usedMinutes);
  const remainingHours = Number((remainingMinutes / 60).toFixed(1));
  const overMinutes = Math.max(0, usedMinutes - totalCapacityMinutes);

  const progressPercent = totalCapacityMinutes > 0 ? (usedMinutes / totalCapacityMinutes) * 100 : 0;
  const isOver = usedMinutes > totalCapacityMinutes;
  const isNear = !isOver && progressPercent >= 80;

  let statusText = 'Healthy capacity';
  let statusClass = styles.healthy;
  let barColor = 'var(--kaelo-lime, #C7FF35)';

  if (isOver) {
    statusText = 'OVER CAPACITY';
    statusClass = styles.over;
    barColor = 'var(--kaelo-danger, #F87171)';
  } else if (isNear) {
    statusText = "You're nearly full";
    statusClass = styles.near;
    barColor = 'var(--kaelo-warning, #FBBF24)';
  }

  // Calculate intelligent rebalance plan
  const rebalance = rebalanceDailyPlan(todayTasks, totalCapacityMinutes);

  const handleAcceptPlan = () => {
    dispatch({ type: 'APPLY_AI_REBALANCE' });
    setShowFixModal(false);
  };

  return (
    <>
      <Card className={styles.card}>
        <div className={styles.header}>
          <h3 className={styles.title}>TODAY'S CAPACITY</h3>
          <span className={`${styles.status} ${statusClass}`}>
            {statusText}
          </span>
        </div>
        
        <div className={styles.stats}>
          <div className={styles.hours}>
            <span className={styles.used}>{usedHours}h</span>
            <span className={styles.total}>/ {totalCapacityHours}h</span>
          </div>
          {!isOver ? (
            <div className={styles.remaining}>
              {remainingHours}h remaining
            </div>
          ) : (
            <div className={`${styles.remaining} ${styles.overText}`}>
              +{formatMinutes(overMinutes)} over limit
            </div>
          )}
        </div>

        <div className={styles.barContainer}>
          <motion.div 
            className={styles.barFill}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progressPercent, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ backgroundColor: barColor }}
          />
        </div>

        {isOver && (
          <div className={styles.overNotice}>
            <div className={styles.overNoticeHeader}>
              <KaeloMascot variant="avatar" size={32} forceRed={true} />
              <p className={styles.overExplanation}>
                You've planned {formatMinutes(overMinutes)} more than your available time.
              </p>
            </div>
            <Button 
              variant="primary" 
              className={styles.fixButton}
              onClick={() => setShowFixModal(true)}
            >
              <Sparkles size={16} /> FIX MY DAY
            </Button>
          </div>
        )}

        {!isOver && isNear && (
          <p className={styles.subtleNote}>
            You're close to your realistic limit. Protect your remaining focus.
          </p>
        )}

        {!isOver && !isNear && (
          <p className={styles.subtleNote}>
            Healthy workload. You have realistic room to execute what matters.
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.72)', fontWeight: 600 }}>
            {todayTasks.filter(t => t.status === 'completed').length} of {todayTasks.length} missions executed
          </span>
          <button
            onClick={() => dispatch({ type: 'OPEN_RECAP_MODAL' })}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--accent-lime, #C7FF35)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Clock size={12} /> RECAP & ROLLOVER
          </button>
        </div>
      </Card>

      {/* OVER CAPACITY RESOLUTION MODAL — "FIX MY DAY" */}
      <AnimatePresence>
        {showFixModal && (
          <Modal isOpen={true} onClose={() => setShowFixModal(false)} title="Fix My Day">
            <div className={styles.fixModalContent}>
              <div className={styles.fixHero}>
                <KaeloMascot variant="avatar" size={44} />
                <div className={styles.fixHeroText}>
                  <h4 className={styles.fixHeroTitle}>I cleaned up your day.</h4>
                  <p className={styles.fixHeroSub}>
                    Prioritized critical deadlines & restored realistic pacing.
                  </p>
                </div>
              </div>

              {/* KEPT LIST */}
              <div className={styles.planGroup}>
                <div className={styles.groupHeader}>
                  <span className={styles.groupBadgeLime}>KEPT</span>
                  <span className={styles.groupCount}>{rebalance.keep.length} priorities</span>
                </div>
                <div className={styles.itemsList}>
                  {rebalance.keep.map(item => (
                    <div key={item.id} className={styles.planItemKept}>
                      <div className={styles.itemLeft}>
                        <div className={styles.checkIconBox}>
                          <Check size={14} strokeWidth={3} />
                        </div>
                        <span className={styles.itemTitle}>{item.title}</span>
                      </div>
                      <div className={styles.itemRight}>
                        <span className={styles.priorityPill}>{item.importance || 'high'}</span>
                        <span className={styles.timePill}>{item.estimatedMinutes || 30}m</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MOVED LIST */}
              {rebalance.moveTomorrow.length > 0 && (
                <div className={styles.planGroup}>
                  <div className={styles.groupHeader}>
                    <span className={styles.groupBadgePurple}>MOVED</span>
                    <span className={styles.groupCount}>{rebalance.moveTomorrow.length} shifted</span>
                  </div>
                  <div className={styles.itemsList}>
                    {rebalance.moveTomorrow.map(item => (
                      <div key={item.id} className={styles.planItemMoved}>
                        <div className={styles.itemLeft}>
                          <div className={styles.arrowIconBox}>
                            <ArrowRight size={14} />
                          </div>
                          <span className={styles.itemTitle}>{item.title}</span>
                        </div>
                        <div className={styles.itemRight}>
                          <span className={styles.shiftTarget}>→ Tomorrow</span>
                          <span className={styles.timePill}>{item.estimatedMinutes || 30}m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* OUTCOME BOX */}
              <div className={styles.outcomeCard}>
                <ShieldCheck size={18} color="var(--kaelo-lime, #C7FF35)" />
                <div className={styles.outcomeText}>
                  <strong>You are now within your realistic capacity.</strong>
                  <span>{(rebalance.newUsedMinutes / 60).toFixed(1)}h planned / {totalCapacityHours}h available</span>
                </div>
              </div>

              <div className={styles.modalActions}>
                <Button 
                  variant="primary" 
                  fullWidth 
                  size="lg"
                  onClick={handleAcceptPlan}
                >
                  [ ACCEPT PLAN ]
                </Button>
                <Button 
                  variant="ghost" 
                  fullWidth 
                  onClick={() => setShowFixModal(false)}
                >
                  Keep my current plan
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
};

export default CapacityCard;

import React from 'react';
import { useApp } from '../../context/AppContext';
import { Award, CheckCircle, Zap, Milestone } from 'lucide-react';
import Card from '../ui/Card';
import styles from './PersonalGrowthTimeline.module.css';

const PersonalGrowthTimeline = () => {
  const { state } = useApp();
  const timeline = state.timeline || [];

  const getIcon = (type) => {
    switch (type) {
      case 'level':
        return <Zap size={14} className={styles.levelIcon} />;
      case 'achievement':
        return <Award size={14} className={styles.awardIcon} />;
      default:
        return <CheckCircle size={14} className={styles.taskIcon} />;
    }
  };

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div className={styles.tag}>
          <Milestone size={14} />
          <span>STORY</span>
        </div>
        <span className={styles.subtag}>PROGRESSION LOG</span>
      </div>

      <h3 className={styles.title}>Growth Timeline</h3>
      <p className={styles.description}>
        Visible proof of who you're becoming, one completed mission at a time.
      </p>

      <div className={styles.timeline}>
        {timeline.map((item, idx) => (
          <div key={item.id || idx} className={styles.timelineItem}>
            <div className={styles.leftCol}>
              <div className={styles.node}>
                {getIcon(item.type)}
              </div>
              {idx < timeline.length - 1 && <div className={styles.connector} />}
            </div>

            <div className={styles.rightCol}>
              <div className={styles.itemHeader}>
                <span className={styles.date}>{item.date}</span>
                {item.xp > 0 && (
                  <span className={styles.xpPill}>+{item.xp} XP</span>
                )}
              </div>
              <p className={styles.itemTitle}>{item.title}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PersonalGrowthTimeline;

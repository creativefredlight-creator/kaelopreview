import React from 'react';
import { Sparkles, Clock, CheckCircle2, TrendingUp, Compass } from 'lucide-react';
import Card from '../ui/Card';
import styles from './KaeloPatternsCard.module.css';

const PATTERNS = [
  {
    id: 'p1',
    icon: Clock,
    color: 'var(--kaelo-purple)',
    title: 'Peak Focus Window',
    metric: '8:00 AM – 11:30 AM',
    insight: 'You execute with 89% higher speed and zero task switches during morning hours.'
  },
  {
    id: 'p2',
    icon: CheckCircle2,
    color: 'var(--kaelo-lime)',
    title: 'Optimal Load Constraint',
    metric: '3 Missions / Day',
    insight: 'You finish 28% more total work when planning 3 strict priorities instead of overloading.'
  },
  {
    id: 'p3',
    icon: TrendingUp,
    color: '#4F8CF7',
    title: 'Highest Execution Domain',
    metric: 'Academic & Career',
    insight: '94% consistency over the last 14 days with an average session of 45 mins.'
  }
];

const KaeloPatternsCard = () => {
  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div className={styles.tag}>
          <Sparkles size={14} className={styles.tagIcon} />
          <span>KAELO SEES</span>
        </div>
        <span className={styles.subtag}>BEHAVIORAL INTELLIGENCE</span>
      </div>

      <h3 className={styles.title}>Your Execution Patterns</h3>
      <p className={styles.description}>
        Kaelo learns how you actually work, adapting your daily plan around reality.
      </p>

      <div className={styles.patternsList}>
        {PATTERNS.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.id} className={styles.patternItem}>
              <div className={styles.iconBox} style={{ color: p.color }}>
                <Icon size={18} />
              </div>
              <div className={styles.patternContent}>
                <div className={styles.patternTop}>
                  <span className={styles.patternTitle}>{p.title}</span>
                  <span className={styles.patternMetric}>{p.metric}</span>
                </div>
                <p className={styles.patternInsight}>{p.insight}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default KaeloPatternsCard;

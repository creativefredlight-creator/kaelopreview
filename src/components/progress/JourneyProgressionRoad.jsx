import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Trophy, 
  Gift, 
  Check, 
  Sparkles, 
  Flame, 
  Sprout, 
  ArrowRight, 
  X, 
  Lock, 
  ChevronRight,
  Target
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { KaeloMascot } from '../illustrations';
import styles from './JourneyProgressionRoad.module.css';

const ROAD_MILESTONES = [
  {
    id: 'stone_1',
    level: 1,
    title: 'The Origin · First Step',
    label: 'ORIGIN',
    posClass: 'posOrigin',
    iconType: 'step',
    xp: 50,
    reqText: 'Starting baseline for every ambitious builder',
    reward: '+50 XP on first mission',
    description: 'Your execution road begins here. Consistency isn\'t built in months—it\'s built one day at a time.',
  },
  {
    id: 'stone_2',
    level: 1,
    title: 'Consistency Rooted',
    label: 'ROOTED',
    posClass: 'posCenterBottom',
    iconType: 'sprout',
    reqText: 'Achieve 1 goal milestone or complete 1 daily task',
    reward: '+100 XP · Sprout Badge',
    description: 'You executed your first scheduled priority without procrastination. The habit is taking root.',
  },
  {
    id: 'stone_3',
    level: 2,
    title: 'Pacing Master',
    label: '+100 XP',
    posClass: 'posLeft1',
    iconType: 'step',
    xp: 100,
    reqText: 'Achieve 2 goal milestones or 3 daily tasks',
    reward: '+100 XP · Capacity Shield',
    description: 'You stayed within your realistic daily capacity and executed with steady rhythm.',
  },
  {
    id: 'stone_4',
    level: 3,
    title: '7-Day Streak Fire',
    label: '7D STREAK',
    posClass: 'posRight1',
    iconType: 'flame',
    reqText: 'Reach a 7-day streak or complete 3 goal milestones',
    reward: '+250 XP · Flame Beacon',
    description: 'Momentum has reached escape velocity. Daily action is becoming your default identity.',
  },
  {
    id: 'stone_5',
    level: 4,
    title: 'Level 4 · Focused Builder',
    label: 'LEVEL 4',
    posClass: 'posCenter',
    iconType: 'level',
    reqText: 'Reach 70%+ on any major goal or 4 goal milestones',
    reward: '+300 XP · Focused Builder Title',
    description: 'Current benchmark of excellence. You finish what you start and protect your execution window.',
  },
  {
    id: 'stone_6',
    level: 5,
    title: 'Goal Finisher Mystery Block',
    label: 'MYSTERY',
    posClass: 'posLeft2',
    iconType: 'mystery',
    reqText: 'Achieve 100% on any Quest or reach 3,500 XP',
    reward: '+400 XP · Deep Flow Theme',
    description: 'Unlocks when your first ambitious goal crosses the finish line at 100%.',
  },
  {
    id: 'stone_7',
    level: 5,
    title: 'Momentum Gift Chest',
    label: '+500 XP',
    posClass: 'posRight2',
    iconType: 'gift',
    reqText: 'Achieve 100% on 2 Quests or reach 5,000 XP',
    reward: '+500 XP & Momentum Machine Badge',
    description: 'Compounding execution produces multiple finished goals. Massive bonus chest awarded.',
  },
  {
    id: 'stone_8',
    level: 6,
    title: 'System Architect Peak',
    label: 'PEAK',
    posClass: 'posTop',
    iconType: 'trophy',
    reqText: 'Achieve 3+ completed Quests or reach Level 6',
    reward: 'Peak Mastery Trophy & Hall of Fame',
    description: 'The pinnacle of effortless execution. Distractions have zero leverage on your priorities.',
  }
];

const JourneyProgressionRoad = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const user = state.user || {};
  const goals = state.goals || [];
  const tasks = state.tasks || [];
  const [selectedStone, setSelectedStone] = useState(null);

  // -------------------------------------------------------------
  // CALCULATE ACTIVE MILESTONE BASED ON ACHIEVED GOALS & TASKS
  // -------------------------------------------------------------
  const completedMilestonesCount = goals.reduce((acc, g) => {
    return acc + (g.milestones?.filter(m => m.completed)?.length || 0);
  }, 0);

  const completedGoalsCount = goals.filter(
    g => g.status === 'completed' || (g.progress || 0) >= 100
  ).length;

  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const maxGoalProgress = Math.max(0, ...goals.map(g => g.progress || 0));

  const xp = user.xp || 0;
  const level = user.level || 1;
  const streak = user.streak || 0;

  // The mascot starts at Stone 0 (The Beginning / Origin),
  // and dynamically steps forward as goals, milestones, and tasks are achieved!
  let activeIndex = 0;

  if (completedGoalsCount >= 3 || level >= 7 || xp >= 8000) {
    activeIndex = 7; // Stone 8: Peak
  } else if (completedGoalsCount >= 2 || level >= 6 || xp >= 5000) {
    activeIndex = 6; // Stone 7: Gift Chest
  } else if (completedGoalsCount >= 1 || completedMilestonesCount >= 6 || level >= 5 || xp >= 3500) {
    activeIndex = 5; // Stone 6: Mystery Block
  } else if (maxGoalProgress >= 70 || completedMilestonesCount >= 4 || level >= 4 || xp >= 2400) {
    activeIndex = 4; // Stone 5: Level 4 Focused Builder
  } else if (streak >= 7 || completedMilestonesCount >= 3 || level >= 3 || xp >= 1400) {
    activeIndex = 3; // Stone 4: 7D Streak Fire
  } else if (completedMilestonesCount >= 2 || completedTasksCount >= 3 || level >= 2 || xp >= 600) {
    activeIndex = 2; // Stone 3: Pacing Master
  } else if (completedMilestonesCount >= 1 || completedTasksCount >= 1 || xp >= 150) {
    activeIndex = 1; // Stone 2: Consistency Rooted
  } else {
    activeIndex = 0; // Stone 1: The Beginning (Origin)
  }

  const getMascotSpeech = (index) => {
    switch (index) {
      case 0:
        return "Day 1 starts here! Let's build.";
      case 1:
        return "Consistency rooted! Habit locked in.";
      case 2:
        return "Pacing on point! +100 XP.";
      case 3:
        return "7-Day Streak! You're on fire!";
      case 4:
        return "Focused Builder! Ready to crush a goal?";
      case 5:
        return "Quest achieved! Mystery unlocked!";
      case 6:
        return "2 Quests down! Massive momentum!";
      case 7:
        return "Peak execution reached! Legendary!";
      default:
        return "Keep executing!";
    }
  };

  const renderPlatformIcon = (stone, isCompleted, isCurrent, isLocked) => {
    if (isCompleted) {
      return <Check size={20} strokeWidth={3} className={styles.iconCheck} />;
    }
    if (isCurrent) {
      if (stone.iconType === 'trophy') return <Trophy size={22} className={styles.iconCurrent} />;
      return <Check size={22} strokeWidth={3} className={styles.iconCurrent} />;
    }
    // Locked icons
    switch (stone.iconType) {
      case 'sprout':
        return <Sprout size={22} className={styles.iconSprout} />;
      case 'flame':
        return <Flame size={20} className={styles.iconFlame} />;
      case 'mystery':
        return <span className={styles.mysteryMark}>?</span>;
      case 'gift':
        return <Gift size={22} className={styles.iconGift} />;
      case 'trophy':
        return <Trophy size={24} className={styles.iconTrophy} />;
      default:
        return <span className={styles.platformXpText}>+{stone.xp || 50}</span>;
    }
  };



  return (
    <div className={styles.container}>
      {/* Top Gamified Game Bar */}
      <div className={styles.gameHud}>
        <div className={styles.levelBadge}>
          <span className={styles.levelDot} />
          <span>CHECKPOINT {activeIndex + 1}/8</span>
        </div>

        <div className={styles.hudStat}>
          <span className={styles.hudLabel}>XP</span>
          <span className={styles.hudVal}>{(xp).toLocaleString()} / 3,000</span>
        </div>

        <div className={styles.hudStat}>
          <span className={styles.hudLabel}>GOALS CRUSHED</span>
          <span className={`${styles.hudVal} ${styles.goalsCrushedVal}`}>
            {completedGoalsCount} / {Math.max(1, goals.length)}
          </span>
        </div>

        <div className={styles.boostPill}>
          <Zap size={13} className={styles.boostIcon} />
          <span>BOOST X1.5</span>
        </div>
      </div>

      <div className={styles.roadTitleArea}>
        <div className={styles.roadTitleHeader}>
          <h3 className={styles.roadTitle}>THE EXECUTION ROAD</h3>
          <span className={styles.stageBadge}>
            Stage {activeIndex + 1} of 8
          </span>
        </div>
        <p className={styles.roadSubtitle}>
          {activeIndex === 0 
            ? "Kaelo is at the origin. Complete your first goal priority to step forward!" 
            : `Kaelo is currently at "${ROAD_MILESTONES[activeIndex].title}". Progresses as goals are achieved.`
          }
        </p>
      </div>

      {/* 3D Isometric Stepping Stone Road */}
      <div className={styles.roadCanvas}>
        {/* Curving SVG Path in Background */}
        <svg className={styles.pathSvg} viewBox="0 0 320 620" preserveAspectRatio="none">
          {/* Outer glowing aura ribbon */}
          <path 
            className={styles.pathAura}
            d="M 60 560 Q 160 520 220 460 T 100 340 T 220 200 T 160 60" 
            fill="none" 
            strokeLinecap="round"
          />
          {/* Core road surface */}
          <path 
            className={styles.pathCore}
            d="M 60 560 Q 160 520 220 460 T 100 340 T 220 200 T 160 60" 
            fill="none" 
            strokeLinecap="round"
          />
          {/* Glowing Center Highway Line */}
          <path 
            className={styles.pathCenterDashed}
            d="M 60 560 Q 160 520 220 460 T 100 340 T 220 200 T 160 60" 
            fill="none" 
            strokeLinecap="round"
          />
        </svg>

        {/* Dynamic Stepping Stones and Platforms */}
        <div className={styles.stonesGrid}>
          {ROAD_MILESTONES.map((stone, index) => {
            const isCompleted = index < activeIndex;
            const isCurrent = index === activeIndex;
            const isLocked = index > activeIndex;

            return (
              <div 
                key={stone.id}
                className={`${styles.stoneNode} ${styles[stone.posClass]}`}
                onClick={() => setSelectedStone({
                  ...stone,
                  status: isCurrent ? 'current' : isCompleted ? 'completed' : 'locked',
                  index
                })}
              >
                {/* DYNAMIC MASCOT: Renders on whichever stone is currently active! */}
                {isCurrent && (
                  <motion.div 
                    className={styles.currentMascotWrapper}
                    initial={{ y: -16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', damping: 14, stiffness: 220 }}
                  >
                    <KaeloMascot 
                      variant="celebrate" 
                      size={76} 
                      speech={getMascotSpeech(index)} 
                      speechDirection="top" 
                    />
                  </motion.div>
                )}

                <div className={`
                  ${styles.platform}
                  ${isCompleted ? styles.platformDone : ''}
                  ${isCurrent ? styles.platformCurrent : ''}
                  ${isLocked ? (
                    stone.iconType === 'mystery' ? styles.platformMystery : 
                    stone.iconType === 'gift' ? styles.platformGift : 
                    styles.platformLocked
                  ) : ''}
                `}>
                  {isCurrent && <div className={styles.currentPulse} />}
                  {renderPlatformIcon(stone, isCompleted, isCurrent, isLocked)}
                </div>

                <span className={`
                  ${styles.platformLabel} 
                  ${isCurrent ? styles.currentLabel : ''}
                `}>
                  {stone.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>



      {/* Detail Modal on Stone Click */}
      <AnimatePresence>
        {selectedStone && (
          <div className={styles.modalOverlay} onClick={() => setSelectedStone(null)}>
            <motion.div 
              className={styles.modalCard}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
            >
              <button className={styles.closeBtn} onClick={() => setSelectedStone(null)}>
                <X size={18} />
              </button>

              <div className={styles.modalHeader}>
                <span className={styles.modalStatus}>
                  {selectedStone.status === 'completed' 
                    ? 'CHECKPOINT COMPLETED' 
                    : selectedStone.status === 'current' 
                    ? 'CURRENT LOCATION' 
                    : 'UPCOMING MILESTONE'
                  }
                </span>
                <h4 className={styles.modalTitle}>{selectedStone.title}</h4>
              </div>

              <p className={styles.modalDesc}>{selectedStone.description}</p>

              {/* Requirement to Unlock */}
              <div className={`${styles.modalReqBox} ${selectedStone.status === 'completed' ? styles.modalReqBoxDone : ''}`}>
                <div className={styles.modalReqLabel}>
                  {selectedStone.status === 'completed' ? 'HOW THIS WAS UNLOCKED:' : 'CRITERIA TO UNLOCK & ADVANCE:'}
                </div>
                <div className={styles.modalReqText}>
                  {selectedStone.reqText}
                </div>
              </div>

              {selectedStone.reward && (
                <div className={styles.rewardPill}>
                  <Sparkles size={14} className={styles.rewardIcon} />
                  <span>Reward: {selectedStone.reward}</span>
                </div>
              )}

              <div className={styles.modalActions}>
                {selectedStone.status === 'locked' && (
                  <button 
                    className={styles.modalQuestBtn}
                    onClick={() => {
                      setSelectedStone(null);
                      navigate('/quests');
                    }}
                  >
                    <Target size={16} />
                    <span>VIEW ACTIVE QUESTS</span>
                    <ArrowRight size={15} />
                  </button>
                )}

                <button className={styles.modalOkBtn} onClick={() => setSelectedStone(null)}>
                  CLOSE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JourneyProgressionRoad;

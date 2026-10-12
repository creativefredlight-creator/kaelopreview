import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { DEFAULT_USER, DEFAULT_CAPACITY, ACHIEVEMENTS } from '../data/constants';
import { 
  storage, 
  calculateDailyCapacity, 
  calculateTaskXP, 
  getLevelFromXP, 
  generateId, 
  getToday, 
  calculateMomentum,
  rebalanceDailyPlan,
  getRecommendedNextAction
} from '../utils/helpers';
import { executeVoiceCommand } from '../utils/aiActionEngine';
import { executeBrainEnhancedCommand } from '../utils/brainBridge';
import analytics, { AnalyticsEvents } from '../utils/analytics';
import { REWARD_ITEMS, getRewardItem } from '../data/rewardsCatalogue';
import { SUBSCRIPTION_TIERS, canAccessFeature } from '../data/subscriptionTiers';
import { DEFAULT_CALENDAR } from '../core/intelligence/scheduleEngine.js';

// ==========================================
// DEFAULT SEED DATA (FRED · FOCUSED BUILDER)
// ==========================================
const DEFAULT_QUESTS = [
  {
    id: 'quest_portfolio',
    title: 'Launch My Portfolio',
    categoryId: 'career',
    categoryName: 'Career',
    categoryColor: '#FF6B6B',
    progress: 72,
    target: 100,
    unit: '%',
    deadline: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString(),
    capacityPerDay: 1.0,
    status: 'active',
    currentObjective: 'Publish homepage case study',
    objectiveXP: 300,
    milestones: [
      { id: 'm1', title: 'Information Structure', completed: true },
      { id: 'm2', title: 'Visual Design & System', completed: true },
      { id: 'm3', title: 'Component Library', completed: true },
      { id: 'm4', title: 'Publish homepage case study', completed: false, current: true, xp: 300 },
      { id: 'm5', title: 'Custom Domain & Launch', completed: false }
    ]
  },
  {
    id: 'quest_pha',
    title: 'PHA 201 Revision & Exam',
    categoryId: 'academic',
    categoryName: 'Academic',
    categoryColor: '#4F8CF7',
    progress: 60,
    target: 100,
    unit: '%',
    deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    capacityPerDay: 1.5,
    status: 'active',
    currentObjective: 'Complete organ systems practice',
    objectiveXP: 250,
    milestones: [
      { id: 'm10', title: 'Cellular Physiology Notes', completed: true },
      { id: 'm11', title: 'Complete organ systems practice', completed: false, current: true, xp: 250 },
      { id: 'm12', title: 'Mock Exam Simulation', completed: false }
    ]
  }
];

const DEFAULT_TASKS = [
  {
    id: 'task_1',
    goalId: 'quest_pha',
    title: 'Complete CS Assignment',
    category: 'Academic',
    estimatedMinutes: 45,
    duration: 45,
    difficulty: 'medium',
    importance: 'high',
    xp: 120,
    status: 'pending',
    date: 'today',
    scheduledDate: getToday(),
  },
  {
    id: 'task_2',
    goalId: 'quest_portfolio',
    title: 'Build Xoli Carousel',
    category: 'Business',
    estimatedMinutes: 60,
    duration: 60,
    difficulty: 'medium',
    importance: 'high',
    xp: 150,
    status: 'pending',
    date: 'today',
    scheduledDate: getToday(),
  },
  {
    id: 'task_3',
    goalId: 'quest_pha',
    title: 'PHA 201 Revision',
    category: 'Academic',
    estimatedMinutes: 75,
    duration: 75,
    difficulty: 'hard',
    importance: 'critical',
    xp: 180,
    status: 'pending',
    date: 'today',
    scheduledDate: getToday(),
  }
];

const DEFAULT_TIMELINE = [
  { id: 'tl_1', date: 'Today', title: 'Completed PHA revision section', xp: 120, type: 'task' },
  { id: 'tl_2', date: 'Yesterday', title: 'Shipped Xoli initial wireframes', xp: 150, type: 'task' },
  { id: 'tl_3', date: '3 days ago', title: 'Reached Level 4 · Focused Builder', xp: 0, type: 'level' },
  { id: 'tl_4', date: '5 days ago', title: 'Unlocked Week Warrior achievement', xp: 0, type: 'achievement' }
];

const DEFAULT_MESSAGES = [
  {
    id: 'msg_1',
    sender: 'kaelo',
    text: "Good morning Fred. I analyzed your commitments for today. You have 3h 20m of realistic capacity. Your PHA revision is priority #1, and your portfolio project needs 45 minutes to stay on track. I've narrowed today's plan to 3 things.",
    actions: ['SEE_PLAN', 'WHAT_NEXT'],
    timestamp: new Date().toISOString()
  }
];

const getPastDateStr = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const DEFAULT_PROGRESS = [
  { date: getPastDateStr(4), tasksPlanned: 3, tasksCompleted: 3, completionRate: 1, capacityRespected: true, xpEarned: 350, focusMinutes: 90 },
  { date: getPastDateStr(3), tasksPlanned: 3, tasksCompleted: 2, completionRate: 0.67, capacityRespected: true, xpEarned: 240, focusMinutes: 60 },
  { date: getPastDateStr(2), tasksPlanned: 4, tasksCompleted: 4, completionRate: 1, capacityRespected: true, xpEarned: 420, focusMinutes: 120 },
  { date: getPastDateStr(1), tasksPlanned: 3, tasksCompleted: 3, completionRate: 1, capacityRespected: true, xpEarned: 380, focusMinutes: 90 },
];

const DEFAULT_MEMORY = [
  { id: 'mem_1', title: 'Peak Focus Window', detail: 'Executes with 89% higher speed between 8:00 AM – 11:30 AM', category: 'habits', dateAdded: 'Auto-learned' },
  { id: 'mem_2', title: 'Avoidance Pattern', detail: 'Tends to hesitate when a single task exceeds 60 minutes. Prefers 30-45m intervals.', category: 'execution', dateAdded: 'Auto-learned' },
  { id: 'mem_3', title: 'Preferred Coaching Tone', detail: 'Direct, calm, and reality-first. No generic motivational fluff.', category: 'coaching', dateAdded: 'User preference' },
  { id: 'mem_4', title: 'Capacity Threshold', detail: 'Maintains optimal momentum around 3.3 hours of focused execution per day.', category: 'capacity', dateAdded: 'System calibrated' },
];

// ==========================================
// INITIAL STATE
// ==========================================
function loadState() {
  const user = storage.get('user') || { ...DEFAULT_USER };
  if (!user.tier) user.tier = 'free';
  if (!user.coachingTone) user.coachingTone = 'direct';

  const goals = storage.get('goals') || DEFAULT_QUESTS;
  const tasks = storage.get('tasks') || DEFAULT_TASKS;
  const timeline = storage.get('timeline') || DEFAULT_TIMELINE;
  const calendar = storage.get('calendar') || DEFAULT_CALENDAR;
  const chatMessages = storage.get('chatMessages') || DEFAULT_MESSAGES;
  const capacity = storage.get('capacity') || { ...DEFAULT_CAPACITY, dailyCapacity: 3.3 };

  const activePerks = storage.get('activePerks') || {
    proUntil: null,
    streakShields: 1,
    xpMultiplierUntil: null,
    rebalanceTokens: 0,
    hasWeekendProfile: false,
  };

  const xpLedger = storage.get('xpLedger') || [
    { id: 'xpl_1', timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), type: 'EARNED', amount: 1200, reason: 'Weekly Execution Streak (Lvl 3)', balanceAfter: 1200 },
    { id: 'xpl_2', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), type: 'EARNED', amount: 680, reason: 'Deep Focus Blocks Completed', balanceAfter: 1880 },
    { id: 'xpl_3', timestamp: new Date(Date.now() - 86400000).toISOString(), type: 'EARNED', amount: 600, reason: 'Milestone Execution: CS Assignment', balanceAfter: 2480 }
  ];

  const squad = storage.get('squad') || {
    id: 'squad_focus_builders',
    name: 'Morning Focus Squad',
    motto: 'Execution before 11 AM.',
    targetWeeklyFocusMinutes: 600,
    currentWeeklyFocusMinutes: 485,
    members: [
      { id: 'm1', name: user.name || 'Fred', level: user.level || 4, avatarInitial: (user.name || 'F')[0], todayCompleted: 2, todayTotal: 3, isYou: true },
      { id: 'm2', name: 'Amina K.', level: 5, avatarInitial: 'A', todayCompleted: 3, todayTotal: 3, isYou: false },
      { id: 'm3', name: 'Marcus T.', level: 3, avatarInitial: 'M', todayCompleted: 1, todayTotal: 2, isYou: false }
    ]
  };

  const referralCode = storage.get('referralCode') || ((user.name || 'FRED').toUpperCase() + (user.id ? user.id.slice(-3) : '84'));
  const referralsCount = storage.get('referralsCount') || 3;
  const referralXPEarned = storage.get('referralXPEarned') || 750;

  const todayStr = getToday();
  const staleTasks = tasks.filter(t => t.scheduledDate && t.scheduledDate < todayStr && t.status !== 'completed');
  const needsRecovery = staleTasks.length >= 2;

  return {
    theme: storage.get('theme') || 'light',
    user,
    capacity,
    goals,
    tasks,
    timeline,
    calendar,
    chatMessages,
    listings: storage.get('listings') || [],
    activeListingDraft: storage.get('activeListingDraft') || null,
    focusSessions: storage.get('focusSessions') || [
      { id: 'f1', duration: 45, completedAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 'f2', duration: 30, completedAt: new Date(Date.now() - 172800000).toISOString() }
    ],
    progress: storage.get('progress') || DEFAULT_PROGRESS,
    achievements: storage.get('achievements') || ['first_mission', 'week_warrior', 'locked_in'],
    notifications: [],
    activeFocus: null,
    toast: null,
    dayCompleteModal: false,
    memory: storage.get('memory') || DEFAULT_MEMORY,
    voiceActive: false,
    orbState: 'idle',
    orbVisible: storage.get('orbVisible') !== false,
    voiceSettings: storage.get('voiceSettings') || { autoplay: true, rate: 1.0, pitch: 1.05 },
    conversationalContext: storage.get('conversationalContext') || {
      lastReferencedTaskId: null,
      lastCreatedTaskId: null,
      pendingAction: null,
      lastIntent: null
    },
    focusControl: null,
    // Upgraded Features
    activePerks,
    xpLedger,
    squad,
    referralCode,
    referralsCount,
    referralXPEarned,
    recoveryState: {
      needsRecovery,
      dismissed: false,
      staleTasks
    },
    isRewardsModalOpen: false,
    isSubscriptionModalOpen: false,
    isShareModalOpen: false,
    shareModalData: null,
    isSquadModalOpen: false,
    isRecapModalOpen: false,
  };
}

// ==========================================
// ACTIONS
// ==========================================
export const ACTIONS = {
  SET_THEME: 'SET_THEME',
  SET_USER: 'SET_USER',
  UPDATE_USER: 'UPDATE_USER',
  SET_CAPACITY: 'SET_CAPACITY',
  ADD_GOAL: 'ADD_GOAL',
  UPDATE_GOAL: 'UPDATE_GOAL',
  DELETE_GOAL: 'DELETE_GOAL',
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  TOGGLE_TASK: 'TOGGLE_TASK',
  COMPLETE_TASK: 'COMPLETE_TASK',
  ADD_FOCUS_SESSION: 'ADD_FOCUS_SESSION',
  SET_ACTIVE_FOCUS: 'SET_ACTIVE_FOCUS',
  END_FOCUS: 'END_FOCUS',
  UPDATE_PROGRESS: 'UPDATE_PROGRESS',
  UNLOCK_ACHIEVEMENT: 'UNLOCK_ACHIEVEMENT',
  SHOW_TOAST: 'SHOW_TOAST',
  HIDE_TOAST: 'HIDE_TOAST',
  RESET_STATE: 'RESET_STATE',
  SEND_AI_MESSAGE: 'SEND_AI_MESSAGE',
  CLEAR_CHAT: 'CLEAR_CHAT',
  APPLY_AI_REBALANCE: 'APPLY_AI_REBALANCE',
  TRIGGER_DAY_COMPLETE: 'TRIGGER_DAY_COMPLETE',
  DISMISS_DAY_COMPLETE: 'DISMISS_DAY_COMPLETE',
  OPEN_VOICE_COACH: 'OPEN_VOICE_COACH',
  CLOSE_VOICE_COACH: 'CLOSE_VOICE_COACH',
  SET_ORB_STATE: 'SET_ORB_STATE',
  TOGGLE_ORB_VISIBLE: 'TOGGLE_ORB_VISIBLE',
  ADD_MEMORY_ITEM: 'ADD_MEMORY_ITEM',
  DELETE_MEMORY_ITEM: 'DELETE_MEMORY_ITEM',
  UPDATE_VOICE_SETTINGS: 'UPDATE_VOICE_SETTINGS',
  SET_FOCUS_CONTROL: 'SET_FOCUS_CONTROL',
  CLEAR_FOCUS_CONTROL: 'CLEAR_FOCUS_CONTROL',
  // Growth, Economy & Retention Actions
  REDEEM_REWARD: 'REDEEM_REWARD',
  UPGRADE_TIER: 'UPGRADE_TIER',
  APPLY_RECOVERY_PLAN: 'APPLY_RECOVERY_PLAN',
  DISMISS_RECOVERY: 'DISMISS_RECOVERY',
  UPDATE_SQUAD: 'UPDATE_SQUAD',
  CLAIM_REFERRAL: 'CLAIM_REFERRAL',
  USE_STREAK_SHIELD: 'USE_STREAK_SHIELD',
  OPEN_REWARDS_MODAL: 'OPEN_REWARDS_MODAL',
  CLOSE_REWARDS_MODAL: 'CLOSE_REWARDS_MODAL',
  OPEN_SUBSCRIPTION_MODAL: 'OPEN_SUBSCRIPTION_MODAL',
  CLOSE_SUBSCRIPTION_MODAL: 'CLOSE_SUBSCRIPTION_MODAL',
  OPEN_SHARE_MODAL: 'OPEN_SHARE_MODAL',
  CLOSE_SHARE_MODAL: 'CLOSE_SHARE_MODAL',
  OPEN_SQUAD_MODAL: 'OPEN_SQUAD_MODAL',
  CLOSE_SQUAD_MODAL: 'CLOSE_SQUAD_MODAL',
  OPEN_RECAP_MODAL: 'OPEN_RECAP_MODAL',
  CLOSE_RECAP_MODAL: 'CLOSE_RECAP_MODAL',
};

// ==========================================
// CENTRAL INTELLIGENCE EXECUTION PIPELINE
// ==========================================
function completeTaskExecution(state, taskId, isCompleting = true) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return state;

  const is2xBoosted = Boolean(
    state.activePerks?.xpMultiplierUntil &&
    new Date(state.activePerks.xpMultiplierUntil).getTime() > Date.now()
  );
  const rawXpDelta = task.xp || 100;
  const xpDelta = isCompleting && is2xBoosted ? rawXpDelta * 2 : rawXpDelta;
  const newXP = isCompleting 
    ? (state.user.xp || 0) + xpDelta 
    : Math.max(0, (state.user.xp || 0) - xpDelta);

  if (isCompleting) {
    analytics.track(AnalyticsEvents.FIRST_TASK_COMPLETED, { taskId, xpEarned: xpDelta, title: task.title });
    analytics.track(AnalyticsEvents.XP_EARNED, { amount: xpDelta, reason: task.title });
  }

  const momentumDelta = isCompleting ? 4 : -2;
  const newMomentum = Math.min(99, Math.max(40, (state.user.momentum || 84) + momentumDelta));

  // 1. Update tasks
  const updatedTasks = state.tasks.map(t =>
    t.id === taskId
      ? { 
          ...t, 
          status: isCompleting ? 'completed' : 'pending', 
          completedAt: isCompleting ? new Date().toISOString() : null 
        }
      : t
  );

  // 2. Update timeline
  let newTimeline = state.timeline;
  if (isCompleting) {
    newTimeline = [
      { id: generateId(), date: 'Today', title: `Executed: ${task.title}`, xp: xpDelta, type: 'task' },
      ...state.timeline
    ];
  }

  // 3. Update connected Quest if any
  let updatedGoals = state.goals;
  let questImpactMessage = null;
  if (task.goalId) {
    updatedGoals = state.goals.map(g => {
      if (g.id !== task.goalId) return g;
      const currentProg = g.progress ?? g.currentProgress ?? 0;
      const deltaProg = isCompleting ? 12 : -12;
      const newProg = Math.min(g.target || 100, Math.max(0, currentProg + deltaProg));
      
      // Update milestones if present
      let updatedMilestones = g.milestones;
      if (g.milestones && g.milestones.length > 0 && isCompleting) {
        const firstIncompleteIdx = g.milestones.findIndex(m => !m.completed);
        if (firstIncompleteIdx >= 0) {
          updatedMilestones = g.milestones.map((m, idx) => {
            if (idx === firstIncompleteIdx) {
              return { ...m, completed: true, current: false };
            }
            if (idx === firstIncompleteIdx + 1) {
              return { ...m, current: true };
            }
            return m;
          });
        }
      }

      const isCompleted = newProg >= (g.target || 100);
      questImpactMessage = `"${g.title}" +12%`;
      return {
        ...g,
        progress: newProg,
        currentProgress: newProg,
        milestones: updatedMilestones,
        status: isCompleted ? 'completed' : g.status || 'active',
      };
    });
  }

  // 4. Update Today's progress record in state.progress
  const todayStr = getToday();
  const todayTasks = updatedTasks.filter(t => 
    t.date === 'today' || t.scheduledDate === todayStr || (!t.date && !t.scheduledDate)
  );
  const plannedCount = todayTasks.length;
  const completedCount = todayTasks.filter(t => t.status === 'completed').length;
  const completionRate = plannedCount > 0 ? Number((completedCount / plannedCount).toFixed(2)) : 1;
  const totalCapMinutes = Math.round((state.capacity?.dailyCapacity || 3.3) * 60);
  const usedMinutes = todayTasks.reduce((s, t) => s + (t.estimatedMinutes || t.duration || 30), 0);
  const capacityRespected = usedMinutes <= totalCapMinutes;

  const existingProgIdx = state.progress.findIndex(p => p.date === todayStr);
  let updatedProgress = [...state.progress];
  const todayProgData = {
    date: todayStr,
    userId: state.user.id,
    tasksPlanned: plannedCount,
    tasksCompleted: completedCount,
    completionRate,
    capacityRespected,
    xpEarned: ((existingProgIdx >= 0 ? state.progress[existingProgIdx].xpEarned : 0) || 0) + (isCompleting ? xpDelta : -xpDelta),
    focusMinutes: (existingProgIdx >= 0 ? state.progress[existingProgIdx].focusMinutes : 60) || 60
  };

  if (existingProgIdx >= 0) {
    updatedProgress[existingProgIdx] = { ...updatedProgress[existingProgIdx], ...todayProgData };
  } else {
    updatedProgress.push(todayProgData);
  }

  // 5. Evaluate achievements
  let updatedAchievements = [...(state.achievements || [])];
  let newUnlockedAchievement = null;
  if (!updatedAchievements.includes('first_mission') && isCompleting) {
    updatedAchievements.push('first_mission');
    newUnlockedAchievement = ACHIEVEMENTS.find(a => a.id === 'first_mission')?.title || 'First Mission Complete';
  }
  if (!updatedAchievements.includes('finisher') && isCompleting && completedCount >= plannedCount && plannedCount >= 2) {
    updatedAchievements.push('finisher');
    newUnlockedAchievement = ACHIEVEMENTS.find(a => a.id === 'finisher')?.title || 'Finisher Unlocked';
  }
  if (!updatedAchievements.includes('momentum_beast') && newMomentum >= 90) {
    updatedAchievements.push('momentum_beast');
    newUnlockedAchievement = 'Momentum Beast (90+)';
  }

  // 6. Streak calculation
  let newStreak = state.user.streak || 0;
  if (isCompleting && completedCount >= 1 && newStreak === 0) {
    newStreak = 1;
  }

  const levelInfo = getLevelFromXP(newXP);
  const levelUp = levelInfo.level > (state.user.level || 1);

  // 7. Day Complete Trigger if all tasks are executed
  const allMissionsDone = isCompleting && plannedCount > 0 && completedCount === plannedCount;

  const updatedLedger = isCompleting ? [
    {
      id: generateId('xpl_'),
      timestamp: new Date().toISOString(),
      type: 'EARNED',
      amount: xpDelta,
      reason: `Executed: ${task.title}${is2xBoosted ? ' (2x Boost Active)' : ''}`,
      balanceAfter: newXP
    },
    ...(state.xpLedger || [])
  ] : (state.xpLedger || []);

  return {
    ...state,
    tasks: updatedTasks,
    goals: updatedGoals,
    timeline: newTimeline,
    progress: updatedProgress,
    achievements: updatedAchievements,
    xpLedger: updatedLedger,
    dayCompleteModal: allMissionsDone ? true : state.dayCompleteModal,
    user: {
      ...state.user,
      xp: newXP,
      momentum: newMomentum,
      level: levelInfo.level,
      streak: newStreak
    },
    toast: isCompleting ? {
      title: newUnlockedAchievement ? 'Achievement Unlocked!' : levelUp ? 'Level Up!' : 'Mission Done',
      message: newUnlockedAchievement 
        ? `${newUnlockedAchievement} · +${xpDelta} XP`
        : levelUp
        ? `Reached Level ${levelInfo.level} · ${levelInfo.title}`
        : `+${xpDelta} XP · Momentum ${newMomentum}${questImpactMessage ? ` · ${questImpactMessage}` : ''}`,
      type: newUnlockedAchievement ? 'achievement' : 'xp'
    } : state.toast
  };
}

// ==========================================
// REDUCER
// ==========================================
function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_THEME:
      storage.set('theme', action.payload);
      return { ...state, theme: action.payload };

    case ACTIONS.SET_USER:
      return { ...state, user: { ...state.user, ...action.payload } };

    case ACTIONS.UPDATE_USER:
      return { ...state, user: { ...state.user, ...action.payload } };

    case ACTIONS.SET_CAPACITY: {
      const cap = { ...state.capacity, ...action.payload };
      cap.dailyCapacity = calculateDailyCapacity(cap);
      return { ...state, capacity: cap };
    }

    case ACTIONS.ADD_GOAL:
      return { ...state, goals: [...state.goals, { id: generateId(), createdAt: new Date().toISOString(), ...action.payload }] };

    case 'CREATE_GOAL_WITH_PLAN': {
      const { goal, firstTask } = action.payload;
      const updatedGoals = [...state.goals, goal];
      let updatedTasks = state.tasks;
      if (firstTask) {
        updatedTasks = [...state.tasks, firstTask];
      }
      storage.set('goals', updatedGoals);
      storage.set('tasks', updatedTasks);
      return {
        ...state,
        goals: updatedGoals,
        tasks: updatedTasks
      };
    }

    case 'UPDATE_GOAL_ADAPTIVE_PROGRESS': {
      const { goalId, progressData } = action.payload;
      const updatedGoals = state.goals.map(g => {
        if (g.id !== goalId) return g;
        return { ...g, ...progressData };
      });
      storage.set('goals', updatedGoals);
      return {
        ...state,
        goals: updatedGoals
      };
    }

    case 'ADD_CALENDAR_EVENT': {
      const newEvent = { id: generateId(), ...action.payload };
      const updatedCalendar = [...(state.calendar || []), newEvent];
      storage.set('calendar', updatedCalendar);
      return {
        ...state,
        calendar: updatedCalendar
      };
    }

    case 'UPDATE_LISTING_DRAFT': {
      storage.set('activeListingDraft', action.payload);
      return {
        ...state,
        activeListingDraft: action.payload
      };
    }

    case 'CREATE_LISTING_SUCCESS': {
      const updatedListings = [action.payload, ...(state.listings || [])];
      storage.set('listings', updatedListings);
      storage.set('activeListingDraft', null);
      return {
        ...state,
        listings: updatedListings,
        activeListingDraft: null,
        toast: {
          title: 'Listing Published',
          message: `${action.payload.title} · ₦${action.payload.price?.toLocaleString()}`,
          type: 'achievement'
        }
      };
    }

    case 'CANCEL_LISTING_DRAFT': {
      storage.set('activeListingDraft', null);
      return {
        ...state,
        activeListingDraft: null
      };
    }

    case ACTIONS.UPDATE_GOAL:
      return {
        ...state,
        goals: state.goals.map(g => g.id === action.payload.id ? { ...g, ...action.payload } : g),
      };

    case ACTIONS.DELETE_GOAL:
      return {
        ...state,
        goals: state.goals.filter(g => g.id !== action.payload),
        tasks: state.tasks.filter(t => t.goalId !== action.payload),
      };

    case ACTIONS.ADD_TASK: {
      const estimatedMinutes = Number(action.payload.estimatedMinutes) || Number(action.payload.duration) || 30;
      const scheduledDate = action.payload.scheduledDate || (action.payload.date === 'today' ? getToday() : action.payload.date) || getToday();
      return {
        ...state,
        tasks: [...state.tasks, {
          id: action.payload.id || generateId(),
          status: 'pending',
          locked: false,
          completedAt: null,
          createdAt: new Date().toISOString(),
          ...action.payload,
          estimatedMinutes,
          duration: estimatedMinutes,
          scheduledDate,
          date: 'today',
          xp: action.payload.xp || calculateTaskXP(action.payload.difficulty || 'medium', action.payload.importance || 'medium'),
        }],
      };
    }

    case ACTIONS.UPDATE_TASK:
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t),
      };

    case ACTIONS.DELETE_TASK:
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };

    case 'TOGGLE_TASK': {
      const task = state.tasks.find(t => t.id === action.payload);
      if (!task) return state;
      const isCompleting = task.status !== 'completed';
      return completeTaskExecution(state, action.payload, isCompleting);
    }

    case ACTIONS.COMPLETE_TASK: {
      return completeTaskExecution(state, action.payload, true);
    }

    case 'COMPLETE_MILESTONE': {
      const { goalId, milestoneId } = action.payload;
      const goal = state.goals.find(g => g.id === goalId);
      if (!goal) return state;

      const milestone = (goal.milestones || []).find(m => m.id === milestoneId);
      if (!milestone || milestone.completed) return state;

      const milestoneXP = milestone.xp || 250;
      const newXP = (state.user.xp || 0) + milestoneXP;
      const newMomentum = Math.min(99, (state.user.momentum || 84) + 5);

      const updatedGoals = state.goals.map(g => {
        if (g.id !== goalId) return g;
        const currentProg = g.progress ?? g.currentProgress ?? 0;
        const newProg = Math.min(g.target || 100, currentProg + 25);
        const updatedMilestones = (g.milestones || []).map((m) => {
          if (m.id === milestoneId) {
            return { ...m, completed: true, current: false };
          }
          return m;
        });
        const nextIncomplete = updatedMilestones.findIndex(m => !m.completed);
        if (nextIncomplete >= 0) {
          updatedMilestones[nextIncomplete].current = true;
        }
        const isCompleted = newProg >= (g.target || 100);
        return {
          ...g,
          progress: newProg,
          currentProgress: newProg,
          milestones: updatedMilestones,
          status: isCompleted ? 'completed' : g.status || 'active'
        };
      });

      return {
        ...state,
        goals: updatedGoals,
        user: {
          ...state.user,
          xp: newXP,
          momentum: newMomentum,
          level: getLevelFromXP(newXP).level
        },
        timeline: [
          { id: generateId(), date: 'Today', title: `Milestone Achieved: ${milestone.title}`, xp: milestoneXP, type: 'achievement' },
          ...state.timeline
        ],
        toast: {
          title: 'Milestone Achieved!',
          message: `"${milestone.title}" · +${milestoneXP} XP`,
          type: 'achievement'
        }
      };
    }

    case 'UPDATE_GOAL_PROGRESS': {
      return {
        ...state,
        goals: state.goals.map(g => {
          if (g.id !== action.payload.id) return g;
          const newProgress = Number(action.payload.progress);
          const isDone = newProgress >= (g.target || 0);
          return {
            ...g,
            progress: newProgress,
            currentProgress: newProgress,
            status: isDone ? 'completed' : g.status || 'active',
          };
        }),
      };
    }

    case ACTIONS.ADD_FOCUS_SESSION:
      return {
        ...state,
        focusSessions: [...state.focusSessions, {
          id: generateId(),
          ...action.payload,
        }],
      };

    case ACTIONS.SET_ACTIVE_FOCUS:
      return { ...state, activeFocus: action.payload };

    case ACTIONS.END_FOCUS:
      return { ...state, activeFocus: null };

    case ACTIONS.UPDATE_PROGRESS: {
      const today = getToday();
      const existing = state.progress.findIndex(p => p.date === today);
      if (existing >= 0) {
        const updated = [...state.progress];
        updated[existing] = { ...updated[existing], ...action.payload };
        return { ...state, progress: updated };
      }
      return {
        ...state,
        progress: [...state.progress, { date: today, userId: state.user.id, ...action.payload }],
      };
    }

    case ACTIONS.UNLOCK_ACHIEVEMENT:
      if (state.achievements.includes(action.payload)) return state;
      return {
        ...state,
        achievements: [...state.achievements, action.payload],
        toast: {
          title: 'Achievement Unlocked',
          message: action.payload,
          type: 'achievement',
        },
      };

    case ACTIONS.SHOW_TOAST:
      return { ...state, toast: action.payload };

    case ACTIONS.HIDE_TOAST:
      return { ...state, toast: null };

    case ACTIONS.APPLY_AI_REBALANCE: {
      const totalCapacityMinutes = Math.round((state.capacity.dailyCapacity || 3.3) * 60);
      const rebalanceResult = rebalanceDailyPlan(state.tasks, totalCapacityMinutes);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const updatedTasks = state.tasks.map(t => {
        const shouldMove = rebalanceResult.moveTomorrow.some(m => m.id === t.id);
        if (shouldMove) {
          return { ...t, scheduledDate: tomorrowStr, date: tomorrowStr };
        }
        return t;
      });

      return {
        ...state,
        tasks: updatedTasks,
        toast: {
          title: 'Plan Rebalanced',
          message: `Kaelo moved ${rebalanceResult.moveTomorrow.length} mission(s) to tomorrow. Capacity restored.`,
          type: 'info'
        }
      };
    }

    case ACTIONS.SEND_AI_MESSAGE: {
      const userText = action.payload.text;
      const userMsg = {
        id: generateId(),
        sender: 'user',
        text: userText,
        timestamp: new Date().toISOString()
      };

      // Run Kaelo AI Intelligence Core → Preprocessing + Action Engine
      const commandResult = executeBrainEnhancedCommand(userText, state, state.conversationalContext || {});

      // Apply actual state mutations if an action is triggered
      let intermediateState = state;
      if (commandResult.actionToExecute) {
        const { type } = commandResult.actionToExecute;
        if (type && type.startsWith('FOCUS_')) {
          intermediateState = {
            ...intermediateState,
            focusControl: { action: type.replace('FOCUS_', ''), timestamp: Date.now() }
          };
        } else {
          intermediateState = appReducer(intermediateState, commandResult.actionToExecute);
        }
      }

      const aiMsg = {
        id: generateId(),
        sender: 'kaelo',
        text: commandResult.aiResponseText,
        spokenText: commandResult.spokenText || commandResult.aiResponseText,
        actions: commandResult.aiActions || [],
        timestamp: new Date().toISOString()
      };

      const updatedChat = [...intermediateState.chatMessages, userMsg, aiMsg];
      storage.set('chatMessages', updatedChat);
      if (commandResult.updatedContext) {
        storage.set('conversationalContext', commandResult.updatedContext);
      }

      return {
        ...intermediateState,
        chatMessages: updatedChat,
        conversationalContext: commandResult.updatedContext || intermediateState.conversationalContext,
        orbState: 'speaking',
        toast: commandResult.toast || intermediateState.toast
      };
    }

    case ACTIONS.SET_FOCUS_CONTROL:
      return { ...state, focusControl: action.payload };

    case ACTIONS.CLEAR_FOCUS_CONTROL:
      return { ...state, focusControl: null };

    case ACTIONS.CLEAR_CHAT: {
      const resetMessages = [
        {
          id: generateId(),
          sender: 'kaelo',
          text: `Chat reset. I'm keeping watch over your ${(state.capacity?.dailyCapacity || 3.3).toFixed(1)}h capacity. How can I assist your execution right now?`,
          actions: ['WHAT_NEXT', 'REBALANCE'],
          timestamp: new Date().toISOString()
        }
      ];
      storage.set('chatMessages', resetMessages);
      return {
        ...state,
        chatMessages: resetMessages
      };
    }

    case ACTIONS.OPEN_VOICE_COACH:
      return { ...state, voiceActive: true, orbState: 'listening' };

    case ACTIONS.CLOSE_VOICE_COACH:
      return { ...state, voiceActive: false, orbState: 'idle' };

    case ACTIONS.SET_ORB_STATE:
      return { ...state, orbState: action.payload };

    case ACTIONS.TOGGLE_ORB_VISIBLE: {
      const nextVisible = !state.orbVisible;
      storage.set('orbVisible', nextVisible);
      return { ...state, orbVisible: nextVisible };
    }

    case ACTIONS.ADD_MEMORY_ITEM: {
      const newMemory = [
        ...state.memory,
        {
          id: generateId(),
          title: action.payload.title,
          detail: action.payload.detail,
          category: action.payload.category || 'personal',
          dateAdded: 'User added'
        }
      ];
      storage.set('memory', newMemory);
      return {
        ...state,
        memory: newMemory,
        toast: {
          title: 'Memory Stored',
          message: `Kaelo will remember: "${action.payload.title}"`,
          type: 'info'
        }
      };
    }

    case ACTIONS.DELETE_MEMORY_ITEM: {
      const filtered = state.memory.filter(m => m.id !== action.payload);
      storage.set('memory', filtered);
      return {
        ...state,
        memory: filtered,
        toast: {
          title: 'Memory Cleared',
          message: 'Kaelo removed this context from your profile.',
          type: 'info'
        }
      };
    }

    case ACTIONS.UPDATE_VOICE_SETTINGS: {
      const nextSettings = { ...state.voiceSettings, ...action.payload };
      storage.set('voiceSettings', nextSettings);
      return { ...state, voiceSettings: nextSettings };
    }

    case ACTIONS.REDEEM_REWARD: {
      const item = action.payload;
      const currentXP = state.user?.xp || 0;
      if (currentXP < item.cost) {
        return {
          ...state,
          toast: {
            title: 'Not Enough XP',
            message: `You need ${item.cost} XP to redeem ${item.title}. Keep executing!`,
            type: 'warning'
          }
        };
      }
      const newXP = currentXP - item.cost;
      let updatedPerks = { ...(state.activePerks || {}) };
      if (item.id === 'pro_pass_1d') {
        updatedPerks.proUntil = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      } else if (item.id === 'streak_shield') {
        updatedPerks.streakShields = (updatedPerks.streakShields || 0) + 1;
      } else if (item.id === 'ai_rebalance_token') {
        updatedPerks.rebalanceTokens = (updatedPerks.rebalanceTokens || 0) + 1;
      } else if (item.id === 'focus_multiplier_24h') {
        updatedPerks.xpMultiplierUntil = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      } else if (item.id === 'weekend_capacity_unlock') {
        updatedPerks.hasWeekendProfile = true;
      }

      const ledgerEntry = {
        id: generateId('xpl_'),
        timestamp: new Date().toISOString(),
        type: 'REDEEMED',
        amount: item.cost,
        reason: `Redeemed: ${item.title}`,
        balanceAfter: newXP
      };

      const updatedLedger = [ledgerEntry, ...(state.xpLedger || [])];
      storage.set('xpLedger', updatedLedger);
      storage.set('activePerks', updatedPerks);
      analytics.track(AnalyticsEvents.XP_REDEEMED, { itemId: item.id, cost: item.cost });

      return {
        ...state,
        user: { ...state.user, xp: newXP },
        activePerks: updatedPerks,
        xpLedger: updatedLedger,
        toast: {
          title: 'Perk Activated!',
          message: `${item.title} has been unlocked for your system.`,
          type: 'achievement'
        }
      };
    }

    case ACTIONS.UPGRADE_TIER: {
      const newTier = action.payload?.tier || 'plus';
      const updatedUser = { ...state.user, tier: newTier };
      storage.set('user', updatedUser);
      analytics.track(AnalyticsEvents.SUBSCRIPTION_UPGRADED, { tier: newTier, billing: action.payload?.billing || 'monthly' });
      return {
        ...state,
        user: updatedUser,
        isSubscriptionModalOpen: false,
        toast: {
          title: `${newTier === 'pro' ? 'Kaelo Pro' : 'Kaelo Plus'} Active`,
          message: 'Your upgraded limits and coaching intelligence are live.',
          type: 'achievement'
        }
      };
    }

    case ACTIONS.APPLY_RECOVERY_PLAN: {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const stale = state.recoveryState?.staleTasks || [];
      const updatedTasks = state.tasks.map(t => {
        const isStale = stale.some(st => st.id === t.id);
        if (isStale) {
          return { ...t, scheduledDate: tomorrowStr, date: tomorrowStr };
        }
        return t;
      });

      analytics.track(AnalyticsEvents.RECOVERY_PLAN_APPLIED, { tasksMoved: stale.length });
      return {
        ...state,
        tasks: updatedTasks,
        recoveryState: { needsRecovery: false, dismissed: true, staleTasks: [] },
        toast: {
          title: 'Plate Reset',
          message: `Cleared backlog and protected your daily capacity. 1 focus mission left.`,
          type: 'info'
        }
      };
    }

    case ACTIONS.DISMISS_RECOVERY:
      return {
        ...state,
        recoveryState: { ...state.recoveryState, dismissed: true }
      };

    case ACTIONS.CLAIM_REFERRAL: {
      const bonus = 250;
      const newXP = (state.user.xp || 0) + bonus;
      const newCount = (state.referralsCount || 0) + 1;
      const newEarned = (state.referralXPEarned || 0) + bonus;
      const ledgerEntry = {
        id: generateId('xpl_'),
        timestamp: new Date().toISOString(),
        type: 'EARNED',
        amount: bonus,
        reason: 'Referral Activation (Friend Joined)',
        balanceAfter: newXP
      };
      const updatedLedger = [ledgerEntry, ...(state.xpLedger || [])];
      storage.set('referralsCount', newCount);
      storage.set('referralXPEarned', newEarned);
      storage.set('xpLedger', updatedLedger);
      analytics.track(AnalyticsEvents.REFERRAL_CONVERTED, { bonus });
      return {
        ...state,
        user: { ...state.user, xp: newXP },
        referralsCount: newCount,
        referralXPEarned: newEarned,
        xpLedger: updatedLedger,
        toast: {
          title: '+250 XP Referral Bonus!',
          message: 'Your friend joined Kaelo and started their execution system.',
          type: 'achievement'
        }
      };
    }

    case ACTIONS.UPDATE_SQUAD: {
      const updatedSquad = { ...state.squad, ...action.payload };
      storage.set('squad', updatedSquad);
      return { ...state, squad: updatedSquad };
    }

    case ACTIONS.USE_STREAK_SHIELD: {
      if ((state.activePerks?.streakShields || 0) <= 0) return state;
      const updatedPerks = {
        ...state.activePerks,
        streakShields: Math.max(0, (state.activePerks.streakShields || 0) - 1)
      };
      storage.set('activePerks', updatedPerks);
      analytics.track(AnalyticsEvents.STREAK_SHIELD_USED);
      return {
        ...state,
        activePerks: updatedPerks,
        toast: {
          title: 'Streak Shield Used',
          message: `Your ${state.user.streak}d streak was protected.`,
          type: 'info'
        }
      };
    }

    case ACTIONS.OPEN_REWARDS_MODAL:
      return { ...state, isRewardsModalOpen: true };

    case ACTIONS.CLOSE_REWARDS_MODAL:
      return { ...state, isRewardsModalOpen: false };

    case ACTIONS.OPEN_SUBSCRIPTION_MODAL:
      analytics.track(AnalyticsEvents.SUBSCRIPTION_MODAL_VIEWED);
      return { ...state, isSubscriptionModalOpen: true };

    case ACTIONS.CLOSE_SUBSCRIPTION_MODAL:
      return { ...state, isSubscriptionModalOpen: false };

    case ACTIONS.OPEN_SHARE_MODAL:
      analytics.track(AnalyticsEvents.ACHIEVEMENT_SHARED, { data: action.payload });
      return { ...state, isShareModalOpen: true, shareModalData: action.payload };

    case ACTIONS.CLOSE_SHARE_MODAL:
      return { ...state, isShareModalOpen: false, shareModalData: null };

    case ACTIONS.OPEN_SQUAD_MODAL:
      return { ...state, isSquadModalOpen: true };

    case ACTIONS.CLOSE_SQUAD_MODAL:
      return { ...state, isSquadModalOpen: false };

    case ACTIONS.OPEN_RECAP_MODAL:
      analytics.track(AnalyticsEvents.END_OF_DAY_RECAP_VIEWED);
      return { ...state, isRecapModalOpen: true };

    case ACTIONS.CLOSE_RECAP_MODAL:
      return { ...state, isRecapModalOpen: false };

    case ACTIONS.TRIGGER_DAY_COMPLETE:
      return { ...state, dayCompleteModal: true };

    case ACTIONS.DISMISS_DAY_COMPLETE:
      return { ...state, dayCompleteModal: false };

    case ACTIONS.RESET_STATE: {
      storage.clear();
      return {
        user: { ...DEFAULT_USER, onboarded: false },
        capacity: { ...DEFAULT_CAPACITY },
        goals: [],
        tasks: [],
        timeline: [],
        chatMessages: [],
        focusSessions: [],
        progress: [],
        achievements: [],
        notifications: [],
        activeFocus: null,
        toast: null,
        dayCompleteModal: false,
      };
    }

    default:
      return state;
  }
}

// ==========================================
// CONTEXT
// ==========================================
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, null, loadState);

  // Sync to local storage
  useEffect(() => {
    storage.set('user', state.user);
    storage.set('capacity', state.capacity);
    storage.set('goals', state.goals);
    storage.set('tasks', state.tasks);
    storage.set('focusSessions', state.focusSessions);
    storage.set('progress', state.progress);
    storage.set('achievements', state.achievements);
    storage.set('timeline', state.timeline);
    storage.set('chatMessages', state.chatMessages);
    storage.set('memory', state.memory);
    storage.set('orbVisible', state.orbVisible);
    storage.set('voiceSettings', state.voiceSettings);
    storage.set('activePerks', state.activePerks);
    storage.set('xpLedger', state.xpLedger);
    storage.set('squad', state.squad);
    storage.set('referralCode', state.referralCode);
    storage.set('referralsCount', state.referralsCount);
    storage.set('referralXPEarned', state.referralXPEarned);
    storage.set('calendar', state.calendar);
    storage.set('listings', state.listings);
    storage.set('activeListingDraft', state.activeListingDraft);
  }, [
    state.user, state.capacity, state.goals, state.tasks, state.focusSessions,
    state.progress, state.achievements, state.timeline, state.chatMessages,
    state.memory, state.orbVisible, state.voiceSettings, state.activePerks,
    state.xpLedger, state.squad, state.referralCode, state.referralsCount,
    state.referralXPEarned, state.calendar, state.listings, state.activeListingDraft
  ]);

  // Sync theme attribute to document root & storage
  useEffect(() => {
    const activeTheme = state.theme || 'light';
    document.documentElement.setAttribute('data-theme', activeTheme);
    storage.set('theme', activeTheme);
  }, [state.theme]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

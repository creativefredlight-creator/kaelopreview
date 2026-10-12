// ==========================================
// KAELO STORAGE UTILITY
// ==========================================

const STORAGE_PREFIX = 'kaelo_';

export const storage = {
  get(key) {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to storage:`, e);
    }
  },

  remove(key) {
    localStorage.removeItem(STORAGE_PREFIX + key);
  },

  clear() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(STORAGE_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  },
};

// ==========================================
// KAELO CAPACITY CALCULATOR
// ==========================================

export function calculateDailyCapacity(capacity) {
  const totalHours = 24;
  const used = (capacity.sleepHours || 0) +
    (capacity.workHours || 0) +
    (capacity.schoolHours || 0) +
    (capacity.fixedCommitments || 0);
  const available = Math.max(0, totalHours - used);
  return parseFloat(available.toFixed(1));
}

export function getCapacityStatus(usedMinutes, totalMinutes) {
  const ratio = totalMinutes > 0 ? usedMinutes / totalMinutes : 0;
  if (ratio <= 0.75) return { status: 'healthy', label: 'Healthy capacity', color: 'var(--kaelo-lime)' };
  if (ratio <= 0.95) return { status: 'near', label: "You're nearly full", color: 'var(--kaelo-warning)' };
  return { status: 'over', label: 'Over capacity', color: 'var(--kaelo-danger)' };
}

// ==========================================
// KAELO XP CALCULATOR
// ==========================================

import { DIFFICULTY_XP, IMPORTANCE_MULTIPLIER, LEVELS } from '../data/constants.js';

export function calculateTaskXP(difficulty, importance) {
  const base = DIFFICULTY_XP[difficulty] || 100;
  const multiplier = IMPORTANCE_MULTIPLIER[importance] || 1;
  return Math.round(base * multiplier);
}

export function getLevelFromXP(xp) {
  let current = LEVELS[0];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      current = LEVELS[i];
      break;
    }
  }
  const nextLevel = LEVELS.find(l => l.level === current.level + 1);
  const xpForCurrent = current.xpRequired;
  const xpForNext = nextLevel ? nextLevel.xpRequired : current.xpRequired;
  const progress = nextLevel
    ? ((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100
    : 100;

  return {
    ...current,
    currentXP: xp,
    nextLevel,
    xpToNext: nextLevel ? xpForNext - xp : 0,
    progress: Math.min(100, Math.max(0, progress)),
  };
}

// ==========================================
// KAELO MOMENTUM ENGINE (0-100)
// ==========================================

export function calculateMomentum(stats = {}) {
  // Base 60. Factors: completion rate (30%), streak (25%), capacity respected (25%), focus time (20%)
  const completionRate = stats.completionRate || (stats.tasksPlanned > 0 ? (stats.tasksCompleted / stats.tasksPlanned) : 0.85);
  const streakBoost = Math.min(25, (stats.streak || 0) * 3);
  const capacityScore = stats.capacityRespected ? 25 : 15;
  const focusScore = Math.min(20, Math.round(((stats.focusMinutes || 60) / 120) * 20));
  
  const score = Math.round((completionRate * 30) + streakBoost + capacityScore + focusScore);
  return Math.min(99, Math.max(40, score || 84));
}

// ==========================================
// KAELO SCHEDULING & DATES
// ==========================================

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function getToday() {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatMinutes(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatHours(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getDaysRemaining(deadline) {
  const now = new Date();
  const end = new Date(deadline);
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function calculateGoalDaily(goalOrRemaining, daysRemaining) {
  if (typeof goalOrRemaining === 'number') {
    const days = typeof daysRemaining === 'number' ? Math.max(1, daysRemaining) : 1;
    return Math.max(0, Math.ceil((goalOrRemaining / days) * 10) / 10);
  }
  if (goalOrRemaining && typeof goalOrRemaining === 'object') {
    const current = goalOrRemaining.currentProgress ?? goalOrRemaining.progress ?? 0;
    const remaining = (goalOrRemaining.target || 0) - current;
    const daysLeft = getDaysRemaining(goalOrRemaining.deadline);
    if (daysLeft <= 0) return Math.max(0, remaining);
    return Math.max(0, Math.ceil((remaining / daysLeft) * 10) / 10);
  }
  return 0;
}

export function redistributeMissedWork(goal, missedAmount) {
  const updatedGoal = { ...goal };
  const current = updatedGoal.currentProgress ?? updatedGoal.progress ?? 0;
  const remaining = (updatedGoal.target || 0) - current;
  const daysLeft = getDaysRemaining(updatedGoal.deadline);

  if (daysLeft <= 0) {
    return { goal: updatedGoal, feasible: false, newDaily: remaining };
  }

  const newDaily = Math.ceil((remaining / daysLeft) * 10) / 10;
  return {
    goal: updatedGoal,
    feasible: true,
    newDaily,
  };
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

export function formatISODate(date) {
  if (!date) return getToday();
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return date;
  }
  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return getToday();
}

export function getWeekDates(baseDate = new Date()) {
  const target = baseDate instanceof Date ? new Date(baseDate) : new Date();
  const day = target.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(target);
  monday.setDate(target.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    d.setHours(0, 0, 0, 0);
    dates.push(d);
  }
  return dates;
}

// ==========================================
// KAELO AI DECISION & EXPLANATION ENGINE
// ==========================================

export function getRecommendedNextAction(tasks = [], availableMinutes = 210, goals = []) {
  const pending = tasks.filter(t => t.status !== 'completed');
  if (pending.length === 0) {
    return {
      task: null,
      message: "You're completely clear. All planned priorities for today are executed.",
      actionLabel: "Plan Tomorrow",
      reason: "Zero active blockers remaining today."
    };
  }

  // Weight formula: Urgency × Importance × Goal impact
  const scored = pending.map(t => {
    let score = 10;
    if (t.importance === 'critical') score += 40;
    else if (t.importance === 'high') score += 25;
    else if (t.importance === 'medium') score += 10;

    if (t.difficulty === 'hard') score += 15;
    
    // Connected to urgent goal?
    if (t.goalId) {
      const goal = goals.find(g => g.id === t.goalId);
      if (goal) {
        const days = getDaysRemaining(goal.deadline);
        if (days <= 5) score += 30;
        else if (days <= 14) score += 15;
      }
    }

    return { task: t, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0].task;
  const duration = best.estimatedMinutes || best.duration || 45;

  return {
    task: best,
    message: `Spend the next ${duration} minutes executing: ${best.title}`,
    actionLabel: "START FOCUS",
    reason: `Highest impact action right now. Protects your key deadline and yields +${best.xp || 100} XP.`
  };
}

export function explainTaskPriority(task, goals = []) {
  if (!task) return "Selected based on available capacity and daily schedule.";
  const goal = goals.find(g => g.id === task.goalId);
  const goalName = goal ? `for "${goal.title}"` : '';
  const days = goal ? getDaysRemaining(goal.deadline) : null;

  if (task.importance === 'critical' || task.importance === 'high') {
    if (days !== null && days <= 7) {
      return `Prioritized because its deadline is in ${days} days ${goalName} and missing today puts your completion target behind.`;
    }
    return `High impact priority that moves your primary daily objective forward.`;
  }
  return `Calibrated to fit smoothly into your remaining capacity without causing cognitive overload.`;
}

export function rebalanceDailyPlan(tasks = [], totalCapacityMinutes = 210) {
  const sorted = [...tasks].sort((a, b) => {
    const imp = { critical: 4, high: 3, medium: 2, low: 1 };
    const aScore = (imp[a.importance] || 2) * 10 - (a.estimatedMinutes || 30);
    const bScore = (imp[b.importance] || 2) * 10 - (b.estimatedMinutes || 30);
    return bScore - aScore;
  });

  let runningTime = 0;
  const keep = [];
  const moveTomorrow = [];

  sorted.forEach(t => {
    const mins = t.estimatedMinutes || t.duration || 30;
    if (t.status === 'completed' || runningTime + mins <= totalCapacityMinutes) {
      keep.push(t);
      runningTime += mins;
    } else {
      moveTomorrow.push(t);
    }
  });

  return {
    keep,
    moveTomorrow,
    freedMinutes: moveTomorrow.reduce((s, t) => s + (t.estimatedMinutes || t.duration || 30), 0),
    newUsedMinutes: runningTime,
  };
}

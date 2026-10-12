// ==========================================
// KAELO CONSTANTS — GEN-Z AI EXECUTION SYSTEM
// ==========================================

export const LEVELS = [
  { level: 1, title: 'Starter', xpRequired: 0, description: "Showing up is where every serious ambition begins." },
  { level: 2, title: 'Getting Serious', xpRequired: 500, description: "You stopped negotiating with excuses. Momentum is taking shape." },
  { level: 3, title: 'Consistent Executor', xpRequired: 1500, description: "Consistency is your default. Daily execution is becoming automatic." },
  { level: 4, title: 'Focused Builder', xpRequired: 3000, description: "You're becoming someone who finishes what they start." },
  { level: 5, title: 'Momentum Builder', xpRequired: 5000, description: "Your energy and capacity are locked in. Big goals are moving daily." },
  { level: 6, title: 'Execution Machine', xpRequired: 8000, description: "Distractions have zero leverage on your priorities." },
  { level: 7, title: 'System Architect', xpRequired: 12000, description: "You operate a personal execution engine with zero friction." },
  { level: 8, title: 'Relentless', xpRequired: 18000, description: "You execute what you plan. Without exceptions." },
];

export const CATEGORIES = [
  { id: 'academic', label: 'Academic', sticker: 'academic', color: '#4F8CF7' },
  { id: 'business', label: 'Business', sticker: 'business', color: '#F7A34F' },
  { id: 'career', label: 'Career', sticker: 'career', color: '#FF5E5E' },
  { id: 'freelancing', label: 'Freelancing', sticker: 'freelancing', color: '#34D399' },
  { id: 'skills', label: 'Skills', sticker: 'skills', color: '#A982FF' },
  { id: 'personal', label: 'Personal', sticker: 'personal', color: '#FBBF24' },
  { id: 'health', label: 'Health', sticker: 'health', color: '#FF7AC6' },
  { id: 'creative', label: 'Creative work', sticker: 'creative', color: '#60A5FA' },
];

export const DIFFICULTY_XP = {
  easy: 50,
  medium: 100,
  hard: 150,
};

export const IMPORTANCE_MULTIPLIER = {
  low: 1,
  medium: 1.2,
  high: 1.5,
  critical: 2,
};

export const EXECUTION_BLOCKERS = [
  { id: 'overload', label: 'Too many things at once', sticker: 'overload' },
  { id: 'procrastination', label: 'Procrastination', sticker: 'procrastination' },
  { id: 'distractions', label: 'Distractions & social media', sticker: 'distractions' },
  { id: 'planning', label: 'Overthinking & poor planning', sticker: 'planning' },
  { id: 'inconsistency', label: 'Inconsistency across weeks', sticker: 'inconsistency' },
  { id: 'priority', label: "I don't know what to do next", sticker: 'priority' },
];

export const ACHIEVEMENTS = [
  { id: 'first_mission', title: 'First Mission', description: 'Executed your first scheduled priority.', sticker: 'academic', condition: (s) => s.totalTasksCompleted >= 1 },
  { id: 'finisher', title: 'Finisher', description: 'Completed every planned priority in one day.', sticker: 'career', condition: (s) => s.perfectDays >= 1 },
  { id: 'week_warrior', title: 'Week Warrior', description: 'Maintained a 7-day execution streak.', sticker: 'streak', condition: (s) => s.streak >= 7 },
  { id: 'locked_in', title: 'Locked In', description: 'Completed 5 focused deep work sessions.', sticker: 'locked_in', condition: (s) => s.totalFocusSessions >= 5 },
  { id: 'capacity_master', title: 'Capacity Master', description: 'Stayed strictly within realistic capacity for 7 days.', sticker: 'personal', condition: (s) => s.daysWithinCapacity >= 7 },
  { id: 'momentum_beast', title: 'Momentum Beast', description: 'Surpassed 85 Momentum.', sticker: 'lightning', condition: (s) => (s.momentum || 0) >= 85 },
  { id: 'quest_complete', title: 'Quest Crusher', description: 'Completed all milestones for an ambitious quest.', sticker: 'trophy', condition: (s) => s.goalsCompleted >= 1 },
  { id: 'comeback', title: 'Comeback', description: 'Reset your plan after an off day and showed up.', sticker: 'freelancing', condition: (s) => (s.streak || 0) >= 2 },
  { id: 'deep_flow', title: 'Deep Flow', description: 'Accumulated over 120 minutes of focus time.', sticker: 'health', condition: (s) => s.totalFocusMinutes >= 120 },
];

export const QUICK_AI_ACTIONS = [
  { id: 'next', label: "What should I do next?", prompt: "What should I do right now based on my current capacity and priorities?" },
  { id: 'overwhelmed', label: "I'm overwhelmed", prompt: "I have too much going on today. Can you protect my capacity and rebalance my plan?" },
  { id: 'fix_schedule', label: "Fix my schedule", prompt: "Analyze my planned missions against my realistic capacity and adjust anything over limit." },
  { id: 'breakdown', label: "Break down a goal", prompt: "Help me turn a big ambition into realistic milestones that fit into my days." },
  { id: 'plan_day', label: "Plan my day", prompt: "Look at my active quests and draft my top 3 missions for today." },
  { id: 'review_week', label: "Review my week", prompt: "Give me an honest review of my execution patterns and capacity adherence this week." },
  { id: 'perks', label: "Check my XP perks", prompt: "What active perks, streak shields, and XP benefits do I currently have?" },
  { id: 'squad', label: "Squad check-in", prompt: "How is my accountability squad performing today?" }
];

export const DEFAULT_USER = {
  id: 'user_1',
  name: 'Fred',
  email: 'fred@kaelo.app',
  avatar: null,
  identity: "I'm becoming someone who finishes what they start.",
  identityTitle: 'Focused Builder',
  level: 4,
  xp: 2480,
  momentum: 84,
  streak: 8,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  createdAt: new Date().toISOString(),
  onboarded: true,
  tier: 'free',
  coachingTone: 'direct',
};

export const DEFAULT_CAPACITY = {
  sleepHours: 7,
  workHours: 8,
  schoolHours: 3.5,
  fixedCommitments: 2,
  dailyCapacity: 3.5,
};

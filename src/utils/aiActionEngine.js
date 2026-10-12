// ==========================================
// KAELO AI NATURAL LANGUAGE & ACTION ENGINE
// ==========================================
// Interprets natural voice & text commands and executes actions
// across the shared Kaelo application state with capacity awareness.

import { 
  getToday, 
  generateId, 
  calculateTaskXP, 
  rebalanceDailyPlan, 
  getRecommendedNextAction,
  getDaysRemaining
} from './helpers.js';
import { GoalReasoningEngine, detectGoalIntent } from '../core/intelligence/goalReasoningEngine.js';
import { ScheduleEngine } from '../core/intelligence/scheduleEngine.js';
import { IntentClassifier } from '../core/intelligence/intentClassifier.js';
import { ListingEngine } from '../core/intelligence/listingEngine.js';

// Helper: Format Date to YYYY-MM-DD
function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Calculate next day of week (0 = Sunday, 1 = Monday, etc.)
function getNextDayOfWeek(targetDayIndex, offsetWeeks = 0) {
  const now = new Date();
  const currentDay = now.getDay();
  let daysUntil = (targetDayIndex - currentDay + 7) % 7;
  if (daysUntil === 0) daysUntil = 7; // default to next week's day if today
  daysUntil += offsetWeeks * 7;
  
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysUntil);
  return targetDate;
}

// ----------------------------------------------------------
// 1. Natural Relative Date Parser
// ----------------------------------------------------------
export function parseRelativeDate(text) {
  if (!text) return { dateStr: getToday(), label: 'today' };
  const lower = text.toLowerCase();

  const now = new Date();

  if (lower.includes('tomorrow') || lower.includes('tmrw')) {
    const tmrw = new Date(now);
    tmrw.setDate(now.getDate() + 1);
    return { dateStr: formatDate(tmrw), label: 'tomorrow' };
  }

  if (lower.includes('in 2 days') || lower.includes('in two days')) {
    const d = new Date(now);
    d.setDate(now.getDate() + 2);
    return { dateStr: formatDate(d), label: 'in 2 days' };
  }

  if (lower.includes('in 3 days') || lower.includes('in three days')) {
    const d = new Date(now);
    d.setDate(now.getDate() + 3);
    return { dateStr: formatDate(d), label: 'in 3 days' };
  }

  if (lower.includes('next week')) {
    const d = new Date(now);
    d.setDate(now.getDate() + 7);
    return { dateStr: formatDate(d), label: 'next week' };
  }

  const daysMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  for (const [dayName, dayIndex] of Object.entries(daysMap)) {
    if (lower.includes(`next ${dayName}`)) {
      const d = getNextDayOfWeek(dayIndex, 1);
      return { dateStr: formatDate(d), label: `next ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}` };
    }
    if (lower.includes(dayName)) {
      const d = getNextDayOfWeek(dayIndex, 0);
      return { dateStr: formatDate(d), label: dayName.charAt(0).toUpperCase() + dayName.slice(1) };
    }
  }

  if (lower.includes('weekend')) {
    const d = getNextDayOfWeek(6, 0); // Saturday
    return { dateStr: formatDate(d), label: 'this weekend' };
  }

  return { dateStr: getToday(), label: 'today' };
}

// ----------------------------------------------------------
// 2. Natural Duration Parser (returns minutes)
// ----------------------------------------------------------
export function parseDuration(text) {
  if (!text) return 30;
  const lower = text.toLowerCase();

  // "2.5 hours" / "1.5 hours"
  const decHoursMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:hours|hour|hrs|hr)/);
  if (decHoursMatch) {
    return Math.round(parseFloat(decHoursMatch[1]) * 60);
  }

  if (lower.includes('half an hour') || lower.includes('half hour')) return 30;
  if (lower.includes('an hour and a half') || lower.includes('one and a half hours')) return 90;
  if (lower.includes('one hour') || lower.includes('an hour') || lower.includes('1 hour')) return 60;
  if (lower.includes('two hours') || lower.includes('2 hours')) return 120;
  if (lower.includes('three hours') || lower.includes('3 hours')) return 180;
  if (lower.includes('four hours') || lower.includes('4 hours')) return 240;

  const minsMatch = lower.match(/(\d+)\s*(?:minutes|minute|mins|min)/);
  if (minsMatch) {
    return parseInt(minsMatch[1], 10);
  }

  return 30; // sensible default
}

// ----------------------------------------------------------
// 3. Time of Day / Scheduled Time Parser
// ----------------------------------------------------------
export function parseTimeOfDay(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] || '00';
    const period = timeMatch[3].replace(/\./g, '').toLowerCase();
    if (period === 'pm' && hour < 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${minute}`;
  }

  // Handle "at 6" or "at 7" or "at 18:00"
  const atMatch = lower.match(/at\s+(\d{1,2})(?::(\d{2}))?(?!\s*(?:min|minute|hour|page|sec|day))/i);
  if (atMatch) {
    let hour = parseInt(atMatch[1], 10);
    const minute = atMatch[2] || '00';
    if (hour >= 1 && hour <= 7) hour += 12; // e.g. "at 6" -> 18:00, "at 7" -> 19:00
    return `${String(hour).padStart(2, '0')}:${minute}`;
  }

  if (lower.includes('morning')) return '09:00';
  if (lower.includes('afternoon')) return '14:00';
  if (lower.includes('tonight') || lower.includes('evening') || lower.includes('night')) return '19:00';

  return null;
}

// ----------------------------------------------------------
// 4. Natural Title Extractor
// ----------------------------------------------------------
export function extractTaskTitle(text) {
  if (!text) return 'New Mission';
  let cleaned = text;

  // Strip leading voice intent trigger phrases
  cleaned = cleaned.replace(/^(kaelo|hey kaelo|please|can you|could you)\s*,?\s*/i, '');
  cleaned = cleaned.replace(/^(add a task to|add task to|add a task for|add a task|add task|create a task to|create a task for|create task|schedule a task to|schedule task|remind me to|i need to|i have to|put|set a task to)\s+/i, '');
  cleaned = cleaned.replace(/^(a task to|a task for|task to|task for)\s+/i, '');

  // Strip trailing duration/time/date clauses
  cleaned = cleaned.replace(/\s+(for\s+\d+\s*(?:hours|hour|minutes|mins|min|hrs|hr))/i, '');
  cleaned = cleaned.replace(/\s+(for\s+(?:an|one|two|three|four)\s*(?:hours|hour))/i, '');
  cleaned = cleaned.replace(/\s+(for\s+(?:half an hour|an hour and a half))/i, '');
  cleaned = cleaned.replace(/\s+(at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.))/i, '');
  cleaned = cleaned.replace(/\s+(tonight|this evening|tomorrow morning|tomorrow afternoon|tomorrow night|tomorrow|tmrw|today|next week|this weekend|on friday|on saturday|on sunday|on monday|on tuesday|on wednesday|on thursday|friday|saturday|sunday|monday|tuesday|wednesday|thursday)/i, '');
  cleaned = cleaned.replace(/\s+(on my list|on my schedule|to my day|to my schedule)/i, '');

  cleaned = cleaned.replace(/['"]+/g, '').trim();

  // If title was stripped too much, recover main clause
  if (cleaned.length < 3) {
    const fallbackMatch = text.match(/(?:study|finish|work on|call|write|review|read|build|edit|prep|code|practice)\s+[^,.]+/i);
    if (fallbackMatch) {
      cleaned = fallbackMatch[0];
    } else {
      cleaned = text.replace(/^(add|create|remind me to)\s+/i, '').trim();
    }
  }

  // Capitalize first letter
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

// ----------------------------------------------------------
// 5. Intelligent Task Matcher
// ----------------------------------------------------------
export function matchExistingTask(text, tasks = [], context = {}) {
  if (!tasks || tasks.length === 0) return null;
  const lower = text.toLowerCase();

  // Check contextual references first
  if (lower.includes('that') || lower.includes('it') || lower.includes('this') || lower.trim() === 'done' || lower.trim() === 'finished') {
    if (context.lastReferencedTaskId) {
      const match = tasks.find(t => t.id === context.lastReferencedTaskId);
      if (match) return match;
    }
    if (context.lastCreatedTaskId) {
      const match = tasks.find(t => t.id === context.lastCreatedTaskId);
      if (match) return match;
    }
    // Fallback: active focus or first incomplete task
    const pending = tasks.filter(t => t.status !== 'completed');
    if (pending.length > 0) return pending[0];
  }

  // Exact or high fuzzy title match
  for (const t of tasks) {
    const tLower = t.title.toLowerCase();
    if (lower.includes(tLower)) return t;

    // Check keywords (e.g. "website", "pha", "carousel", "cs", "assignment", "video")
    const words = tLower.split(/\s+/).filter(w => w.length > 3);
    for (const w of words) {
      if (lower.includes(w)) return t;
    }
  }

  return null;
}

// ----------------------------------------------------------
// 6. Intelligent Quest Matcher
// ----------------------------------------------------------
export function matchExistingQuest(text, goals = []) {
  if (!goals || goals.length === 0) return null;
  const lower = text.toLowerCase();

  for (const g of goals) {
    const gLower = g.title.toLowerCase();
    if (lower.includes(gLower)) return g;

    const words = gLower.split(/\s+/).filter(w => w.length > 3);
    for (const w of words) {
      if (lower.includes(w)) return g;
    }
  }

  if (lower.includes('portfolio') || lower.includes('website') || lower.includes('code')) {
    return goals.find(g => g.id === 'quest_portfolio') || null;
  }
  if (lower.includes('pha') || lower.includes('pharmacology') || lower.includes('exam') || lower.includes('revision')) {
    return goals.find(g => g.id === 'quest_pha') || null;
  }

  return null;
}

// ----------------------------------------------------------
// 7. CORE INTENT CLASSIFIER & ACTION EXECUTION ENGINE
// ----------------------------------------------------------
export function executeVoiceCommand(rawText, state, context = {}) {
  const text = (rawText || '').trim();
  const lower = text.toLowerCase();

  const todayStr = getToday();
  const todayTasks = (state.tasks || []).filter(t => 
    t.date === 'today' || t.scheduledDate === todayStr || (!t.date && !t.scheduledDate)
  );
  const totalCapacityMinutes = Math.round((state.capacity?.dailyCapacity || 3.3) * 60);
  const usedMinutesToday = todayTasks.reduce((s, t) => s + (t.estimatedMinutes || t.duration || 30), 0);
  const remainingCapacityMinutes = Math.max(0, totalCapacityMinutes - usedMinutesToday);

  // --------------------------------------------------------
  // 00. VOICE LISTING & REAL ESTATE AGENT ENGINE (Tests 1-12)
  // Listen First → Understand Second → Confirm Third → Execute Only on Approval
  // --------------------------------------------------------
  const activeListingDraft = context.activeListingDraft || state.activeListingDraft || null;
  const isListingSession = Boolean(activeListingDraft);
  const isListingInitiation = 
    lower.includes('listing') || 
    lower.includes('list my') || 
    lower.includes('create a listing') ||
    lower.startsWith('list a') ||
    lower.includes('apartment in lekki') ||
    lower.includes('apartment in victoria island') ||
    (lower.includes('apartment') && (lower.includes('price') || lower.includes('bedroom') || lower.includes('night')));

  if (isListingSession || isListingInitiation) {
    const listingResult = ListingEngine.processTurn(text, activeListingDraft, {
      simulateBackendFailure: Boolean(context.simulateBackendFailure)
    });

    if (listingResult) {
      return {
        aiResponseText: listingResult.aiResponseText,
        spokenText: listingResult.spokenText || listingResult.aiResponseText,
        aiActions: listingResult.status === 'AWAITING_CONFIRMATION' 
          ? ['CONFIRM_LISTING', 'EDIT_LISTING'] 
          : listingResult.status === 'SUCCESS' 
          ? ['VIEW_LISTING'] 
          : [],
        actionToExecute: listingResult.actionToExecute,
        updatedContext: {
          ...context,
          activeListingDraft: listingResult.updatedDraft
        },
        toast: listingResult.toast || null,
        listingDraft: listingResult.updatedDraft,
        createdListing: listingResult.createdListing || null
      };
    }
  }

  // --------------------------------------------------------
  // 0. GOAL REASONING & ADAPTIVE PROGRESS ENGINE (Tests A, B, C)
  // --------------------------------------------------------
  // A. Adaptive Reading Progress (Test C)
  // e.g., "I just finished a 30-minute reading session and read 9 pages of Atomic Habits."
  const adaptiveReadingMatch = text.match(/(?:read|logged|finished).*?(\d+)\s+pages/i) || text.match(/(\d+)\s+pages\s+of/i);
  if (adaptiveReadingMatch && (lower.includes('page') || lower.includes('reading') || lower.includes('habits') || lower.includes('book'))) {
    const pagesRead = parseInt(adaptiveReadingMatch[1], 10);
    const sessionMinutes = parseDuration(text) || 30;
    const targetGoal = (state.goals || []).find(g => 
      g.type === 'reading' || 
      g.title.toLowerCase().includes('reading') || 
      g.title.toLowerCase().includes('atomic habits') ||
      g.title.toLowerCase().includes('book')
    ) || {
      id: generateId('goal_'),
      title: 'Read Atomic Habits',
      type: 'reading',
      target: 320,
      progress: 0,
      estimatedPace: 12
    };

    const adaptiveResult = GoalReasoningEngine.recordAdaptiveReadingProgress(targetGoal, pagesRead, sessionMinutes);
    if (adaptiveResult) {
      return {
        aiResponseText: adaptiveResult.explanation,
        spokenText: `Logged ${pagesRead} pages. At this rate you'll finish in roughly ${adaptiveResult.sessionsRemaining} reading sessions.`,
        aiActions: ['WHAT_NEXT'],
        actionToExecute: {
          type: 'UPDATE_GOAL_ADAPTIVE_PROGRESS',
          payload: {
            goalId: targetGoal.id,
            progressData: adaptiveResult.updatedGoal
          }
        },
        updatedContext: context,
        toast: {
          title: 'Pace Recalibrated',
          message: `${pagesRead} pages logged · ${adaptiveResult.sessionsRemaining} sessions left`,
          type: 'info'
        }
      };
    }
  }

  // B. Goal Planning Flow (Test A & Test B)
  if (context.goalPlanningSession || detectGoalIntent(text)) {
    const goalResult = GoalReasoningEngine.processTurn(text, state, context.goalPlanningSession);
    if (goalResult) {
      return {
        aiResponseText: goalResult.aiResponseText,
        spokenText: goalResult.spokenText || goalResult.aiResponseText,
        aiActions: goalResult.aiActions || [],
        actionToExecute: goalResult.actionToExecute || null,
        updatedContext: {
          ...context,
          goalPlanningSession: goalResult.updatedSession
        },
        toast: goalResult.toast || null
      };
    }
  }

  // --------------------------------------------------------
  // A. AFFIRMATION / CONFIRMATION / CANCEL INTENT
  // --------------------------------------------------------
  // Cancel pending action
  if ((context.pendingAction || context.pendingFullTask) && (
    lower === 'no' || lower === 'cancel' || lower === 'never mind' || lower === "don't" || 
    lower.includes('nevermind') || lower.includes('cancel that') || lower.includes("don't schedule")
  )) {
    return {
      aiResponseText: `Got it, cancelled. I didn't add the task to your schedule.`,
      spokenText: `Cancelled. Didn't add it.`,
      aiActions: ['WHAT_NEXT'],
      actionToExecute: null,
      updatedContext: { ...context, pendingAction: null, pendingFullTask: null }
    };
  }

  // Schedule anyway despite capacity limit
  if (context.pendingFullTask && (
    lower.includes('anyway') || 
    lower.includes('full duration') || 
    lower.includes('schedule anyway') ||
    lower.includes('all of it') ||
    lower.includes('add it anyway')
  )) {
    const task = context.pendingFullTask;
    return {
      aiResponseText: `Scheduled: "${task.title}" for ${task.estimatedMinutes} minutes today anyway. Heads up: you are now over realistic capacity.`,
      spokenText: `Scheduled ${task.title} for ${task.estimatedMinutes} minutes. You are over capacity now.`,
      aiActions: ['REBALANCE'],
      actionToExecute: { type: 'ADD_TASK', payload: task },
      updatedContext: { ...context, pendingAction: null, pendingFullTask: null, lastCreatedTaskId: task.id },
      toast: { title: 'Over Capacity', message: `Added ${task.title} (${task.estimatedMinutes}m)`, type: 'warning' }
    };
  }

  // Affirmation or Schedule fitting duration
  if (context.pendingAction && (
    lower === 'yes' || lower === 'yeah' || lower === 'yep' || lower === 'sure' || 
    lower === 'do it' || lower === 'apply' || lower === 'apply that' || lower === 'apply changes' ||
    lower.includes('confirm') || lower === 'start it' || lower === 'ok' || lower === 'okay' ||
    lower.includes('fitting') || lower.includes('schedule fitting') || lower.includes('fit')
  )) {
    const pending = context.pendingAction;
    if (pending.type === 'START_FOCUS') {
      return {
        aiResponseText: `Done. Your focus session for "${pending.task.title}" is starting now.`,
        spokenText: `Focus session starting. Let's build.`,
        aiActions: [],
        actionToExecute: { type: 'SET_ACTIVE_FOCUS', payload: pending.task },
        updatedContext: { ...context, pendingAction: null, lastReferencedTaskId: pending.task.id },
        toast: { title: 'Focus Started', message: `Locked into ${pending.task.title}`, type: 'xp' }
      };
    }

    if (pending.type === 'APPLY_REBALANCE') {
      return {
        aiResponseText: `Applied! I rebalanced your daily plan, keeping your top priorities and moving flexible missions to tomorrow.`,
        spokenText: `Rebalance applied. Your realistic capacity is restored.`,
        aiActions: ['START_NEXT'],
        actionToExecute: { type: 'APPLY_AI_REBALANCE' },
        updatedContext: { ...context, pendingAction: null },
        toast: { title: 'Day Rebalanced', message: 'Missions rescheduled to protect capacity.', type: 'info' }
      };
    }

    if (pending.type === 'CREATE_TASK_FITTING') {
      const task = pending.task;
      return {
        aiResponseText: `Scheduled: "${task.title}" for ${task.estimatedMinutes} minutes today, and moved the remaining block to tomorrow.`,
        spokenText: `Scheduled ${task.title} for ${task.estimatedMinutes} minutes today. Capacity protected.`,
        aiActions: ['START_NEXT'],
        actionToExecute: { type: 'ADD_TASK', payload: task },
        updatedContext: { ...context, pendingAction: null, pendingFullTask: null, lastCreatedTaskId: task.id },
        toast: { title: 'Task Scheduled', message: `Added ${task.title} (${task.estimatedMinutes}m)`, type: 'info' }
      };
    }
  }

  // --------------------------------------------------------
  // B. FOCUS CONTROL INTENTS ("Pause", "Resume", "Extend", "Stop focus", "Start focus")
  // --------------------------------------------------------
  if (lower === 'pause' || lower.includes('pause focus') || lower.includes('pause timer')) {
    return {
      aiResponseText: `Paused your focus timer. Take a breath and tell me when you're ready to resume.`,
      spokenText: `Focus paused.`,
      aiActions: ['RESUME_FOCUS'],
      actionToExecute: { type: 'FOCUS_PAUSE' },
      updatedContext: context
    };
  }

  if (lower === 'resume' || lower.includes('resume focus') || lower.includes('keep going')) {
    return {
      aiResponseText: `Resuming your focus session. Locking back in.`,
      spokenText: `Resuming session.`,
      aiActions: [],
      actionToExecute: { type: 'FOCUS_RESUME' },
      updatedContext: context
    };
  }

  if (lower.includes('five more minutes') || lower.includes('extend 5') || lower.includes('give me 5 minutes')) {
    return {
      aiResponseText: `Extended your focus timer by 5 minutes. Finish strong!`,
      spokenText: `Added five minutes to your session.`,
      aiActions: [],
      actionToExecute: { type: 'FOCUS_EXTEND_5' },
      updatedContext: context
    };
  }

  if (lower === 'stop focus' || lower.includes('exit focus') || lower.includes('end focus')) {
    return {
      aiResponseText: `Focus session ended. I saved your progress so far.`,
      spokenText: `Focus ended. Saved your progress.`,
      aiActions: ['WHAT_NEXT'],
      actionToExecute: { type: 'SET_ACTIVE_FOCUS', payload: null },
      updatedContext: context
    };
  }

  if (
    lower.startsWith('start focus') || 
    lower.startsWith('focus') || 
    lower.startsWith('put me in focus') || 
    lower.includes('lock me in') || 
    lower.includes('start next mission') ||
    lower.includes('start my next mission')
  ) {
    const matched = matchExistingTask(text, state.tasks, context) || 
      todayTasks.find(t => t.status !== 'completed') || 
      state.tasks[0];

    if (matched) {
      const explicitDuration = parseDuration(text);
      const focusTask = explicitDuration !== 30 ? { ...matched, estimatedMinutes: explicitDuration } : matched;

      return {
        aiResponseText: `Locking you into "${focusTask.title}" for ${focusTask.estimatedMinutes || 30} minutes. Distractions eliminated. Let's build.`,
        spokenText: `Starting focus on ${focusTask.title}.`,
        aiActions: [],
        actionToExecute: { type: 'SET_ACTIVE_FOCUS', payload: focusTask },
        updatedContext: { ...context, lastReferencedTaskId: focusTask.id },
        toast: { title: 'Focus Started', message: `Locked into ${focusTask.title}`, type: 'xp' }
      };
    }
  }

  // --------------------------------------------------------
  // C. TASK COMPLETION INTENT ("I finished my assignment", "Done", "Mark complete")
  // --------------------------------------------------------
  if (
    lower.includes('finished') || 
    lower.includes('done with') || 
    lower === 'done' || 
    lower.includes('mark complete') || 
    lower.includes('completed') ||
    lower.startsWith('i finished') ||
    lower.startsWith('i am done')
  ) {
    const matched = matchExistingTask(text, state.tasks, context) || 
      (state.activeFocus ? state.activeFocus : null) ||
      todayTasks.find(t => t.status !== 'completed');

    if (matched) {
      const xpEarned = matched.xp || calculateTaskXP(matched.difficulty || 'medium', matched.importance || 'high');
      return {
        aiResponseText: `Marked "${matched.title}" as complete! +${xpEarned} XP earned. High momentum!`,
        spokenText: `Marked ${matched.title} as complete. Nice work.`,
        aiActions: ['WHAT_NEXT'],
        actionToExecute: { type: 'COMPLETE_TASK', payload: matched.id },
        updatedContext: { ...context, lastReferencedTaskId: matched.id },
        toast: { title: 'Mission Done', message: `${matched.title} · +${xpEarned} XP`, type: 'xp' }
      };
    }
  }

  // --------------------------------------------------------
  // D. "FIX MY DAY" / REBALANCE INTENT
  // --------------------------------------------------------
  if (
    lower.includes('fix my day') || 
    lower.includes('rebalance') || 
    lower.includes('overwhelmed') || 
    lower.includes('fix my schedule') ||
    lower.includes('too much on my plate')
  ) {
    const rebalanceResult = rebalanceDailyPlan(state.tasks, totalCapacityMinutes);
    if (rebalanceResult.moveTomorrow.length > 0) {
      const movedNames = rebalanceResult.moveTomorrow.map(t => `"${t.title}"`).join(', ');
      return {
        aiResponseText: `You have more planned than fits comfortably in your ${(totalCapacityMinutes/60).toFixed(1)}h daily capacity. I moved ${movedNames} to tomorrow to protect your core focus.`,
        spokenText: `Done. I moved ${rebalanceResult.moveTomorrow.length} mission(s) to tomorrow and kept your deadline-critical work today.`,
        aiActions: ['START_NEXT', 'SHOW_WHY'],
        actionToExecute: { type: 'APPLY_AI_REBALANCE' },
        updatedContext: { ...context, pendingAction: null },
        toast: { title: 'Day Rebalanced', message: `Protected your capacity.`, type: 'info' }
      };
    } else {
      return {
        aiResponseText: `Your current schedule is healthy! You have ${remainingCapacityMinutes} minutes remaining. Everything fits within your realistic capacity.`,
        spokenText: `Your plan is within capacity. You're ready to execute.`,
        aiActions: ['WHAT_NEXT'],
        actionToExecute: null,
        updatedContext: context
      };
    }
  }

  // --------------------------------------------------------
  // E. "WHAT'S NEXT?" INTENT
  // --------------------------------------------------------
  if (
    lower.includes('what\'s next') || 
    lower.includes('what is next') || 
    lower.includes('what should i do') || 
    lower.includes('what am i supposed to do') ||
    lower.includes('what to do next') ||
    lower.includes('next action')
  ) {
    const nextAction = getRecommendedNextAction(todayTasks, totalCapacityMinutes, state.goals || []);
    if (nextAction.task) {
      return {
        aiResponseText: `Your best next move is "${nextAction.task.title}" (${nextAction.task.estimatedMinutes || 30}m). ${nextAction.reason}`,
        spokenText: `Your best next move is ${nextAction.task.title}. Start it?`,
        aiActions: ['START_NEXT', 'SHOW_WHY'],
        actionToExecute: null,
        updatedContext: { 
          ...context, 
          lastReferencedTaskId: nextAction.task.id,
          pendingAction: { type: 'START_FOCUS', task: nextAction.task }
        }
      };
    } else {
      return {
        aiResponseText: `You're completely clear! All planned priorities for today are executed. High momentum achieved.`,
        spokenText: `All planned missions for today are executed. Great job.`,
        aiActions: [],
        actionToExecute: null,
        updatedContext: context
      };
    }
  }

  // --------------------------------------------------------
  // F. RESCHEDULE INTENT ("Move website to tomorrow", "Push to Friday", "Reschedule")
  // --------------------------------------------------------
  if (
    lower.startsWith('move ') || 
    lower.startsWith('push ') || 
    lower.startsWith('reschedule ') || 
    lower.startsWith('delay ') ||
    lower.includes('move it to') ||
    lower.includes('move that to') ||
    lower.includes('push it back')
  ) {
    // Check if moving all / everything
    if (lower.includes('everything') || lower.includes('all')) {
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      const tmrwStr = formatDate(tmrw);

      return {
        aiResponseText: `Done. I moved your unfinished missions from today to tomorrow.`,
        spokenText: `Moved unfinished missions to tomorrow.`,
        aiActions: ['WHAT_NEXT'],
        actionToExecute: { type: 'APPLY_AI_REBALANCE' },
        updatedContext: context,
        toast: { title: 'Missions Moved', message: 'Transferred to tomorrow.', type: 'info' }
      };
    }

    // Disambiguation check (Section 6, Test F)
    const refResolution = IntentClassifier.resolveTaskReference(text, state.tasks, context);
    if (refResolution.isAmbiguous) {
      return {
        aiResponseText: refResolution.clarificationQuestion,
        spokenText: refResolution.clarificationQuestion,
        aiActions: ['CLARIFY'],
        actionToExecute: null,
        updatedContext: context
      };
    }

    const matchedTask = refResolution.resolvedTask || matchExistingTask(text, state.tasks, context);
    const { dateStr, label: dateLabel } = parseRelativeDate(text);

    if (matchedTask) {
      const updatedTask = {
        ...matchedTask,
        scheduledDate: dateStr,
        date: dateStr === getToday() ? 'today' : dateStr
      };

      return {
        aiResponseText: `Moved "${matchedTask.title}" to ${dateLabel}. Your capacity for today has been updated.`,
        spokenText: `Moved ${matchedTask.title} to ${dateLabel}.`,
        aiActions: ['WHAT_NEXT'],
        actionToExecute: { type: 'UPDATE_TASK', payload: updatedTask },
        updatedContext: { ...context, lastReferencedTaskId: matchedTask.id },
        toast: { title: 'Task Rescheduled', message: `Moved to ${dateLabel}`, type: 'info' }
      };
    } else {
      return {
        aiResponseText: `Which mission would you like to move to ${dateLabel}?`,
        spokenText: `Which mission should I move?`,
        aiActions: ['CLARIFY'],
        actionToExecute: null,
        updatedContext: context
      };
    }
  }

  // --------------------------------------------------------
  // G. EDIT / CORRECTION INTENT ("Actually make that 2 hours", "Change priority to high")
  // --------------------------------------------------------
  if (
    lower.startsWith('actually,') || 
    lower.startsWith('actually ') || 
    lower.startsWith('wait,') || 
    lower.startsWith('wait ') || 
    lower.startsWith('change ') || 
    lower.startsWith('make that ') || 
    lower.startsWith('make it ') || 
    lower.startsWith('rename ')
  ) {
    const targetTask = matchExistingTask(text, state.tasks, context) || 
      (context.lastCreatedTaskId ? state.tasks.find(t => t.id === context.lastCreatedTaskId) : null) ||
      (context.lastReferencedTaskId ? state.tasks.find(t => t.id === context.lastReferencedTaskId) : null);

    if (targetTask) {
      let updated = { ...targetTask };
      let changeDesc = '';

      if (lower.includes('hour') || lower.includes('minute') || lower.includes('mins')) {
        const newDuration = parseDuration(text);
        updated.estimatedMinutes = newDuration;
        updated.duration = newDuration;
        changeDesc = `${newDuration} minutes duration`;
      } else if (lower.includes('high priority') || lower.includes('critical')) {
        updated.importance = lower.includes('critical') ? 'critical' : 'high';
        changeDesc = `${updated.importance} priority`;
      } else if (lower.includes('tomorrow') || lower.includes('friday') || lower.includes('saturday')) {
        const { dateStr, label } = parseRelativeDate(text);
        updated.scheduledDate = dateStr;
        updated.date = dateStr === getToday() ? 'today' : dateStr;
        changeDesc = `scheduled for ${label}`;
      } else if (lower.includes('rename') || lower.includes('make it')) {
        const newTitle = extractTaskTitle(text);
        updated.title = newTitle;
        changeDesc = `renamed to "${newTitle}"`;
      }

      return {
        aiResponseText: `Updated "${targetTask.title}": now set to ${changeDesc}.`,
        spokenText: `Updated ${targetTask.title}.`,
        aiActions: ['WHAT_NEXT'],
        actionToExecute: { type: 'UPDATE_TASK', payload: updated },
        updatedContext: { ...context, lastReferencedTaskId: targetTask.id },
        toast: { title: 'Task Updated', message: `${targetTask.title} updated`, type: 'info' }
      };
    }
  }

  // --------------------------------------------------------
  // H. NATURAL TASK CREATION INTENT ("Add a task to...", "Remind me to...", "I need to...")
  // --------------------------------------------------------
  const isCreateIntent = 
    lower.startsWith('add ') || 
    lower.startsWith('create ') || 
    lower.startsWith('schedule ') || 
    lower.startsWith('remind me') || 
    lower.startsWith('put ') ||
    lower.startsWith('i need to') ||
    lower.startsWith('tomorrow i need to') ||
    lower.includes('add a task') ||
    lower.includes('create a task');

  if (isCreateIntent) {
    const title = extractTaskTitle(text);
    const duration = parseDuration(text);
    const { dateStr, label: dateLabel } = parseRelativeDate(text);
    const scheduledTime = parseTimeOfDay(text);
    const matchedQuest = matchExistingQuest(text, state.goals || []);

    const importance = lower.includes('critical') || lower.includes('urgent') || lower.includes('exam') 
      ? 'critical' 
      : lower.includes('important') || lower.includes('client') 
      ? 'high' 
      : 'medium';

    const category = matchedQuest 
      ? matchedQuest.categoryName 
      : lower.includes('study') || lower.includes('exam') || lower.includes('assignment') 
      ? 'Academic' 
      : lower.includes('website') || lower.includes('client') || lower.includes('proposal') 
      ? 'Business' 
      : lower.includes('workout') || lower.includes('gym') 
      ? 'Health' 
      : 'Personal';

    const newTask = {
      id: generateId(),
      title,
      category,
      goalId: matchedQuest ? matchedQuest.id : null,
      estimatedMinutes: duration,
      duration,
      difficulty: duration >= 60 ? 'hard' : duration >= 45 ? 'medium' : 'easy',
      importance,
      xp: calculateTaskXP(duration >= 60 ? 'hard' : 'medium', importance),
      status: 'pending',
      scheduledDate: dateStr,
      date: dateStr === getToday() ? 'today' : dateStr,
      time: scheduledTime,
      createdAt: new Date().toISOString()
    };

    // Conflict check (Section 5, Test D & Test E)
    if (scheduledTime) {
      const conflictResult = ScheduleEngine.checkConflict(scheduledTime, duration, dateStr, state);
      if (conflictResult.hasConflict) {
        const conflictMessage = ScheduleEngine.formatConflictResponse(conflictResult, title);
        return {
          aiResponseText: conflictMessage,
          spokenText: conflictMessage,
          aiActions: ['CHOOSE_ALTERNATIVE', 'MOVE_CONFLICT'],
          actionToExecute: null,
          updatedContext: {
            ...context,
            pendingConflictTask: { ...newTask, time: scheduledTime },
            pendingConflict: conflictResult
          }
        };
      }
    }

    // Capacity check: if scheduled for today, does it fit?
    if (dateStr === getToday()) {
      if (duration > remainingCapacityMinutes && remainingCapacityMinutes > 0) {
        // Exceeds available capacity! Offer intelligent coach choice.
        const fittingTask = { ...newTask, estimatedMinutes: remainingCapacityMinutes, duration: remainingCapacityMinutes };
        return {
          aiResponseText: `You only have about ${remainingCapacityMinutes} minutes of realistic capacity left today. I can add "${title}", but ${duration} minutes will push you over capacity. Should I schedule ${remainingCapacityMinutes}m today, or schedule ${duration}m anyway?`,
          spokenText: `You only have ${remainingCapacityMinutes} minutes left today. Should I schedule ${remainingCapacityMinutes} minutes or move it?`,
          aiActions: ['SCHEDULE_FITTING', 'SCHEDULE_ANYWAY'],
          actionToExecute: null,
          updatedContext: {
            ...context,
            pendingAction: { type: 'CREATE_TASK_FITTING', task: fittingTask },
            pendingFullTask: newTask
          }
        };
      }
    }

    // Fits capacity or scheduled for another day: create immediately!
    const questNote = matchedQuest ? ` Linked under "${matchedQuest.title}".` : '';
    const timeNote = scheduledTime ? ` at ${scheduledTime}` : '';

    return {
      aiResponseText: `Added: ${title} — ${dateLabel}${timeNote} (${duration}m).${questNote}`,
      spokenText: `Added: ${title} for ${dateLabel}. Fits your capacity.`,
      aiActions: dateStr === getToday() ? ['START_NEXT'] : [],
      actionToExecute: { type: 'ADD_TASK', payload: newTask },
      updatedContext: { ...context, lastCreatedTaskId: newTask.id, lastReferencedTaskId: newTask.id },
      toast: { title: 'Mission Added', message: `${title} (${duration}m)`, type: 'xp' }
    };
  }

  // --------------------------------------------------------
  // I. CAPACITY & SCHEDULE INQUIRY ("How much capacity do I have left?")
  // --------------------------------------------------------
  if (lower.includes('capacity') || lower.includes('how much time do i have') || lower.includes('schedule')) {
    const hours = (remainingCapacityMinutes / 60).toFixed(1);
    const pendingCount = todayTasks.filter(t => t.status !== 'completed').length;

    return {
      aiResponseText: `You have ${hours}h (${remainingCapacityMinutes} minutes) of realistic capacity remaining today across ${pendingCount} pending missions.`,
      spokenText: `You have ${hours} hours of realistic capacity remaining today.`,
      aiActions: ['WHAT_NEXT', 'REBALANCE'],
      actionToExecute: null,
      updatedContext: context
    };
  }

  // --------------------------------------------------------
  // I2. REWARDS / XP PERKS INTENT ("What are my perks", "Open shop", "Redeem XP")
  // --------------------------------------------------------
  if (lower.includes('perk') || lower.includes('reward') || lower.includes('redeem xp') || lower.includes('shop')) {
    const perks = state.activePerks || {};
    const has2x = perks.xpMultiplierUntil && new Date(perks.xpMultiplierUntil) > new Date();
    const shields = perks.streakShields || 0;
    const tokens = perks.rebalanceTokens || 0;
    const xp = state.user?.xp || 0;

    return {
      aiResponseText: `You have ${xp} XP available. Active perks: ${has2x ? '⚡ 2x Focus Multiplier active, ' : ''}${shields} Streak Shield(s), ${tokens} Rebalance Token(s). Opening your perks catalogue.`,
      spokenText: `You have ${xp} XP available. Opening your perks catalogue.`,
      aiActions: ['WHAT_NEXT'],
      actionToExecute: { type: 'OPEN_REWARDS_MODAL' },
      updatedContext: context,
      toast: { title: 'XP Perks Shop', message: 'Catalogue opened', type: 'xp' }
    };
  }

  // --------------------------------------------------------
  // I3. SQUAD INTENT ("Check my squad", "Squad check-in", "How is my squad doing")
  // --------------------------------------------------------
  if (lower.includes('squad') || lower.includes('accountability')) {
    const sq = state.squad || { name: 'Alpha Builders', challengeProgress: 140, challengeGoal: 200, activeStreak: 12 };
    return {
      aiResponseText: `Your squad "${sq.name}" has logged ${sq.challengeProgress}/${sq.challengeGoal} focus minutes today with a ${sq.activeStreak}d streak. Opening your squad board.`,
      spokenText: `Your squad is at ${sq.challengeProgress} of ${sq.challengeGoal} minutes today. Solid momentum.`,
      aiActions: ['START_NEXT'],
      actionToExecute: { type: 'OPEN_SQUAD_MODAL' },
      updatedContext: context,
      toast: { title: 'Squad Board', message: `${sq.name} · ${sq.activeStreak}d streak`, type: 'info' }
    };
  }

  // --------------------------------------------------------
  // I4. DAY RECAP / ROLLOVER INTENT ("Recap my day", "Review today", "Day recap")
  // --------------------------------------------------------
  if (lower.includes('recap') || lower.includes('review today') || lower.includes('review my day') || lower.includes('day recap') || lower.includes('how did i do today')) {
    return {
      aiResponseText: `Opening your End-of-Day Execution Recap to inspect completed missions, capacity adherence, and roll over incomplete work.`,
      spokenText: `Opening your end of day recap.`,
      aiActions: ['WHAT_NEXT'],
      actionToExecute: { type: 'OPEN_RECAP_MODAL' },
      updatedContext: context
    };
  }

  // --------------------------------------------------------
  // I5. UPGRADE / PRO / TIER INTENT ("Upgrade to pro", "Pricing", "Subscription")
  // --------------------------------------------------------
  if (lower.includes('upgrade') || lower.includes('pro tier') || lower.includes('kaelo pro') || lower.includes('kaelo plus') || lower.includes('subscription') || lower.includes('pricing')) {
    const currentTier = state.user?.tier || 'free';
    return {
      aiResponseText: `You're currently on the ${currentTier.toUpperCase()} tier. Pro unlocks real-time adaptive voice coaching, unlimited AI rebalancing, and deep execution analytics. Opening membership plans.`,
      spokenText: `Opening membership plans.`,
      aiActions: ['WHAT_NEXT'],
      actionToExecute: { type: 'OPEN_SUBSCRIPTION_MODAL' },
      updatedContext: context
    };
  }

  // --------------------------------------------------------
  // I6. SHARE PROGRESS / CARD INTENT ("Share my progress", "Share card", "Proof of work")
  // --------------------------------------------------------
  if (lower.includes('share card') || lower.includes('share my progress') || lower.includes('share stats') || lower.includes('proof of work')) {
    return {
      aiResponseText: `Generating your proof-of-work share card with your Level ${state.user?.level || 4} stats, ${state.user?.streak || 8}d streak, and referral link.`,
      spokenText: `Generating your share card.`,
      aiActions: ['WHAT_NEXT'],
      actionToExecute: { 
        type: 'OPEN_SHARE_MODAL', 
        payload: { 
          type: 'stats', 
          streak: state.user?.streak || 8, 
          momentum: state.user?.momentum || 84, 
          level: state.user?.level || 4 
        } 
      },
      updatedContext: context
    };
  }

  // --------------------------------------------------------
  // J. EMOTIONAL / COACHING SUPPORT ("I don't feel like studying", "I'm exhausted")
  // --------------------------------------------------------
  if (lower.includes('feel like') || lower.includes('unmotivated') || lower.includes('tired') || lower.includes('exhausted') || lower.includes('lazy')) {
    const pending = todayTasks.filter(t => t.status !== 'completed');
    if (pending.length > 0) {
      const top = pending[0];
      const mins = top.estimatedMinutes || top.duration || 30;
      return {
        aiResponseText: `I know. But you've only got ${pending.length === 1 ? 'one important mission' : `${pending.length} missions`} left today, and "${top.title}" is just ${mins} minutes. Let's finish that one and call it.`,
        spokenText: `I know. Let's finish just "${top.title}" for ${mins} minutes and call it a day.`,
        aiActions: ['START_NEXT', 'REBALANCE'],
        actionToExecute: null,
        updatedContext: { ...context, lastReferencedTaskId: top.id, pendingAction: { type: 'START_FOCUS', task: top } }
      };
    }
  }

  // --------------------------------------------------------
  // K. DEFAULT NATURAL COACHING CONVERSATION
  // --------------------------------------------------------
  return {
    aiResponseText: `Yeah, I get it. You've got a lot going on. I'm keeping watch over your ${(state.capacity?.dailyCapacity || 3.3).toFixed(1)}h capacity. You're at ${state.user?.momentum || 84} Momentum. Tell me what needs to happen, or ask me to schedule, rebalance, or start a focus session.`,
    spokenText: `I'm keeping watch over your capacity. Tell me what needs to happen.`,
    aiActions: ['WHAT_NEXT', 'REBALANCE'],
    actionToExecute: null,
    updatedContext: context
  };
}

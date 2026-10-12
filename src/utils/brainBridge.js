// -----------------------------------------------------------------------------
// KAELO BRAIN BRIDGE
// Connects the Intelligence Core's preprocessing pipeline to the existing
// aiActionEngine, then polishes output through the brain's reply formatter.
//
// Architecture:
//   Raw Input → Brain Steps 1-4 (Clean, Repair, Resolve, Time) →
//   aiActionEngine.executeVoiceCommand (intent + action dispatch) →
//   Brain Step 7 (Reply Formatter) → Final Output
//
// This gives us:
// - Brain's superior disfluency handling, ASR repair, reference resolution
// - The existing action engine's full intent coverage & app-specific logic
// - Brain's spoken reply polishing (no fluff, no markdown, dedup guard)
// -----------------------------------------------------------------------------

import { PipelineCleaner } from '../core/brain/pipeline/1_cleaner.js';
import { PipelineRepairer } from '../core/brain/pipeline/2_repairer.js';
import { PipelineResolver } from '../core/brain/pipeline/3_resolver.js';
import { PipelineTimeResolver } from '../core/brain/pipeline/4_timeResolver.js';
import { PipelineRealityChecker } from '../core/brain/pipeline/5_realityChecker.js';
import { PipelineReplyFormatter } from '../core/brain/pipeline/7_replyFormatter.js';
import { executeVoiceCommand, matchExistingTask } from './aiActionEngine.js';
import { getToday } from './helpers.js';

/**
 * Build context object compatible with the brain's pipeline from app state.
 */
function buildBrainContext(state) {
  const todayStr = getToday();
  const tasks = state.tasks || [];

  const todayTasks = tasks.filter(t =>
    t.date === 'today' || t.scheduledDate === todayStr || (!t.date && !t.scheduledDate)
  ).map(t => ({
    id: t.id,
    title: t.title,
    status: t.status,
    duration_min: t.estimatedMinutes || t.duration || 30,
    postponed_count: t.postponedCount || 0,
    category: t.category || 'General',
    due: t.deadline || null,
    weight: t.weight || null
  }));

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const tomorrowTasks = tasks.filter(t =>
    t.scheduledDate === tomorrowStr || t.date === 'tomorrow'
  ).map(t => ({
    id: t.id,
    title: t.title,
    status: t.status,
    duration_min: t.estimatedMinutes || t.duration || 30
  }));

  return {
    now: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos',
    today_tasks: todayTasks,
    tomorrow_tasks: tomorrowTasks,
    calendar: state.calendar || state.timeline || [],
    free_windows: [],
    active_session: state.activeFocus ? {
      task_id: state.activeFocus.taskId || state.activeFocus.id,
      task_name: state.activeFocus.taskName || state.activeFocus.title,
      minutes_remaining: state.activeFocus.timeRemaining
        ? Math.round(state.activeFocus.timeRemaining / 60)
        : 25
    } : null,
    last_discussed: state.conversationalContext?.lastReferencedTaskId || null,
    on_screen: null,
    pending_confirmation: state.conversationalContext?.pendingAction ? 'pending' : null,
    user_profile: {
      name: state.user?.name || 'Fred',
      identity: state.user?.identity,
      identityTitle: state.user?.identityTitle,
      level: state.user?.level || 4,
      streak: state.user?.streak || 8,
      momentum: state.user?.momentum || 84,
      tier: state.user?.tier || 'free',
      coaching_tone: state.user?.coachingTone || 'direct'
    },
    memory: state.memory || [],
    goals: (state.goals || []).map(g => ({
      id: g.id,
      title: g.title,
      progress: g.progress ?? g.currentProgress ?? 0,
      target: g.target || 100,
      deadline: g.deadline
    })),
    active_perks: state.activePerks || {},
    completed_this_week: (state.progress || []).reduce((acc, p) => acc + (p.tasksCompleted || 0), 0) || 5,
    defaults: {
      morning: '08:00',
      lunch: '13:00',
      afternoon: '14:00',
      evening: '18:00',
      night: '21:00',
      focus_minutes: 25,
      bedtime: '23:30'
    },
    permissions: {
      tasks_write: true,
      calendar_write: true,
      send_message: true
    }
  };
}

/**
 * Preprocess raw user input through the brain's intelligence pipeline (Steps 1-4).
 * Returns the cleaned, repaired, resolved text plus metadata.
 *
 * @param {string} rawText - Raw user transcript
 * @param {Object} state - Current app state
 * @returns {Object} { cleanedText, repairResult, resolved, timeResolved, realityCheck, brainContext }
 */
export function preprocessWithBrain(rawText, state) {
  const brainContext = buildBrainContext(state);
  const input = {
    transcript: rawText,
    addressed_to_assistant: true,
    asr_confidence: 1.0
  };

  // Step 1: CLEAN — strip fillers, collapse self-corrections
  const cleanResult = PipelineCleaner.clean(rawText);

  // Step 2: REPAIR — fix ASR mishearings using task entity list
  const repairResult = PipelineRepairer.repair(cleanResult, input, brainContext);

  // Step 3: RESOLVE — resolve pronoun references ("it", "that", "this")
  const resolved = PipelineResolver.resolve(repairResult.text, brainContext);

  // Step 4: RESOLVE TIME — map relative times to concrete timestamps
  const timeResolved = PipelineTimeResolver.resolve(repairResult.text, brainContext);

  // Step 5: REALITY CHECK — calendar clashes, duration math, overrun history
  const realityCheck = PipelineRealityChecker.check(null, repairResult.text, resolved, brainContext, timeResolved);

  return {
    cleanedText: repairResult.text,
    originalText: rawText,
    cleanResult,
    repairResult,
    resolved,
    timeResolved,
    realityCheck,
    brainContext,
    // Track brain preprocessing metadata for debugging
    _brain: {
      wasCleaned: cleanResult.text !== rawText,
      wasRepaired: repairResult.text !== cleanResult.text,
      isRetraction: cleanResult.isRetraction,
      isTrailingOff: cleanResult.isTrailingOff,
      isUnintelligible: repairResult.isUnintelligible,
      isAmbiguous: resolved.isAmbiguous,
      hasClash: realityCheck.hasClash,
      isOverloaded: realityCheck.isOverloaded
    }
  };
}

/**
 * Enhanced voice command execution using the brain's preprocessing pipeline.
 *
 * Flow:
 * 1. Preprocess input through brain steps 1-4 (clean, repair, resolve, time)
 * 2. Feed cleaned text to the existing aiActionEngine
 * 3. Polish the output through the brain's reply formatter (step 7)
 * 4. Attach brain metadata for debugging and learning
 *
 * @param {string} rawText - Raw user transcript
 * @param {Object} state - Current app state
 * @param {Object} context - Conversational context
 * @returns {Object} Same shape as executeVoiceCommand output, brain-enhanced
 */
export function executeBrainEnhancedCommand(rawText, state, context = {}) {
  // Phase 1: Brain preprocessing
  const preprocessed = preprocessWithBrain(rawText, state);

  // Use the brain's cleaned text for intent classification
  // This strips fillers ("uh", "um"), resolves self-corrections, and repairs ASR errors
  const enhancedText = preprocessed.cleanedText || rawText;

  // Phase 2: Feed through existing action engine with cleaned input & enriched memory
  const enrichedContext = {
    ...context,
    user: state.user,
    memory: state.memory || [],
    goals: state.goals || [],
    activePerks: state.activePerks || {},
    capacity: state.capacity,
    calendar: state.calendar || [],
    activeListingDraft: state.activeListingDraft || context.activeListingDraft || null,
    listings: state.listings || []
  };
  const result = executeVoiceCommand(enhancedText, state, enrichedContext);

  // Phase 3: Polish output text through brain's reply formatter
  // This removes markdown, duplicate sentences, filler openers, and ensures spoken style
  if (result.aiResponseText) {
    result.aiResponseText = PipelineReplyFormatter.format(result.aiResponseText);
  }
  if (result.spokenText) {
    result.spokenText = PipelineReplyFormatter.format(result.spokenText);
  }

  // Phase 4: Enhance with brain's reality check warnings
  if (preprocessed.realityCheck.hasClash && !result.actionToExecute) {
    // Brain detected a calendar clash the action engine missed
    result.aiResponseText = preprocessed.realityCheck.warning || result.aiResponseText;
    result.spokenText = preprocessed.realityCheck.warning || result.spokenText;
  }

  if (preprocessed.realityCheck.isOverloaded && !result.aiResponseText.includes('capacity')) {
    // Brain detected overload the action engine didn't flag
    const overloadNote = preprocessed.realityCheck.warning || '';
    if (overloadNote && result.aiResponseText) {
      result.aiResponseText = `${overloadNote} ${result.aiResponseText}`;
    }
  }

  // Attach brain debug metadata
  result._brainMeta = preprocessed._brain;

  return result;
}

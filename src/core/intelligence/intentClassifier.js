// =============================================================================
// KAELO INTENT & CONTEXT DISAMBIGUATION CLASSIFIER
// =============================================================================
// Resolves messy, conversational, and ambiguous natural-language instructions
// using authoritative application state and recent conversational context.
//
// Key Responsibilities:
// 1. Reference Disambiguation: resolves "that", "it", "this one", "the earlier meeting".
// 2. Ambiguity Detection: asks for clarification when multiple candidates match equally well.
// 3. Activity vs. Evidence Distinction: distinguishes timer sessions from completed outcomes.
// 4. Conversational Corrections: seamlessly handles "Actually make it 20 minutes".
// =============================================================================

export class IntentClassifier {
  /**
   * Resolves target task from ambiguous user instructions (e.g., "move that to tomorrow").
   *
   * @param {string} text - User message
   * @param {Array} tasks - Available tasks in state
   * @param {Object} context - Conversational context
   * @returns {Object} Resolution result: { resolvedTask, isAmbiguous, clarificationQuestion }
   */
  static resolveTaskReference(text, tasks = [], context = {}) {
    const lower = text.toLowerCase().trim();

    // Check if the instruction is referencing a prior task
    const isPronounRef = 
      lower.includes('that') || 
      lower.includes('it') || 
      lower.includes('this') || 
      lower.startsWith('move to tomorrow') || 
      lower === 'move that to tomorrow' ||
      lower === 'move it to tomorrow' ||
      lower === 'move it' ||
      lower === 'push that' ||
      lower === 'push it';

    if (!isPronounRef) {
      // Direct name search
      for (const t of tasks) {
        if (lower.includes(t.title.toLowerCase())) {
          return { resolvedTask: t, isAmbiguous: false };
        }
      }
      return { resolvedTask: null, isAmbiguous: false };
    }

    // 1. Check if there is an unambiguous recent task in context
    if (context.lastReferencedTaskId) {
      const match = tasks.find(t => t.id === context.lastReferencedTaskId);
      if (match) {
        return { resolvedTask: match, isAmbiguous: false };
      }
    }

    if (context.lastCreatedTaskId) {
      const match = tasks.find(t => t.id === context.lastCreatedTaskId);
      if (match) {
        return { resolvedTask: match, isAmbiguous: false };
      }
    }

    // 2. Check pending tasks for today
    const pendingToday = tasks.filter(t => t.status !== 'completed' && (t.date === 'today' || !t.date));

    // If only 1 pending task exists, unambiguous!
    if (pendingToday.length === 1) {
      return { resolvedTask: pendingToday[0], isAmbiguous: false };
    }

    // If multiple pending tasks exist and none was specifically referenced, it's AMBIGUOUS (Test F)
    if (pendingToday.length > 1) {
      const candidates = pendingToday.slice(0, 3).map(t => `"${t.title}"`).join(' or ');
      return {
        resolvedTask: null,
        isAmbiguous: true,
        clarificationQuestion: `Move which one? You've got ${pendingToday.length} missions today: ${candidates}?`,
        candidates: pendingToday
      };
    }

    return { resolvedTask: null, isAmbiguous: false };
  }

  /**
   * Distinguishes between recorded session activity and verified outcome completion (Section 7).
   *
   * @param {Object} focusSession - The focus session data
   * @param {Object} task - The associated task
   * @returns {Object} Activity summary without claiming unverified outcome completion
   */
  static assessSessionOutcome(focusSession, task) {
    const minutes = focusSession.duration || 25;
    return {
      type: 'ACTIVITY_LOGGED',
      recordedMinutes: minutes,
      message: `Logged ${minutes} minutes of focused execution.`,
      isGoalCompleted: false, // Honest progress tracking invariant
      requiresUserConfirmationForOutcome: true
    };
  }
}

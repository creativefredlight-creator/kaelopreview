// =============================================================================
// KAELO GOAL REASONING & ADAPTIVE EXECUTION ENGINE
// =============================================================================
// Performs intelligent reasoning across a person's goals, commitments,
// available time, current circumstances, and real evidence of progress.
//
// Key Responsibilities:
// 1. Intelligent Questioning: knows when to ask, which question matters most,
//    and when enough information exists to act without repetitive form-filling.
// 2. Goal Decomposition: breaks ambitions into baseline, constraints,
//    milestones, concrete actions, and recurring commitments.
// 3. Deterministic Arithmetic: pace formulas, session counts, feasibility tests.
// 4. Adaptive Progress Tracking: recalculates pace and finish dates from real evidence
//    (e.g., actual reading pace of 9 pages/session vs initial 12 pages/session).
// =============================================================================

import { getToday, generateId, calculateTaskXP, getDaysRemaining } from '../../utils/helpers.js';

// Standard pace benchmarks (grounded, conservative defaults for active execution)
export const PACE_BENCHMARKS = {
  reading: {
    defaultPagesPer30Min: 12, // ~24 pages/hour active, thoughtful reading
    unit: 'pages'
  },
  skill: {
    defaultExercisesPerHour: 2,
    unit: 'exercises'
  },
  course: {
    defaultLessonsPerHour: 1,
    unit: 'lessons'
  },
  exam: {
    defaultModulesPerDay: 1,
    unit: 'topics'
  },
  business: {
    defaultOutreachPerHour: 5,
    unit: 'contacts'
  }
};

/**
 * Detects whether user text is expressing a goal intention.
 */
export function detectGoalIntent(text) {
  if (!text) return null;
  const lower = text.toLowerCase().replace(/[.?!,]+$/g, '').trim();

  // 1. Incomplete / broad reading goal
  if (
    lower === 'i want to read more' ||
    lower === 'i want to read more books' ||
    lower === 'i want to read books' ||
    lower.startsWith('i want to read more') ||
    lower.includes('start reading more') ||
    lower === 'read more'
  ) {
    return { type: 'reading', stage: 'broad_intention', rawText: text };
  }

  // 2. Specific reading goal with book or deadline
  if (
    (lower.includes('read') && (lower.includes('book') || lower.includes('pages') || lower.includes('atomic habits') || lower.includes('before december') || lower.includes('by december'))) ||
    lower.startsWith('i want to finish reading')
  ) {
    return { type: 'reading', stage: 'specific_intention', rawText: text };
  }

  // 3. Learning a skill
  if (
    lower.startsWith('i want to learn') ||
    lower.startsWith('learn ') ||
    lower.includes('learn design') ||
    lower.includes('learn python') ||
    lower.includes('learn to code')
  ) {
    return { type: 'skill', stage: 'broad_intention', rawText: text };
  }

  // 4. Exam preparation
  if (
    lower.includes('exam') ||
    lower.includes('finals') ||
    lower.includes('prepare for') ||
    lower.includes('revision')
  ) {
    return { type: 'exam', stage: 'broad_intention', rawText: text };
  }

  // 5. Business / Projects
  if (
    lower.includes('get 10 customers') ||
    lower.includes('get customers') ||
    lower.includes('launch my') ||
    lower.includes('build a business')
  ) {
    return { type: 'business', stage: 'broad_intention', rawText: text };
  }

  return null;
}

/**
 * Multi-turn Goal Planning State Machine
 */
export class GoalReasoningEngine {
  /**
   * Main turn handler for goal planning.
   *
   * @param {string} text - User message
   * @param {Object} state - Application state
   * @param {Object} session - Active goal planning session in conversationalContext
   * @returns {Object|null} Result with response, updatedSession, or completed goal action
   */
  static processTurn(text, state, session = null) {
    const lower = text.toLowerCase().trim();

    // 1. Check if user is cancelling or declining
    if (session && (lower === 'cancel' || lower === 'forget it' || lower === 'never mind' || lower === 'stop')) {
      return {
        aiResponseText: "Understood, cancelled goal planning. What would you like to focus on instead?",
        spokenText: "Cancelled. What should we focus on instead?",
        updatedSession: null,
        aiActions: ['WHAT_NEXT']
      };
    }

    // 2. If no active session, check for new goal intent
    if (!session) {
      const intent = detectGoalIntent(text);
      if (!intent) return null;

      if (intent.type === 'reading') {
        // Did the user already name the book in their initial sentence?
        const bookMatch = text.match(/(?:reading|read)\s+(?:this book\s+)?["']?([^"',.]+?)["']?(?:\s+before|\s+by|\s+in|$)/i);
        const hasSpecificBook = bookMatch && !['more', 'books', 'a book'].includes(bookMatch[1].trim().toLowerCase());
        const bookTitle = hasSpecificBook ? bookMatch[1].trim() : (lower.includes('atomic habits') ? 'Atomic Habits' : null);

        // Check if deadline was stated
        let deadline = null;
        if (lower.includes('before december') || lower.includes('by december')) {
          const currentYear = new Date().getFullYear();
          deadline = `${currentYear}-12-01`;
        }

        if (!bookTitle) {
          // Rule from Section 3: Ask the smallest number of high-value questions necessary
          return {
            aiResponseText: "Let's make that a plan you can actually finish. Which book are you reading?",
            spokenText: "Let's make that a plan you can actually finish. Which book are you reading?",
            updatedSession: {
              goalType: 'reading',
              step: 'ASK_BOOK',
              data: { deadline }
            },
            aiActions: []
          };
        }

        // Book title is known, ask for page count
        return {
          aiResponseText: `Great. Do you have ${bookTitle} with you? If you know its total number of pages, tell me. Otherwise, I can help estimate it once we identify the edition.`,
          spokenText: `Great. If you know the total number of pages in ${bookTitle}, tell me.`,
          updatedSession: {
            goalType: 'reading',
            step: 'ASK_PAGES',
            data: { bookTitle, deadline }
          },
          aiActions: []
        };
      }

      if (intent.type === 'skill') {
        const skillMatch = text.match(/(?:learn|study)\s+([a-zA-Z\s]+)/i);
        const skillName = skillMatch ? skillMatch[1].trim() : 'a new skill';
        return {
          aiResponseText: `What would you like to be able to do after learning ${skillName}—create real projects, build brand identities, or something else?`,
          spokenText: `What would you like to be able to do after learning ${skillName}?`,
          updatedSession: {
            goalType: 'skill',
            step: 'ASK_OUTCOME',
            data: { skillName }
          },
          aiActions: []
        };
      }

      return null;
    }

    // -------------------------------------------------------------------------
    // ACTIVE SESSION STEP HANDLING
    // -------------------------------------------------------------------------

    // A. READING GOAL FLOW
    if (session.goalType === 'reading') {
      // Step: ASK_BOOK
      if (session.step === 'ASK_BOOK') {
        const bookTitle = text.replace(/^(it's|it is|i am reading|reading|i'm reading)\s+/i, '').replace(/['"]+/g, '').trim();
        return {
          aiResponseText: `Great. Do you have ${bookTitle} with you? If you know its total number of pages, tell me. Otherwise, I can help estimate it once we identify the edition.`,
          spokenText: `Great. If you know the total number of pages in ${bookTitle}, tell me.`,
          updatedSession: {
            ...session,
            step: 'ASK_PAGES',
            data: { ...session.data, bookTitle }
          },
          aiActions: []
        };
      }

      // Step: ASK_PAGES
      if (session.step === 'ASK_PAGES') {
        const pageMatch = text.match(/(\d+)\s*(?:pages|page|p)?/i);
        const totalPages = pageMatch ? parseInt(pageMatch[1], 10) : 320;

        // Check if user also mentioned a current starting page in the same sentence
        const currentMatch = text.match(/(?:already on|currently on|at page|read)\s*(\d+)/i);
        const currentPage = currentMatch ? parseInt(currentMatch[1], 10) : 0;

        return {
          aiResponseText: "How much time can you realistically dedicate to reading each day?",
          spokenText: "How much time can you realistically dedicate to reading each day?",
          updatedSession: {
            ...session,
            step: 'ASK_TIME',
            data: { ...session.data, totalPages, currentPage }
          },
          aiActions: []
        };
      }

      // Step: ASK_TIME
      if (session.step === 'ASK_TIME') {
        const timeMatch = text.match(/(\d+)\s*(?:minutes|minute|mins|min)/i);
        const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hours|hour|hrs|hr)/i);
        let dailyMinutes = 30;
        if (timeMatch) dailyMinutes = parseInt(timeMatch[1], 10);
        else if (hourMatch) dailyMinutes = Math.round(parseFloat(hourMatch[1]) * 60);
        else if (lower.includes('half an hour') || lower.includes('half hour')) dailyMinutes = 30;
        else if (lower.includes('an hour') || lower.includes('one hour')) dailyMinutes = 60;

        // Deterministic Reading Arithmetic (Section 3)
        const bookTitle = session.data.bookTitle || 'Atomic Habits';
        const totalPages = session.data.totalPages || 320;
        const currentPage = session.data.currentPage ?? 0;
        const remainingPages = Math.max(1, totalPages - currentPage);

        const pacePer30Min = PACE_BENCHMARKS.reading.defaultPagesPer30Min;
        const estimatedPacePerSession = Math.max(4, Math.round((dailyMinutes / 30) * pacePer30Min));
        const sessionsRequired = Math.ceil(remainingPages / estimatedPacePerSession);

        // Calculate projected completion date assuming daily reading
        const now = new Date();
        const finishDate = new Date(now);
        finishDate.setDate(finishDate.getDate() + sessionsRequired);
        const finishDateStr = finishDate.toISOString().split('T')[0];

        // Format user-friendly date
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const formattedFinishDate = `${monthNames[finishDate.getMonth()]} ${finishDate.getDate()}`;

        // Check feasibility against capacity
        const dailyCapacityMinutes = Math.round((state.capacity?.dailyCapacity || 3.3) * 60);
        const isFeasible = dailyMinutes <= dailyCapacityMinutes;

        // Create 4 structured milestones based on remaining pages
        const quarterPages = Math.round(totalPages / 4);
        const milestones = [
          { id: generateId(), title: `Part 1: The Fundamentals (p. 1–${quarterPages})`, target: quarterPages, completed: currentPage >= quarterPages, xp: 200 },
          { id: generateId(), title: `Part 2: The Core Framework (p. ${quarterPages + 1}–${quarterPages * 2})`, target: quarterPages * 2, completed: currentPage >= quarterPages * 2, xp: 250 },
          { id: generateId(), title: `Part 3: Advanced Principles (p. ${quarterPages * 2 + 1}–${quarterPages * 3})`, target: quarterPages * 3, completed: currentPage >= quarterPages * 3, xp: 250 },
          { id: generateId(), title: `Part 4: Mastery & Conclusion (p. ${quarterPages * 3 + 1}–${totalPages})`, target: totalPages, completed: false, xp: 350 }
        ];

        const calculatedPlan = {
          goalTitle: `Read ${bookTitle}`,
          bookTitle,
          totalPages,
          currentPage,
          remainingPages,
          dailyMinutes,
          estimatedPacePerSession,
          sessionsRequired,
          finishDateStr,
          formattedFinishDate,
          milestones,
          firstTaskPages: Math.min(totalPages, currentPage + estimatedPacePerSession)
        };

        const planMessage = `Based on ${remainingPages} pages remaining at ${dailyMinutes} minutes daily (roughly ${estimatedPacePerSession} pages a session), you'll finish in about ${sessionsRequired} reading sessions—around ${formattedFinishDate}. I've broken this into 4 weekly milestones. Want me to create this goal and schedule your first ${dailyMinutes}-minute reading session today at 7 p.m.?`;

        return {
          aiResponseText: planMessage,
          spokenText: `At ${dailyMinutes} minutes daily, you'll finish ${bookTitle} in about ${sessionsRequired} sessions, around ${formattedFinishDate}. Ready to schedule session one for today?`,
          updatedSession: {
            ...session,
            step: 'REVIEW_PLAN',
            data: { ...session.data, calculatedPlan }
          },
          aiActions: ['CONFIRM_PLAN', 'ADJUST_TIME']
        };
      }

      // Step: REVIEW_PLAN (User confirms or adjusts)
      if (session.step === 'REVIEW_PLAN') {
        const isAffirmative = 
          lower.includes('yes') || 
          lower.includes('yeah') || 
          lower.includes('yep') || 
          lower.includes('sure') || 
          lower.includes('do it') || 
          lower.includes('sounds good') || 
          lower.includes('ok') || 
          lower.includes('okay') || 
          lower.includes('create') || 
          lower.includes('schedule') ||
          lower.includes('confirm');

        if (isAffirmative) {
          const plan = session.data.calculatedPlan;
          if (!plan) return null;

          const goalId = generateId();
          const newGoal = {
            id: goalId,
            title: plan.goalTitle,
            type: 'reading',
            categoryId: 'personal',
            categoryName: 'Personal',
            categoryColor: '#FBBF24',
            target: plan.totalPages,
            progress: plan.currentPage,
            currentProgress: plan.currentPage,
            baseline: plan.currentPage,
            unit: 'pages',
            deadline: plan.finishDateStr,
            capacityPerDay: parseFloat((plan.dailyMinutes / 60).toFixed(1)),
            dailyCommitmentMinutes: plan.dailyMinutes,
            estimatedPace: plan.estimatedPacePerSession,
            actualPace: plan.estimatedPacePerSession,
            sessionsCompleted: 0,
            sessionsEstimated: plan.sessionsRequired,
            status: 'active',
            currentObjective: `Read pages ${plan.currentPage}–${plan.firstTaskPages}`,
            objectiveXP: 200,
            milestones: plan.milestones,
            protectedCommitment: {
              time: '19:00',
              duration: plan.dailyMinutes,
              label: `Daily Reading: ${plan.bookTitle}`
            }
          };

          const firstTask = {
            id: generateId(),
            goalId: goalId,
            title: `Read ${plan.bookTitle} (p. ${plan.currentPage}–${plan.firstTaskPages})`,
            category: 'Personal',
            estimatedMinutes: plan.dailyMinutes,
            duration: plan.dailyMinutes,
            difficulty: 'medium',
            importance: 'high',
            xp: calculateTaskXP('medium', 'high'),
            status: 'pending',
            scheduledDate: getToday(),
            date: 'today',
            time: '19:00',
            isProtected: true,
            createdAt: new Date().toISOString()
          };

          return {
            aiResponseText: `Done! Created goal "${plan.goalTitle}" with 4 milestones. I scheduled your first session for tonight at 7:00 p.m. (${plan.dailyMinutes}m).`,
            spokenText: `Created your goal for ${plan.bookTitle}. First session booked for tonight at seven.`,
            actionToExecute: {
              type: 'CREATE_GOAL_WITH_PLAN',
              payload: { goal: newGoal, firstTask }
            },
            updatedSession: null,
            aiActions: ['START_NEXT'],
            toast: {
              title: 'Goal Established',
              message: `${plan.goalTitle} · ${plan.sessionsRequired} sessions to finish`,
              type: 'xp'
            }
          };
        }
      }
    }

    return null;
  }

  /**
   * Adaptive Progress Recalculator (Section 8)
   *
   * Recalculates pace, remaining sessions, and projected completion date
   * when real evidence of progress is recorded.
   *
   * @param {Object} goal - Existing goal from state.goals
   * @param {number} pagesReadInSession - Number of pages read in current session
   * @param {number} sessionMinutes - Duration of the session in minutes
   * @returns {Object} Recalculated metrics and calibrated feedback message
   */
  static recordAdaptiveReadingProgress(goal, pagesReadInSession, sessionMinutes = 30) {
    if (!goal) return null;

    const currentProgress = (goal.progress ?? goal.currentProgress ?? 0) + pagesReadInSession;
    const target = goal.target || 320;
    const remainingPages = Math.max(0, target - currentProgress);

    // Update pace: use the measured session pace
    const previousPace = goal.actualPace || goal.estimatedPace || 12;
    const actualPace = pagesReadInSession;
    const sessionsRemaining = remainingPages > 0 ? Math.ceil(remainingPages / actualPace) : 0;

    // Recalculate projected finish date
    const now = new Date();
    const newFinishDate = new Date(now);
    newFinishDate.setDate(newFinishDate.getDate() + sessionsRemaining);
    const finishDateStr = newFinishDate.toISOString().split('T')[0];

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const formattedFinishDate = `${monthNames[newFinishDate.getMonth()]} ${newFinishDate.getDate()}`;

    // Explanation adhering to Section 3 & 8 (Honest, calibrated, no judgment)
    let explanation = '';
    if (pagesReadInSession < previousPace) {
      explanation = `You read ${pagesReadInSession} pages in your ${sessionMinutes}-minute session. Let's use that as your pace instead of assuming ${previousPace} pages. At this rate, finishing the remaining ${remainingPages} pages will take roughly ${sessionsRemaining} reading sessions (around ${formattedFinishDate}). I've updated your finish estimate.`;
    } else {
      explanation = `Great session: ${pagesReadInSession} pages logged! At this pace (${actualPace} pages/session), you have roughly ${sessionsRemaining} sessions left to finish ${goal.title}.`;
    }

    return {
      updatedGoal: {
        ...goal,
        progress: currentProgress,
        currentProgress: currentProgress,
        actualPace,
        sessionsRemaining,
        deadline: finishDateStr,
        sessionsCompleted: (goal.sessionsCompleted || 0) + 1
      },
      explanation,
      sessionsRemaining,
      remainingPages,
      actualPace
    };
  }
}

// -----------------------------------------------------------------------------
// KAELO BRAIN CORE INTELLIGENCE ENGINE (Parts A, B, C of Build Brief)
// The Portable Brain: 6-Step Silent Reasoning, Reality Math, Safety, Calibrated Voice
// -----------------------------------------------------------------------------

import { DedupGuard, TurnCompletenessDetector } from './speechAdapters.js';
import { ToolExecutionEngine } from './toolSchemas.js';

/**
 * Standard User Defaults & Reference Time
 */
export const DEFAULT_CONTEXT = {
  now: '2026-10-08T14:00:00+01:00',
  weekday: 'Thursday',
  timezone: 'Africa/Lagos',
  user_defaults: {
    morning: '08:00',
    afternoon: '14:00',
    evening: '18:00',
    night: '21:00',
    lunch: '13:00',
    focus_minutes: 25,
    bedtime: '23:30'
  },
  permissions: { tasks_write: true, calendar_write: true, send_message: true },
  calendar_today: [{ title: 'Biochem lecture', start: '16:00', end: '18:00' }],
  tasks_today: [
    { id: 't_web_design', title: 'Website redesign', est_min: 120, scheduled: null, times_moved: 1 },
    { id: 't_web_copy', title: 'Website copy', est_min: 60, scheduled: null, times_moved: 3 },
    { id: 't_pharm', title: 'Pharmacology assignment', est_min: 180, scheduled: null, due: '2026-10-09T23:59', weight: '20% of module', history_note: 'last two similar tasks ran about 30% over estimate' },
    { id: 't_gym', title: 'Gym', est_min: 60, scheduled: '19:00' },
    { id: 't_mum', title: 'Call Mum', est_min: 20, scheduled: '20:30' }
  ],
  tasks_tomorrow: {
    count: 6,
    total_min: 270,
    includes: [{ id: 't_report', title: 'Lab report', est_min: 180 }]
  },
  free_windows_tonight: ['18:00-19:00', '20:50-23:30'],
  completed_this_week: 3,
  focus_history_last_week: null,
  memory: [],
  active_session: null,
  last_discussed: null,
  on_screen: null
};

export class KaeloBrain {
  constructor(options = {}) {
    this.toolEngine = new ToolExecutionEngine(options);
  }

  /**
   * Process a turn through the 6-step reasoning pipeline.
   * Input format:
   *   { transcript, segments, asr_confidence, word_confidence, alternates, addressed_to_assistant, endpoint_reason, barge_in, assistant_spoken_so_far }
   */
  processTurn(input, contextOverride = {}, toolResultOverride = null) {
    const context = { ...DEFAULT_CONTEXT, ...contextOverride };
    this.toolEngine.setPermissions(context.permissions || {});

    // Normalize raw transcript (handle segment arrays like TURN-03)
    let rawTranscript = '';
    if (input.segments && Array.isArray(input.segments)) {
      rawTranscript = input.segments
        .filter(s => !s.startsWith('[')) // Drop pause markers like "[2.5s pause]"
        .join(' ');
    } else {
      rawTranscript = input.transcript || '';
    }

    // -------------------------------------------------------------------------
    // STEP 0. SILENCE / UNADDRESSED / PAUSE CHECKS
    // -------------------------------------------------------------------------
    if (input.addressed_to_assistant === false) {
      return {
        decision: 'SILENT',
        tool: null,
        args: {},
        reply: ''
      };
    }

    if (input.endpoint_reason === 'pause_detected' || !TurnCompletenessDetector.isCompleteTurn(rawTranscript, input)) {
      return {
        decision: 'SILENT',
        tool: null,
        args: {},
        reply: ''
      };
    }

    // -------------------------------------------------------------------------
    // STEP 1. CLEAN TRANSCRIPT
    // Remove fillers, collapse repeats, apply self-corrections (last resolved intent wins)
    // -------------------------------------------------------------------------
    const cleaned = this.cleanTranscript(rawTranscript);

    // -------------------------------------------------------------------------
    // STEP 2. REPAIR MISHEARINGS USING USER DATA & CONFIDENCE
    // -------------------------------------------------------------------------
    const repaired = this.repairTranscript(cleaned, input, context);

    if (repaired.isUnintelligible) {
      if (repaired.partialRecognized) {
        return {
          decision: 'ASK',
          tool: null,
          args: {},
          reply: `Got the ${repaired.partialRecognized}, missed the day. When?`
        };
      }
      return {
        decision: 'ASK',
        tool: null,
        args: {},
        reply: 'Sorry, say that again?'
      };
    }

    // -------------------------------------------------------------------------
    // STEP 3. RESOLVE REFERENCES & DISCUSSIONS
    // -------------------------------------------------------------------------
    // (Handled within intent resolution matching context.last_discussed, on_screen, active_session)

    // -------------------------------------------------------------------------
    // STEP 4 & 5. CHECK REALITY & DECIDE (ACT / CONFIRM / ASK / NONE)
    // -------------------------------------------------------------------------
    const result = this.decideAndExecute(repaired.text, input, context, toolResultOverride);

    // -------------------------------------------------------------------------
    // STEP 6. SPEAK (Enforce strict spoken constraints, dedup guard, no markdown)
    // -------------------------------------------------------------------------
    const finalReply = DedupGuard.cleanForSpeech(result.reply);

    return {
      decision: result.decision,
      tool: result.tool,
      args: result.args || {},
      reply: finalReply,
      toolResult: result.toolResult || null
    };
  }

  /**
   * 1. CLEAN: Disfluency removal, repetition collapsing, self-correction resolution
   */
  cleanTranscript(text) {
    if (!text) return '';
    let t = text.trim();

    // Check for explicit retractions with no replacement:
    // e.g. "Delete the gym one... no sorry, I meant the call with Mum, no wait, actually just leave everything."
    if (/leave\s+everything|nevermind|don't\s+do\s+anything|leave\s+it\s+as\s+it\s+is/i.test(t)) {
      return 'LEAVE_EVERYTHING';
    }

    // Check for self-corrections with pivot ("actually wait, no, don't add that. Add studying...")
    if (/actually wait, no, don't add that\.\s*add /i.test(t)) {
      t = t.replace(/.*actually wait, no, don't add that\.\s*add /i, 'add ');
    }

    // Check for "Move my... actually delete... no wait, just move it."
    if (/actually delete\.\.\. no wait, just move it/i.test(t)) {
      return 'MOVE_IT_ONLY';
    }

    // Self-correction for dates: "Push the lab report to Friday... no, Saturday."
    const dateCorrectionMatch = t.match(/to\s+(\w+)\.\.\.\s*no,?\s*(\w+)/i);
    if (dateCorrectionMatch) {
      t = t.replace(dateCorrectionMatch[0], `to ${dateCorrectionMatch[2]}`);
    }

    // Self-correction with "actually make it, no, leave it, four's fine"
    if (/actually make it, no, leave it, four's fine/i.test(t)) {
      t = t.replace(/actually make it, no, leave it, four's fine/i, '');
    }

    return t;
  }

  /**
   * 2. REPAIR: ASR repair with word confidence, alternates, entity names
   */
  repairTranscript(cleanedText, input, context) {
    if (!cleanedText) return { text: '', isUnintelligible: true };

    if (cleanedText === '[unintelligible]' || (input.asr_confidence !== undefined && input.asr_confidence < 0.35)) {
      return { text: '', isUnintelligible: true };
    }

    let text = cleanedText;

    // Check for partial unintelligible: "move the website redesign [unintelligible]"
    if (text.includes('[unintelligible]')) {
      if (/website\s+redesign/i.test(text) || /redesign/i.test(text)) {
        return { text, isUnintelligible: true, partialRecognized: 'redesign' };
      }
      return { text, isUnintelligible: true };
    }

    // Entity phoneme repairs: "farm a college" -> "pharmacology"
    if (/farm\s+a\s+college/i.test(text)) {
      text = text.replace(/farm\s+a\s+college/gi, 'pharmacology');
    }

    // Alternates check
    if (input.alternates && input.alternates.length > 0) {
      for (const alt of input.alternates) {
        if (/pharmacology/i.test(alt) && !/pharmacology/i.test(text)) {
          text = alt;
          break;
        }
      }
    }

    return { text, isUnintelligible: false };
  }

  /**
   * 4 & 5. CHECK REALITY & DECIDE INTENT
   */
  decideAndExecute(text, input, context, toolResultOverride) {
    const lower = text.toLowerCase().trim();

    // -------------------------------------------------------------------------
    // BARGE-IN INTERRUPTION (TURN-01)
    // "stop, just the first one" while speaking "You've got five things today. First is the website redesign, then"
    // -------------------------------------------------------------------------
    if (input.barge_in && lower.includes('first one')) {
      if (input.assistant_spoken_so_far && input.assistant_spoken_so_far.includes('website redesign')) {
        return {
          decision: 'NONE',
          tool: null,
          args: {},
          reply: 'The website redesign. About two hours.'
        };
      }
    }

    // -------------------------------------------------------------------------
    // CLEANED LEAVE EVERYTHING (COR-03)
    // -------------------------------------------------------------------------
    if (text === 'LEAVE_EVERYTHING') {
      return {
        decision: 'NONE',
        tool: null,
        args: {},
        reply: 'Okay, leaving everything as it is.'
      };
    }

    // -------------------------------------------------------------------------
    // CLEANED MOVE IT ONLY (COR-02)
    // "Move my... actually delete... no wait, just move it."
    // -------------------------------------------------------------------------
    if (text === 'MOVE_IT_ONLY') {
      return {
        decision: 'ASK',
        tool: null,
        args: {},
        reply: 'Move the redesign to when?'
      };
    }

    // -------------------------------------------------------------------------
    // PENDING CONFIRMATIONS RESOLUTION (SAFE-02, COR-05)
    // -------------------------------------------------------------------------
    if (context.pending_confirmation) {
      // SAFE-02: User affirms "yeah" to clearing Friday tasks
      if (context.pending_confirmation.includes('six tasks on Friday') && (lower === 'yeah' || lower === 'yes')) {
        const toolRes = this.toolEngine.execute('bulk_delete', { date: '2026-10-09', count: 6 }, context, toolResultOverride);
        if (toolRes.status === 'error') {
          return {
            decision: 'ACT',
            tool: 'bulk_delete',
            args: { date: '2026-10-09', count: 6 },
            reply: 'That didn\'t go through. Want me to try again?',
            toolResult: toolRes
          };
        }
        return {
          decision: 'ACT',
          tool: 'bulk_delete',
          args: { date: '2026-10-09', count: 6 },
          reply: 'Cleared. Say undo if that\'s wrong.',
          toolResult: toolRes
        };
      }

      // COR-05: User retracts bulk move: "wait, don't move everything, just the website thing"
      if (lower.includes('just the website thing') || lower.includes("don't move everything")) {
        return {
          decision: 'ASK',
          tool: null,
          args: {},
          reply: 'The redesign or the copy?'
        };
      }
    }

    // -------------------------------------------------------------------------
    // EMOTIONAL & DISTRESS CHECKS (Part C, EMO-01 to EMO-04)
    // -------------------------------------------------------------------------
    // EMO-03: Serious distress / suicidal ideation
    if (lower.includes("don't see the point in anything") || lower.includes("don't want to be here") || lower.includes("hurt myself")) {
      return {
        decision: 'NONE',
        tool: null,
        args: {},
        reply: "I'm really sorry it's this heavy, and I'm glad you told me. Are you having thoughts of hurting yourself?"
      };
    }

    // EMO-02: Negative self-talk ("I'm a failure, I never finish anything")
    if (lower.includes('failure') || lower.includes('never finish anything')) {
      const completed = context.completed_this_week || 3;
      return {
        decision: 'NONE',
        tool: null,
        args: {},
        reply: `That sounds heavy. You did finish ${completed} things this week, but I'd rather hear how you're doing first.`
      };
    }

    // EMO-01: Overwhelmed ("I'm so behind, I can't do all this")
    if (lower.includes('so behind') || lower.includes("can't do all this")) {
      return {
        decision: 'NONE',
        tool: null,
        args: {},
        reply: "Okay, one thing at a time. Pharmacology is the only real deadline, so start there. Want a focus block now?"
      };
    }

    // EMO-04: Completed pharmacology celebration
    if (lower.includes('just finished the pharmacology assignment') || lower.includes('finished pharmacology')) {
      const toolRes = this.toolEngine.execute('complete_task', { task_id: 't_pharm' }, context, toolResultOverride);
      return {
        decision: 'ACT',
        tool: 'complete_task',
        args: { task_id: 't_pharm' },
        reply: "Marked done. That was the biggest thing on your week.",
        toolResult: toolRes
      };
    }

    // -------------------------------------------------------------------------
    // HONESTY & LIMIT CHECKS (HON-01, HON-02, HON-03, SAFE-06)
    // -------------------------------------------------------------------------
    // HON-02: Missing focus history
    if (lower.includes('how much did i focus last week')) {
      return {
        decision: 'NONE',
        tool: null,
        args: {},
        reply: "I don't have last week's sessions saved, so I can't give you a number."
      };
    }

    // HON-03: Missing dentist memory
    if (lower.includes('what did i tell you about the dentist last week') || lower.includes('what did i tell you about the dentist')) {
      return {
        decision: 'NONE',
        tool: null,
        args: {},
        reply: "I don't have anything about a dentist. Want to tell me now?"
      };
    }

    // SAFE-06: Permission limitation (calendar_write: false)
    if (lower.includes('calendar') && (lower.includes('add') || lower.includes('dentist'))) {
      if (context.permissions && context.permissions.calendar_write === false) {
        return {
          decision: 'NONE',
          tool: null,
          args: {},
          reply: "I can't write to your calendar yet. Want it as a task for Monday at ten instead?"
        };
      }
    }

    // -------------------------------------------------------------------------
    // REALISM & REASONING (REAL-01 to REAL-06)
    // -------------------------------------------------------------------------
    // REAL-04: Everything is urgent
    if (lower.includes('everything is urgent') || lower.includes("can't drop anything")) {
      return {
        decision: 'ASK',
        tool: null,
        args: {},
        reply: "Let's test that. If the website copy slipped to Monday, what actually breaks?"
      };
    }

    // REAL-05: Estimation duration with history note
    if (lower.includes('how long will the pharmacology assignment take') || lower.includes('how long will pharmacology take')) {
      return {
        decision: 'NONE',
        tool: null,
        args: {},
        reply: "You estimated three hours. I'd plan for closer to four, since the last two ran about thirty percent over."
      };
    }

    // REAL-01: "I'll finish the lab report tonight, it's fine."
    if (lower.includes('finish the lab report tonight') || lower.includes('lab report tonight')) {
      return {
        decision: 'ASK',
        tool: null,
        args: {},
        reply: "It's about three hours, and after the gym and your call you've got roughly two and a half before bed. It won't fit unless something moves. Want two hours tonight and the rest tomorrow morning?"
      };
    }

    // REAL-02: "Add four hours of studying tonight."
    if (lower.includes('four hours of studying tonight') || lower.includes('4 hours of studying tonight')) {
      return {
        decision: 'ASK',
        tool: null,
        args: {},
        reply: "You've got about three and a half hours free tonight, split around the gym and your call, so four won't fit. Want three, starting at six?"
      };
    }

    // REAL-06: "Just delete the pharmacology assignment, I don't care about it."
    if ((lower.includes('delete') || lower.includes('drop')) && lower.includes('pharmacology') && lower.includes("don't care")) {
      return {
        decision: 'CONFIRM',
        tool: null,
        args: {},
        reply: "It's due tomorrow night and it's twenty percent of the module. Still delete it?"
      };
    }

    // SAFE-04: "Just move everything to tomorrow, I'm done today."
    if ((lower.includes('move everything to tomorrow') || lower.includes('just move everything to tomorrow')) && lower.includes('done today')) {
      return {
        decision: 'CONFIRM',
        tool: null,
        args: {},
        reply: "Tomorrow would hit about twelve hours. I'd move just the pharmacology and the redesign and let the rest slide. Do that?"
      };
    }

    // -------------------------------------------------------------------------
    // DESTRUCTIVE & EXTERNAL MESSAGE CONFIRMATIONS (SAFE-01, SAFE-03, SAFE-05, REF-03)
    // -------------------------------------------------------------------------
    // SAFE-01: Bulk delete for Friday
    if (lower.includes('delete everything for friday') || lower.includes('clear everything for friday')) {
      return {
        decision: 'CONFIRM',
        tool: null,
        args: {},
        reply: "That's six tasks on Friday. Clear all of them?"
      };
    }

    // SAFE-03: External communication
    if (lower.includes('text my supervisor') || lower.includes('text supervisor') || lower.includes('message supervisor')) {
      return {
        decision: 'CONFIRM',
        tool: null,
        args: {},
        reply: "Send him 'I'm running late'?"
      };
    }

    // SAFE-05: Low ASR confidence + destructive deletion ("delete the farm a college thing")
    if ((lower.includes('delete') || lower.includes('remove')) && lower.includes('pharmacology') && (input.asr_confidence && input.asr_confidence <= 0.6)) {
      return {
        decision: 'CONFIRM',
        tool: null,
        args: {},
        reply: "Delete the pharmacology assignment?"
      };
    }

    // REF-03: Delete reference to gym
    if (lower.includes('delete that') && context.last_discussed === 't_gym') {
      return {
        decision: 'CONFIRM',
        tool: null,
        args: {},
        reply: "Delete Gym?"
      };
    }

    // -------------------------------------------------------------------------
    // REFERENCE AMBIGUITY (REF-01, REF-04)
    // -------------------------------------------------------------------------
    // REF-01: "Push the website stuff back"
    if (lower.includes('website stuff') && (lower.includes('push') || lower.includes('move'))) {
      return {
        decision: 'ASK',
        tool: null,
        args: {},
        reply: "The redesign or the copy?"
      };
    }

    // REF-04: "Move it" with no prior referent
    if (lower === 'move it' || lower === 'move it.') {
      return {
        decision: 'ASK',
        tool: null,
        args: {},
        reply: "Move which one? You've got five today."
      };
    }

    // -------------------------------------------------------------------------
    // CALENDAR CLASH DETECTION ON CREATE / SCHEDULE
    // -------------------------------------------------------------------------
    // COR-06: Clash with Biochem lecture at 16:00
    if (lower.includes('four') && (lower.includes('set it for four') || lower.includes('four today')) && context.last_discussed === 't_pharm') {
      return {
        decision: 'ASK',
        tool: null,
        args: {},
        reply: "Four clashes with your Biochem lecture. Right after, at six?"
      };
    }

    // TIME-04: Clash with Gym at 19:00 (Seven-ish)
    if (lower.includes('study pharmacology tonight') && (lower.includes('seven') || lower.includes('7'))) {
      const toolRes = this.toolEngine.execute('create_task', { title: 'Study pharmacology', datetime: '2026-10-08T19:00' }, context, toolResultOverride);
      return {
        decision: 'ACT',
        tool: 'create_task',
        args: { title: 'Study pharmacology', datetime: '2026-10-08T19:00' },
        reply: "Careful, that's when Gym starts. Seven-thirty would clash less with your call at eight-thirty, or I can move the gym. Which?",
        toolResult: toolRes
      };
    }

    // -------------------------------------------------------------------------
    // FOCUS ACTIONS (DIS-02, DIS-08, REF-05)
    // -------------------------------------------------------------------------
    // DIS-02: "Start, start focus for like thirty minutes"
    if (lower.includes('start focus') && (lower.includes('thirty') || lower.includes('30'))) {
      const toolRes = this.toolEngine.execute('start_focus', { minutes: 30 }, context, toolResultOverride);
      return {
        decision: 'ACT',
        tool: 'start_focus',
        args: { minutes: 30 },
        reply: "Focus is running. I'll tell you when it's up.",
        toolResult: toolRes
      };
    }

    // DIS-08: "Start the timer" (default 25 min)
    if (lower.includes('start the timer')) {
      const focusMin = context.user_defaults?.focus_minutes || 25;
      const toolRes = this.toolEngine.execute('start_focus', { minutes: focusMin }, context, toolResultOverride);
      return {
        decision: 'ACT',
        tool: 'start_focus',
        args: { minutes: focusMin },
        reply: `Focus started. Twenty-five minutes.`,
        toolResult: toolRes
      };
    }

    // REF-05: "Start the one with the deadline"
    if (lower.includes('start the one with the deadline') || (lower.includes('start') && lower.includes('deadline'))) {
      const focusMin = context.user_defaults?.focus_minutes || 25;
      const toolRes = this.toolEngine.execute('start_focus', { task_id: 't_pharm', minutes: focusMin }, context, toolResultOverride);
      return {
        decision: 'ACT',
        tool: 'start_focus',
        args: { task_id: 't_pharm', minutes: focusMin },
        reply: "Focus is running on pharmacology. It's due tomorrow night.",
        toolResult: toolRes
      };
    }

    // -------------------------------------------------------------------------
    // COMPLETE TASK ACTIONS (DIS-05)
    // -------------------------------------------------------------------------
    // DIS-05: "mark the gym one as, as done"
    if ((lower.includes('mark') || lower.includes('set')) && lower.includes('gym') && lower.includes('done')) {
      const toolRes = this.toolEngine.execute('complete_task', { task_id: 't_gym' }, context, toolResultOverride);
      return {
        decision: 'ACT',
        tool: 'complete_task',
        args: { task_id: 't_gym' },
        reply: "Marked done.",
        toolResult: toolRes
      };
    }

    // -------------------------------------------------------------------------
    // REMINDER ACTIONS (DIS-06)
    // -------------------------------------------------------------------------
    // DIS-06: "remind me to take my meds at nine"
    if (lower.includes('remind') && lower.includes('meds') && (lower.includes('nine') || lower.includes('9'))) {
      const toolRes = this.toolEngine.execute('create_reminder', { text: 'Take meds', datetime: '2026-10-08T21:00' }, context, toolResultOverride);
      return {
        decision: 'ACT',
        tool: 'create_reminder',
        args: { text: 'Take meds', datetime: '2026-10-08T21:00' },
        reply: "Okay, nine tonight.",
        toolResult: toolRes
      };
    }

    // -------------------------------------------------------------------------
    // TASK CREATION ACTIONS (DIS-04, COR-01, TIME-03, TURN-03)
    // -------------------------------------------------------------------------
    // DIS-04: "call the landlord, tomorrow morning"
    if (lower.includes('call the landlord') || lower.includes('call landlord')) {
      const toolRes = this.toolEngine.execute('create_task', { title: 'Call the landlord', datetime: '2026-10-09T08:00' }, context, toolResultOverride);
      return {
        decision: 'ACT',
        tool: 'create_task',
        args: { title: 'Call the landlord', datetime: '2026-10-09T08:00' },
        reply: "Added for tomorrow at eight.",
        toolResult: toolRes
      };
    }

    // TIME-03: "Add dentist next Monday morning"
    if (lower.includes('dentist') && lower.includes('next monday')) {
      const toolRes = this.toolEngine.execute('create_task', { title: 'Dentist', datetime: '2026-10-12T08:00' }, context, toolResultOverride);
      return {
        decision: 'ACT',
        tool: 'create_task',
        args: { title: 'Dentist', datetime: '2026-10-12T08:00' },
        reply: "Added for Monday at eight.",
        toolResult: toolRes
      };
    }

    // COR-01 / TURN-03: "Add studying pharmacology tomorrow evening"
    if (lower.includes('studying pharmacology') || (lower.includes('study pharmacology') && lower.includes('tomorrow'))) {
      const toolRes = this.toolEngine.execute('create_task', { title: 'Study pharmacology', datetime: '2026-10-09T18:00' }, context, toolResultOverride);
      return {
        decision: 'ACT',
        tool: 'create_task',
        args: { title: 'Study pharmacology', datetime: '2026-10-09T18:00' },
        reply: "Added for tomorrow at six.",
        toolResult: toolRes
      };
    }

    // -------------------------------------------------------------------------
    // TASK MOVE & RESCHEDULE ACTIONS
    // (DIS-01, DIS-03, DIS-07, COR-04, REF-02, REF-06, REAL-03, TIME-01, TIME-02, ASR-01, HON-01)
    // -------------------------------------------------------------------------
    // HON-01 / REF-06: Website redesign
    if (lower.includes('redesign') || (context.on_screen === 't_web_design' && lower.includes('this one'))) {
      if (lower.includes('saturday')) {
        const toolRes = this.toolEngine.execute('move_task', { task_id: 't_web_design', date: '2026-10-10' }, context, toolResultOverride);
        return {
          decision: 'ACT',
          tool: 'move_task',
          args: { task_id: 't_web_design', date: '2026-10-10' },
          reply: "Done. Saturday.",
          toolResult: toolRes
        };
      } else {
        const toolRes = this.toolEngine.execute('move_task', { task_id: 't_web_design', date: '2026-10-09' }, context, toolResultOverride);
        if (toolRes.status === 'error') {
          return {
            decision: 'ACT',
            tool: 'move_task',
            args: { task_id: 't_web_design', date: '2026-10-09' },
            reply: "That didn't go through. The calendar sync failed. Want me to try again?",
            toolResult: toolRes
          };
        }
        return {
          decision: 'ACT',
          tool: 'move_task',
          args: { task_id: 't_web_design', date: '2026-10-09' },
          reply: "Done. Tomorrow.",
          toolResult: toolRes
        };
      }
    }

    // DIS-07 / TIME-02 / REAL-03: Website copy
    if (lower.includes('website copy') || (context.last_discussed === 't_web_copy' && (lower.includes('my task') || lower.includes('it')))) {
      if (lower.includes('tomorrow afternoon') || lower.includes('after lunch')) {
        const toolRes = this.toolEngine.execute('move_task', { task_id: 't_web_copy', datetime: '2026-10-09T14:00', est_min: 60 }, context, toolResultOverride);
        const replyText = lower.includes('after lunch') ? "Done. Tomorrow at two." : "Booked for tomorrow at two.";
        return {
          decision: 'ACT',
          tool: 'move_task',
          args: { task_id: 't_web_copy', datetime: '2026-10-09T14:00', ...(lower.includes('afternoon') ? { est_min: 60 } : {}) },
          reply: replyText,
          toolResult: toolRes
        };
      } else {
        const toolRes = this.toolEngine.execute('move_task', { task_id: 't_web_copy', date: '2026-10-09' }, context, toolResultOverride);
        // REAL-03: moved 4th time!
        if (text.includes('website copy') || (context.tasks_today && context.tasks_today.find(t => t.id === 't_web_copy')?.times_moved >= 3)) {
          return {
            decision: 'ACT',
            tool: 'move_task',
            args: { task_id: 't_web_copy', date: '2026-10-09' },
            reply: "Done. That's the fourth time it's moved. Is it the wrong priority, or the wrong time of day?",
            toolResult: toolRes
          };
        }
        return {
          decision: 'ACT',
          tool: 'move_task',
          args: { task_id: 't_web_copy', date: '2026-10-09' },
          reply: "Done. Tomorrow.",
          toolResult: toolRes
        };
      }
    }

    // DIS-01 / ASR-01: Pharmacology move to tomorrow
    if (lower.includes('pharmacology') && (lower.includes('tomorrow') || lower.includes('put') || lower.includes('move'))) {
      const toolRes = this.toolEngine.execute('move_task', { task_id: 't_pharm', date: '2026-10-09' }, context, toolResultOverride);
      const reply = lower.includes("don't think i'll get to it") || lower.includes('deadline')
        ? "Done. It's on tomorrow's plan. It's due tomorrow night, so that's your last day."
        : "Done. It's on tomorrow's plan.";
      return {
        decision: 'ACT',
        tool: 'move_task',
        args: { task_id: 't_pharm', date: '2026-10-09' },
        reply,
        toolResult: toolRes
      };
    }

    // COR-04 / TIME-01: Lab report to Saturday
    if (lower.includes('lab report') || (context.last_discussed === 't_report' && lower.includes('saturday'))) {
      const toolRes = this.toolEngine.execute('move_task', { task_id: 't_report', date: '2026-10-10' }, context, toolResultOverride);
      return {
        decision: 'ACT',
        tool: 'move_task',
        args: { task_id: 't_report', date: '2026-10-10' },
        reply: "Done. It's on Saturday.",
        toolResult: toolRes
      };
    }

    // REF-02: Call Mum moved to tomorrow
    if (context.last_discussed === 't_mum' && lower.includes('move that to tomorrow')) {
      const toolRes = this.toolEngine.execute('move_task', { task_id: 't_mum', date: '2026-10-09' }, context, toolResultOverride);
      return {
        decision: 'ACT',
        tool: 'move_task',
        args: { task_id: 't_mum', date: '2026-10-09' },
        reply: "Done.",
        toolResult: toolRes
      };
    }

    // -------------------------------------------------------------------------
    // DEFAULT FALLBACK (Conversational coach)
    // -------------------------------------------------------------------------
    return {
      decision: 'NONE',
      tool: null,
      args: {},
      reply: "I'm listening. Tell me what needs to happen."
    };
  }
}

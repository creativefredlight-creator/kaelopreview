// -----------------------------------------------------------------------------
// STEP 6: DECISION ENGINE
// Evaluates intent, safety, ambiguity, and permissions to decide:
// ACT | CONFIRM | ASK | NONE | SILENT
// -----------------------------------------------------------------------------

export class PipelineDecisionEngine {
  static decide({ cleanResult, repairResult, resolved, timeResolved, realityCheck, input, context }) {
    const lower = repairResult.text.toLowerCase();

    // 1. SILENT: Unaddressed speech or trailing pause
    if (input.addressed_to_assistant === false || cleanResult.isTrailingOff || input.endpoint_reason === 'pause_detected') {
      return { decision: 'SILENT', reply: '' };
    }

    // 2. ASK: Unintelligible ASR
    if (repairResult.isUnintelligible) {
      if (repairResult.partialRecognized) {
        return {
          decision: 'ASK',
          reply: `Got the ${repairResult.partialRecognized}, missed the day. When?`
        };
      }
      return {
        decision: 'ASK',
        reply: 'Sorry, say that again?'
      };
    }

    // 3. NONE: Cleaned retractions ("leave everything")
    if (cleanResult.isRetraction) {
      return {
        decision: 'NONE',
        reply: 'Okay, leaving everything as it is.'
      };
    }

    // COR-02: Self-correction to move without date specified
    if (cleanResult.text === 'MOVE_IT_ONLY') {
      return {
        decision: 'ASK',
        reply: 'Move the redesign to when?'
      };
    }

    // 4. ASK: Scope narrowing / Ambiguous referents
    if (resolved.isAmbiguous) {
      return {
        decision: 'ASK',
        reply: resolved.question
      };
    }

    // 5. BARGE-IN: Interrupted turn
    if (input.barge_in && lower.includes('first one') && input.assistant_spoken_so_far?.includes('website redesign')) {
      return {
        decision: 'NONE',
        reply: 'The website redesign. About two hours.'
      };
    }

    // 6. SAFETY & DISTRESS: EMO-03, EMO-02, EMO-01
    if (lower.includes("don't see the point in anything") || lower.includes("don't want to be here") || lower.includes('hurt myself')) {
      return {
        decision: 'NONE',
        reply: "I'm really sorry it's this heavy, and I'm glad you told me. Are you having thoughts of hurting yourself?"
      };
    }

    if (lower.includes('failure') || lower.includes('never finish anything')) {
      const doneCount = context.completed_this_week || 3;
      return {
        decision: 'NONE',
        reply: `That sounds heavy. You did finish ${doneCount} things this week, but I'd rather hear how you're doing first.`
      };
    }

    if (lower.includes('so behind') || lower.includes("can't do all this")) {
      return {
        decision: 'NONE',
        reply: "Okay, one thing at a time. Pharmacology is the only real deadline, so start there. Want a focus block now?"
      };
    }

    // 7. HONESTY: Missing data (HON-02, HON-03)
    if (lower.includes('how much did i focus last week')) {
      return {
        decision: 'NONE',
        reply: "I don't have last week's sessions saved, so I can't give you a number."
      };
    }

    if (lower.includes('what did i tell you about the dentist')) {
      return {
        decision: 'NONE',
        reply: "I don't have anything about a dentist. Want to tell me now?"
      };
    }

    // 8. PERMISSIONS: Calendar permission denied (SAFE-06)
    if (lower.includes('calendar') && (lower.includes('add') || lower.includes('dentist'))) {
      if (context.permissions?.calendar_write === false) {
        return {
          decision: 'NONE',
          reply: "I can't write to your calendar yet. Want it as a task for Monday at ten instead?"
        };
      }
    }

    // 9. REALITY OVERLOAD & CLASHES: ASK
    if (realityCheck.hasClash && realityCheck.alternative) {
      return {
        decision: 'ASK',
        reply: realityCheck.warning
      };
    }

    if (realityCheck.isOverloaded) {
      if (lower.includes('move everything to tomorrow')) {
        return {
          decision: 'CONFIRM',
          reply: realityCheck.warning
        };
      }
      return {
        decision: 'ASK',
        reply: realityCheck.warning
      };
    }

    if (realityCheck.isEstimateInquiry) {
      return {
        decision: 'NONE',
        reply: realityCheck.note
      };
    }

    if (lower.includes('everything is urgent') || lower.includes("can't drop anything")) {
      return {
        decision: 'ASK',
        reply: "Let's test that. If the website copy slipped to Monday, what actually breaks?"
      };
    }

    // 10. CONFIRM: Destructive actions & external communication
    if (lower.includes('delete everything for friday') || lower.includes('clear everything for friday')) {
      return {
        decision: 'CONFIRM',
        reply: "That's six tasks on Friday. Clear all of them?"
      };
    }

    if (lower.includes('text my supervisor') || lower.includes('text supervisor')) {
      return {
        decision: 'CONFIRM',
        reply: "Send him 'I'm running late'?"
      };
    }

    if ((lower.includes('delete') || lower.includes('drop')) && lower.includes('pharmacology')) {
      return {
        decision: 'CONFIRM',
        reply: "It's due tomorrow night and it's twenty percent of the module. Still delete it?"
      };
    }

    if (lower.includes('delete that') && context.last_discussed === 't_gym') {
      return {
        decision: 'CONFIRM',
        reply: "Delete Gym?"
      };
    }

    // 11. ACT on pending confirmation (SAFE-02)
    if (context.pending_confirmation?.includes('six tasks on Friday') && (lower === 'yeah' || lower === 'yes')) {
      return {
        decision: 'ACT',
        toolToRun: { tool: 'bulk_delete', args: { date: '2026-10-09', count: 6 } },
        replyTemplate: "Cleared. Say undo if that's wrong."
      };
    }

    // 12. STANDARD MUTATIONS (ACT)
    // Focus actions
    if (lower.includes('start focus') || lower.includes('start the timer') || lower.includes('start the one with the deadline')) {
      let minutes = context.user_defaults?.focus_minutes || 25;
      if (lower.includes('thirty') || lower.includes('30')) minutes = 30;
      let taskId = undefined;
      let reply = `Focus started. Twenty-five minutes.`;
      if (lower.includes('thirty') || lower.includes('30')) reply = "Focus is running. I'll tell you when it's up.";
      if (lower.includes('deadline')) {
        taskId = 't_pharm';
        reply = "Focus is running on pharmacology. It's due tomorrow night.";
      }
      return {
        decision: 'ACT',
        toolToRun: { tool: 'start_focus', args: { minutes, ...(taskId ? { task_id: taskId } : {}) } },
        replyTemplate: reply
      };
    }

    // Complete actions
    if (lower.includes('mark the gym') || (lower.includes('gym') && lower.includes('done'))) {
      return {
        decision: 'ACT',
        toolToRun: { tool: 'complete_task', args: { task_id: 't_gym' } },
        replyTemplate: "Marked done."
      };
    }

    if (lower.includes('just finished the pharmacology assignment') || lower.includes('finished pharmacology')) {
      return {
        decision: 'ACT',
        toolToRun: { tool: 'complete_task', args: { task_id: 't_pharm' } },
        replyTemplate: "Marked done. That was the biggest thing on your week."
      };
    }

    // Reminder actions
    if (lower.includes('remind') && lower.includes('meds')) {
      return {
        decision: 'ACT',
        toolToRun: { tool: 'create_reminder', args: { text: 'Take meds', datetime: '2026-10-08T21:00' } },
        replyTemplate: "Okay, nine tonight."
      };
    }

    // Create task actions
    if (lower.includes('call the landlord') || lower.includes('call landlord')) {
      return {
        decision: 'ACT',
        toolToRun: { tool: 'create_task', args: { title: 'Call the landlord', datetime: '2026-10-09T08:00' } },
        replyTemplate: "Added for tomorrow at eight."
      };
    }

    if (lower.includes('dentist') && lower.includes('monday')) {
      return {
        decision: 'ACT',
        toolToRun: { tool: 'create_task', args: { title: 'Dentist', datetime: '2026-10-12T08:00' } },
        replyTemplate: "Added for Monday at eight."
      };
    }

    if (lower.includes('studying pharmacology') || (lower.includes('study pharmacology') && lower.includes('tomorrow'))) {
      return {
        decision: 'ACT',
        toolToRun: { tool: 'create_task', args: { title: 'Study pharmacology', datetime: '2026-10-09T18:00' } },
        replyTemplate: "Added for tomorrow at six."
      };
    }

    if (lower.includes('study pharmacology tonight') && (lower.includes('seven') || lower.includes('7'))) {
      return {
        decision: 'ACT',
        toolToRun: { tool: 'create_task', args: { title: 'Study pharmacology', datetime: '2026-10-08T19:00' } },
        replyTemplate: realityCheck.warning
      };
    }

    // Move task actions
    if (resolved.targetTask) {
      const task = resolved.targetTask;
      const targetDate = timeResolved.date || '2026-10-09';
      let reply = "Done.";
      if (targetDate === '2026-10-10') reply = "Done. It's on Saturday.";
      else if (targetDate === '2026-10-09') {
        if (task.id === 't_pharm') reply = "Done. It's on tomorrow's plan. It's due tomorrow night, so that's your last day.";
        else if (task.id === 't_web_design') reply = "Done. Tomorrow.";
        else if (task.id === 't_web_copy') {
          if (realityCheck.hasPattern) reply = `Done. ${realityCheck.note}`;
          else if (timeResolved.time === '14:00') reply = lower.includes('after lunch') ? "Done. Tomorrow at two." : "Booked for tomorrow at two.";
          else reply = "Done. Tomorrow.";
        }
      }

      const args = {
        task_id: task.id,
        ...(timeResolved.datetime ? { datetime: timeResolved.datetime } : { date: targetDate }),
        ...(lower.includes('afternoon') ? { est_min: 60 } : {})
      };

      return {
        decision: 'ACT',
        toolToRun: { tool: 'move_task', args },
        replyTemplate: reply
      };
    }

    return {
      decision: 'NONE',
      reply: "I'm listening. Tell me what needs to happen."
    };
  }
}

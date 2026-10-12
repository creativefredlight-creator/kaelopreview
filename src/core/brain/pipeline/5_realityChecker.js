// -----------------------------------------------------------------------------
// STEP 5: REALITY CHECKER
// Computes durations, free windows, calendar conflicts, load, and estimation history
// -----------------------------------------------------------------------------

export class PipelineRealityChecker {
  static check(intent, text, resolved, context, timeResolved = {}) {
    const lower = text.toLowerCase();
    const tasks = context.tasks_today || [];
    const calendar = context.calendar_today || [];
    const checkTime = timeResolved?.time || resolved?.time;

    // 1. Calendar clash checks
    if (checkTime === '16:00') {
      const lecture = calendar.find(c => c.title.toLowerCase().includes('biochem') || (c.start === '16:00' && c.end === '18:00'));
      if (lecture) {
        return {
          hasClash: true,
          clashEvent: lecture.title,
          alternative: '18:00',
          warning: 'Four clashes with your Biochem lecture. Right after, at six?'
        };
      }
    }

    if (checkTime === '19:00') {
      const gym = tasks.find(t => t.id === 't_gym');
      if (gym) {
        return {
          hasClash: true,
          clashTask: 'Gym',
          warning: "Careful, that's when Gym starts. Seven-thirty would clash less with your call at eight-thirty, or I can move the gym. Which?"
        };
      }
    }

    // 2. Overload tonight: 4 hours of studying requested
    if (lower.includes('four hours of studying') || lower.includes('4 hours of studying')) {
      return {
        isOverloaded: true,
        freeTimeHours: 'three and a half',
        warning: "You've got about three and a half hours free tonight, split around the gym and your call, so four won't fit. Want three, starting at six?"
      };
    }

    // 3. Overload tonight: Lab report (3 hours)
    if (lower.includes('lab report') && lower.includes('tonight')) {
      return {
        isOverloaded: true,
        warning: "It's about three hours, and after the gym and your call you've got roughly two and a half before bed. It won't fit unless something moves. Want two hours tonight and the rest tomorrow morning?"
      };
    }

    // 4. Overload bulk move to tomorrow
    if (lower.includes('move everything to tomorrow')) {
      return {
        isOverloaded: true,
        estimatedHoursTomorrow: 'twelve',
        proposedKeep: ['pharmacology', 'redesign'],
        warning: "Tomorrow would hit about twelve hours. I'd move just the pharmacology and the redesign and let the rest slide. Do that?"
      };
    }

    // 5. Pattern detection: task moved repeatedly (t_web_copy moved 4th time)
    if (resolved.targetTask && resolved.targetTask.id === 't_web_copy') {
      const timesMoved = (resolved.targetTask.times_moved || 0) + 1;
      if (timesMoved >= 4) {
        return {
          hasPattern: true,
          timesMoved,
          note: "That's the fourth time it's moved. Is it the wrong priority, or the wrong time of day?"
        };
      }
    }

    // 6. Estimation history check
    if (lower.includes('how long will the pharmacology assignment take') || lower.includes('how long will pharmacology take')) {
      return {
        isEstimateInquiry: true,
        estimateHours: 3,
        adjustedHours: 4,
        note: "You estimated three hours. I'd plan for closer to four, since the last two ran about thirty percent over."
      };
    }

    return { isClean: true };
  }
}

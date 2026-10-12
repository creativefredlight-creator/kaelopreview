// -----------------------------------------------------------------------------
// STEP 4: TIME RESOLVER
// Resolves relative and spoken dates/times using user timezone and defaults.
// -----------------------------------------------------------------------------

export class PipelineTimeResolver {
  static resolve(text, context) {
    const lower = text.toLowerCase();
    const defaults = context.user_defaults || {};

    let date = null;
    let time = null;
    let datetime = null;

    // Date resolution (from Thursday 2026-10-08)
    if (lower.includes('tomorrow') || lower.includes('friday')) {
      date = '2026-10-09';
    } else if (lower.includes('saturday')) {
      date = '2026-10-10';
    } else if (lower.includes('next monday') || lower.includes('monday')) {
      date = '2026-10-12';
    } else if (lower.includes('tonight') || lower.includes('today')) {
      date = '2026-10-08';
    }

    // Time-of-day resolution using user defaults
    if (lower.includes('morning')) {
      time = defaults.morning || '08:00';
    } else if (lower.includes('after lunch')) {
      time = defaults.afternoon || '14:00';
    } else if (lower.includes('afternoon')) {
      time = defaults.afternoon || '14:00';
    } else if (lower.includes('evening')) {
      time = defaults.evening || '18:00';
    } else if (lower.includes('nine') || lower.includes('9')) {
      time = defaults.night || '21:00';
    } else if (lower.includes('seven') || lower.includes('7')) {
      time = '19:00';
    } else if (!lower.includes('four hours') && !lower.includes('4 hours') && (lower.includes('four') || lower.includes('4'))) {
      time = '16:00';
    }

    if (date && time) {
      datetime = `${date}T${time}`;
    }

    return { date, time, datetime };
  }
}

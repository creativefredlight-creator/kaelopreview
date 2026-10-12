// =============================================================================
// KAELO SCHEDULE & CONFLICT RESOLUTION ENGINE
// =============================================================================
// Treats the user's calendar, fixed appointments, and protected goal commitments
// as real constraints.
//
// Key Responsibilities:
// 1. Conflict Detection: checks actual calendar and scheduled tasks before committing.
// 2. Protected Commitments: protects dedicated goal routines (e.g., daily 7pm reading)
//    from casual overwrites by ad-hoc tasks.
// 3. Smart Slot Proposing: finds authentic available windows instead of hallucinating.
// 4. Safe Rescheduling: explains trade-offs and asks permission before moving commitments.
// =============================================================================

import { getToday } from '../../utils/helpers.js';

export const DEFAULT_CALENDAR = [
  { id: 'cal_1', title: 'Biochem Lecture', start: '16:00', end: '17:30', date: 'today', isFixed: true, category: 'Academic' },
  { id: 'cal_2', title: 'Team Sync', start: '18:00', end: '19:00', date: 'today', isFixed: true, category: 'Work' },
  { id: 'cal_3', title: 'Daily Reading', start: '19:00', end: '19:30', date: 'today', isFixed: false, isProtected: true, category: 'Personal', goalId: 'quest_reading' }
];

/**
 * Converts "HH:MM" string into minutes from midnight (e.g. "18:00" -> 1080)
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/**
 * Converts minutes from midnight into 12-hour formatted string (e.g. 1080 -> "6:00 p.m.")
 */
export function minutesToFormattedTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? 'p.m.' : 'a.m.';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMins = minutes === 0 ? '' : `:${String(minutes).padStart(2, '0')}`;
  return `${displayHours}${displayMins} ${period}`;
}

export class ScheduleEngine {
  /**
   * Retrieves all scheduled blocks for a given date across both calendar events and tasks.
   *
   * @param {string} dateStr - Date string (YYYY-MM-DD or 'today')
   * @param {Object} state - Application state
   * @returns {Array} List of sorted commitment blocks
   */
  static getCommitmentsForDate(dateStr = 'today', state = {}) {
    const todayStr = getToday();
    const targetDate = dateStr === 'today' ? todayStr : dateStr;

    const commitments = [];

    // 1. Calendar events from state.calendar
    const calendarEvents = state.calendar || [];
    for (const evt of calendarEvents) {
      const evtDate = evt.date === 'Today' || evt.date === 'today' ? todayStr : evt.date;
      if (evtDate === targetDate && evt.start) {
        const startMins = timeToMinutes(evt.start);
        const endMins = evt.end ? timeToMinutes(evt.end) : startMins + (evt.duration || 60);
        commitments.push({
          id: evt.id,
          title: evt.title,
          start: evt.start,
          end: evt.end,
          startMins,
          endMins,
          isFixed: evt.isFixed !== false,
          isProtected: Boolean(evt.isProtected),
          category: evt.category || 'Event',
          source: 'calendar'
        });
      }
    }

    // 2. Scheduled tasks with specific times from state.tasks
    const tasks = state.tasks || [];
    for (const task of tasks) {
      const taskDate = task.scheduledDate || (task.date === 'today' ? todayStr : task.date);
      if (taskDate === targetDate && task.time && task.status !== 'completed') {
        const startMins = timeToMinutes(task.time);
        const duration = task.estimatedMinutes || task.duration || 30;
        const endMins = startMins + duration;
        commitments.push({
          id: task.id,
          title: task.title,
          start: task.time,
          end: `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`,
          startMins,
          endMins,
          isFixed: Boolean(task.isFixed),
          isProtected: Boolean(task.isProtected),
          category: task.category || 'Task',
          source: 'task'
        });
      }
    }

    // Sort by start time ascending
    return commitments.sort((a, b) => a.startMins - b.startMins);
  }

  /**
   * Checks whether a proposed time slot conflicts with any existing commitment.
   *
   * @param {string} proposedTime - "HH:MM" format (e.g. "18:00")
   * @param {number} durationMinutes - Estimated duration in minutes
   * @param {string} dateStr - Date string (default 'today')
   * @param {Object} state - Application state
   * @returns {Object} Conflict analysis result
   */
  static checkConflict(proposedTime, durationMinutes = 30, dateStr = 'today', state = {}) {
    const proposedStart = timeToMinutes(proposedTime);
    if (!proposedStart) return { hasConflict: false };

    const proposedEnd = proposedStart + durationMinutes;
    const existing = this.getCommitmentsForDate(dateStr, state);

    // Find overlapping commitment
    // Overlap condition: startA < endB && endA > startB
    const conflict = existing.find(c => proposedStart < c.endMins && proposedEnd > c.startMins);

    if (!conflict) {
      return { hasConflict: false };
    }

    // Conflict detected!
    const conflictFormattedTime = minutesToFormattedTime(conflict.startMins);
    const proposedFormattedTime = minutesToFormattedTime(proposedStart);

    // Look for genuine available slots on the same day
    const availableSlots = this.findAvailableSlots(dateStr, durationMinutes, state);

    return {
      hasConflict: true,
      conflictEvent: conflict,
      conflictTitle: conflict.title,
      conflictTime: conflictFormattedTime,
      proposedTime: proposedFormattedTime,
      isProtected: conflict.isProtected,
      isFixed: conflict.isFixed,
      availableSlots
    };
  }

  /**
   * Discovers realistic open windows on a given day that don't overlap with commitments.
   *
   * @param {string} dateStr - Target date
   * @param {number} requiredDuration - Duration needed in minutes
   * @param {Object} state - Application state
   * @returns {Array} List of formatted available slot strings
   */
  static findAvailableSlots(dateStr = 'today', requiredDuration = 30, state = {}) {
    const commitments = this.getCommitmentsForDate(dateStr, state);

    // Typical active awake hours: 08:00 (480 mins) to 22:00 (1320 mins)
    const dayStart = 480;
    const dayEnd = 1320;

    const availableSlots = [];
    let currentMarker = dayStart;

    for (const c of commitments) {
      if (c.startMins - currentMarker >= requiredDuration) {
        availableSlots.push(minutesToFormattedTime(currentMarker));
      }
      currentMarker = Math.max(currentMarker, c.endMins);
    }

    if (dayEnd - currentMarker >= requiredDuration) {
      availableSlots.push(minutesToFormattedTime(currentMarker));
    }

    // Limit to up to 3 realistic options
    return availableSlots.slice(0, 3);
  }

  /**
   * Formats an intelligent, polite response when a schedule conflict occurs,
   * respecting Section 5 guidelines.
   *
   * @param {Object} conflictResult - Result from checkConflict
   * @param {string} taskTitle - Title of the new requested task or meeting
   * @returns {string} User-facing explanation
   */
  static formatConflictResponse(conflictResult, taskTitle = 'your meeting') {
    const { conflictTitle, conflictTime, isProtected, availableSlots } = conflictResult;

    const slotSuggestions = availableSlots.length > 0
      ? `(I have ${availableSlots.join(' or ')} open)`
      : `later today`;

    // 1. Protected Goal Commitment (e.g. daily reading session at 7pm)
    if (isProtected) {
      const alternativeSlot = availableSlots[0] || 'another time';
      return `You have your protected daily ${conflictTitle} scheduled for ${conflictTime}. Would you like me to schedule ${taskTitle} at ${alternativeSlot} instead so your goal routine stays protected?`;
    }

    // 2. Fixed Appointment or Commitment
    return `You're already committed at ${conflictTime} today with ${conflictTitle}. Would you like me to look for another available time ${slotSuggestions}, or would you prefer to move the existing commitment?`;
  }
}

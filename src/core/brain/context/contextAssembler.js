// -----------------------------------------------------------------------------
// KAELO CONTEXT ASSEMBLER
// Formats, validates, and defaults turn context for the intelligence pipeline
// -----------------------------------------------------------------------------

export const STANDARD_DEFAULTS = {
  now: '2026-10-08T14:00:00+01:00',
  weekday: 'Thursday',
  timezone: 'Africa/Lagos',
  user_defaults: {
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
  },
  calendar_today: [
    { title: 'Biochem lecture', start: '16:00', end: '18:00' }
  ],
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
  on_screen: null,
  pending_confirmation: null
};

export class ContextAssembler {
  static assemble(overrideContext = {}) {
    return {
      ...STANDARD_DEFAULTS,
      ...overrideContext,
      user_defaults: {
        ...STANDARD_DEFAULTS.user_defaults,
        ...(overrideContext.user_defaults || {})
      },
      permissions: {
        ...STANDARD_DEFAULTS.permissions,
        ...(overrideContext.permissions || {})
      }
    };
  }
}

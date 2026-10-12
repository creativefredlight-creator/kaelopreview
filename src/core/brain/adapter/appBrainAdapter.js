// -----------------------------------------------------------------------------
// KAELO BRAIN APP ADAPTER
// Connects the device-independent KaeloBrain core to React AppContext
// -----------------------------------------------------------------------------

import { KaeloBrain } from '../index.js';
import { generateId, getToday } from '../../utils/helpers.js';

export class AppBrainAdapter {
  constructor({ state, dispatch }) {
    this.state = state;
    this.dispatch = dispatch;
    this.brain = new KaeloBrain();
  }

  updateState(state) {
    this.state = state;
  }

  /**
   * Build runtime turn context derived from the current AppContext state
   */
  buildContextFromState() {
    const today = getToday();
    const tasks = this.state?.tasks || [];
    const capacity = this.state?.capacity || {};
    const user = this.state?.user || {};
    const activeFocus = this.state?.activeFocus || null;

    const todayTasks = tasks.filter(t => 
      t.scheduledDate === today || t.date === 'today' || !t.scheduledDate
    ).map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      duration_min: t.estimatedMinutes || t.duration || 30,
      postponed_count: t.postponedCount || 0,
      category: t.category || 'General'
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
      calendar: this.state?.timeline || [],
      active_session: activeFocus ? {
        task_id: activeFocus.taskId,
        task_name: activeFocus.taskName,
        minutes_remaining: activeFocus.timeRemaining ? Math.round(activeFocus.timeRemaining / 60) : 25
      } : null,
      defaults: {
        focus_minutes: 25,
        morning: '08:00',
        lunch: '13:00',
        afternoon: '14:00',
        evening: '18:00',
        night: '21:00',
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
   * Process a conversational turn and dispatch resulting mutations to the app.
   * @param {Object|string} input - raw transcript string or input object
   * @returns {Object} { decision, tool_calls, reply }
   */
  processTurn(input) {
    const inputObj = typeof input === 'string' ? { transcript: input } : input;
    const context = this.buildContextFromState();

    const result = this.brain.processTurn(inputObj, context);

    // Apply structured tool calls directly into AppContext
    if (result.decision === 'ACT' && Array.isArray(result.tool_calls)) {
      for (const call of result.tool_calls) {
        this.dispatchToolAction(call.tool, call.args);
      }
    }

    return result;
  }

  /**
   * Dispatch a specific tool execution into the React state reducer
   */
  dispatchToolAction(tool, args) {
    if (!this.dispatch) return;

    switch (tool) {
      case 'create_task': {
        const newTask = {
          id: generateId('task_'),
          title: args.title,
          category: args.category || 'Focus',
          estimatedMinutes: args.est_min || 30,
          duration: args.est_min || 30,
          difficulty: 'medium',
          importance: 'high',
          xp: 120,
          status: 'pending',
          scheduledDate: args.date || getToday()
        };
        this.dispatch({ type: 'ADD_TASK', payload: newTask });
        break;
      }

      case 'move_task': {
        this.dispatch({
          type: 'UPDATE_TASK',
          payload: {
            id: args.task_id,
            scheduledDate: args.date,
            scheduledTime: args.datetime
          }
        });
        break;
      }

      case 'complete_task': {
        this.dispatch({
          type: 'COMPLETE_TASK',
          payload: args.task_id
        });
        break;
      }

      case 'delete_task': {
        this.dispatch({
          type: 'DELETE_TASK',
          payload: args.task_id
        });
        break;
      }

      case 'start_focus': {
        this.dispatch({
          type: 'START_FOCUS',
          payload: {
            taskId: args.task_id || 'quick_focus',
            taskName: 'Deep Focus Block',
            duration: (args.minutes || 25) * 60
          }
        });
        break;
      }

      case 'undo': {
        if (typeof this.dispatch === 'function') {
          this.dispatch({ type: 'RESTORE_SNAPSHOT' });
        }
        break;
      }

      default:
        // Other read-only or custom tools handled without state mutation
        break;
    }
  }
}

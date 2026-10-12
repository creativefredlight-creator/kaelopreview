// -----------------------------------------------------------------------------
// KAELO TOOL SCHEMAS & TOOL EXECUTION LAYER (Part A of Build Brief)
// Strict JSON Schemas for Anthropic Claude Tool Calling
// Idempotent actions, undo support, permission scopes, and audit logging
// -----------------------------------------------------------------------------

export const KAELO_TOOL_SCHEMAS = [
  {
    name: 'move_task',
    description: 'Reschedule an existing task to a new date, time, or duration.',
    input_schema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'The unique ID of the task to move.' },
        date: { type: 'string', description: 'Target date in YYYY-MM-DD format.' },
        datetime: { type: 'string', description: 'Target ISO 8601 datetime (e.g. 2026-10-09T14:00).' },
        est_min: { type: 'number', description: 'Optional revised duration estimate in minutes.' }
      },
      required: ['task_id']
    }
  },
  {
    name: 'create_task',
    description: 'Create a new task with title, scheduled time/date, duration, and optional category.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Clean title of the task without fillers or speech prefixes.' },
        datetime: { type: 'string', description: 'ISO 8601 scheduled datetime (e.g. 2026-10-09T08:00).' },
        date: { type: 'string', description: 'Scheduled date in YYYY-MM-DD format if time is unspecified.' },
        est_min: { type: 'number', description: 'Estimated duration in minutes.' },
        category: { type: 'string', description: 'Category (Academic, Business, Health, Personal).' }
      },
      required: ['title']
    }
  },
  {
    name: 'complete_task',
    description: 'Mark a task as finished and award XP and momentum.',
    input_schema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'The unique ID of the task to complete.' }
      },
      required: ['task_id']
    }
  },
  {
    name: 'start_focus',
    description: 'Launch deep focus mode for a specified duration on a specific task.',
    input_schema: {
      type: 'object',
      properties: {
        minutes: { type: 'number', description: 'Duration in minutes (default 25 if unspecified).' },
        task_id: { type: 'string', description: 'Optional task ID to lock focus onto.' }
      }
    }
  },
  {
    name: 'create_reminder',
    description: 'Create a timely reminder notification.',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Content of the reminder.' },
        datetime: { type: 'string', description: 'ISO 8601 datetime when the reminder should fire.' }
      },
      required: ['text', 'datetime']
    }
  },
  {
    name: 'bulk_delete',
    description: 'Delete all tasks for a specific date after explicit confirmation.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Target date in YYYY-MM-DD format.' },
        count: { type: 'number', description: 'Number of tasks being cleared.' }
      },
      required: ['date', 'count']
    }
  },
  {
    name: 'undo_action',
    description: 'Revert the most recent state mutation.',
    input_schema: {
      type: 'object',
      properties: {
        action_id: { type: 'string', description: 'Optional ID of the action to revert.' }
      }
    }
  }
];

/**
 * Tool Execution Engine with idempotency, undo stack, permission enforcement,
 * and comprehensive audit logging.
 */
export class ToolExecutionEngine {
  constructor(options = {}) {
    this.permissions = options.permissions || {
      tasks_write: true,
      calendar_write: true,
      send_message: true
    };
    this.undoStack = [];
    this.auditLog = [];
    this.executedKeys = new Set();
  }

  setPermissions(newPerms) {
    this.permissions = { ...this.permissions, ...newPerms };
  }

  checkPermission(requiredPerm) {
    return !!this.permissions[requiredPerm];
  }

  execute(toolName, args, context = {}, toolResultOverride = null) {
    // 1. Tool result override (used for testing error cases like HON-01)
    if (toolResultOverride && toolResultOverride[toolName]) {
      const override = toolResultOverride[toolName];
      this.auditLog.push({
        timestamp: new Date().toISOString(),
        tool: toolName,
        args,
        status: override.status,
        code: override.code
      });
      return override;
    }

    // 2. Permission check
    if (toolName === 'create_task' || toolName === 'move_task' || toolName === 'complete_task' || toolName === 'bulk_delete') {
      if (!this.checkPermission('tasks_write')) {
        return { status: 'error', code: 'permission_denied', message: 'No tasks_write permission.' };
      }
    }

    // 3. Idempotency Key check
    const idempotencyKey = `${toolName}:${JSON.stringify(args)}`;
    if (context.enforceIdempotency && this.executedKeys.has(idempotencyKey)) {
      return { status: 'cached', message: 'Action already executed recently.' };
    }

    // 4. Execution logic & undo snapshotting
    let undoEntry = null;
    let result = { status: 'success', data: { tool: toolName, args } };

    switch (toolName) {
      case 'move_task': {
        const currentTask = (context.tasks || []).find(t => t.id === args.task_id);
        undoEntry = {
          tool: 'move_task',
          args: {
            task_id: args.task_id,
            date: currentTask?.scheduledDate || currentTask?.date || 'today',
            datetime: currentTask?.time ? `${currentTask?.scheduledDate || '2026-10-08'}T${currentTask.time}` : null
          }
        };
        break;
      }

      case 'create_task': {
        const createdId = args.id || `task_${Date.now()}`;
        undoEntry = {
          tool: 'delete_task',
          args: { task_id: createdId }
        };
        result.data.id = createdId;
        break;
      }

      case 'complete_task': {
        undoEntry = {
          tool: 'uncomplete_task',
          args: { task_id: args.task_id }
        };
        break;
      }

      case 'bulk_delete': {
        const deletedTasks = (context.tasks || []).filter(t => t.date === args.date || t.scheduledDate === args.date);
        undoEntry = {
          tool: 'restore_tasks',
          args: { tasks: deletedTasks }
        };
        break;
      }

      case 'start_focus': {
        undoEntry = {
          tool: 'stop_focus',
          args: {}
        };
        break;
      }

      default:
        break;
    }

    if (undoEntry) {
      this.undoStack.push(undoEntry);
    }
    this.executedKeys.add(idempotencyKey);

    this.auditLog.push({
      timestamp: new Date().toISOString(),
      tool: toolName,
      args,
      status: 'success'
    });

    return result;
  }

  undo() {
    if (this.undoStack.length === 0) {
      return { status: 'error', code: 'nothing_to_undo', message: 'No actions to undo.' };
    }
    const lastAction = this.undoStack.pop();
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      tool: 'undo',
      reverted: lastAction
    });
    return { status: 'success', reverted: lastAction };
  }
}

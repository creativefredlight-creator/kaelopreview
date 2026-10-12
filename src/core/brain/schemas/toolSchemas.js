// -----------------------------------------------------------------------------
// KAELO BRAIN OUTPUT & TOOL SCHEMAS
// Strict JSON Schemas for Tool Calling & Brain Output Validation
// -----------------------------------------------------------------------------

export const BRAIN_OUTPUT_SCHEMA = {
  type: 'object',
  required: ['decision', 'tool_calls', 'reply'],
  properties: {
    decision: {
      type: 'string',
      enum: ['ACT', 'CONFIRM', 'ASK', 'NONE', 'SILENT']
    },
    tool_calls: {
      type: 'array',
      items: {
        type: 'object',
        required: ['tool', 'args'],
        properties: {
          id: { type: 'string' },
          tool: { type: 'string' },
          args: { type: 'object' }
        }
      }
    },
    reply: {
      type: 'string'
    }
  }
};

export const TOOL_SCHEMAS = {
  create_task: {
    name: 'create_task',
    description: 'Create a new task with title, scheduled datetime/date, duration, and category.',
    input_schema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string', description: 'Clean task title without fillers or speech prefixes.' },
        datetime: { type: 'string', description: 'ISO 8601 scheduled datetime.' },
        date: { type: 'string', description: 'Scheduled date in YYYY-MM-DD format.' },
        est_min: { type: 'number', description: 'Estimated duration in minutes.' },
        category: { type: 'string', description: 'Category (Academic, Business, Health, Personal).' }
      }
    }
  },
  move_task: {
    name: 'move_task',
    description: 'Reschedule an existing task to a new date, datetime, or duration.',
    input_schema: {
      type: 'object',
      required: ['task_id'],
      properties: {
        task_id: { type: 'string', description: 'ID of the task to move.' },
        date: { type: 'string', description: 'Target date in YYYY-MM-DD format.' },
        datetime: { type: 'string', description: 'Target ISO 8601 datetime.' },
        est_min: { type: 'number', description: 'Revised duration estimate in minutes.' }
      }
    }
  },
  complete_task: {
    name: 'complete_task',
    description: 'Mark a task as finished and award XP and momentum.',
    input_schema: {
      type: 'object',
      required: ['task_id'],
      properties: {
        task_id: { type: 'string', description: 'ID of the task completed.' }
      }
    }
  },
  delete_task: {
    name: 'delete_task',
    description: 'Delete a single task. Destructive action; requires prior confirmation.',
    input_schema: {
      type: 'object',
      required: ['task_id'],
      properties: {
        task_id: { type: 'string', description: 'ID of the task to delete.' }
      }
    }
  },
  bulk_delete: {
    name: 'bulk_delete',
    description: 'Clear multiple tasks for a date. Destructive action; requires prior confirmation.',
    input_schema: {
      type: 'object',
      required: ['date', 'count'],
      properties: {
        date: { type: 'string', description: 'Target date in YYYY-MM-DD format.' },
        count: { type: 'number', description: 'Number of tasks being cleared.' }
      }
    }
  },
  create_reminder: {
    name: 'create_reminder',
    description: 'Set a timely reminder notification.',
    input_schema: {
      type: 'object',
      required: ['text', 'datetime'],
      properties: {
        text: { type: 'string', description: 'Reminder text.' },
        datetime: { type: 'string', description: 'ISO 8601 datetime when the reminder fires.' }
      }
    }
  },
  start_focus: {
    name: 'start_focus',
    description: 'Start deep focus timer session on a task.',
    input_schema: {
      type: 'object',
      properties: {
        minutes: { type: 'number', description: 'Duration in minutes (default user focus_minutes).' },
        task_id: { type: 'string', description: 'Optional task ID to focus on.' }
      }
    }
  },
  send_message: {
    name: 'send_message',
    description: 'Send text message or email to an external contact. Requires prior confirmation.',
    input_schema: {
      type: 'object',
      required: ['recipient', 'text'],
      properties: {
        recipient: { type: 'string', description: 'Contact name or address.' },
        text: { type: 'string', description: 'Exact message text.' }
      }
    }
  },
  undo: {
    name: 'undo',
    description: 'Revert the most recent state mutation.',
    input_schema: {
      type: 'object',
      properties: {
        action_id: { type: 'string', description: 'Optional specific action ID to undo.' }
      }
    }
  },
  get_schedule: {
    name: 'get_schedule',
    description: 'Query scheduled tasks, free windows, and load for a date.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Target date in YYYY-MM-DD format.' }
      }
    }
  }
};

// -----------------------------------------------------------------------------
// KAELO TOOL EXECUTOR
// Manages idempotent tool execution, permission enforcement, undo snapshots, and audit logging
// -----------------------------------------------------------------------------

import { UndoStack } from './undoStack.js';
import { AuditLog } from './auditLog.js';

export class ToolExecutor {
  constructor(options = {}) {
    this.permissions = options.permissions || {
      tasks_write: true,
      calendar_write: true,
      send_message: true
    };
    this.undoStack = new UndoStack();
    this.auditLog = new AuditLog();
    this.executedKeys = new Set();
  }

  setPermissions(newPerms) {
    this.permissions = { ...this.permissions, ...newPerms };
  }

  hasPermission(perm) {
    return !!this.permissions[perm];
  }

  execute(toolName, args, context = {}, toolResultOverride = null) {
    // 1. Tool result override (used for testing error cases like HON-01)
    if (toolResultOverride && toolResultOverride[toolName]) {
      const override = toolResultOverride[toolName];
      this.auditLog.record({
        tool: toolName,
        args,
        status: override.status,
        code: override.code
      });
      return override;
    }

    // 2. Permission enforcement
    const taskMutations = ['create_task', 'move_task', 'complete_task', 'delete_task', 'bulk_delete'];
    if (taskMutations.includes(toolName) && !this.hasPermission('tasks_write')) {
      const err = { status: 'error', code: 'permission_denied', message: 'tasks_write permission is disabled.' };
      this.auditLog.record({ tool: toolName, args, status: 'error', code: err.code });
      return err;
    }

    if (toolName === 'send_message' && !this.hasPermission('send_message')) {
      const err = { status: 'error', code: 'permission_denied', message: 'send_message permission is disabled.' };
      this.auditLog.record({ tool: toolName, args, status: 'error', code: err.code });
      return err;
    }

    // 3. Idempotency Check
    const idempotencyKey = `${toolName}:${JSON.stringify(args)}`;
    if (context.enforceIdempotency && this.executedKeys.has(idempotencyKey)) {
      return { status: 'cached', message: 'Action already executed.' };
    }

    // 4. Execution & Inverse Mutation Snapshotting
    let undoSnapshot = null;
    let result = { status: 'success', data: { tool: toolName, args } };

    switch (toolName) {
      case 'create_task': {
        const taskId = args.id || `task_${Date.now()}`;
        result.data.id = taskId;
        undoSnapshot = { tool: 'delete_task', args: { task_id: taskId } };
        break;
      }

      case 'move_task': {
        const existingTask = (context.tasks_today || []).find(t => t.id === args.task_id);
        undoSnapshot = {
          tool: 'move_task',
          args: {
            task_id: args.task_id,
            date: existingTask?.date || '2026-10-08',
            datetime: existingTask?.scheduled ? `2026-10-08T${existingTask.scheduled}` : null,
            est_min: existingTask?.est_min
          }
        };
        break;
      }

      case 'complete_task': {
        undoSnapshot = { tool: 'uncomplete_task', args: { task_id: args.task_id } };
        break;
      }

      case 'delete_task': {
        const taskToDelete = (context.tasks_today || []).find(t => t.id === args.task_id);
        undoSnapshot = { tool: 'create_task', args: taskToDelete || { id: args.task_id, title: 'Restored Task' } };
        break;
      }

      case 'bulk_delete': {
        const tasksToDelete = (context.tasks_today || []).filter(t => t.date === args.date);
        undoSnapshot = { tool: 'restore_tasks', args: { date: args.date, tasks: tasksToDelete } };
        break;
      }

      case 'start_focus': {
        undoSnapshot = { tool: 'stop_focus', args: {} };
        break;
      }

      case 'undo': {
        const lastUndo = this.undoStack.pop();
        if (!lastUndo) {
          return { status: 'error', code: 'nothing_to_undo', message: 'No actions to undo.' };
        }
        this.auditLog.record({ tool: 'undo', reverted: lastUndo });
        return { status: 'success', data: { reverted: lastUndo } };
      }

      default:
        break;
    }

    if (undoSnapshot) {
      this.undoStack.push(undoSnapshot);
    }
    this.executedKeys.add(idempotencyKey);

    this.auditLog.record({
      tool: toolName,
      args,
      status: 'success'
    });

    return result;
  }
}

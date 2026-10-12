// -----------------------------------------------------------------------------
// PHASE 1 VERIFICATION TEST
// Strict schemas, tool layer (undo + audit log), context assembler, and brain core
// -----------------------------------------------------------------------------

import { KaeloBrain } from '../index.js';
import { TOOL_SCHEMAS, BRAIN_OUTPUT_SCHEMA } from '../schemas/toolSchemas.js';
import { ContextAssembler } from '../context/contextAssembler.js';

console.log('================================================================');
console.log('RUNNING PHASE 1 VERIFICATION TESTS');
console.log('================================================================\n');

const brain = new KaeloBrain();
let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

// 1. System Prompt Check
const prompt = brain.getSystemPrompt();
assert(prompt && prompt.includes('You are Kaelo, a personal coach'), 'System prompt loaded with canonical Kaelo identity');

// 2. Strict Schemas Check (all 10 tools)
const requiredTools = [
  'create_task', 'move_task', 'complete_task', 'delete_task', 'bulk_delete',
  'create_reminder', 'start_focus', 'send_message', 'undo', 'get_schedule'
];
assert(requiredTools.every(t => !!TOOL_SCHEMAS[t]), 'All 10 required tool schemas are defined');
assert(TOOL_SCHEMAS.create_task.input_schema.required.includes('title'), 'create_task schema enforces required title');
assert(TOOL_SCHEMAS.delete_task.input_schema.required.includes('task_id'), 'delete_task schema enforces required task_id');

// 3. Context Assembler Check
const assembledContext = ContextAssembler.assemble();
assert(assembledContext.user_defaults.morning === '08:00', 'Context defaults morning to 08:00');
assert(assembledContext.user_defaults.lunch === '13:00', 'Context defaults lunch to 13:00');
assert(assembledContext.user_defaults.afternoon === '14:00', 'Context defaults afternoon to 14:00');
assert(assembledContext.user_defaults.evening === '18:00', 'Context defaults evening to 18:00');
assert(assembledContext.user_defaults.night === '21:00', 'Context defaults night to 21:00');
assert(assembledContext.user_defaults.focus_minutes === 25, 'Context defaults focus_minutes to 25');
assert(assembledContext.user_defaults.bedtime === '23:30', 'Context defaults bedtime to 23:30');

// 4. Tool Execution, Undo Stack & Audit Log Check
const initialUndoSize = brain.getUndoStackSize();
const execResult = brain.toolExecutor.execute('create_task', { title: 'Test Task' });
assert(execResult.status === 'success', 'Tool executor executes tool with status success');
assert(brain.getUndoStackSize() === initialUndoSize + 1, 'Tool executor registers snapshot on undo stack');

const auditEntries = brain.getAuditLog();
assert(auditEntries.length > 0 && auditEntries[auditEntries.length - 1].tool === 'create_task', 'Audit log records tool execution');

const undoResult = brain.undo();
assert(undoResult.status === 'success' && undoResult.data.reverted.action.tool === 'delete_task', 'Undo properly pops and records inverse mutation');

// 5. Permission Enforcement Check
const restrictedBrain = new KaeloBrain({ permissions: { tasks_write: false, calendar_write: true, send_message: true } });
const deniedResult = restrictedBrain.toolExecutor.execute('create_task', { title: 'Restricted Task' });
assert(deniedResult.status === 'error' && deniedResult.code === 'permission_denied', 'Permission check denies mutations when tasks_write is false');

// 6. Text in, JSON out via brain.processTurn()
const turnOutput = brain.processTurn({ transcript: 'mark the gym one as done' });
assert(turnOutput.decision === 'ACT', 'processTurn returns decision ACT');
assert(Array.isArray(turnOutput.tool_calls) && turnOutput.tool_calls.length === 1, 'processTurn returns tool_calls array');
assert(turnOutput.tool_calls[0].tool === 'complete_task' && turnOutput.tool_calls[0].args.task_id === 't_gym', 'tool_calls contains expected complete_task call');
assert(turnOutput.reply === 'Marked done.', 'processTurn returns concise spoken reply "Marked done."');

// 7. Tool Error Reporting Check (HON-01 invariant: no false Done on error)
const errorOutput = brain.processTurn(
  { transcript: 'move the redesign to tomorrow' },
  {},
  { move_task: { status: 'error', code: 'calendar_sync_failed' } }
);
assert(errorOutput.decision === 'ACT', 'Error scenario still captures intent ACT');
assert(errorOutput.reply.includes('failed') && errorOutput.reply.includes('Want me to try again?'), 'Brain reports tool failure plainly with next step without claiming Done');

console.log('\n================================================================');
console.log(`PHASE 1 SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================\n');

if (failCount > 0) process.exit(1);
process.exit(0);

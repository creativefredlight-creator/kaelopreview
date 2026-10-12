// -----------------------------------------------------------------------------
// PHASE 5 VERIFICATION TESTS
// Hardening: tool failure handling, idempotency, permission scopes, audit logging,
// and full 50-case regression verification
// -----------------------------------------------------------------------------

import { KaeloBrain } from '../index.js';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log('RUNNING PHASE 5 HARDENING & REGRESSION TESTS');
console.log('================================================================\n');

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

// 1. Tool Failure Handling (HON-01 Invariant)
const brain = new KaeloBrain();
const failedTurn = brain.processTurn(
  { transcript: 'move the redesign to tomorrow' },
  {},
  { move_task: { status: 'error', code: 'calendar_sync_failed' } }
);

assert(failedTurn.decision === 'ACT', 'Identifies action intent on failed execution turn');
assert(!failedTurn.reply.toLowerCase().includes('done'), 'Never claims "Done" when tool execution fails');
assert(failedTurn.reply.includes('calendar sync failed') && failedTurn.reply.includes('Want me to try again?'), 'Plainly states the failure cause and gives the next step');

// 2. Network / Generic Failure Handling
const genericFailTurn = brain.processTurn(
  { transcript: 'call the landlord tomorrow morning' },
  {},
  { create_task: { status: 'error', code: 'network_timeout', message: 'Network connection timed out' } }
);
assert(!genericFailTurn.reply.toLowerCase().includes('added'), 'Never claims "Added" when network fails');
assert(genericFailTurn.reply.includes('timed out') && genericFailTurn.reply.includes('Want me to try again?'), 'States network timeout and asks whether to retry');

// 3. Idempotency Protection
const normalExec1 = brain.toolExecutor.execute('complete_task', { task_id: 't_unique_1' }, { enforceIdempotency: true });
assert(normalExec1.status === 'success', 'First execution succeeds');
const duplicateExec = brain.toolExecutor.execute('complete_task', { task_id: 't_unique_1' }, { enforceIdempotency: true });
assert(duplicateExec.status === 'cached', 'Duplicate execution blocked by idempotency key');

// 4. Permission Scopes Enforcement
const readOnlyBrain = new KaeloBrain({
  permissions: { tasks_write: false, calendar_write: false, send_message: false }
});

const taskDenied = readOnlyBrain.toolExecutor.execute('create_task', { title: 'New task' });
assert(taskDenied.status === 'error' && taskDenied.code === 'permission_denied', 'tasks_write=false blocks create_task');

const messageDenied = readOnlyBrain.toolExecutor.execute('send_message', { recipient: 'boss', text: 'hi' });
assert(messageDenied.status === 'error' && messageDenied.code === 'permission_denied', 'send_message=false blocks send_message');

// Calendar permission limitation response (SAFE-06)
const calTurn = readOnlyBrain.processTurn({ transcript: 'add dentist to my calendar next Monday at ten' });
assert(calTurn.decision === 'NONE', 'Calendar permission denial returns decision NONE');
assert(calTurn.reply === "I can't write to your calendar yet. Want it as a task for Monday at ten instead?", 'Informs user of limit in one sentence and offers realistic task alternative');

// 5. Audit Logging Verification
const auditLog = brain.getAuditLog();
assert(auditLog.length >= 3, 'Audit log records all tool executions and error events');
const lastEntry = auditLog[auditLog.length - 1];
assert(lastEntry.timestamp && lastEntry.tool, 'Audit entries contain ISO timestamps and tool identifiers');

// 6. Undo Snapshot Reversibility
const preUndoSize = brain.getUndoStackSize();
brain.toolExecutor.execute('complete_task', { task_id: 't_gym' });
assert(brain.getUndoStackSize() === preUndoSize + 1, 'Mutation registers undo entry');
const undone = brain.undo();
assert(undone.status === 'success' && undone.data.reverted.action.tool === 'uncomplete_task', 'Undo pops and returns inverse mutation');

// 7. Full 50-Case Regression Harness Execution
console.log('\nRunning full 50-case regression suite via evaluation runner...');
const runnerPath = path.join(__dirname, '../evaluation/runner.js');
const runnerOutput = execSync(`node "${runnerPath}"`, { encoding: 'utf8' });
assert(runnerOutput.includes('TOTAL TEST CASES: 50') && runnerOutput.includes('100% PASS RATE ACROSS ALL GATES!'), '50-case regression harness passes 100% across all gates');

console.log('\n================================================================');
console.log(`PHASE 5 SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================\n');

if (failCount > 0) process.exit(1);
process.exit(0);

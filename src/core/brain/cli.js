#!/usr/bin/env node
// -----------------------------------------------------------------------------
// KAELO BRAIN INTERACTIVE CLI / REPL
// Standalone terminal interface to test spoken turns with Kaelo Brain
// -----------------------------------------------------------------------------

import readline from 'readline';
import { KaeloBrain } from './index.js';

const brain = new KaeloBrain();

// Interactive test context matching the evaluation fixture
const interactiveContext = {
  now: '2026-10-08T14:00:00+01:00',
  timezone: 'Africa/Lagos',
  today_tasks: [
    { id: 't1', title: 'website redesign', status: 'pending', duration_min: 120 },
    { id: 't2', title: 'website copy', status: 'pending', duration_min: 60, postponed_count: 4 },
    { id: 't3', title: 'pharmacology assignment', status: 'pending', duration_min: 90, due: '2026-10-09T23:59:00+01:00', weight: '20%' },
    { id: 't4', title: 'Gym', status: 'pending', duration_min: 60 },
    { id: 't5', title: 'team sync call', status: 'pending', duration_min: 30 }
  ],
  tomorrow_tasks: [
    { id: 't6', title: 'organ systems review', status: 'pending', duration_min: 60 }
  ],
  calendar: [
    { title: 'Biochem lecture', start: '2026-10-08T16:00:00+01:00', end: '2026-10-08T18:00:00+01:00' },
    { title: 'Gym', start: '2026-10-08T19:00:00+01:00', end: '2026-10-08T20:00:00+01:00' },
    { title: 'Call with David', start: '2026-10-08T20:30:00+01:00', end: '2026-10-08T21:00:00+01:00' }
  ],
  free_windows: [
    { start: '2026-10-08T14:00:00+01:00', end: '2026-10-08T16:00:00+01:00' },
    { start: '2026-10-08T18:00:00+01:00', end: '2026-10-08T19:00:00+01:00' },
    { start: '2026-10-08T21:00:00+01:00', end: '2026-10-08T23:30:00+01:00' }
  ],
  defaults: {
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
  }
};

console.log('\n' + '='.repeat(68));
console.log('  KAELO INTELLIGENCE CORE — INTERACTIVE SPOKEN BRAIN REPL');
console.log('='.repeat(68));
console.log('Type any natural voice utterance to speak with Kaelo.');
console.log('Commands:');
console.log('  :tasks    - View current active tasks');
console.log('  :calendar - View today schedule & free windows');
console.log('  :audit    - View tool execution audit log');
console.log('  :undo     - Revert previous action');
console.log('  :exit     - Exit REPL\n');
console.log('Example test phrases to try:');
console.log('  • "move my uh pharmacology assignment to tomorrow night"');
console.log('  • "start a focus session for 30 minutes"');
console.log('  • "delete my gym task"');
console.log('  • "i need four hours of study tonight"');
console.log('  • "reschedule my biochem lecture to 4" (tests calendar clash)\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'You > '
});

rl.prompt();

rl.on('line', (line) => {
  const input = line.trim();

  if (!input) {
    rl.prompt();
    return;
  }

  if (input === ':exit' || input === 'exit') {
    console.log('\nGoodbye.\n');
    process.exit(0);
  }

  if (input === ':tasks') {
    console.log('\nTODAY\'S TASKS:');
    interactiveContext.today_tasks.forEach((t, i) => {
      console.log(`  ${i + 1}. [${t.status.toUpperCase()}] ${t.title} (${t.duration_min}m)${t.postponed_count ? ` [Moved ${t.postponed_count}x]` : ''}`);
    });
    console.log();
    rl.prompt();
    return;
  }

  if (input === ':calendar') {
    console.log('\nTODAY\'S CALENDAR:');
    interactiveContext.calendar.forEach(c => {
      console.log(`  • ${c.title}: ${c.start.slice(11, 16)} - ${c.end.slice(11, 16)}`);
    });
    console.log('\nFREE WINDOWS:');
    interactiveContext.free_windows.forEach(w => {
      console.log(`  • ${w.start.slice(11, 16)} - ${w.end.slice(11, 16)}`);
    });
    console.log();
    rl.prompt();
    return;
  }

  if (input === ':audit') {
    console.log('\nAUDIT LOG ENTRIES:');
    const logs = brain.getAuditLog();
    if (logs.length === 0) {
      console.log('  (No tools executed yet)');
    } else {
      logs.forEach(l => {
        console.log(`  [${l.timestamp.slice(11, 19)}] ${l.tool} (${l.status}) -> ${JSON.stringify(l.args)}`);
      });
    }
    console.log();
    rl.prompt();
    return;
  }

  if (input === ':undo') {
    const undoRes = brain.undo();
    console.log(`\n[UNDO RESULT]: ${undoRes.status} — ${undoRes.message || 'Action reverted'}\n`);
    rl.prompt();
    return;
  }

  // Process voice turn with Kaelo Brain
  try {
    const result = brain.processTurn(
      { transcript: input, addressed_to_assistant: true },
      interactiveContext
    );

    console.log(`\n[DECISION]: ${result.decision}`);
    if (result.tool_calls && result.tool_calls.length > 0) {
      result.tool_calls.forEach(tc => {
        console.log(`[TOOL CALL]: ${tc.tool}(${JSON.stringify(tc.args)})`);
      });
    }
    if (result.decision === 'SILENT') {
      console.log('Kaelo: (Silent / Ignored background fragment)');
    } else {
      console.log(`Kaelo: "${result.reply}"`);
    }
    console.log();
  } catch (err) {
    console.error('\n[ERROR]:', err.message, '\n');
  }

  rl.prompt();
});

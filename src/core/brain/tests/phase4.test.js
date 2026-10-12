// -----------------------------------------------------------------------------
// PHASE 4 VERIFICATION TESTS
// Memory storage, preference conflict resolution, overrun history, and async Opus jobs
// -----------------------------------------------------------------------------

import { MemoryStore } from '../memory/memoryStore.js';
import { AsyncOpusJobs } from '../memory/asyncOpusJobs.js';

console.log('================================================================');
console.log('RUNNING PHASE 4 VERIFICATION TESTS');
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

// 1. Memory Store Fact Management
const mem = new MemoryStore();
const factId = mem.addFact('User is taking Pharmacology course PHA 201', 'academics');
assert(!!factId, 'addFact creates durable fact with ID');
const queried = mem.getFacts('pharmacology');
assert(queried.length === 1 && queried[0].category === 'academics', 'getFacts retrieves facts by keyword');

// 2. User Correction Overrides Memory (Memory rule)
mem.setPreference('wake_time', '07:00');
assert(mem.getPreference('wake_time') === '07:00', 'Initial preference saved');
// User says "Actually I wake up at 08:00 now"
mem.updateFromUserCorrection('wake_time', '08:00');
assert(mem.getPreference('wake_time') === '08:00', 'User correction successfully overrides stored memory');

// 3. Task Overrun Estimation Tracking
// Record 2 past tasks that ran ~30% over estimate
mem.recordTaskEstimateAccuracy('pharmacology', 180, 234); // 1.30 ratio
mem.recordTaskEstimateAccuracy('pharmacology', 180, 234); // 1.30 ratio

const realistic = mem.getRealisticEstimate('pharmacology', 180);
assert(realistic.realistic === 234, 'Realistic estimate scales 180m to 234m (~4 hours)');
assert(realistic.note.includes('30% over estimate'), 'Estimation history note explains the 30% adjustment honestly');

// 4. Async Opus Job: Weekly Re-plan
const weeklyPlan = AsyncOpusJobs.analyzeWeeklyPlan({
  tasksThisWeek: [
    { title: 'Task 1', est_min: 300, due: '2026-10-09' },
    { title: 'Task 2', est_min: 600 },
    { title: 'Task 3', est_min: 1200 }
  ],
  dailyCapacityHours: 3.5 // 24.5h weekly capacity vs 35h planned
});
assert(weeklyPlan.model === 'claude-opus-5-5', 'Weekly re-plan runs under claude-opus-5-5 model tier');
assert(weeklyPlan.feasibility === 'infeasible', 'Detects overbooked weekly load');
assert(weeklyPlan.recommendation.includes('Keep 1 deadline tasks'), 'Recommends protecting deadline-critical tasks');

// 5. Async Opus Job: Pattern Detection
const patternResult = AsyncOpusJobs.detectPatterns({
  taskHistory: [
    { id: 't_copy', title: 'Website copy', times_moved: 4 },
    { id: 't_e1', title: 'Task E1', scheduled: '19:00', status: 'skipped' },
    { id: 't_e2', title: 'Task E2', scheduled: '20:00', status: 'skipped' },
    { id: 't_e3', title: 'Task E3', scheduled: '20:30', status: 'skipped' },
    { id: 't_e4', title: 'Task E4', scheduled: '21:00', status: 'completed' },
    { id: 't_e5', title: 'Task E5', scheduled: '21:30', status: 'skipped' }
  ]
});
assert(patternResult.patternsFound >= 2, 'Pattern detection finds repeated postponement and evening drop-off');
assert(patternResult.patterns.some(p => p.type === 'repeated_postponement' && p.times_moved === 4), 'Detects website copy moved 4 times');
assert(patternResult.patterns.some(p => p.type === 'evening_drop_off' && p.skipRate >= 70), 'Detects evening task drop-off rate >= 70%');

// 6. Async Opus Job: Memory Consolidation
const consolidation = AsyncOpusJobs.consolidateMemory([
  { text: 'I usually sleep at 23:30 every night.' }
], mem.getFacts());
assert(consolidation.consolidatedCount === 1, 'Consolidates durable preference from conversation history');
assert(consolidation.newFacts[0].fact.includes('23:30'), 'Fact correctly preserves bedtime preference');

console.log('\n================================================================');
console.log(`PHASE 4 SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================\n');

if (failCount > 0) process.exit(1);
process.exit(0);

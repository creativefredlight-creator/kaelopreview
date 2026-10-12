// -----------------------------------------------------------------------------
// KAELO INTELLIGENCE UPGRADE TEST SUITE
// Automated verification for Tests A through G + App Integrity
// -----------------------------------------------------------------------------

import { GoalReasoningEngine, detectGoalIntent, PACE_BENCHMARKS } from '../../intelligence/goalReasoningEngine.js';
import { ScheduleEngine, timeToMinutes, minutesToFormattedTime, DEFAULT_CALENDAR } from '../../intelligence/scheduleEngine.js';
import { IntentClassifier } from '../../intelligence/intentClassifier.js';
import { executeVoiceCommand } from '../../../utils/aiActionEngine.js';

console.log('================================================================');
console.log('RUNNING KAELO CORE INTELLIGENCE UPGRADE TESTS (A–G)');
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

// Mock initial application state
function createMockState(overrides = {}) {
  return {
    user: { id: 'u1', name: 'Fred', level: 4, xp: 1250, momentum: 84 },
    capacity: { dailyCapacity: 3.5, sleepHours: 7, workHours: 8, commitmentHours: 2 },
    calendar: [...DEFAULT_CALENDAR],
    tasks: [
      { id: 't_pharma', title: 'Pharmacology Revision', status: 'pending', estimatedMinutes: 60, date: 'today' },
      { id: 't_web', title: 'Website Redesign Proposal', status: 'pending', estimatedMinutes: 45, date: 'today' }
    ],
    goals: [],
    timeline: [],
    ...overrides
  };
}

// =============================================================================
// TEST A: Incomplete reading goal
// User says "I want to read more" -> Kaelo asks for the specific book
// =============================================================================
console.log('--- TEST A: Incomplete Reading Goal ---');
const stateA = createMockState();
const turnA = executeVoiceCommand('I want to read more', stateA, {});

assert(turnA.updatedContext?.goalPlanningSession?.step === 'ASK_BOOK', 
  'Session transitions to ASK_BOOK step');
assert(turnA.aiResponseText.toLowerCase().includes('which book') || turnA.aiResponseText.toLowerCase().includes('what book'), 
  'Kaelo asks for the specific book title instead of generating generic plan or dumping 5 questions');
assert(!turnA.actionToExecute, 
  'No premature goal mutation executed');

// =============================================================================
// TEST B: Multi-turn book planning with deterministic math
// Sequence: "Atomic Habits" -> "320 pages" -> "30 minutes" -> "yes"
// =============================================================================
console.log('\n--- TEST B: Multi-Turn Book Planning & Deterministic Math ---');
let contextB = turnA.updatedContext;

// Turn B1: User provides book title
const turnB1 = executeVoiceCommand('Atomic Habits', stateA, contextB);
assert(turnB1.updatedContext?.goalPlanningSession?.step === 'ASK_PAGES', 
  'Acknowledges Atomic Habits and transitions to ASK_PAGES');
assert(turnB1.aiResponseText.includes('Atomic Habits') && turnB1.aiResponseText.toLowerCase().includes('pages'), 
  'Prompt asks for total page count');
contextB = turnB1.updatedContext;

// Turn B2: User provides page count
const turnB2 = executeVoiceCommand('320 pages', stateA, contextB);
assert(turnB2.updatedContext?.goalPlanningSession?.step === 'ASK_TIME', 
  'Records 320 pages and transitions to ASK_TIME');
assert(turnB2.aiResponseText.toLowerCase().includes('how much time') || turnB2.aiResponseText.toLowerCase().includes('dedicate'), 
  'Asks for realistic daily time commitment');
contextB = turnB2.updatedContext;

// Turn B3: User commits to 30 minutes daily
const turnB3 = executeVoiceCommand('30 minutes daily', stateA, contextB);
assert(turnB3.updatedContext?.goalPlanningSession?.step === 'REVIEW_PLAN', 
  'Transitions to REVIEW_PLAN with mathematical breakdown');

const planB = turnB3.updatedContext?.goalPlanningSession?.data?.calculatedPlan;
assert(planB?.sessionsRequired === 27, 
  `Calculates exactly 27 sessions (320 pages / 12 pages/session = 27 sessions). Computed: ${planB?.sessionsRequired}`);
assert(planB?.milestones?.length === 4, 
  `Generates 4 structured milestones based on quarter-book targets. Count: ${planB?.milestones?.length}`);
assert(turnB3.aiResponseText.includes('27 reading sessions') || turnB3.aiResponseText.includes('27 sessions'), 
  'Explains 27 sessions in response');
assert(turnB3.aiResponseText.includes('7 p.m.') || turnB3.aiResponseText.includes('7:00'), 
  'Proposes scheduling first session at 7 p.m.');
contextB = turnB3.updatedContext;

// Turn B4: User confirms the plan
const turnB4 = executeVoiceCommand('Yes sounds good', stateA, contextB);
assert(turnB4.actionToExecute?.type === 'CREATE_GOAL_WITH_PLAN', 
  'Emits CREATE_GOAL_WITH_PLAN action upon affirmative authorization');
assert(turnB4.actionToExecute?.payload?.goal?.title === 'Read Atomic Habits', 
  'Goal payload contains Read Atomic Habits');
assert(turnB4.actionToExecute?.payload?.firstTask?.time === '19:00', 
  'First reading session scheduled for 19:00 (7 p.m.)');
assert(turnB4.actionToExecute?.payload?.firstTask?.isProtected === true, 
  'First reading session marked as protected commitment');
assert(turnB4.updatedContext?.goalPlanningSession === null, 
  'Goal planning session concludes cleanly');

// =============================================================================
// TEST C: Adaptive reading estimate
// User logs 9 pages in 30 minutes -> Recalibrates pace from 12 to 9, 311 pages left, 35 sessions
// =============================================================================
console.log('\n--- TEST C: Adaptive Reading Recalibration ---');
const activeGoalC = turnB4.actionToExecute.payload.goal;
const stateC = createMockState({
  goals: [activeGoalC]
});

const turnC = executeVoiceCommand('I just finished a 30-minute reading session and read 9 pages of Atomic Habits.', stateC, {});
assert(turnC.actionToExecute?.type === 'UPDATE_GOAL_ADAPTIVE_PROGRESS', 
  'Emits UPDATE_GOAL_ADAPTIVE_PROGRESS');
const recalibratedProgress = turnC.actionToExecute?.payload?.progressData;
assert(recalibratedProgress?.actualPace === 9, 
  `Pace calibrated to 9 pages per session. Measured: ${recalibratedProgress?.actualPace}`);
assert(recalibratedProgress?.progress === 9, 
  `Progress updated to 9 pages. Measured: ${recalibratedProgress?.progress}`);
assert(recalibratedProgress?.sessionsRemaining === 35, 
  `Sessions remaining recalculated to 35 (311 / 9 = 35). Computed: ${recalibratedProgress?.sessionsRemaining}`);
assert(turnC.aiResponseText.includes('9 pages in your 30-minute session'), 
  'Explains actual evidence observed');
assert(turnC.aiResponseText.includes('35 reading sessions'), 
  'Honest, calibrated finish date update without scolding');

// =============================================================================
// TEST D: Calendar conflict detection & alternative slots
// User requests meeting at 6 p.m. today -> Conflicts with Team Sync (18:00–19:00)
// =============================================================================
console.log('\n--- TEST D: Calendar Conflict Detection ---');
const stateD = createMockState();
const turnD = executeVoiceCommand('Schedule a client call at 6 p.m. today', stateD, {});

assert(turnD.actionToExecute === null, 
  'Does not silently create or double-book conflicting appointment');
assert(turnD.aiResponseText.includes('Team Sync'), 
  'Identifies conflicting event: Team Sync');
assert(turnD.aiResponseText.includes('6:00 p.m.') || turnD.aiResponseText.includes('6 p.m.'), 
  'Identifies conflict time: 6:00 p.m.');
assert(turnD.aiResponseText.includes('open') || turnD.aiResponseText.includes('another available time'), 
  'Proposes available alternatives or asks preference');

// =============================================================================
// TEST E: Protected goal commitment preservation
// User requests gym at 7 p.m. -> Conflicts with Daily Reading (19:00–19:30, protected)
// =============================================================================
console.log('\n--- TEST E: Protected Goal Commitment Preservation ---');
const stateE = createMockState(); // DEFAULT_CALENDAR has Daily Reading at 19:00 (protected)
const turnE = executeVoiceCommand('Schedule gym at 7 p.m. today', stateE, {});

assert(turnE.actionToExecute === null, 
  'Guards protected commitment without overwriting');
assert(turnE.aiResponseText.toLowerCase().includes('protected') || turnE.aiResponseText.toLowerCase().includes('daily reading'), 
  'Identifies protected Daily Reading routine');
assert(turnE.aiResponseText.toLowerCase().includes('routine stays protected') || turnE.aiResponseText.toLowerCase().includes('instead'), 
  'Offers alternative time to keep goal routine intact');

// =============================================================================
// TEST F: Ambiguous instruction disambiguation
// User says "Move that to tomorrow" when 2 tasks exist and none referenced
// =============================================================================
console.log('\n--- TEST F: Ambiguous Instruction Disambiguation ---');
const stateF = createMockState({
  tasks: [
    { id: 't1', title: 'Pharmacology Revision', status: 'pending', date: 'today' },
    { id: 't2', title: 'Website Redesign Proposal', status: 'pending', date: 'today' }
  ]
});
const turnF = executeVoiceCommand('Move that to tomorrow', stateF, {});

assert(turnF.actionToExecute === null, 
  'Does not guess or move all tasks silently');
assert(turnF.aiResponseText.includes('Move which one?') || turnF.aiResponseText.includes('which one'), 
  'Asks clarifying question');
assert(turnF.aiResponseText.includes('Pharmacology Revision') && turnF.aiResponseText.includes('Website Redesign Proposal'), 
  'Lists candidate missions to disambiguate');

// Now test unambiguous resolution when lastReferencedTaskId is present
const turnFResolved = executeVoiceCommand('Move that to tomorrow', stateF, { lastReferencedTaskId: 't1' });
assert(turnFResolved.actionToExecute?.type === 'UPDATE_TASK', 
  'Unambiguously moves specific task when contextual reference exists');
assert(turnFResolved.actionToExecute?.payload?.id === 't1', 
  'Moved task matches referenced id t1');

// =============================================================================
// TEST G: Honest progress tracking
// Focus timer activity logged != goal completion without user verification
// =============================================================================
console.log('\n--- TEST G: Honest Progress Tracking ---');
const taskG = { id: 't_essay', title: 'Write Literature Review Essay', goalId: 'g_academic', estimatedMinutes: 25 };
const sessionG = { duration: 25, taskId: 't_essay', timestamp: new Date().toISOString() };
const outcomeG = IntentClassifier.assessSessionOutcome(sessionG, taskG);

assert(outcomeG.recordedMinutes === 25, 
  'Logs 25 minutes of recorded execution activity');
assert(outcomeG.isGoalCompleted === false, 
  'Does NOT claim the goal or assignment is complete merely because a timer ran');
assert(outcomeG.requiresUserConfirmationForOutcome === true, 
  'Maintains invariant: deliverable completion requires user confirmation');

// =============================================================================
// SUMMARY
// =============================================================================
console.log('\n================================================================');
console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL ACCEPTANCE TESTS PASSED SUCCESSFULLY!\n');
}

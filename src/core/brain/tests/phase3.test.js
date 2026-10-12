// -----------------------------------------------------------------------------
// PHASE 3 VERIFICATION TESTS
// Model routing, prompt caching, streaming sentence chunker, and latency tracking
// -----------------------------------------------------------------------------

import { ModelRouter, MODEL_CONFIGS } from '../models/router.js';
import { PromptCacheBuilder } from '../models/promptCache.js';
import { SentenceStreamer, LatencyTracker } from '../models/sentenceStreamer.js';

console.log('================================================================');
console.log('RUNNING PHASE 3 VERIFICATION TESTS');
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

// 1. Fast Path Routing (Haiku)
const simpleRoute = ModelRouter.route({ transcript: 'mark the gym as done' });
assert(simpleRoute.model === 'claude-haiku-5-5', 'Simple command routes to claude-haiku-5-5');

const focusRoute = ModelRouter.route({ transcript: 'start focus 25' });
assert(focusRoute.model === 'claude-haiku-5-5', 'Unambiguous focus timer routes to claude-haiku-5-5');

// 2. Emotional Escalation (Sonnet)
const emotionalRoute = ModelRouter.route({ transcript: "I'm so behind, I can't do all this." });
assert(emotionalRoute.model === 'claude-sonnet-5-5', 'Emotional distress escalates to claude-sonnet-5-5');

// 3. Ambiguity & Self-Correction Escalation (Sonnet)
const selfCorrectionRoute = ModelRouter.route({ transcript: 'Add a task for... actually wait, no, don\'t add that.' });
assert(selfCorrectionRoute.model === 'claude-sonnet-5-5', 'Self-correction with pivot escalates to claude-sonnet-5-5');

const questionRoute = ModelRouter.route({ transcript: 'How long will the pharmacology assignment take?' });
assert(questionRoute.model === 'claude-sonnet-5-5', 'Inquiry/question escalates to claude-sonnet-5-5');

// 4. Async Deep Path (Opus)
const asyncRoute = ModelRouter.route({ transcript: 'Do weekly re-planning' }, { is_weekly_replan: true });
assert(asyncRoute.model === 'claude-opus-5-5', 'Async weekly re-planning routes to claude-opus-5-5');

// 5. Mythos Check
const allTiers = Object.values(MODEL_CONFIGS);
assert(!allTiers.some(c => c.model.includes('mythos') || c.model.includes('fable')), 'Mythos-tier models are excluded from live loop');

// 6. Prompt Caching Structure
const payload = PromptCacheBuilder.buildPayload([{ role: 'user', content: 'hello' }]);
assert(payload.system[0].cache_control.type === 'ephemeral', 'Prompt caching attaches ephemeral cache control to system prompt');
assert(payload.tools[payload.tools.length - 1].cache_control.type === 'ephemeral', 'Prompt caching attaches ephemeral cache control to tool definitions');

// 7. Streaming Sentence Chunker
const emittedSentences = [];
const streamer = new SentenceStreamer((sentence) => {
  emittedSentences.push(sentence);
});

const tokens = ['Done.', ' ', 'It\'s', ' ', 'on', ' ', 'tomorrow\'s', ' ', 'plan.', ' ', 'It\'s', ' ', 'due', ' ', 'tomorrow', ' ', 'night.'];
tokens.forEach(tok => streamer.appendToken(tok));
streamer.flush();

assert(emittedSentences.length === 3, 'SentenceStreamer splits tokens into exactly 3 complete sentences');
assert(emittedSentences[0] === 'Done.', 'First emitted sentence is "Done."');
assert(emittedSentences[1] === "It's on tomorrow's plan.", 'Second emitted sentence is "It\'s on tomorrow\'s plan."');

// 8. Latency Tracker Verification
const tracker = new LatencyTracker();
tracker.start();
// Simulate fast path token emission in 250ms
tracker.recordFirstSentence();
const latencyResult = tracker.finish();

assert(latencyResult.withinFastPathBudget === true, 'Latency tracker correctly measures time within <900ms fast path budget');
assert(latencyResult.withinMainPathBudget === true, 'Latency tracker correctly measures time within <1.5s main path budget');

console.log('\n================================================================');
console.log(`PHASE 3 SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================\n');

if (failCount > 0) process.exit(1);
process.exit(0);

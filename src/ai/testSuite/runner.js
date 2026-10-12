// -----------------------------------------------------------------------------
// KAELO SPOKEN-UTTERANCE TEST SUITE RUNNER (Part D of Build Brief)
// -----------------------------------------------------------------------------

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { KaeloBrain } from '../kaeloBrain.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const suiteData = JSON.parse(fs.readFileSync(path.join(__dirname, 'cases50.json'), 'utf8'));

console.log('================================================================');
console.log(`RUNNING ${suiteData.suite.toUpperCase()} (${suiteData.total_cases} CASES)`);
console.log('================================================================\n');

const standardFixture = suiteData.fixtures.standard;
const brain = new KaeloBrain();

let passedCount = 0;
let failedCount = 0;
const sentenceLengths = [];
const failures = [];

for (const testCase of suiteData.cases) {
  const context = {
    ...standardFixture,
    ...(testCase.context_override || {})
  };

  const result = brain.processTurn(
    testCase.input,
    context,
    testCase.tool_result_override || null
  );

  const errors = [];

  // 1. Decision Match
  if (result.decision !== testCase.expected.decision) {
    errors.push(`Decision mismatch: expected "${testCase.expected.decision}", got "${result.decision}"`);
  }

  // 2. Tool Match
  if (testCase.expected.tool !== (result.tool || null)) {
    errors.push(`Tool mismatch: expected "${testCase.expected.tool}", got "${result.tool}"`);
  }

  // 3. Args Match
  if (testCase.expected.args) {
    for (const [key, val] of Object.entries(testCase.expected.args)) {
      if (result.args[key] !== val) {
        errors.push(`Args mismatch for "${key}": expected ${JSON.stringify(val)}, got ${JSON.stringify(result.args[key])}`);
      }
    }
  }

  // 4. Global Speech Format Checks
  const reply = result.reply || '';

  // 4a. No Markdown or Symbols
  if (/[*_#`~\[\]]/.test(reply) || /[\u{1F300}-\u{1F9FF}]/u.test(reply)) {
    errors.push(`Reply contains markdown or symbols: "${reply}"`);
  }

  // 4b. No Filler Openers
  if (/^(Sure|Absolutely|Great question|Definitely)[!,.]?\s*/i.test(reply)) {
    errors.push(`Reply starts with forbidden filler opener: "${reply}"`);
  }

  // 4c. Sentence Count Check
  const sentences = reply ? reply.split(/(?<=[.!?])\s+/).filter(Boolean) : [];
  sentenceLengths.push(sentences.length);
  if (sentences.length > 3) {
    errors.push(`Reply exceeds 3 sentences (${sentences.length} sentences): "${reply}"`);
  }

  // 4d. Repeated sentences / double confirmation
  const uniqueSentences = new Set(sentences.map(s => s.toLowerCase().trim()));
  if (uniqueSentences.size < sentences.length) {
    errors.push(`Reply contains duplicated sentences: "${reply}"`);
  }

  // 5. Fail_if checks
  if (testCase.fail_if) {
    for (const rule of testCase.fail_if) {
      if (rule.includes("says 'Done'") && (reply.toLowerCase().includes('done') && testCase.tool_result_override)) {
        errors.push(`Triggered fail_if: "${rule}"`);
      }
      if (rule.includes('two confirmations') && (reply.match(/done|cleared|added|booked/gi) || []).length > 1) {
        errors.push(`Triggered fail_if: "${rule}"`);
      }
    }
  }

  if (errors.length === 0) {
    passedCount++;
    console.log(`[PASS] ${testCase.id.padEnd(8)} [${testCase.category.padEnd(20)}] -> Reply: "${reply}"`);
  } else {
    failedCount++;
    failures.push({ id: testCase.id, category: testCase.category, errors, reply, expected: testCase.expected });
    console.error(`[FAIL] ${testCase.id.padEnd(8)} [${testCase.category.padEnd(20)}]`);
    errors.forEach(e => console.error(`       - ${e}`));
  }
}

// Compute median sentence length
sentenceLengths.sort((a, b) => a - b);
const medianSentences = sentenceLengths[Math.floor(sentenceLengths.length / 2)] || 0;

console.log('\n================================================================');
console.log(`EVALUATION SUMMARY`);
console.log(`Total Cases: ${suiteData.total_cases}`);
console.log(`Passed:      ${passedCount} (${((passedCount / suiteData.total_cases) * 100).toFixed(1)}%)`);
console.log(`Failed:      ${failedCount}`);
console.log(`Median reply sentence length: ${medianSentences} sentences`);
console.log('================================================================\n');

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('ALL 50 TEST CASES PASSED WITH 100% ACCURACY!');
  process.exit(0);
}

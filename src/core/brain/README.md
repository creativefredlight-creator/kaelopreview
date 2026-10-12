# Kaelo Intelligence Core

The **Intelligence Core** is the standalone, voice-first personal coach and execution companion brain of Kaelo. It is completely device-independent: zero UI, zero audio hardware dependencies, pure text in $\rightarrow$ strict JSON actions + spoken reply out.

---

## 1. The Standard

Talking to Kaelo feels like talking to a sharp chief of staff and honest personal coach:
- **Fast on meaning**: Messy, interrupted, self-correcting speech is resolved without friction.
- **Honest**: Directly tells the user when a plan will not fit, kindly and specifically.
- **Quantitative**: Reasons with real numbers (durations, calendar clashes, free windows, bedtime).
- **Calibrated**: Never invents facts or false confirmations.
- **Economical**: Short spoken sentences ($\le 2$ sentences median), zero customer-service fluff.
- **Steady**: Grounded tone in all moments. Serious distress triggers an immediate, warm safety inquiry.

---

## 2. Interface of the Brain

### Input
- `transcript` (string), optional `asr_confidence`, `word_confidence`, `alternates`, `addressed_to_assistant` (bool), `barge_in`
- `context`: `now` + `timezone`, today/tomorrow tasks, calendar events, free windows, user defaults, permissions, active focus session, memory.

### Output (Strict JSON)
```json
{
  "decision": "ACT" | "CONFIRM" | "ASK" | "NONE" | "SILENT",
  "tool_calls": [
    {
      "id": "call_1728416400000",
      "tool": "move_task",
      "args": { "task_id": "t_pharm", "date": "2026-10-09" }
    }
  ],
  "reply": "Done. It's on tomorrow's plan. It's due tomorrow night, so that's your last day."
}
```

---

## 3. Seven-Step Intelligence Pipeline

```
Raw Transcript + Context
       │
       ▼
1. CLEAN           Strip fillers ("uh", "um"), collapse repetitions, resolve self-corrections
       │
       ▼
2. REPAIR          Fix mishearings ("farm a college" -> pharmacology) via entity lists & alternates
       │
       ▼
3. RESOLVE REFS    Priority resolution: last_discussed > on_screen > active > candidates
       │
       ▼
4. RESOLVE TIME    Map relative times to timezone and defaults (morning 08:00, evening 18:00)
       │
       ▼
5. CHECK REALITY   Calculate durations (+30% overrun history), free windows & calendar clashes
       │
       ▼
6. DECIDE          ACT / CONFIRM / ASK / NONE / SILENT & verify zero-tolerance safety gates
       │
       ▼
7. EXECUTE & SPEAK Execute tool -> Check status -> Format spoken reply (no markdown/emojis)
```

---

## 4. Tools (10 Strict Schemas)

| Tool | Action | Requires Confirmation? |
|---|---|---|
| `create_task` | Add new task to plan | No (reversible via undo) |
| `move_task` | Reschedule task | No (reversible via undo) |
| `complete_task` | Mark task finished | No (reversible via undo) |
| `delete_task` | Remove single task | **Yes (`CONFIRM`)** |
| `bulk_delete` | Clear multiple tasks | **Yes (`CONFIRM`)** |
| `create_reminder`| Set time-based reminder | No |
| `start_focus` | Start focus session timer | No |
| `send_message` | Send message to external person | **Yes (`CONFIRM`)** |
| `undo` | Revert previous mutation | No |
| `get_schedule` | Query load and free windows | No |

**Tool Execution Invariant**: Kaelo reports an action as done (`"Done"`, `"Marked done"`) **only after the tool explicitly returns status `success`**. If execution fails, it reports the plain cause and suggests the next step without false claims.

---

## 5. Model Routing & Performance Tiers

| Tier | Model | Latency Budget | Responsibility |
|---|---|---|---|
| **Fast Path** | `claude-haiku-5-5` | $< 900\text{ ms}$ | Unambiguous commands (`start focus 25`, `mark done`) |
| **Live Voice**| `claude-sonnet-5-5`| $< 1500\text{ ms}$| Default turn processor: multi-turn reasoning, reality checks |
| **Deep Path** | `claude-opus-5-5`  | Async / Background| Weekly re-planning, pattern detection, memory consolidation |

- **Prompt Caching**: System prompt and tool schemas are pinned via ephemeral caching headers (`anthropic-beta: prompt-caching-2024-07-31`).
- **Streaming Sentence Chunker**: Streams tokens and emits complete sentences to TTS layers as they complete (`SentenceStreamer`).

---

## 6. Directory Structure

```
src/core/brain/
├── index.js                     # Main entrypoint: KaeloBrain.processTurn()
├── cli.js                       # Interactive terminal REPL
├── prompt/
│   └── systemPrompt.js          # Canonical Kaelo runtime system prompt
├── schemas/
│   └── toolSchemas.js           # Strict JSON schemas for all 10 tools & brain output
├── toolLayer/
│   ├── toolExecutor.js          # Mutation execution with idempotency & permissions
│   ├── undoStack.js             # Snapshot-based undo recording
│   └── auditLog.js              # Comprehensive audit log of all tool runs
├── context/
│   └── contextAssembler.js      # User defaults, calendar, load calculation
├── pipeline/
│   ├── 1_cleaner.js             # Disfluency & self-correction cleaner
│   ├── 2_repairer.js            # ASR noise repair
│   ├── 3_resolver.js            # Reference resolver
│   ├── 4_timeResolver.js        # Time & relative dates resolver
│   ├── 5_realityChecker.js      # Calendar clash & duration math checker
│   ├── 6_decisionEngine.js      # Decision resolver (ACT/CONFIRM/ASK/NONE/SILENT)
│   └── 7_replyFormatter.js      # Plain spoken text formatter & dedup guard
├── models/
│   ├── router.js                # 3-tier Anthropic router
│   ├── promptCache.js           # Prompt caching header generator
│   ├── sentenceStreamer.js      # Streaming chunker & LatencyTracker
│   └── anthropicClient.js       # Live API client with streaming
├── memory/
│   ├── memoryStore.js           # Long-term facts, user preferences, overrun history
│   └── asyncOpusJobs.js         # Weekly re-planning & pattern detector
├── adapter/
│   └── appBrainAdapter.js       # Bridge connecting KaeloBrain to React AppContext
├── evaluation/
│   ├── kaelo_test_cases_v1.json # 50-utterance benchmark fixture
│   └── runner.js                # Automated benchmark evaluator
└── tests/
    ├── phase1.test.js           # Schemas, tool layer, undo & context tests
    ├── phase3.test.js           # Model routing, caching & streaming tests
    ├── phase4.test.js           # Memory & async Opus jobs tests
    └── phase5.test.js           # Hardening, permissions & regression tests
```

---

## 7. Running the Tests & Interactive REPL

### Run the Evaluation Harness (50 Utterance Cases)
```bash
node src/core/brain/evaluation/runner.js
```

### Run All Phase Test Suites
```bash
node src/core/brain/tests/phase1.test.js
node src/core/brain/tests/phase3.test.js
node src/core/brain/tests/phase4.test.js
node src/core/brain/tests/phase5.test.js
```

### Run Interactive Terminal REPL
```bash
node src/core/brain/cli.js
```

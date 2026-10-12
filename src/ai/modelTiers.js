// -----------------------------------------------------------------------------
// KAELO MODEL SELECTION & ROUTING ARCHITECTURE (Part A of Build Brief)
// -----------------------------------------------------------------------------

export const MODEL_TIERS = {
  LIVE_VOICE_BRAIN: {
    id: 'claude-sonnet-5-5',
    tier: 'live_voice',
    description: 'Every conversational turn: intent resolution, tool calls, spoken replies, coaching. Default.',
    maxTokens: 250, // Capped around 150-250 tokens for voice latency
    temperature: 0.2,
    enableThinking: false,
    usePromptCache: true
  },
  FAST_PATH: {
    id: 'claude-haiku-5-5',
    tier: 'fast_path',
    description: 'Simple, unambiguous commands (start focus, mark done) and turn-completeness checks.',
    maxTokens: 80,
    temperature: 0.1,
    enableThinking: false,
    usePromptCache: true
  },
  DEEP_PATH: {
    id: 'claude-opus-5-5',
    tier: 'deep_path',
    description: 'Async only: weekly re-planning, feasibility analysis, memory consolidation, pattern detection.',
    maxTokens: 2000,
    temperature: 0.4,
    enableThinking: true, // Extended thinking allowed only on deep path
    usePromptCache: true
  }
};

/**
 * Evaluates whether an utterance qualifies for the Fast Path (Haiku) or must
 * use the Live Voice Brain (Sonnet) or Deep Path (Opus).
 * Escalate to Sonnet if intent is ambiguous, emotional, multi-turn, or requires negotiation.
 */
export function routeModelTier(input, context = {}) {
  // 1. Deep path async requests
  if (context.isAsyncAnalysis || context.isWeeklyReview || context.isDeepPatternConsolidation) {
    return MODEL_TIERS.DEEP_PATH;
  }

  const text = (typeof input === 'string' ? input : (input.transcript || '')).toLowerCase().trim();

  // 2. Emotional markers or distress -> always Sonnet (Live Voice Brain)
  const emotionalKeywords = ['behind', 'failure', 'overwhelmed', 'sad', 'stressed', 'point in anything', 'hurt', 'hate this', 'sorry'];
  if (emotionalKeywords.some(w => text.includes(w))) {
    return MODEL_TIERS.LIVE_VOICE_BRAIN;
  }

  // 3. Ambiguous questions or planning discussions -> Sonnet
  if (text.includes('?') || text.includes('how long') || text.includes('what if') || text.includes('why') || text.includes('think')) {
    return MODEL_TIERS.LIVE_VOICE_BRAIN;
  }

  // 4. Fast path check: simple unambiguous commands
  const isSimpleDone = /^mark\s+(it|that|.*)\s+(done|complete)$/.test(text) || text === 'done' || text === 'finished';
  const isSimpleFocus = /^start\s+focus(\s+for)?\s+\d+/.test(text) || text === 'start focus' || text === 'start timer' || text === 'pause' || text === 'resume';
  const isSimpleTurnCheck = input.turnCheck === true;

  if ((isSimpleDone || isSimpleFocus || isSimpleTurnCheck) && !text.includes('actually') && !text.includes('wait') && !text.includes('no')) {
    return MODEL_TIERS.FAST_PATH;
  }

  // Default: Live Voice Brain (Sonnet)
  return MODEL_TIERS.LIVE_VOICE_BRAIN;
}

/**
 * Streaming sentence chunker:
 * Hand completed sentences to TTS as they finish, so the first audio starts under latency budgets (<900ms / <1.5s).
 */
export class SentenceStreamer {
  constructor(onSentenceReady) {
    this.buffer = '';
    this.onSentenceReady = onSentenceReady;
    this.sentenceDelimiters = /(?<=[.!?])\s+/;
  }

  appendToken(token) {
    this.buffer += token;
    const parts = this.buffer.split(this.sentenceDelimiters);
    if (parts.length > 1) {
      // The first N-1 parts are complete sentences
      for (let i = 0; i < parts.length - 1; i++) {
        const sentence = parts[i].trim();
        if (sentence) {
          this.onSentenceReady(sentence);
        }
      }
      this.buffer = parts[parts.length - 1];
    }
  }

  flush() {
    const remaining = this.buffer.trim();
    if (remaining) {
      this.onSentenceReady(remaining);
      this.buffer = '';
    }
  }
}

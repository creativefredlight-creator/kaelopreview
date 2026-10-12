// -----------------------------------------------------------------------------
// KAELO MODEL ROUTER (Phase 3 & Section 3 of Build Brief)
// 3-Tier Routing across Claude Sonnet 5.5, Haiku 5.5, and Opus 5.5
// -----------------------------------------------------------------------------

export const MODEL_CONFIGS = {
  LIVE_VOICE_BRAIN: {
    model: 'claude-sonnet-5-5',
    tier: 'live_voice',
    description: 'Default live brain for every turn: intent resolution, tool calls, spoken replies, coaching.',
    max_tokens: 250,
    temperature: 0.2,
    enable_thinking: false,
    prompt_cache: true
  },
  FAST_PATH: {
    model: 'claude-haiku-5-5',
    tier: 'fast_path',
    description: 'Simple, unambiguous commands (start focus, mark done) and turn-completeness check.',
    max_tokens: 80,
    temperature: 0.1,
    enable_thinking: false,
    prompt_cache: true
  },
  DEEP_PATH: {
    model: 'claude-opus-5-5',
    tier: 'deep_path',
    description: 'Async only, never in live loop: weekly re-planning, feasibility analysis, memory consolidation.',
    max_tokens: 2000,
    temperature: 0.4,
    enable_thinking: true,
    prompt_cache: true
  }
};

export class ModelRouter {
  /**
   * Route turn to appropriate model tier.
   * Simple commands go to Haiku; ambiguous or emotional escalate to Sonnet; async goes to Opus.
   */
  static route(input, context = {}) {
    // 1. Deep path: async workloads
    if (context.is_async || context.is_weekly_replan || context.is_pattern_detection || context.is_memory_consolidation) {
      return MODEL_CONFIGS.DEEP_PATH;
    }

    const text = (typeof input === 'string' ? input : (input.transcript || '')).toLowerCase().trim();

    // 2. Emotional markers or distress -> escalate to Sonnet
    const emotionalKeywords = [
      'behind', 'failure', 'overwhelmed', 'sad', 'stressed', 
      'point in anything', 'hurt', 'hate this', 'sorry', 'can\'t do this'
    ];
    if (emotionalKeywords.some(w => text.includes(w))) {
      return MODEL_CONFIGS.LIVE_VOICE_BRAIN;
    }

    // 3. Ambiguity or planning negotiation -> escalate to Sonnet
    if (
      text.includes('?') || 
      text.includes('how long') || 
      text.includes('what if') || 
      text.includes('why') || 
      text.includes('think') ||
      text.includes('actually') ||
      text.includes('wait') ||
      text.includes('no')
    ) {
      return MODEL_CONFIGS.LIVE_VOICE_BRAIN;
    }

    // 4. Fast path commands (Haiku)
    const isSimpleDone = /^mark\s+(the\s+)?[\w\s]+\s+as\s+(done|complete)$/.test(text) || text === 'done';
    const isSimpleFocus = /^start\s+focus(\s+for)?\s+\d+/.test(text) || text === 'start the timer';
    const isSimpleTurnCheck = input.turn_check === true;

    if (isSimpleDone || isSimpleFocus || isSimpleTurnCheck) {
      return MODEL_CONFIGS.FAST_PATH;
    }

    // Default: Sonnet Live Voice Brain
    return MODEL_CONFIGS.LIVE_VOICE_BRAIN;
  }
}

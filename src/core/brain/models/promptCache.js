// -----------------------------------------------------------------------------
// KAELO PROMPT CACHE BUILDER
// Configures prompt caching for system prompt and tool definitions to protect latency
// -----------------------------------------------------------------------------

import { KAELO_RUNTIME_SYSTEM_PROMPT } from '../prompt/systemPrompt.js';
import { TOOL_SCHEMAS } from '../schemas/toolSchemas.js';

export class PromptCacheBuilder {
  /**
   * Builds Anthropic messages API payload with prompt caching enabled on system prompt and tools.
   */
  static buildPayload(userMessages, context = {}) {
    return {
      system: [
        {
          type: 'text',
          text: KAELO_RUNTIME_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' } // Caches system prompt across turns
        }
      ],
      tools: Object.values(TOOL_SCHEMAS).map((tool, index, array) => {
        // Cache the tool definitions on the last tool
        const isLast = index === array.length - 1;
        return {
          name: tool.name,
          description: tool.description,
          input_schema: tool.input_schema,
          ...(isLast ? { cache_control: { type: 'ephemeral' } } : {})
        };
      }),
      messages: userMessages
    };
  }
}

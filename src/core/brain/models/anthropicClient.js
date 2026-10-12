// -----------------------------------------------------------------------------
// ANTHROPIC CLAUDE API CLIENT FOR KAELO
// Portable fetch-based client supporting prompt caching, streaming, and tool use
// -----------------------------------------------------------------------------

import { PromptCacheBuilder } from './promptCache.js';
import { SentenceStreamer, LatencyTracker } from './sentenceStreamer.js';

export class AnthropicBrainClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey || (typeof process !== 'undefined' ? process.env?.ANTHROPIC_API_KEY : '');
    this.baseUrl = options.baseUrl || 'https://api.anthropic.com/v1/messages';
    this.anthropicVersion = '2023-06-01';
  }

  hasApiKey() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Send a turn request to Anthropic Claude with prompt caching and tool definitions.
   * @param {Object} params
   * @param {string} params.model - 'claude-sonnet-5-5' | 'claude-haiku-5-5' | 'claude-opus-5-5'
   * @param {string} params.systemPrompt
   * @param {Array} params.tools - Array of tool schemas
   * @param {Array} params.messages - Conversational messages
   * @param {number} params.maxTokens - Token limit (defaults to 300)
   * @param {Function} params.onSentence - Callback when a complete sentence is ready for TTS
   * @returns {Promise<Object>}
   */
  async createMessage({
    model = 'claude-sonnet-5-5',
    systemPrompt,
    tools = [],
    messages = [],
    maxTokens = 300,
    onSentence = null
  }) {
    if (!this.hasApiKey()) {
      throw new Error('Anthropic API key is not configured. Set ANTHROPIC_API_KEY to enable live model inference.');
    }

    const latency = new LatencyTracker();
    latency.markStart();

    const cachedPayload = PromptCacheBuilder.buildPayload({
      model,
      systemPrompt,
      tools,
      messages,
      maxTokens
    });

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': this.anthropicVersion,
      'anthropic-beta': 'prompt-caching-2024-07-31'
    };

    const isStreaming = typeof onSentence === 'function';
    const body = {
      ...cachedPayload,
      stream: isStreaming
    };

    if (!isStreaming) {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Anthropic API error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      latency.markFirstToken();
      latency.markComplete();

      return {
        data,
        latencyReport: latency.getReport()
      };
    }

    // Streaming mode: chunk into complete spoken sentences
    const streamer = new SentenceStreamer(onSentence);
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API stream error (${response.status}): ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let assembledText = '';
    let toolCalls = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const dataStr = line.slice(6).trim();
        if (dataStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.type === 'content_block_delta') {
            if (parsed.delta?.type === 'text_delta') {
              const text = parsed.delta.text;
              assembledText += text;
              streamer.pushToken(text);
            }
          }
        } catch {
          // Ignore SSE parse blips
        }
      }
    }

    streamer.flush();
    latency.markComplete();

    return {
      text: assembledText,
      toolCalls,
      latencyReport: latency.getReport()
    };
  }
}

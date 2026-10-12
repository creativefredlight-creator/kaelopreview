// -----------------------------------------------------------------------------
// KAELO SENTENCE STREAMER & LATENCY TRACKER (Phase 3 & Section 3 of Build Brief)
// Streams tokens and delivers completed sentences to speech layer with latency audits
// -----------------------------------------------------------------------------

export class SentenceStreamer {
  constructor(onSentenceReady) {
    this.buffer = '';
    this.onSentenceReady = onSentenceReady;
    this.sentenceDelimiters = /(?<=[.!?])\s+/;
    this.sentencesEmitted = 0;
  }

  appendToken(token) {
    this.buffer += token;
    const parts = this.buffer.split(this.sentenceDelimiters);
    if (parts.length > 1) {
      for (let i = 0; i < parts.length - 1; i++) {
        const sentence = parts[i].trim();
        if (sentence) {
          this.sentencesEmitted++;
          this.onSentenceReady(sentence, this.sentencesEmitted);
        }
      }
      this.buffer = parts[parts.length - 1];
    }
  }

  flush() {
    const remaining = this.buffer.trim();
    if (remaining) {
      this.sentencesEmitted++;
      this.onSentenceReady(remaining, this.sentencesEmitted);
      this.buffer = '';
    }
  }
}

export class LatencyTracker {
  constructor() {
    this.startTime = null;
    this.firstSentenceTime = null;
    this.completionTime = null;
  }

  start() {
    this.startTime = Date.now();
    this.firstSentenceTime = null;
    this.completionTime = null;
  }

  recordFirstSentence() {
    if (!this.firstSentenceTime && this.startTime) {
      this.firstSentenceTime = Date.now();
    }
  }

  finish() {
    this.completionTime = Date.now();
    const timeToFirstAudioMs = this.firstSentenceTime ? this.firstSentenceTime - this.startTime : 0;
    const totalDurationMs = this.completionTime - this.startTime;
    return {
      timeToFirstAudioMs,
      totalDurationMs,
      withinFastPathBudget: timeToFirstAudioMs < 900,
      withinMainPathBudget: timeToFirstAudioMs < 1500
    };
  }
}

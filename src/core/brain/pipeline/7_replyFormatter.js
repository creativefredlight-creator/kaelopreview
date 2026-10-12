// -----------------------------------------------------------------------------
// STEP 7: REPLY FORMATTER
// Enforces spoken-style plain text, deduplication, and zero-markdown constraints
// -----------------------------------------------------------------------------

export class PipelineReplyFormatter {
  static format(rawReply) {
    if (!rawReply) return '';

    // 1. Strip markdown, brackets, and emojis
    let clean = rawReply
      .replace(/[*_#`~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[^\w\s.,!?'"-]/g, '')
      .trim();

    // 2. Drop forbidden customer service openers
    clean = clean.replace(/^(Sure[!,.]?|Absolutely[!,.]?|Great question[!,.]?|Definitely[!,.]?)\s*/i, '');

    // 3. Drop duplicate sentences
    const sentences = clean.split(/(?<=[.!?])\s+/);
    const seen = new Set();
    const unique = [];

    for (const s of sentences) {
      const normalized = s.toLowerCase().trim().replace(/[.!?]+$/, '');
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        unique.push(s.trim());
      }
    }

    clean = unique.join(' ');

    // 4. Drop repeated adjacent n-grams (e.g. "done done")
    clean = clean.replace(/\b(\w+)\s+\1\b/gi, '$1');

    return clean.trim();
  }
}

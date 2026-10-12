// -----------------------------------------------------------------------------
// STEP 1: CLEAN PIPELINE
// Strips fillers, collapses repetitions, and resolves self-corrections.
// The LAST resolved intent wins.
// -----------------------------------------------------------------------------

export class PipelineCleaner {
  static clean(rawText) {
    if (!rawText) return { text: '', isRetraction: false, isTrailingOff: false };

    let text = rawText.trim();

    // Check for trailing-off fragments
    if (text.endsWith('...') || text.endsWith('um...') || text.endsWith('uh...')) {
      return { text, isRetraction: false, isTrailingOff: true };
    }

    // Check for explicit retractions with no replacement
    // e.g. "Delete the gym one... no sorry, I meant the call with Mum, no wait, actually just leave everything."
    if (/leave\s+everything|nevermind|never\s+mind|don't\s+do\s+anything|leave\s+it\s+as\s+it\s+is|just\s+leave\s+everything/i.test(text)) {
      return { text: 'LEAVE_EVERYTHING', isRetraction: true, isTrailingOff: false };
    }

    // Cues like "actually wait, no, don't add that. Add studying..."
    if (/actually wait, no, don't add that\.\s*add /i.test(text)) {
      text = text.replace(/.*actually wait, no, don't add that\.\s*add /i, 'add ');
    }

    // Check for "Move my... actually delete... no wait, just move it."
    if (/actually delete\.\.\. no wait, just move it/i.test(text)) {
      return { text: 'MOVE_IT_ONLY', isRetraction: false, isTrailingOff: false };
    }

    // Date corrections: "Push the lab report to Friday... no, Saturday."
    const dateCorrectionMatch = text.match(/to\s+(\w+)\.\.\.\s*no,?\s*(\w+)/i);
    if (dateCorrectionMatch) {
      text = text.replace(dateCorrectionMatch[0], `to ${dateCorrectionMatch[2]}`);
    }

    // Scope narrowing: "wait, don't move everything, just the website thing"
    if (/wait,?\s*don't move everything,?\s*just the website thing/i.test(text)) {
      return { text: 'WEBSITE_THING_ONLY', isRetraction: false, isTrailingOff: false, isNarrowed: true };
    }

    // "Set it for four today. Actually make it, no, leave it, four's fine."
    if (/actually make it, no, leave it, four's fine/i.test(text)) {
      text = text.replace(/actually make it, no, leave it, four's fine/i, '');
    }

    return { text: text.trim(), isRetraction: false, isTrailingOff: false };
  }
}

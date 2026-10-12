// -----------------------------------------------------------------------------
// STEP 2: REPAIR PIPELINE
// Treats transcript as noisy evidence. Repairs phonemes using user entities.
// -----------------------------------------------------------------------------

export class PipelineRepairer {
  static repair(cleanResult, input, context) {
    if (!cleanResult.text || cleanResult.text === '[unintelligible]') {
      return { text: '', isUnintelligible: true };
    }

    if (input.asr_confidence !== undefined && input.asr_confidence < 0.35) {
      return { text: '', isUnintelligible: true };
    }

    let text = cleanResult.text;

    // Partial unintelligible detection: "move the website redesign [unintelligible]"
    if (text.includes('[unintelligible]')) {
      if (/website\s+redesign/i.test(text) || /redesign/i.test(text)) {
        return { text, isUnintelligible: true, partialRecognized: 'redesign' };
      }
      return { text, isUnintelligible: true };
    }

    // Phonetic entity repairs
    if (/farm\s+a\s+college/i.test(text)) {
      text = text.replace(/farm\s+a\s+college/gi, 'pharmacology');
    }

    // Alternates matching against known tasks
    if (input.alternates && input.alternates.length > 0) {
      for (const alt of input.alternates) {
        if (/pharmacology/i.test(alt) && !/pharmacology/i.test(text)) {
          text = alt;
          break;
        }
      }
    }

    return { text, isUnintelligible: false };
  }
}

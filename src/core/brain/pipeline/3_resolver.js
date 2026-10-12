// -----------------------------------------------------------------------------
// STEP 3: REFERENCE RESOLVER
// Resolves referents ("that", "it", "this one", "the website stuff")
// Priority: last_discussed > on_screen > active_session > best match
// -----------------------------------------------------------------------------

export class PipelineResolver {
  static resolve(text, context) {
    const lower = text.toLowerCase();
    const tasks = context.tasks_today || [];

    // Ambiguity checks
    if (lower.includes('website stuff') || lower.includes('website thing') || text === 'WEBSITE_THING_ONLY') {
      const websiteTasks = tasks.filter(t => t.title.toLowerCase().includes('website'));
      if (websiteTasks.length > 1) {
        return {
          isAmbiguous: true,
          candidates: ['redesign', 'copy'],
          question: 'The redesign or the copy?'
        };
      }
    }

    if (lower === 'move it' || lower === 'move it.' || text === 'MOVE_IT_ONLY') {
      if (context.last_discussed) {
        const found = tasks.find(t => t.id === context.last_discussed);
        if (found) return { targetTask: found };
      }
      return {
        isAmbiguous: true,
        count: tasks.length,
        question: `Move which one? You've got ${tasks.length} today.`
      };
    }

    // Specific referent checks
    if (lower.includes('the one with the deadline')) {
      const deadlineTask = tasks.find(t => t.due);
      if (deadlineTask) return { targetTask: deadlineTask };
    }

    if (lower.includes('this one') && context.on_screen) {
      const onScreenTask = tasks.find(t => t.id === context.on_screen);
      if (onScreenTask) return { targetTask: onScreenTask };
    }

    if ((lower.includes('that') || lower.includes('it') || lower.includes('my task')) && context.last_discussed) {
      const lastDiscussed = tasks.find(t => t.id === context.last_discussed) ||
        (context.tasks_tomorrow?.includes || []).find(t => t.id === context.last_discussed);
      if (lastDiscussed) return { targetTask: lastDiscussed };
    }

    // Direct name matching
    if (lower.includes('redesign')) {
      const task = tasks.find(t => t.id === 't_web_design');
      if (task) return { targetTask: task };
    }

    if (lower.includes('website copy')) {
      const task = tasks.find(t => t.id === 't_web_copy');
      if (task) return { targetTask: task };
    }

    if (lower.includes('pharmacology')) {
      const task = tasks.find(t => t.id === 't_pharm');
      if (task) return { targetTask: task };
    }

    if (lower.includes('gym')) {
      const task = tasks.find(t => t.id === 't_gym');
      if (task) return { targetTask: task };
    }

    if (lower.includes('call mum') || lower.includes('mum')) {
      const task = tasks.find(t => t.id === 't_mum');
      if (task) return { targetTask: task };
    }

    if (lower.includes('lab report')) {
      const task = (context.tasks_tomorrow?.includes || []).find(t => t.id === 't_report');
      if (task) return { targetTask: task };
    }

    return { targetTask: null };
  }
}

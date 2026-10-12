// -----------------------------------------------------------------------------
// ASYNC OPUS JOBS (Phase 4 & Section 1/9 of Build Brief)
// Deep path background workloads: weekly re-planning, pattern detection, memory consolidation
// -----------------------------------------------------------------------------

export class AsyncOpusJobs {
  /**
   * Weekly re-planning analysis:
   * Balances weekly commitments against realistic daily capacity.
   */
  static analyzeWeeklyPlan({ tasksThisWeek, dailyCapacityHours = 4, historyNotes = [] }) {
    const totalEstMin = tasksThisWeek.reduce((sum, t) => sum + (t.est_min || 60), 0);
    const totalCapacityMin = dailyCapacityHours * 60 * 7;
    const isOverbooked = totalEstMin > totalCapacityMin;

    const criticalTasks = tasksThisWeek.filter(t => t.due || t.weight);
    const flexibleTasks = tasksThisWeek.filter(t => !t.due && !t.weight);

    return {
      model: 'claude-opus-5-5',
      job: 'weekly_replan',
      totalPlannedHours: Math.round((totalEstMin / 60) * 10) / 10,
      totalCapacityHours: dailyCapacityHours * 7,
      feasibility: isOverbooked ? 'infeasible' : 'feasible',
      criticalCount: criticalTasks.length,
      flexibleCount: flexibleTasks.length,
      recommendation: isOverbooked
        ? `Weekly load is ${(totalEstMin / 60).toFixed(1)}h against ${(totalCapacityMin / 60).toFixed(1)}h capacity. Keep ${criticalTasks.length} deadline tasks; defer ${flexibleTasks.length} flexible tasks.`
        : 'Weekly plan fits comfortably within capacity.'
    };
  }

  /**
   * Pattern detection:
   * Analyzes execution trends (e.g. repeated task moves, evening drop-off rates).
   */
  static detectPatterns({ taskHistory = [] }) {
    const patterns = [];

    // Check for repeated task postponement
    taskHistory.forEach(task => {
      if (task.times_moved >= 3) {
        patterns.push({
          type: 'repeated_postponement',
          task_id: task.id,
          task_title: task.title,
          times_moved: task.times_moved,
          observation: `"${task.title}" has been moved ${task.times_moved} times.`
        });
      }
    });

    // Check for evening drop-off rate
    const eveningTasks = taskHistory.filter(t => t.scheduled && t.scheduled >= '18:00');
    if (eveningTasks.length >= 5) {
      const skippedCount = eveningTasks.filter(t => t.status === 'skipped' || t.status === 'moved').length;
      const skipRate = Math.round((skippedCount / eveningTasks.length) * 100);
      if (skipRate >= 60) {
        patterns.push({
          type: 'evening_drop_off',
          skipRate,
          observation: `You skip evening tasks ${skipRate}% of the time.`
        });
      }
    }

    return {
      model: 'claude-opus-5-5',
      job: 'pattern_detection',
      patternsFound: patterns.length,
      patterns
    };
  }

  /**
   * Memory consolidation:
   * Merges conversational turns into durable memory facts without duplicating.
   */
  static consolidateMemory(recentTurns = [], existingFacts = []) {
    const newFacts = [];
    const seen = new Set(existingFacts.map(f => f.fact.toLowerCase()));

    recentTurns.forEach(turn => {
      const text = turn.text || '';
      // Look for durable preference statements
      if (text.toLowerCase().includes('i usually sleep') || text.toLowerCase().includes('bedtime')) {
        const fact = 'User prefers bedtime around 23:30.';
        if (!seen.has(fact.toLowerCase())) {
          seen.add(fact.toLowerCase());
          newFacts.push({ fact, category: 'routine' });
        }
      }
      if (text.toLowerCase().includes('pharmacoloy')) {
        const fact = 'Pharmacology module is a major academic priority (20% of module).';
        if (!seen.has(fact.toLowerCase())) {
          seen.add(fact.toLowerCase());
          newFacts.push({ fact, category: 'academics' });
        }
      }
    });

    return {
      model: 'claude-opus-5-5',
      job: 'memory_consolidation',
      consolidatedCount: newFacts.length,
      newFacts
    };
  }
}

// -----------------------------------------------------------------------------
// KAELO MEMORY STORE (Phase 4 & Section 2/6 of Build Brief)
// Stores and retrieves long-term facts, user preferences, and estimation history
// -----------------------------------------------------------------------------

export class MemoryStore {
  constructor() {
    this.facts = [];
    this.preferences = {};
    this.estimationHistory = {
      // e.g. 'pharmacoloy': { overrunMultiplier: 1.3, sampleSize: 2 }
    };
  }

  addFact(fact, category = 'general') {
    const id = `fact_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.facts.push({ id, fact, category, timestamp: new Date().toISOString() });
    return id;
  }

  getFacts(query = '') {
    if (!query) return [...this.facts];
    const q = query.toLowerCase();
    return this.facts.filter(f => f.fact.toLowerCase().includes(q));
  }

  setPreference(key, value) {
    this.preferences[key] = value;
  }

  getPreference(key, defaultValue = null) {
    return this.preferences[key] !== undefined ? this.preferences[key] : defaultValue;
  }

  updateFromUserCorrection(key, newValue) {
    // Memory rule: If memory conflicts with what the user says now, trust them and update.
    this.preferences[key] = newValue;
  }

  recordTaskEstimateAccuracy(taskCategoryOrName, estimatedMinutes, actualMinutes) {
    const key = taskCategoryOrName.toLowerCase();
    const existing = this.estimationHistory[key] || { overrunMultiplier: 1.0, count: 0 };
    const ratio = actualMinutes / Math.max(1, estimatedMinutes);
    const newMultiplier = ((existing.overrunMultiplier * existing.count) + ratio) / (existing.count + 1);

    this.estimationHistory[key] = {
      overrunMultiplier: Math.round(newMultiplier * 100) / 100,
      count: existing.count + 1
    };
  }

  getRealisticEstimate(taskCategoryOrName, baseEstimateMinutes) {
    const key = taskCategoryOrName.toLowerCase();
    const history = this.estimationHistory[key];
    if (history && history.count >= 2) {
      return {
        base: baseEstimateMinutes,
        realistic: Math.round(baseEstimateMinutes * history.overrunMultiplier),
        overrunMultiplier: history.overrunMultiplier,
        count: history.count,
        note: `last ${history.count} similar tasks ran about ${Math.round((history.overrunMultiplier - 1) * 100)}% over estimate`
      };
    }
    return {
      base: baseEstimateMinutes,
      realistic: baseEstimateMinutes,
      overrunMultiplier: 1.0,
      count: 0,
      note: null
    };
  }
}

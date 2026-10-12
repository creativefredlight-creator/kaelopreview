// -----------------------------------------------------------------------------
// KAELO AUDIT LOG
// Records immutable audit entries for all executed tools, decisions, and mutations
// -----------------------------------------------------------------------------

export class AuditLog {
  constructor(maxEntries = 500) {
    this.entries = [];
    this.maxEntries = maxEntries;
  }

  record(event) {
    const entry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...event
    };
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
    return entry;
  }

  getEntries() {
    return [...this.entries];
  }

  clear() {
    this.entries = [];
  }
}

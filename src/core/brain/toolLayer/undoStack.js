// -----------------------------------------------------------------------------
// KAELO UNDO STACK
// Records inverse mutations for every state modification to enable instant undo
// -----------------------------------------------------------------------------

export class UndoStack {
  constructor(maxDepth = 50) {
    this.stack = [];
    this.maxDepth = maxDepth;
  }

  push(inverseMutation) {
    this.stack.push({
      id: `undo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      action: inverseMutation
    });
    if (this.stack.length > this.maxDepth) {
      this.stack.shift();
    }
  }

  pop() {
    return this.stack.pop() || null;
  }

  peek() {
    return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
  }

  clear() {
    this.stack = [];
  }

  get size() {
    return this.stack.length;
  }
}

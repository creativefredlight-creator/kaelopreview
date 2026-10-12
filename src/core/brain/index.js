// -----------------------------------------------------------------------------
// KAELO INTELLIGENCE CORE
// Device-independent brain module: text in, structured actions + spoken reply out
// -----------------------------------------------------------------------------

import { KAELO_RUNTIME_SYSTEM_PROMPT } from './prompt/systemPrompt.js';
import { TOOL_SCHEMAS } from './schemas/toolSchemas.js';
import { ToolExecutor } from './toolLayer/toolExecutor.js';
import { ContextAssembler } from './context/contextAssembler.js';
import { PipelineCleaner } from './pipeline/1_cleaner.js';
import { PipelineRepairer } from './pipeline/2_repairer.js';
import { PipelineResolver } from './pipeline/3_resolver.js';
import { PipelineTimeResolver } from './pipeline/4_timeResolver.js';
import { PipelineRealityChecker } from './pipeline/5_realityChecker.js';
import { PipelineDecisionEngine } from './pipeline/6_decisionEngine.js';
import { PipelineReplyFormatter } from './pipeline/7_replyFormatter.js';

export class KaeloBrain {
  constructor(options = {}) {
    this.options = options;
    this.toolExecutor = new ToolExecutor(options);
    this.systemPrompt = KAELO_RUNTIME_SYSTEM_PROMPT;
    this.toolSchemas = TOOL_SCHEMAS;
  }

  getSystemPrompt() {
    return this.systemPrompt;
  }

  getToolSchemas() {
    return this.toolSchemas;
  }

  getAuditLog() {
    return this.toolExecutor.auditLog.getEntries();
  }

  getUndoStackSize() {
    return this.toolExecutor.undoStack.size;
  }

  undo() {
    return this.toolExecutor.execute('undo', {});
  }

  /**
   * Process a single conversational turn.
   * @param {Object} input - { transcript, segments, asr_confidence, word_confidence, alternates, addressed_to_assistant, endpoint_reason, barge_in, assistant_spoken_so_far }
   * @param {Object} contextOverride - overrides for standard context
   * @param {Object} toolResultOverride - optional simulated tool failure / override
   * @returns {Object} { decision, tool_calls, reply }
   */
  processTurn(input = {}, contextOverride = {}, toolResultOverride = null) {
    const mergedOverride = {
      ...(this.options?.permissions ? { permissions: this.options.permissions } : {}),
      ...contextOverride
    };
    const context = ContextAssembler.assemble(mergedOverride);
    this.toolExecutor.setPermissions(context.permissions || {});

    // Handle transcript segments if provided
    let rawTranscript = '';
    if (input.segments && Array.isArray(input.segments)) {
      rawTranscript = input.segments
        .filter(s => !s.startsWith('['))
        .join(' ');
    } else {
      rawTranscript = input.transcript || '';
    }

    // Step 1: CLEAN
    const cleanResult = PipelineCleaner.clean(rawTranscript);

    // Step 2: REPAIR
    const repairResult = PipelineRepairer.repair(cleanResult, input, context);

    // Step 3: RESOLVE REFERENCES
    const resolved = PipelineResolver.resolve(repairResult.text, context);

    // Step 4: RESOLVE TIME
    const timeResolved = PipelineTimeResolver.resolve(repairResult.text, context);

    // Step 5: CHECK REALITY
    const realityCheck = PipelineRealityChecker.check(null, repairResult.text, resolved, context, timeResolved);

    // Step 6: DECIDE (ACT / CONFIRM / ASK / NONE / SILENT)
    const decisionResult = PipelineDecisionEngine.decide({
      cleanResult,
      repairResult,
      resolved,
      timeResolved,
      realityCheck,
      input,
      context
    });

    let toolCalls = [];
    let rawReply = decisionResult.reply || '';

    // Step 7: EXECUTE TOOLS (if ACT) & READ STATUS
    if (decisionResult.decision === 'ACT' && decisionResult.toolToRun) {
      const { tool, args } = decisionResult.toolToRun;
      toolCalls.push({ id: `call_${Date.now()}`, tool, args });

      const execResult = this.toolExecutor.execute(tool, args, context, toolResultOverride);

      if (execResult.status === 'error') {
        // Plain error reporting with next step (HON-01)
        if (execResult.code === 'calendar_sync_failed') {
          rawReply = "That didn't go through. The calendar sync failed. Want me to try again?";
        } else {
          rawReply = `That didn't go through. ${execResult.message || 'Something failed'}. Want me to try again?`;
        }
      } else {
        // Tool confirmed: use outcome confirmation
        rawReply = decisionResult.replyTemplate || rawReply;
      }
    }

    // Format spoken reply
    const finalReply = decisionResult.decision === 'SILENT' 
      ? '' 
      : PipelineReplyFormatter.format(rawReply);

    return {
      decision: decisionResult.decision,
      tool_calls: toolCalls,
      reply: finalReply
    };
  }
}

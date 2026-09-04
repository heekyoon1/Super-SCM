import { agentAnswerJsonSchema, cannotAnswer, parseAgentAnswer, type AgentAnswer } from '@/lib/agent/schema';
import { callChatCompletions, type ChatMessage, type FetchLike } from '@/lib/agent/llm';
import { agentTools, type AgentRole, type AgentTool, type ToolResult } from '@/lib/agent/tools';
import { validateAnswerNumbers, type AllowedNumbers } from '@/lib/agent/guardrail';

export type AgentUser = { role: AgentRole };
export type ToolTrace = { name: string; args: unknown; ok: boolean; ms: number; reason: string | null };
export type AgentRunInput = { question: string; user: AgentUser | AgentRole; history: ChatMessage[] };
export type AgentRunResult = { answer: AgentAnswer; trace: ToolTrace[]; history: ChatMessage[] };
export type OrchestratorOptions = { fetchImpl?: FetchLike; tools?: readonly AgentTool<any, any>[]; maxDurationMs?: number };

type MessageWithToolCalls = ChatMessage & { tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }> };

const userRole = (user: AgentUser | AgentRole): AgentRole => typeof user === 'string' ? user : user.role;
const toolDefinitions = (tools: readonly AgentTool<any, any>[], role: AgentRole) => tools.filter((tool) => tool.roles.includes(role)).map((tool) => ({ type: 'function' as const, function: { name: tool.name, description: tool.description, parameters: tool.parameters } }));
const asToolError = (reason: string): AgentRunResult => ({ answer: cannotAnswer(reason), trace: [], history: [] });

function withDeadline<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise((resolve) => { const timer = setTimeout(() => resolve(undefined as T), milliseconds); promise.then((value) => { clearTimeout(timer); resolve(value); }, () => { clearTimeout(timer); resolve(undefined as T); }); });
}

export async function runAgent(input: AgentRunInput, options: OrchestratorOptions = {}): Promise<AgentRunResult> {
  const role = userRole(input.user); const trace: ToolTrace[] = []; const allowedNumbers: AllowedNumbers = {}; const conversation: MessageWithToolCalls[] = [...input.history, { role: 'user', content: input.question }]; const tools = options.tools ?? agentTools; const exposedTools = toolDefinitions(tools, role); const deadline = Date.now() + (options.maxDurationMs ?? 60000);
  const finish = async (answer: AgentAnswer): Promise<AgentRunResult> => {
    if (answer.cannot_answer) return { answer, trace, history: conversation };
    const checked = validateAnswerNumbers(answer, allowedNumbers); if (checked.ok) return { answer, trace, history: conversation };
    const remaining = deadline - Date.now(); if (remaining <= 0) return { answer: cannotAnswer('TIMEOUT'), trace, history: conversation };
    const violations = checked.violations.map((item) => `${item.token} (${item.field})`).join(', '); conversation.push({ role: 'assistant', content: answer.answer }); conversation.push({ role: 'user', content: `출처 없는 숫자 ${violations}가 포함되었습니다. Tool 결과에 있는 숫자만 사용해 답변을 한 번만 다시 생성하세요.` });
    const regenerated = await withDeadline(callChatCompletions({ messages: conversation as ChatMessage[], temperature: 0, response_format: { type: 'json_schema', json_schema: { name: 'agent_answer', strict: true, schema: agentAnswerJsonSchema } } }, options.fetchImpl), remaining);
    if (!regenerated || 'error' in regenerated || regenerated.toolCalls.length > 0) return { answer: cannotAnswer('UNSUPPORTED_NUMBER'), trace, history: conversation };
    const repaired = parseAgentAnswer(regenerated.message.content ?? ''); const repairedCheck = validateAnswerNumbers(repaired, allowedNumbers); return repaired.cannot_answer || repairedCheck.ok ? { answer: repaired, trace, history: conversation } : { answer: cannotAnswer('UNSUPPORTED_NUMBER'), trace, history: conversation };
  };
  for (let round = 0; round < 6; round += 1) {
    const remaining = deadline - Date.now(); if (remaining <= 0) return { answer: cannotAnswer('TIMEOUT'), trace, history: conversation };
    const llm = await withDeadline(callChatCompletions({ messages: conversation as ChatMessage[], tools: exposedTools, tool_choice: 'auto', temperature: 0, response_format: { type: 'json_schema', json_schema: { name: 'agent_answer', strict: true, schema: agentAnswerJsonSchema } } }, options.fetchImpl), remaining);
    if (!llm) return { answer: cannotAnswer('TIMEOUT'), trace, history: conversation };
    if ('error' in llm) return { answer: cannotAnswer(llm.error), trace, history: conversation };
    if (llm.toolCalls.length === 0) return finish(parseAgentAnswer(llm.message.content ?? ''));
    const assistantMessage: MessageWithToolCalls = { role: 'assistant', content: llm.message.content, tool_calls: llm.toolCalls.map((call) => ({ id: call.id, type: 'function', function: { name: call.function.name, arguments: JSON.stringify(call.function.arguments) } })) };
    conversation.push(assistantMessage);
    for (const call of llm.toolCalls) {
      const started = Date.now(); const tool = tools.find((candidate) => candidate.name === call.function.name); const args = call.function.arguments;
      if (!tool || !tool.roles.includes(role)) { trace.push({ name: call.function.name, args, ok: false, ms: Date.now() - started, reason: 'TOOL_NOT_ALLOWED' }); return { answer: cannotAnswer('TOOL_NOT_ALLOWED'), trace, history: conversation }; }
      let result: ToolResult<unknown>;
      try { result = await withDeadline(tool.run(args, role), Math.max(1, deadline - Date.now())); } catch { result = { ok: false, data: [], numbers: {}, dataAsOf: null, reason: 'TOOL_FAILED' }; }
      if (!result) { trace.push({ name: call.function.name, args, ok: false, ms: Date.now() - started, reason: 'TIMEOUT' }); return { answer: cannotAnswer('TIMEOUT'), trace, history: conversation }; }
      trace.push({ name: call.function.name, args, ok: result.ok, ms: Date.now() - started, reason: result.reason });
      if (!result.ok) return { answer: cannotAnswer(result.reason ?? 'TOOL_FAILED'), trace, history: conversation };
      Object.entries(result.numbers).forEach(([name, value]) => { allowedNumbers[`${tool.name}.${name}`] = value; });
      conversation.push({ role: 'tool', content: JSON.stringify(result), tool_call_id: call.id });
    }
  }
  return { answer: cannotAnswer('MAX_TOOL_LOOPS'), trace, history: conversation };
}

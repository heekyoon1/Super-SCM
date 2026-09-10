import { strict as assert } from 'node:assert';
import { runAgent, type AgentRunResult } from '@/lib/agent/orchestrator';
import type { FetchLike } from '@/lib/agent/llm';
import type { AgentTool } from '@/lib/agent/tools';

const answer = JSON.stringify({ answer: '완료', verdict: 'SAFE', evidence: [], data_as_of: null, risk: null, recommended_action: null, cannot_answer: false, cannot_answer_reason: null });
const response = (message: Record<string, unknown>) => new Response(JSON.stringify({ choices: [{ message }] }), { status: 200, headers: { 'content-type': 'application/json' } });
const tool = (name = 'allowed'): AgentTool<{ itemCode: string }, unknown> => ({ name, description: name, parameters: { type: 'object', additionalProperties: false, properties: { itemCode: { type: 'string' } }, required: ['itemCode'] }, roles: ['USER'], run: async () => ({ ok: true, data: [{ qty: 3 }], numbers: { qty: 3 }, dataAsOf: '2026-09-04', reason: null }) });

export async function orchestratorContractTests() {
  process.env.OPENAI_BASE_URL = 'https://orchestrator.test'; process.env.OPENAI_API_KEY = 'key'; process.env.OPENAI_MODEL = 'model';
  let calls = 0; const order: string[] = [];
  const fetchImpl: FetchLike = async (_url, init) => { calls += 1; const body = JSON.parse(String(init?.body)); order.push(body.messages.at(-1).role); return calls === 1 ? response({ role: 'assistant', content: null, tool_calls: [{ id: 'call-1', type: 'function', function: { name: 'allowed', arguments: '{"itemCode":"A"}' } }] }) : response({ role: 'assistant', content: answer }); };
  const completed = await runAgent({ question: '질문', user: { role: 'USER' }, history: [] }, { fetchImpl, tools: [tool()] });
  assert.equal(completed.answer.cannot_answer, false); assert.deepEqual(order, ['user', 'tool']); assert.equal(completed.trace[0]?.name, 'allowed'); assert.equal(completed.trace[0]?.ok, true);
  let unauthorizedCalls = 0; const unauthorized = await runAgent({ question: '질문', user: { role: 'USER' }, history: [] }, { fetchImpl: async () => { unauthorizedCalls += 1; return response({ role: 'assistant', content: null, tool_calls: [{ id: 'bad', type: 'function', function: { name: 'adminOnly', arguments: '{}' } }] }); }, tools: [tool('allowed')] });
  assert.equal(unauthorized.answer.cannot_answer_reason, 'TOOL_NOT_ALLOWED'); assert.equal(unauthorizedCalls, 1);
  let adminToolRuns = 0;
  const adminOnly: AgentTool<{ itemCode: string }, unknown> = { ...tool('adminOnly'), roles: ['ADMIN'], run: async () => { adminToolRuns += 1; return { ok: true, data: [], numbers: {}, dataAsOf: null, reason: null }; } };
  const roleTampering = await runAgent({ question: '질문', user: { role: 'USER' }, history: [] }, { fetchImpl: async () => response({ role: 'assistant', content: null, tool_calls: [{ id: 'admin-call', type: 'function', function: { name: 'adminOnly', arguments: '{"itemCode":"A"}' } }] }), tools: [adminOnly] });
  assert.equal(roleTampering.answer.cannot_answer_reason, 'TOOL_NOT_ALLOWED'); assert.equal(adminToolRuns, 0);
  const malformed = await runAgent({ question: '질문', user: { role: 'USER' }, history: [] }, { fetchImpl: async () => response({ role: 'assistant', content: null, tool_calls: [{ id: 'bad', type: 'function', function: { name: 'allowed', arguments: '{broken' } }] }), tools: [tool()] });
  assert.equal(malformed.answer.cannot_answer_reason, 'INVALID_TOOL_CALL_ARGUMENTS');
  let loopCalls = 0; const loop = await runAgent({ question: '질문', user: { role: 'USER' }, history: [] }, { fetchImpl: async () => { loopCalls += 1; return response({ role: 'assistant', content: null, tool_calls: [{ id: `loop-${loopCalls}`, type: 'function', function: { name: 'allowed', arguments: '{"itemCode":"A"}' } }] }); }, tools: [tool()] });
  assert.equal(loop.answer.cannot_answer_reason, 'MAX_TOOL_LOOPS'); assert.equal(loopCalls, 6);
  const typed: AgentRunResult = completed; assert.ok(typed.history.length >= 3);
}

import { strict as assert } from 'node:assert';
import type { ChatRequest, ChatResult } from '@/lib/agent/llm';
import { callChatCompletions } from '@/lib/agent/llm';

const request: ChatRequest = { messages: [{ role: 'user', content: '상태를 알려줘' }] };
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const withEnv = async (fn: () => Promise<void>) => { const old = { base: process.env.OPENAI_BASE_URL, key: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL }; process.env.OPENAI_BASE_URL = 'https://llm.example.test'; process.env.OPENAI_API_KEY = ' test-key '; process.env.OPENAI_MODEL = ' model-a '; try { await fn(); } finally { for (const [name, value] of Object.entries({ OPENAI_BASE_URL: old.base, OPENAI_API_KEY: old.key, OPENAI_MODEL: old.model })) { if (value === undefined) delete process.env[name]; else process.env[name] = value; } } };

export async function llmContractTests() {
  const missing: ChatResult = await callChatCompletions(request, async () => jsonResponse({}));
  assert.equal('error' in missing, true);
  await withEnv(async () => {
    let calls = 0;
    const toolResult = await callChatCompletions({ ...request, tools: [{ type: 'function', function: { name: 'getShipmentTrend', description: '출고 추이', parameters: { type: 'object' } } }] }, async (_url, init) => { calls += 1; assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer test-key'); assert.equal(JSON.parse(String(init?.body)).temperature, 0); return jsonResponse({ choices: [{ message: { role: 'assistant', content: null, tool_calls: [{ id: 'call-1', type: 'function', function: { name: 'getShipmentTrend', arguments: '{"itemCode":"602K02693"}' } }] } }] }); });
    assert.equal(calls, 1); assert.equal('error' in toolResult ? toolResult.error : toolResult.toolCalls[0]?.function.name, 'getShipmentTrend');
  });
  await withEnv(async () => { let calls = 0; const result = await callChatCompletions({ ...request, response_format: { type: 'json_schema', json_schema: { name: 'answer', strict: true, schema: {} } } }, async (_url, init) => { calls += 1; const body = JSON.parse(String(init?.body)); return calls === 1 ? jsonResponse({ error: { message: 'json_schema is not supported' } }, 400) : (assert.equal(body.response_format.type, 'json_object'), jsonResponse({ choices: [{ message: { role: 'assistant', content: '{}' } }] })); }); assert.equal('error' in result, false); });
  await withEnv(async () => { let calls = 0; const result = await callChatCompletions(request, async (_url, init) => { calls += 1; const body = JSON.parse(String(init?.body)); return calls === 1 ? jsonResponse({ error: { message: "'temperature' does not support 0 with this model" } }, 400) : (assert.equal(body.temperature, undefined), jsonResponse({ choices: [{ message: { role: 'assistant', content: 'ok' } }] })); }); assert.equal('error' in result, false); });
  await withEnv(async () => { const result = await callChatCompletions({ ...request, timeoutMs: 1 }, async (_url, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('timeout', 'AbortError'))))); assert.equal('error' in result, true); });
}

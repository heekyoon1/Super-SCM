export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';
export type ChatMessage = { role: ChatRole; content: string | null; name?: string | null; tool_call_id?: string | null };
export type LlmToolCall = { id: string; type: 'function'; function: { name: string; arguments: Record<string, unknown> } };
export type LlmToolDefinition = { type: 'function'; function: { name: string; description?: string; parameters: Record<string, unknown> } };
export type ResponseFormat = { type: 'json_schema'; json_schema: { name: string; description?: string; strict: true; schema: Record<string, unknown> } } | { type: 'json_object' };
export type ChatRequest = { messages: ChatMessage[]; tools?: LlmToolDefinition[]; tool_choice?: 'auto'; temperature?: number; response_format?: ResponseFormat };
export type ChatSuccess = { message: ChatMessage; toolCalls: LlmToolCall[]; usage: Record<string, unknown> | null };
export type ChatError = { error: string };
export type ChatResult = ChatSuccess | ChatError;
export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const fallbackAttempted = new Set<string>();

const setting = (name: string) => (process.env[name] ?? '').trim();
const errorResult = (error: string): ChatError => ({ error });

function fallbackKind(body: string, responseFormat: ResponseFormat | undefined): 'json_schema' | 'temperature' | null {
  const lower = body.toLowerCase();
  if (responseFormat?.type === 'json_schema' && lower.includes('json_schema')) return 'json_schema';
  if (lower.includes('temperature')) return 'temperature';
  return null;
}

function parseToolCalls(value: unknown): { calls: LlmToolCall[]; error: string | null } {
  if (value === undefined || value === null) return { calls: [], error: null };
  if (!Array.isArray(value)) return { calls: [], error: 'INVALID_TOOL_CALLS' };
  const calls: LlmToolCall[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') return { calls: [], error: 'INVALID_TOOL_CALLS' };
    const item = raw as Record<string, unknown>;
    const fn = item.function;
    if (typeof item.id !== 'string' || item.type !== 'function' || !fn || typeof fn !== 'object') return { calls: [], error: 'INVALID_TOOL_CALLS' };
    const functionValue = fn as Record<string, unknown>;
    if (typeof functionValue.name !== 'string' || typeof functionValue.arguments !== 'string') return { calls: [], error: 'INVALID_TOOL_CALLS' };
    try {
      const args: unknown = JSON.parse(functionValue.arguments);
      if (!args || typeof args !== 'object' || Array.isArray(args)) return { calls: [], error: 'INVALID_TOOL_CALL_ARGUMENTS' };
      calls.push({ id: item.id, type: 'function', function: { name: functionValue.name, arguments: args as Record<string, unknown> } });
    } catch { return { calls: [], error: 'INVALID_TOOL_CALL_ARGUMENTS' }; }
  }
  return { calls, error: null };
}

function parseSuccess(body: string): ChatResult {
  try {
    const parsed: unknown = JSON.parse(body);
    if (!parsed || typeof parsed !== 'object') return errorResult('INVALID_RESPONSE_JSON');
    const root = parsed as Record<string, unknown>;
    const choices = root.choices;
    if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== 'object') return errorResult('MISSING_RESPONSE_CHOICE');
    const message = (choices[0] as Record<string, unknown>).message;
    if (!message || typeof message !== 'object') return errorResult('MISSING_RESPONSE_MESSAGE');
    const source = message as Record<string, unknown>;
    if (source.role !== 'assistant' || (source.content !== null && typeof source.content !== 'string')) return errorResult('INVALID_RESPONSE_MESSAGE');
    const tools = parseToolCalls(source.tool_calls);
    if (tools.error) return errorResult(tools.error);
    return { message: { role: 'assistant', content: source.content as string | null }, toolCalls: tools.calls, usage: root.usage && typeof root.usage === 'object' ? root.usage as Record<string, unknown> : null };
  } catch { return errorResult('INVALID_RESPONSE_JSON'); }
}

export async function callChatCompletions(request: ChatRequest, fetchImpl: FetchLike = fetch): Promise<ChatResult> {
  const baseUrl = setting('OPENAI_BASE_URL');
  const apiKey = setting('OPENAI_API_KEY');
  const model = setting('OPENAI_MODEL');
  if (!baseUrl || !apiKey || !model) return errorResult('MISSING_OPENAI_CONFIGURATION');
  const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const key = `${baseUrl}|${model}`;
  const initial: Record<string, unknown> = { model, messages: request.messages, tools: request.tools, tool_choice: request.tool_choice ?? (request.tools ? 'auto' : undefined), temperature: request.temperature ?? 0, response_format: fallbackAttempted.has(key) && request.response_format?.type === 'json_schema' ? { type: 'json_object' } : request.response_format };
  const send = async (payload: Record<string, unknown>): Promise<{ result: ChatResult; status: number; body: string }> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetchImpl(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` }, body: JSON.stringify(payload), signal: controller.signal });
      const body = await response.text();
      if (!response.ok) return { result: errorResult(`HTTP_${response.status}`), status: response.status, body };
      return { result: parseSuccess(body), status: response.status, body };
    } catch (error) { return { result: errorResult(error instanceof DOMException && error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR'), status: 0, body: '' }; }
    finally { clearTimeout(timer); }
  };
  const first = await send(initial);
  if (first.status === 400 && !fallbackAttempted.has(key)) {
    const kind = fallbackKind(first.body, request.response_format);
    if (kind) {
      fallbackAttempted.add(key);
      const retry = { ...initial };
      if (kind === 'json_schema') retry.response_format = { type: 'json_object' };
      else delete retry.temperature;
      return (await send(retry)).result;
    }
  }
  return first.result;
}

export const __resetLlmFallbackCacheForTests = () => fallbackAttempted.clear();

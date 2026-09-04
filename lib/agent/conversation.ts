import type { AgentAnswer } from '@/lib/agent/schema';
import { requireUser } from '@/lib/auth';

export type AgentConversation = {
  conversation_id: string;
  user_id: string;
  user_email: string;
  title: string;
  started_at: string;
  last_at: string;
};

export type AgentMessage = {
  message_id: number;
  conversation_id: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  answer: AgentAnswer | null;
  tool_trace: unknown[] | null;
  usage: Record<string, unknown> | null;
  guardrail: Record<string, unknown> | null;
  created_at: string;
};

export type SaveTurnInput = {
  conversationId?: string | null;
  title?: string;
  question: string;
  answer: AgentAnswer;
  toolTrace?: unknown;
  usage?: unknown;
  guardrail?: unknown;
};

export async function listConversations(): Promise<AgentConversation[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.schema('core').from('agent_conversation')
    .select('conversation_id, user_id, user_email, title, started_at, last_at')
    .order('last_at', { ascending: false });
  if (error) throw new Error(`AGENT_CONVERSATION_LIST_FAILED: ${error.message}`);
  return (data ?? []) as AgentConversation[];
}

export async function getConversationMessages(conversationId: string): Promise<AgentMessage[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.schema('core').from('agent_message')
    .select('message_id, conversation_id, role, content, answer, tool_trace, usage, guardrail, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`AGENT_MESSAGE_LIST_FAILED: ${error.message}`);
  return (data ?? []) as AgentMessage[];
}

export async function saveTurn(input: SaveTurnInput): Promise<string> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.schema('core').rpc('save_agent_turn', {
    p_conversation_id: input.conversationId ?? null,
    p_title: input.title ?? input.question.slice(0, 80),
    p_question: input.question,
    p_answer: input.answer,
    p_tool_trace: input.toolTrace ?? null,
    p_usage: input.usage ?? null,
    p_guardrail: input.guardrail ?? null,
  });
  if (error) throw new Error(`AGENT_TURN_SAVE_FAILED: ${error.message}`);
  return data as string;
}

export function preserveAgentAnswer<T>(answer: T, saveError: unknown) {
  return { answer, saveError: saveError ? '대화 저장에 실패했지만 답변은 표시됩니다.' : null };
}

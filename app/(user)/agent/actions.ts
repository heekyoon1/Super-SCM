'use server';

import { runAgent } from '@/lib/agent/orchestrator';
import { cannotAnswer } from '@/lib/agent/schema';
import { requireUser } from '@/lib/auth';
import { preserveAgentAnswer, saveTurn } from '@/lib/agent/conversation';
import { initialAgentState, type AgentState } from './state';

const configured = () => Boolean((process.env.OPENAI_BASE_URL ?? '').trim() && (process.env.OPENAI_API_KEY ?? '').trim() && (process.env.OPENAI_MODEL ?? '').trim());

export async function submitAgentQuestion(_previous: AgentState, formData: FormData): Promise<AgentState> {
  const session = await requireUser();
  const question = String(formData.get('question') ?? '').trim();
  if (!question) return { ...initialAgentState, status: 'error', error: '질문을 입력하세요.' };
  if (!configured()) return { ...initialAgentState, status: 'error', error: 'AI 기능이 설정되지 않았습니다.' };
  try {
    const result = await runAgent({ question, user: { role: session.profile.role }, history: [] });
    let saveFailure: unknown = null;
    try { await saveTurn({ question, answer: result.answer, toolTrace: result.trace }); } catch (error) { saveFailure = error; }
    const preserved = preserveAgentAnswer(result.answer, saveFailure);
    const answerError = result.answer.cannot_answer ? result.answer.cannot_answer_reason : null;
    return { status: answerError ? 'error' : 'success', error: answerError ?? preserved.saveError, answer: preserved.answer, trace: result.trace };
  } catch { return { ...initialAgentState, status: 'error', error: 'AI 요청을 처리하지 못했습니다.', answer: cannotAnswer('AGENT_REQUEST_FAILED') }; }
}

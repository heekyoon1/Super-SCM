import assert from 'node:assert/strict';
import { cannotAnswer } from './schema';
import { preserveAgentAnswer, type AgentConversation, type AgentMessage } from './conversation';

export function conversationTypesCompile(): [AgentConversation | null, AgentMessage | null] {
  return [null, null];
}

export function saveFailureKeepsAnswer(): void {
  const answer = cannotAnswer('NO_FORECAST');
  const result = preserveAgentAnswer(answer, new Error('database unavailable'));
  assert.equal(result.answer, answer);
  assert.equal(result.saveError, '대화 저장에 실패했지만 답변은 표시됩니다.');
}

export function successfulSaveHasNoWarning(): void {
  const answer = cannotAnswer('NO_FORECAST');
  assert.equal(preserveAgentAnswer(answer, null).saveError, null);
}

import { strict as assert } from 'node:assert';
import { cannotAnswer, parseAgentAnswer } from '@/lib/agent/schema';

const validAnswer = JSON.stringify({
  answer: '재고는 안정적입니다.',
  verdict: 'SAFE',
  evidence: [{ source: 'analytics.v_stockout_risk', claim: '결품 위험 없음', value: 'SAFE', data_as_of: '2026-09-04', reason_code: null }],
  data_as_of: '2026-09-04',
  risk: null,
  recommended_action: null,
  cannot_answer: false,
  cannot_answer_reason: null,
});

export function agentSchemaContractTests() {
  const parsed = parseAgentAnswer(validAnswer);
  assert.equal(parsed.cannot_answer, false);
  assert.equal(parsed.evidence[0]?.source, 'analytics.v_stockout_risk');
  assert.equal(parseAgentAnswer('{broken').cannot_answer_reason, 'INVALID_JSON');
  assert.equal(parseAgentAnswer(JSON.stringify({ answer: '누락' })).cannot_answer_reason, 'MISSING_REQUIRED_FIELD');
  assert.equal(cannotAnswer('NO_FORECAST').cannot_answer, true);
  assert.equal(cannotAnswer('NO_FORECAST').cannot_answer_reason, 'NO_FORECAST');
}

import { strict as assert } from 'node:assert';
import { validateAnswerNumbers } from '@/lib/agent/guardrail';
import type { AgentAnswer } from '@/lib/agent/schema';

const base = (text: string): AgentAnswer => ({ answer: text, verdict: 'SAFE', evidence: [{ source: 'tool', claim: text, value: null, data_as_of: '2026-07', reason_code: null }], data_as_of: '2026-07', risk: null, recommended_action: text, cannot_answer: false, cannot_answer_reason: null });
const allowed = { 'getShipmentTrend.avg_3m': 779, 'getShipmentTrend.avg_12m': 772.3, 'getDemandProfile.zero_demand_rate': 0.25, 'getBomRequirement.required_qty': 20 };

export function guardrailContractTests() {
  const normal = [base('평균은 779.0입니다.'), base('최근 평균은 772.3입니다.'), base('비율은 25%입니다.'), base('필요 수량은 20입니다.'), base('평균 779, 비율 25%입니다.')];
  assert.equal(normal.filter((answer) => !validateAnswerNumbers(answer, allowed).ok).length, 0);
  const manipulated = [base('평균은 780입니다.'), base('최근 평균은 700입니다.'), base('비율은 26%입니다.'), base('필요 수량은 200입니다.'), base('평균은 -20입니다.')];
  assert.equal(manipulated.filter((answer) => validateAnswerNumbers(answer, allowed).ok).length, 0);
  assert.equal(validateAnswerNumbers(base('무조건 1,500개를 발주하세요.'), allowed).ok, false);
  assert.equal(validateAnswerNumbers(base('품목 602K02693, 기종 MDL121, P80, 2026-07, 1. 항목'), allowed).ok, true);
  assert.equal(validateAnswerNumbers(base('원인 코드는 NO_DATA입니다.'), allowed).ok, true);
  assert.equal(validateAnswerNumbers(base('반올림 779'), { 'tool.avg': 779.04 }).ok, true);
  assert.equal(validateAnswerNumbers(base('출처 없는 값은 999입니다.'), allowed).violations[0]?.value, 999);
}

export type AgentVerdict = 'SAFE' | 'WARNING' | 'CRITICAL' | 'CANNOT_ANSWER';
export type AgentRisk = 'SAFE' | 'WARNING' | 'CRITICAL' | 'CALCULATION_UNAVAILABLE' | null;

export type AgentEvidence = {
  source: string;
  claim: string;
  value: string | null;
  data_as_of: string | null;
  reason_code: string | null;
};

export type AgentAnswer = {
  answer: string;
  verdict: AgentVerdict;
  evidence: AgentEvidence[];
  data_as_of: string | null;
  risk: AgentRisk;
  recommended_action: string | null;
  cannot_answer: boolean;
  cannot_answer_reason: string | null;
};

type JsonSchema = {
  type?: 'object' | 'array' | 'string' | 'boolean' | 'null';
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  additionalProperties?: false;
  enum?: string[];
  anyOf?: JsonSchema[];
};

const nullableStringSchema = { anyOf: [{ type: 'string' as const }, { type: 'null' as const }] };

export const agentAnswerJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    answer: { type: 'string' },
    verdict: { type: 'string', enum: ['SAFE', 'WARNING', 'CRITICAL', 'CANNOT_ANSWER'] },
    evidence: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          source: { type: 'string' },
          claim: { type: 'string' },
          value: nullableStringSchema,
          data_as_of: nullableStringSchema,
          reason_code: nullableStringSchema,
        },
        required: ['source', 'claim', 'value', 'data_as_of', 'reason_code'],
      },
    },
    data_as_of: nullableStringSchema,
    risk: { anyOf: [{ type: 'string', enum: ['SAFE', 'WARNING', 'CRITICAL', 'CALCULATION_UNAVAILABLE'] }, { type: 'null' }] },
    recommended_action: nullableStringSchema,
    cannot_answer: { type: 'boolean' },
    cannot_answer_reason: nullableStringSchema,
  },
  required: ['answer', 'verdict', 'evidence', 'data_as_of', 'risk', 'recommended_action', 'cannot_answer', 'cannot_answer_reason'],
} as const satisfies JsonSchema;

const hasOwn = (value: object, property: string) => Object.prototype.hasOwnProperty.call(value, property);
const isNullableString = (value: unknown): value is string | null => value === null || typeof value === 'string';

function isEvidence(value: unknown): value is AgentEvidence {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const evidence = value as Record<string, unknown>;
  const required = ['source', 'claim', 'value', 'data_as_of', 'reason_code'];
  return Object.keys(evidence).every((key) => required.includes(key)) && required.every((key) => hasOwn(evidence, key)) && typeof evidence.source === 'string' && typeof evidence.claim === 'string' && isNullableString(evidence.value) && isNullableString(evidence.data_as_of) && isNullableString(evidence.reason_code);
}

function isAgentAnswer(value: unknown): value is AgentAnswer {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const answer = value as Record<string, unknown>;
  const required = ['answer', 'verdict', 'evidence', 'data_as_of', 'risk', 'recommended_action', 'cannot_answer', 'cannot_answer_reason'];
  const verdicts = ['SAFE', 'WARNING', 'CRITICAL', 'CANNOT_ANSWER'];
  const risks = ['SAFE', 'WARNING', 'CRITICAL', 'CALCULATION_UNAVAILABLE'];
  return Object.keys(answer).every((key) => required.includes(key)) && required.every((key) => hasOwn(answer, key)) && typeof answer.answer === 'string' && typeof answer.verdict === 'string' && verdicts.includes(answer.verdict) && Array.isArray(answer.evidence) && answer.evidence.every(isEvidence) && isNullableString(answer.data_as_of) && (answer.risk === null || (typeof answer.risk === 'string' && risks.includes(answer.risk))) && isNullableString(answer.recommended_action) && typeof answer.cannot_answer === 'boolean' && isNullableString(answer.cannot_answer_reason);
}

export function cannotAnswer(reason: string): AgentAnswer {
  return { answer: '현재 요청에 답변할 수 없습니다.', verdict: 'CANNOT_ANSWER', evidence: [], data_as_of: null, risk: 'CALCULATION_UNAVAILABLE', recommended_action: null, cannot_answer: true, cannot_answer_reason: reason };
}

export function parseAgentAnswer(input: string): AgentAnswer {
  try {
    const parsed: unknown = JSON.parse(input);
    if (!isAgentAnswer(parsed)) return cannotAnswer('MISSING_REQUIRED_FIELD');
    return parsed;
  } catch {
    return cannotAnswer('INVALID_JSON');
  }
}

import type { AgentAnswer } from '@/lib/agent/schema';

export type AllowedNumbers = Record<string, number | null>;
export type ExtractedNumber = { value: number; token: string; field: string };
export type GuardrailViolation = ExtractedNumber & { reason: 'UNSUPPORTED_NUMBER' };
export type GuardrailResult = { ok: boolean; numbers: ExtractedNumber[]; violations: GuardrailViolation[]; reason: string | null };

const numberPattern = /-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?%?/g;
const datePattern = /\b\d{4}-\d{1,2}(?:-\d{1,2})?\b/g;

function excluded(text: string, start: number, end: number): boolean {
  const token = text.slice(start, end); const before = text[start - 1] ?? ''; const after = text[end] ?? '';
  if (/[A-Za-z]/.test(before) || /[A-Za-z]/.test(after)) return true;
  if (before.toUpperCase() === 'P') return true;
  const dates = new RegExp(datePattern.source, 'g'); let dateMatch: RegExpExecArray | null;
  while ((dateMatch = dates.exec(text)) !== null) { const dateStart = dateMatch.index; if (start < dateStart + dateMatch[0].length && end > dateStart) return true; }
  const lineStart = text.lastIndexOf('\n', start - 1) + 1; const prefix = text.slice(lineStart, start); if (/(?:^|[,\n])\s*$/.test(prefix) && /^[.)]/.test(after)) return true;
  return false;
}

export function extractAnswerNumbers(answer: AgentAnswer): ExtractedNumber[] {
  const fields: Array<[string, string | null]> = [['answer', answer.answer], ['verdict', answer.verdict], ['recommended_action', answer.recommended_action]];
  answer.evidence.forEach((evidence, index) => { fields.push([`evidence[${index}].claim`, evidence.claim], [`evidence[${index}].value`, evidence.value], [`evidence[${index}].reason_code`, evidence.reason_code]); });
  const extracted: ExtractedNumber[] = [];
  for (const [field, text] of fields) { if (text === null) continue; const numbers = new RegExp(numberPattern.source, 'g'); let match: RegExpExecArray | null; while ((match = numbers.exec(text)) !== null) { const token = match[0]; const start = match.index; if (excluded(text, start, start + token.length)) continue; extracted.push({ value: Number(token.replace(/,/g, '').replace(/%$/, '')), token, field }); } }
  return extracted.filter((entry) => Number.isFinite(entry.value));
}

function equivalent(display: ExtractedNumber, allowed: number): boolean {
  if (display.token.endsWith('%')) { if (allowed < 0 || allowed > 1) return false; return Math.abs(display.value / 100 - allowed) <= 0.005000001; }
  const decimals = display.token.includes('.') ? display.token.split('.')[1].replace(/%$/, '').length : 0; const tolerance = 0.5 * 10 ** (-decimals) + 1e-9; return Math.abs(display.value - allowed) <= tolerance;
}

export function validateAnswerNumbers(answer: AgentAnswer, allowedNumbers: AllowedNumbers): GuardrailResult {
  const numbers = extractAnswerNumbers(answer); const allowed = Object.values(allowedNumbers).filter((value): value is number => typeof value === 'number' && Number.isFinite(value)); const violations = numbers.filter((number) => !allowed.some((value) => equivalent(number, value))).map((number) => ({ ...number, reason: 'UNSUPPORTED_NUMBER' as const }));
  return { ok: violations.length === 0, numbers, violations, reason: violations.length ? 'UNSUPPORTED_NUMBER' : null };
}

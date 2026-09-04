'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import EmptyValue from '@/components/ui/empty-value';
import Panel from '@/components/ui/panel';
import { submitAgentQuestion } from './actions';
import { initialAgentState } from './state';

const examples = ['602K02693의 최근 출고 추이를 알려줘', 'MDL121 한 대 판매에 필요한 구성품은?', 'Sales OL과 SCM OL 정확도를 비교해줘', '이 품목의 수요 유형과 위험 요인을 알려줘'];
const statusFor = (answer: { cannot_answer: boolean; risk: string | null; verdict: string }) => answer.cannot_answer || answer.risk === 'CALCULATION_UNAVAILABLE' ? 'CALCULATION_UNAVAILABLE' : answer.risk === 'WARNING' ? 'WARNING' : answer.risk === 'CRITICAL' || answer.verdict === 'CRITICAL' ? 'CRITICAL' : 'SAFE';

function SubmitButton({ disabled }: { disabled: boolean }) { const { pending } = useFormStatus(); return <Button variant="primary" type="submit" disabled={disabled || pending}>{pending ? '분석 중…' : '질문 보내기'}</Button>; }
function Nullable({ value, reason = 'NOT_PROVIDED' }: { value: string | null; reason?: string }) { return value === null ? <EmptyValue reasonCode={reason} /> : <span>{value}</span>; }

export default function ChatForm({ enabled }: { enabled: boolean }) {
  const [state, formAction] = useActionState(submitAgentQuestion, initialAgentState); const [question, setQuestion] = useState(''); const answer = state.answer;
  return <div className="stack">
    <Panel title="질문 입력" description={enabled ? 'SCM 데이터에 근거한 답변을 요청할 수 있습니다.' : '서버의 OpenAI 환경변수 설정 후 사용할 수 있습니다.'}>
      <form action={formAction} className="stack"><textarea className="form-input" name="question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="예: 602K02693의 최근 출고량과 수요 위험을 알려줘" rows={4} disabled={!enabled} aria-label="Agent 질문" /><div className="button-row"><SubmitButton disabled={!enabled || !question.trim()} /></div></form>
      <div className="button-row" aria-label="예시 질문">{examples.map((example) => <button className="button" type="button" key={example} onClick={() => setQuestion(example)} disabled={!enabled}>{example}</button>)}</div>
      {!enabled && <p className="muted" role="status">OPENAI_BASE_URL, OPENAI_API_KEY, OPENAI_MODEL이 모두 필요합니다.</p>}
      {state.error && <p className="text-danger" role="alert">{state.error}</p>}
    </Panel>
    {answer && <>
      <Panel title="Structured Answer" description="Agent 계약에 맞게 검증된 응답입니다."><div className="stack"><div className="button-row"><Badge status={statusFor(answer)}>{answer.verdict}</Badge>{answer.risk && <Badge status={statusFor({ ...answer, verdict: answer.risk })}>{answer.risk}</Badge>}</div><p className="body-lg">{answer.answer}</p><div className="grid grid-2"><div><b>데이터 기준시각</b><br /><Nullable value={answer.data_as_of} reason="DATA_AS_OF_UNAVAILABLE" /></div><div><b>권고</b><br /><Nullable value={answer.recommended_action} reason="NO_RECOMMENDED_ACTION" /></div></div></div></Panel>
      <Panel title="근거" description="답변에 사용된 데이터 출처와 값입니다."><div className="grid grid-2">{answer.evidence.length ? answer.evidence.map((item, index) => <article className="card" key={`${item.source}-${index}`}><b>{item.source}</b><p>{item.claim}</p><div><strong>값: </strong><Nullable value={item.value} /><br /><strong>사유: </strong><Nullable value={item.reason_code} reason="NO_REASON_CODE" /></div></article>) : <EmptyValue reasonCode="NO_EVIDENCE" />}</div></Panel>
      <Panel title="Tool trace" description="호출된 Tool과 실행 결과만 표시합니다."><details><summary>{state.trace.length}개 Tool 호출</summary><div className="data-table-wrap"><table className="data-table"><thead><tr><th>Tool</th><th>Args</th><th>결과</th><th>ms</th><th>Reason</th></tr></thead><tbody>{state.trace.map((item, index) => <tr key={`${item.name}-${index}`}><td>{item.name}</td><td><code>{JSON.stringify(item.args)}</code></td><td>{item.ok ? 'OK' : 'FAIL'}</td><td className="numeric">{item.ms}</td><td>{item.reason ?? '—'}</td></tr>)}</tbody></table></div></details></Panel>
    </>}
  </div>;
}

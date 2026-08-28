import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';
import Badge from '@/components/ui/badge';
import EmptyValue from '@/components/ui/empty-value';
import { requireAdmin } from '@/lib/auth';

type Coverage = { data_start: string | null; data_end: string | null; train_start: string | null; train_end: string | null; test_start: string | null; test_end: string | null; train_row_count: number; test_row_count: number; granularity: string; train_window_ok: boolean; test_window_ok: boolean };
type Policy = { policy_key: string; service_level: number | null; review_period_days: number | null; safety_buffer_days: number | null; active: boolean };

function Value({ value, reason = 'NOT_CONFIGURED' }: { value: string | number | null; reason?: string }) { return value == null ? <EmptyValue reasonCode={reason} /> : <span>{value}</span>; }

export default async function ForecastSettingsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: coverage }, { data: policies }] = await Promise.all([
    supabase.schema('analytics').from('v_data_coverage').select('*').maybeSingle(),
    supabase.schema('core').from('policy_config').select('policy_key, service_level, review_period_days, safety_buffer_days, active').order('policy_key'),
  ]);
  const report = coverage as Coverage | null;
  return <><PageHeader eyebrow="ADMIN / FORECAST" title="Forecast 설정" description="학습·검증 기간과 운영 정책, 데이터 격리 상태를 확인합니다." /><div className="two-column"><Panel title="데이터 격리 상태" description="실제 데이터 기간과 설정 기간의 적합성을 검증합니다."><div className="stack"><div className="data-table-wrap"><table className="data-table"><tbody><tr><th>전체 데이터 기간</th><td><Value value={report?.data_start ?? null} /><span> ~ </span><Value value={report?.data_end ?? null} /></td></tr><tr><th>학습 기간</th><td><Value value={report?.train_start ?? null} /><span> ~ </span><Value value={report?.train_end ?? null} /></td></tr><tr><th>검증 기간</th><td><Value value={report?.test_start ?? null} /><span> ~ </span><Value value={report?.test_end ?? null} /></td></tr><tr><th>Granularity</th><td><Value value={report?.granularity ?? null} /></td></tr><tr><th>Train rows</th><td><Value value={report?.train_row_count ?? null} /></td></tr><tr><th>Test rows</th><td><Value value={report?.test_row_count ?? null} /></td></tr><tr><th>Train window</th><td><Badge status={report?.train_window_ok ? 'SAFE' : 'WARNING'}>{report?.train_window_ok ? 'OK' : 'CHECK_REQUIRED'}</Badge></td></tr><tr><th>Test window</th><td><Badge status={report?.test_window_ok ? 'SAFE' : 'WARNING'}>{report?.test_window_ok ? 'OK' : 'CHECK_REQUIRED'}</Badge></td></tr></tbody></table></div></div></Panel><Panel title="정책값" description="정책은 DB의 core.policy_config에서 관리됩니다."><div className="data-table-wrap"><table className="data-table"><thead><tr><th>Policy</th><th className="numeric">Service level</th><th className="numeric">Review period</th><th className="numeric">Safety buffer</th><th>상태</th></tr></thead><tbody>{((policies ?? []) as Policy[]).map((policy) => <tr key={policy.policy_key}><td>{policy.policy_key}</td><td className="numeric"><Value value={policy.service_level} /></td><td className="numeric"><Value value={policy.review_period_days} /></td><td className="numeric"><Value value={policy.safety_buffer_days} /></td><td><Badge status={policy.active ? 'SAFE' : 'WARNING'}>{policy.active ? 'ACTIVE' : 'INACTIVE'}</Badge></td></tr>)}{!policies?.length && <tr><td colSpan={5}><EmptyValue reasonCode="NO_POLICY_CONFIG" /></td></tr>}</tbody></table></div></Panel></div></>;
}

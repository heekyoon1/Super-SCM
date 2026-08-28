import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';
import EmptyValue from '@/components/ui/empty-value';
import { requireUser } from '@/lib/auth';
import DemandProfileTable from './demand-profile-table';

type Profile = { item_id: string; item_name: string | null; n_periods: number; n_nonzero_periods: number; adi: number | null; cv_squared: number | null; zero_demand_rate: number | null; trend: number | null; recent_change_rate: number | null; peak_period: string | null; demand_type: 'SMOOTH' | 'INTERMITTENT' | 'ERRATIC' | 'LUMPY' | null; seasonality: boolean | null; reason_code: string | null; stability: string };
type Kpi = { total_items: number; n_smooth: number; n_intermittent: number; n_erratic: number; n_lumpy: number; n_croston_needed: number; n_calculation_unavailable: number };

export default async function DemandProfilePage() {
  const { supabase } = await requireUser();
  const [{ data: rows, error: profileError }, { data: kpi }] = await Promise.all([
    supabase.schema('analytics').from('v_sku_demand_profile').select('*').order('item_id'),
    supabase.schema('analytics').from('v_demand_profile_kpi').select('*').maybeSingle(),
  ]);
  const profiles = (rows ?? []) as Profile[];
  const summary = kpi as Kpi | null;
  return <><PageHeader eyebrow="ANALYSIS / DEMAND PROFILE" title="SKU Demand Profile" description="학습 구간만 사용해 SKU별 수요 패턴과 모델 후보 기준을 확인합니다." /><Panel title="Demand Profile KPI"><div className="kpi-grid"><div><span className="kpi-label">전체 SKU</span><strong>{summary?.total_items ?? <EmptyValue reasonCode="NO_PROFILE_DATA" />}</strong></div><div><span className="kpi-label">Croston 후보</span><strong>{summary?.n_croston_needed ?? <EmptyValue reasonCode="NO_PROFILE_DATA" />}</strong></div><div><span className="kpi-label">계산 불가</span><strong>{summary?.n_calculation_unavailable ?? <EmptyValue reasonCode="NO_PROFILE_DATA" />}</strong></div></div></Panel><Panel title="SKU별 수요 특성" description={profileError ? 'Demand Profile view를 사용할 수 없습니다. STEP 5 migration 적용 여부를 확인하세요.' : 'ADI, CV², 추세 및 계절성은 analytics 저장 결과를 표시합니다.'}><DemandProfileTable profiles={profiles} /></Panel></>;
}

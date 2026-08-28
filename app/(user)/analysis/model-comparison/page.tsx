import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';
import EmptyValue from '@/components/ui/empty-value';
import { requireUser } from '@/lib/auth';
import ModelComparisonTable from './model-comparison-table';

type Row = { backtest_run_id: string; forecast_run_id: string; model_id: string; model_version: string; item_id: string; period: string; p50: number | null; p80: number | null; p90: number | null; actual: number | null; wape: number | null; mape: number | null; bias: number | null; rmse: number | null; mae: number | null; rank: number | null; calculation_status: string; reason_code: string | null; is_champion: boolean };
type Backtest = { backtest_run_id: string; forecast_run_id: string; test_start: string; test_end: string; status: string };
export default async function ModelComparisonPage() { const { supabase, profile } = await requireUser(); const [{ data: rows }, { data: backtests }] = await Promise.all([supabase.schema('analytics').from('v_model_comparison').select('*').order('period'), supabase.schema('analytics').from('v_backtest_run').select('backtest_run_id, forecast_run_id, test_start, test_end, status').order('started_at', { ascending: false }).limit(100)]); return <><PageHeader eyebrow="ANALYSIS / MODEL COMPARISON" title="Model Comparison" description="저장된 Forecast Result와 검증기간 Actual의 성능을 비교합니다." /><Panel title="Comparison" description="모델 토글은 재실행 없이 저장된 결과만 표시합니다.">{rows?.length ? <ModelComparisonTable rows={rows as Row[]} backtestRuns={(backtests ?? []) as Backtest[]} isAdmin={profile.role === 'ADMIN'} /> : <EmptyValue reasonCode="NO_BACKTEST_RESULT" />}</Panel></>; }

import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';
import Badge from '@/components/ui/badge';
import EmptyValue from '@/components/ui/empty-value';
import { requireUser } from '@/lib/auth';

type Row = Record<string, unknown> & { item_id: string; item_name: string | null; risk_status: 'SAFE' | 'WARNING' | 'CRITICAL' | 'CALCULATION_UNAVAILABLE'; calculation_reason: string | null; calculation_trace: Record<string, unknown> | null };
const show = (v: unknown, reason = 'CALCULATION_UNAVAILABLE') => v == null ? <EmptyValue reasonCode={reason} /> : typeof v === 'number' ? v.toLocaleString() : String(v);

export default async function PurchaseRecommendationDetail({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const { supabase } = await requireUser();
  const { data } = await supabase.schema('analytics').from('purchase_recommendation').select('*').eq('item_id', decodeURIComponent(itemId)).maybeSingle();
  const row = data as Row | null;
  if (!row) return <><PageHeader eyebrow="RECOMMENDATIONS / SKU" title={decodeURIComponent(itemId)} /><Panel><EmptyValue reasonCode="NO_RECOMMENDATION_DATA" /></Panel></>;
  const reason = row.calculation_reason ?? 'CALCULATION_UNAVAILABLE';
  const trace = row.calculation_trace ?? {};
  return <><PageHeader eyebrow="RECOMMENDATIONS / SKU DETAIL" title={`${row.item_id} · ${row.item_name ?? '품목'}`} description="저장된 Forecast → Projection → Safety Stock → Stockout → Purchase Recommendation 흐름입니다." /><Panel title="결과"><div className="detail-grid"><div>Risk<Badge status={row.risk_status}>{row.risk_status}</Badge></div><div>Forecast {show(row.forecast_qty, reason)}</div><div>Demand Basis {show(row.demand_basis_qty, reason)}</div><div>Safety Stock {show(row.safety_stock, reason)}</div><div>Required Qty {show(row.required_qty, reason)}</div><div>Recommended Qty {show(row.recommended_qty, reason)}</div><div>Stockout {show(row.stockout_date, reason)}</div><div>Recommended Order Date {show(row.recommended_order_date, reason)}</div></div></Panel><Panel title="Calculation Trace" description="추천 결과의 입력값과 출력값을 DB trace에서 조회합니다."><pre className="json-trace">{JSON.stringify(trace, null, 2)}</pre></Panel></>;
}

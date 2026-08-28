import PageHeader from '@/components/shell/page-header';
import KpiCard from '@/components/ui/kpi-card';
import Panel from '@/components/ui/panel';
import DataTable from '@/components/ui/data-table';
import Badge from '@/components/ui/badge';
import EmptyValue from '@/components/ui/empty-value';
import AlertRow from '@/components/ui/alert-row';
import { stockoutRows } from '@/lib/scm-data';

export default function StockoutRiskPage() { return <><PageHeader eyebrow="ANALYSIS / STOCKOUT RISK" title="Stockout Risk" description="가용재고와 확정수요를 기준으로 품목별 품절 위험을 확인합니다." /><div className="kpi-grid"><KpiCard label="SAFE" value="1건" meta="정상 커버리지" tone="success" /><KpiCard label="WARNING" value="1건" meta="보충 계획 검토" tone="warning" /><KpiCard label="CRITICAL" value="1건" meta="즉시 조치 필요" tone="critical" /><KpiCard label="계산 불가" value="1건" meta="NO_STOCK_SNAPSHOT" /></div><div className="stack"><Panel title="품목별 위험 현황" description="위험도는 계산 결과의 상태 코드와 함께 표시됩니다."><DataTable columns={[{ key: 'item', label: '품목' }, { key: 'category', label: '구분' }, { key: 'available', label: '가용재고', numeric: true, render: (row) => row.available == null ? <EmptyValue reasonCode={row.reasonCode ?? 'UNKNOWN'} /> : row.available }, { key: 'demand', label: '확정수요', numeric: true, render: (row) => row.demand == null ? <EmptyValue reasonCode={row.reasonCode ?? 'UNKNOWN'} /> : row.demand }, { key: 'risk', label: 'Risk', render: (row) => <Badge status={row.risk} /> }]} rows={stockoutRows} /></Panel><AlertRow status="CRITICAL" title="PART-009 품절 위험" description="가용재고 8개 대비 확정수요 20개입니다. 대체 조달 또는 긴급 발주를 검토하세요." /></div></>; }

import PageHeader from '@/components/shell/page-header';
import KpiCard from '@/components/ui/kpi-card';
import Panel from '@/components/ui/panel';
import DataTable from '@/components/ui/data-table';
import Badge from '@/components/ui/badge';
import EmptyValue from '@/components/ui/empty-value';
import AlertRow from '@/components/ui/alert-row';
import InsightBanner from '@/components/ui/insight-banner';
import { leadTimeRows } from '@/lib/scm-data';

export default function LeadTimePage() { return <><PageHeader eyebrow="ANALYSIS / LEAD TIME" title="Lead Time 분석" description="공급 경로별 계획 리드타임과 실제 소요일의 편차를 확인합니다." /><div className="kpi-grid"><KpiCard label="평균 계획 Lead Time" value="22일" meta="활성 구간 기준" /><KpiCard label="평균 실제 Lead Time" value="29일" meta="계산 가능 이력 기준" tone="warning" /><KpiCard label="위험 구간" value="2건" meta="WARNING 1 · CRITICAL 1" tone="critical" /><KpiCard label="계산 불가" value="1건" meta="NO_HISTORY" /></div><div className="stack"><Panel title="Lead Time 현황" description="계산 불가 데이터는 0으로 대체하지 않고 원인 코드를 표시합니다."><DataTable columns={[{ key: 'supplier', label: 'Supplier' }, { key: 'lane', label: '공급 경로' }, { key: 'plannedDays', label: '계획', numeric: true, render: (row) => row.plannedDays == null ? <EmptyValue reasonCode={row.reasonCode ?? 'UNKNOWN'} /> : `${row.plannedDays}일` }, { key: 'actualDays', label: '실제', numeric: true, render: (row) => row.actualDays == null ? <EmptyValue reasonCode={row.reasonCode ?? 'UNKNOWN'} /> : `${row.actualDays}일` }, { key: 'status', label: '상태', render: (row) => <Badge status={row.status} /> }]} rows={leadTimeRows} /></Panel><div className="two-column"><div className="stack"><AlertRow status="CRITICAL" title="심천 → 부산 지연" description="실제 28일로 계획 15일보다 13일 초과했습니다." /><AlertRow status="WARNING" title="네덜란드 구간 주의" description="실제 41일로 계획 32일보다 9일 초과했습니다." /></div><InsightBanner title="분석 기준">최근 확정 입고 이력이 없는 구간은 임의 추정하지 않고 `NO_HISTORY`로 남깁니다.</InsightBanner></div></div></>; }

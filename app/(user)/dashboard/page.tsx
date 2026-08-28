import Link from 'next/link';
import PageHeader from '@/components/shell/page-header';
import KpiCard from '@/components/ui/kpi-card';
import Panel from '@/components/ui/panel';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import InsightBanner from '@/components/ui/insight-banner';

export default function DashboardPage() { return <><PageHeader eyebrow="SCM CONTROL CENTER" title="월간 발주계획 현황" description="수요, 공급, Lead Time, Stockout Risk를 하나의 기준으로 확인합니다." actions={<Link href="/lead-time"><Button variant="primary">분석 시작</Button></Link>} /><div className="kpi-grid"><KpiCard label="당월 총 발주금액" value="₩107.2M" meta="전월 대비 +8.4%" tone="success" /><KpiCard label="Lead Time 위험 구간" value="2건" meta="1건 WARNING · 1건 CRITICAL" tone="critical" /><KpiCard label="Stockout Risk" value="1건" meta="즉시 검토 필요" tone="critical" /><KpiCard label="계산 상태" value={<Badge status="CALCULATION_UNAVAILABLE" />} meta="일부 데이터 기준일 미충족" /></div><div className="two-column"><Panel title="오늘의 인사이트" description="계산 결과와 예외를 우선순위로 정리했습니다."><div className="stack"><InsightBanner title="심천 → 부산 Lead Time 지연">평균 대비 13일 초과입니다. 구매 일정과 대체 공급 가능성을 확인하세요.</InsightBanner><InsightBanner title="계산 불가 값 1건">재고 스냅샷이 없어 Stockout Risk를 계산할 수 없습니다. 원인 코드는 화면에 그대로 표시됩니다.</InsightBanner></div></Panel><Panel title="빠른 이동"><div className="stack"><Link href="/lead-time"><Button>Lead Time 분석 보기</Button></Link><Link href="/stockout-risk"><Button>Stockout Risk 보기</Button></Link><Link href="/demand"><Button>수요·발주 화면 보기</Button></Link></div></Panel></div></>; }

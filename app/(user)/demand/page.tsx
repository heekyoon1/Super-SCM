import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';
import Badge from '@/components/ui/badge';

export default function DemandPage() { return <><PageHeader eyebrow="WORKFLOW / DEMAND" title="수요·발주" description="수요 확정과 발주계획 검토 화면의 진입점입니다." /><Panel title="수요 확정 상태"><div className="stack"><p>현재 월도 수요 자료가 준비 중입니다.</p><Badge status="WARNING">검토 대기</Badge></div></Panel></>; }

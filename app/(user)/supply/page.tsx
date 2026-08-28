import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';
import Badge from '@/components/ui/badge';

export default function SupplyPage() { return <><PageHeader eyebrow="WORKFLOW / SUPPLY" title="재고·공급" description="가용재고와 Open PO 준비 상태를 확인합니다." /><Panel title="공급 데이터 상태"><div className="stack"><p>공급 데이터 입력이 필요합니다.</p><Badge status="CALCULATION_UNAVAILABLE">NO_SUPPLY_SNAPSHOT</Badge></div></Panel></>; }

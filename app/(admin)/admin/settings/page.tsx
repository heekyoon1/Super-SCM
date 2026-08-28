import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';
import Badge from '@/components/ui/badge';

export default function AdminSettingsPage() { return <><PageHeader eyebrow="ADMIN / SETTINGS" title="관리자 설정" description="상태 기준과 시스템 운영 설정을 관리합니다." /><Panel title="계산 상태 정책"><div className="stack"><p>계산 불가 값은 숫자 0으로 대체하지 않고 원인 코드와 함께 표시합니다.</p><Badge status="CALCULATION_UNAVAILABLE" /></div></Panel></>; }

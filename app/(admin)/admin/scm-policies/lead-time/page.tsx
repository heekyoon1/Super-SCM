import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';
import { requireAdmin } from '@/lib/auth';
import LeadTimeTable from './lead-time-table';

export default async function LeadTimePolicyPage() { const { supabase } = await requireAdmin(); const { data } = await supabase.schema('analytics').from('v_lead_time_policy').select('*').order('item_id').order('supplier_id'); return <><PageHeader eyebrow="ADMIN / SCM POLICIES / LEAD TIME" title="Lead Time 정책" description="관리자 확정값을 우선하고 없으면 실적 P80을 Effective Lead Time으로 사용합니다." /><Panel title="Lead Time Policy" description="정책 변경은 core.lead_time_policy_history와 audit_log에 기록됩니다."><LeadTimeTable policies={(data ?? []) as never[]} /></Panel></>; }

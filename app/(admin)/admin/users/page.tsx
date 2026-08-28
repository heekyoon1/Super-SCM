import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';
import DataTable from '@/components/ui/data-table';
import Badge from '@/components/ui/badge';
import { requireAdmin } from '@/lib/auth';
import UserActions from './user-actions';

type UserRow = { user_id: string; email: string; name: string; department: string | null; role: 'ADMIN' | 'USER'; active: boolean; last_login_at: string | null };
export default async function AdminUsersPage() {
  const { user, supabase } = await requireAdmin();
  const { data: rows, error } = await supabase.schema('core').from('app_user').select('user_id, email, name, department, role, active, last_login_at').order('created_at', { ascending: true });
  const users = (rows ?? []) as UserRow[];
  return <><PageHeader eyebrow="ADMIN / ACCESS CONTROL" title="사용자 관리" description="ADMIN만 사용자 역할과 활성 상태를 변경할 수 있습니다." /><Panel title="등록 사용자" description={error ? '사용자 목록을 불러오지 못했습니다.' : `${users.length}명의 사용자`}><DataTable columns={[{ key: 'name', label: '이름' }, { key: 'email', label: '이메일' }, { key: 'department', label: '부서' }, { key: 'role', label: '권한', render: (row) => <Badge status="SAFE">{row.role}</Badge> }, { key: 'active', label: '상태', render: (row) => <Badge status={row.active ? 'SAFE' : 'WARNING'}>{row.active ? 'ACTIVE' : 'INACTIVE'}</Badge> }, { key: 'actions', label: '관리', render: (row) => <UserActions userId={row.user_id} role={row.role} active={row.active} isSelf={row.user_id === user.id} /> }]} rows={users.map((row) => ({ ...row, id: row.user_id }))} /></Panel></>;
}

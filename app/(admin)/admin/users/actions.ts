'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';

export async function updateUserRole(userId: string, role: 'ADMIN' | 'USER') {
  const { user, supabase } = await requireAdmin();
  if (user.id === userId) return { error: '자신의 관리자 권한은 변경할 수 없습니다.' };
  const { error } = await supabase.schema('core').from('app_user').update({ role }).eq('user_id', userId);
  if (error) return { error: error.message };
  revalidatePath('/admin/users'); return { ok: true };
}

export async function updateUserActive(userId: string, active: boolean) {
  const { user, supabase } = await requireAdmin();
  if (user.id === userId) return { error: '자신의 계정은 비활성화할 수 없습니다.' };
  const { error } = await supabase.schema('core').from('app_user').update({ active }).eq('user_id', userId);
  if (error) return { error: error.message };
  revalidatePath('/admin/users'); return { ok: true };
}

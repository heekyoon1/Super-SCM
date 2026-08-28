import { forbidden, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import type { User } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type AppRole = 'ADMIN' | 'USER';
export type AppProfile = { user_id: string; email: string; name: string; department: string | null; role: AppRole; active: boolean; last_login_at: string | null };

async function loginPath() {
  const headerStore = await headers();
  const pathname = headerStore.get('x-invoke-path') ?? headerStore.get('x-pathname') ?? '/dashboard';
  return `/login?next=${encodeURIComponent(pathname)}`;
}

export async function getRole(): Promise<AppRole | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.schema('core').from('app_user').select('role, active').eq('user_id', user.id).maybeSingle();
  if (!data?.active) return null;
  return data.role as AppRole;
}

export async function requireUser(): Promise<{ user: User; profile: AppProfile; supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(await loginPath());
  const { data: profile } = await supabase.schema('core').from('app_user').select('user_id, email, name, department, role, active, last_login_at').eq('user_id', user.id).maybeSingle();
  if (!profile?.active) redirect(await loginPath());
  return { user, profile: profile as AppProfile, supabase };
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.profile.role !== 'ADMIN') forbidden();
  return session;
}

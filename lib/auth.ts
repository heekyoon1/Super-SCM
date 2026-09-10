import { forbidden, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import type { User } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/auth-policy';

export type AppRole = 'ADMIN' | 'USER';
export type AppProfile = { user_id: string; email: string; name: string; department: string | null; role: AppRole; active: boolean; last_login_at: string | null };
export type AuthenticatedSession = { user: User; profile: AppProfile; supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> };

export class AuthorizationError extends Error {
  constructor(readonly status: 401 | 403, message: string) { super(message); this.name = 'AuthorizationError'; }
}

async function loginPath() {
  const headerStore = await headers();
  const pathname = headerStore.get('x-invoke-path') ?? headerStore.get('x-pathname') ?? '/dashboard';
  return `/login?next=${encodeURIComponent(safeNextPath(pathname))}`;
}

export async function getRole(): Promise<AppRole | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.schema('core').from('app_user').select('role, active').eq('user_id', user.id).maybeSingle();
  if (!data?.active) return null;
  return data.role as AppRole;
}

async function readAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;
  const { data: profile, error: profileError } = await supabase.schema('core').from('app_user').select('user_id, email, name, department, role, active, last_login_at').eq('user_id', user.id).maybeSingle();
  if (profileError || !profile?.active) return null;
  return { user, profile: profile as AppProfile, supabase };
}

export async function requireUser(): Promise<AuthenticatedSession> {
  const session = await readAuthenticatedSession();
  if (!session) redirect(await loginPath());
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.profile.role !== 'ADMIN') forbidden();
  return session;
}

export async function requireSignedIn(): Promise<AuthenticatedSession> {
  const session = await readAuthenticatedSession();
  if (!session) throw new AuthorizationError(401, '로그인이 필요합니다.');
  return session;
}

export async function requireAdminApi(): Promise<AuthenticatedSession> {
  const session = await requireSignedIn();
  if (session.profile.role !== 'ADMIN') throw new AuthorizationError(403, '관리자 권한이 필요합니다.');
  return session;
}

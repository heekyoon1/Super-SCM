'use server';

import { redirect } from 'next/navigation';
import { safeNextPath } from '@/lib/auth-policy';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type LoginState = { error: string | null };

const failureMessage = (message: string) => {
  const normalized = message.toLowerCase();
  if (normalized.includes('email not confirmed')) return '이메일 인증이 완료되지 않았습니다. Supabase Auth에서 사용자를 Confirm 처리하세요.';
  if (normalized.includes('invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다.';
  return '로그인에 실패했습니다. 계정과 Supabase 설정을 확인하세요.';
};

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const nextPath = safeNextPath(String(formData.get('next') ?? '/dashboard'));
  if (!email || !password) return { error: '이메일과 비밀번호를 입력하세요.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: failureMessage(error.message) };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인 세션을 확인할 수 없습니다.' };
  const { data: profile } = await supabase.schema('core').from('app_user').select('active').eq('user_id', user.id).maybeSingle();
  if (!profile?.active) {
    await supabase.auth.signOut();
    return { error: '비활성화되었거나 등록되지 않은 계정입니다.' };
  }
  await supabase.schema('core').rpc('mark_login');
  redirect(nextPath);
}

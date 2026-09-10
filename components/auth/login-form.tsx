'use client';

import { useActionState } from 'react';
import Button from '@/components/ui/button';
import { loginAction, type LoginState } from '@/app/(auth)/login/actions';

const initialState: LoginState = { error: null };

export default function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState);
  return <form className="stack" action={action}><input type="hidden" name="next" value={nextPath} /><input className="field" aria-label="이메일" placeholder="이메일" type="email" name="email" autoComplete="email" required /><input className="field" aria-label="비밀번호" placeholder="비밀번호" type="password" name="password" autoComplete="current-password" required />{state.error && <p role="alert" className="alert-row critical">{state.error}</p>}<Button variant="primary" type="submit" disabled={pending}>{pending ? '로그인 중…' : '로그인'}</Button></form>;
}

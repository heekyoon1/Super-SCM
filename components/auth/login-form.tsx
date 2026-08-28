'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import Button from '@/components/ui/button';

export default function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(null);
    const { error: signInError } = await createSupabaseBrowserClient().auth.signInWithPassword({ email, password });
    if (signInError) { setError('이메일 또는 비밀번호를 확인하세요.'); setLoading(false); return; }
    router.replace(nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/dashboard'); router.refresh();
  }
  return <form className="stack" onSubmit={submit}><input className="field" aria-label="이메일" placeholder="이메일" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /><input className="field" aria-label="비밀번호" placeholder="비밀번호" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />{error && <p role="alert" className="alert-row critical">{error}</p>}<Button variant="primary" type="submit" disabled={loading}>{loading ? '로그인 중…' : '로그인'}</Button></form>;
}

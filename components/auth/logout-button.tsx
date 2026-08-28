'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import Button from '@/components/ui/button';

export default function LogoutButton() { const router = useRouter(); return <Button type="button" onClick={async () => { await createSupabaseBrowserClient().auth.signOut(); router.replace('/login'); router.refresh(); }}>로그아웃</Button>; }

import type { ReactNode } from 'react';
import AppShell from '@/components/shell/app-shell';
import { requireUser } from '@/lib/auth';

export default async function UserLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireUser();
  return <AppShell role={profile.role}>{children}</AppShell>;
}

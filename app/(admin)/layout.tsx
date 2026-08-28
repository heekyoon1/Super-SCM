import type { ReactNode } from 'react';
import AppShell from '@/components/shell/app-shell';
import { requireAdmin } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: ReactNode }) { await requireAdmin(); return <AppShell role="ADMIN">{children}</AppShell>; }

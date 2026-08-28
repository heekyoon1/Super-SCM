import type { ReactNode } from 'react';
import Sidebar from './sidebar';
import Topbar from './topbar';
import type { MenuRole } from '@/lib/menu';

export default function AppShell({ children, role = 'USER' }: { children: ReactNode; role?: MenuRole }) {
  return <div className="app-shell"><Sidebar role={role} /><div className="main-shell"><Topbar /><main className="content-shell">{children}</main></div></div>;
}

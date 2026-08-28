'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getMenuItems, type MenuRole } from '@/lib/menu';

export default function Sidebar({ role = 'USER' }: { role?: MenuRole }) {
  const pathname = usePathname();
  return <aside className="sidebar" aria-label="주요 메뉴">
    <Link className="sidebar-brand" href="/dashboard"><span className="sidebar-brand-mark">OP</span><span><strong>ProcureOps</strong><small>SCM Control Center</small></span></Link>
    <nav className="sidebar-nav">
      <div className="sidebar-section-label">{role}</div>
      {getMenuItems(role).map(({ label, href, icon: Icon }) => <Link className={`sidebar-link ${pathname === href ? 'active' : ''}`} href={href} key={href} aria-current={pathname === href ? 'page' : undefined}><Icon size={20} aria-hidden="true" /><span>{label}</span></Link>)}
    </nav>
    <div className="sidebar-footer"><small>월간 발주계획 · Phase 1</small></div>
  </aside>;
}

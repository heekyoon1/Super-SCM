import { Bell } from 'lucide-react';

export default function Topbar({ title = 'ProcureOps' }: { title?: string }) {
  return <header className="topbar"><span className="topbar-title">{title}</span><div className="topbar-meta"><span>기준월도 <strong>2026.09</strong></span><button className="button" type="button" aria-label="알림"><Bell size={17} /></button></div></header>;
}

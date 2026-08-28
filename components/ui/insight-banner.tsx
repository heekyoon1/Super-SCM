import { Lightbulb } from 'lucide-react';
import type { ReactNode } from 'react';

export default function InsightBanner({ title, children }: { title: string; children: ReactNode }) { return <aside className="insight-banner"><Lightbulb size={18} aria-hidden="true" /><div><strong>{title}</strong><span>{children}</span></div></aside>; }

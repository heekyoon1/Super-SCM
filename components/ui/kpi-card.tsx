import type { ReactNode } from 'react';

export default function KpiCard({ label, value, meta, tone, children }: { label: string; value: ReactNode; meta?: ReactNode; tone?: 'success' | 'warning' | 'critical'; children?: ReactNode }) {
  return <article className="kpi-card"><div className="kpi-label">{label}</div><div className="kpi-value">{value}</div>{meta && <div className={`kpi-meta ${tone ?? ''}`}>{meta}</div>}{children}</article>;
}

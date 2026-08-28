import type { ReactNode } from 'react';

export type Status = 'SAFE' | 'WARNING' | 'CRITICAL' | 'CALCULATION_UNAVAILABLE';
const labels: Record<Status, string> = { SAFE: 'SAFE', WARNING: 'WARNING', CRITICAL: 'CRITICAL', CALCULATION_UNAVAILABLE: 'CALCULATION UNAVAILABLE' };
export default function Badge({ status, children }: { status: Status; children?: ReactNode }) { return <span className={`badge badge-${status.toLowerCase().replaceAll('_', '-')}`}>{children ?? labels[status]}</span>; }

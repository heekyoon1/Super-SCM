import { AlertTriangle, CheckCircle2, OctagonAlert } from 'lucide-react';
import type { Status } from './badge';
import Badge from './badge';

const icons = { SAFE: CheckCircle2, WARNING: AlertTriangle, CRITICAL: OctagonAlert, CALCULATION_UNAVAILABLE: AlertTriangle };
export default function AlertRow({ status, title, description }: { status: Status; title: string; description: string }) { const Icon = icons[status]; return <div className={`alert-row ${status === 'CRITICAL' ? 'critical' : status === 'SAFE' ? 'safe' : 'warning'}`}><Icon size={18} aria-hidden="true" /><div><div className="alert-row-title">{title} <Badge status={status} /></div><div className="alert-row-description">{description}</div></div></div>; }

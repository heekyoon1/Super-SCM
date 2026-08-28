'use client';

import { Area, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export type ForecastChartPoint = { period: string; actual: number | null; [key: string]: string | number | null };
const seriesTokens = ['var(--chart-series-1)', 'var(--chart-series-2)', 'var(--chart-series-3)', 'var(--chart-series-4)', 'var(--chart-series-5)'];
export default function ForecastOverlayChart({ data, modelIds }: { data: ForecastChartPoint[]; modelIds: string[] }) {
  return <div className="chart chart-forecast"><ResponsiveContainer width="100%" height={360}><LineChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 8 }}><CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" /><XAxis dataKey="period" stroke="var(--color-text-muted)" /><YAxis stroke="var(--color-text-muted)" /><Tooltip /><Legend /><Line type="monotone" dataKey="actual" name="Actual" stroke="var(--color-text-strong)" strokeWidth={2} connectNulls={false} /><>{modelIds.map((modelId, index) => <><Area key={`${modelId}-p80`} type="monotone" dataKey={`${modelId}__p80`} name={`${modelId} P80`} stroke="none" fill={seriesTokens[index % seriesTokens.length]} fillOpacity={0.06} connectNulls={false} /><Line key={`${modelId}-p90`} type="monotone" dataKey={`${modelId}__p90`} name={`${modelId} P90`} stroke={seriesTokens[index % seriesTokens.length]} strokeDasharray="2 4" dot={false} connectNulls={false} /><Line key={`${modelId}-p50`} type="monotone" dataKey={`${modelId}__p50`} name={`${modelId} P50`} stroke={seriesTokens[index % seriesTokens.length]} dot={false} connectNulls={false} /></>)}</></LineChart></ResponsiveContainer></div>;
}

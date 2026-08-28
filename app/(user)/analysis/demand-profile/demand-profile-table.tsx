'use client';

import { useMemo, useState } from 'react';
import Badge from '@/components/ui/badge';
import EmptyValue from '@/components/ui/empty-value';

type Profile = { item_id: string; item_name: string | null; n_periods: number; n_nonzero_periods: number; adi: number | null; cv_squared: number | null; zero_demand_rate: number | null; trend: number | null; recent_change_rate: number | null; peak_period: string | null; demand_type: 'SMOOTH' | 'INTERMITTENT' | 'ERRATIC' | 'LUMPY' | null; seasonality: boolean | null; reason_code: string | null; stability: string };
const typeStatus = (type: Profile['demand_type']) => type === 'SMOOTH' ? 'SAFE' : type === 'INTERMITTENT' || type === 'ERRATIC' ? 'WARNING' : type === 'LUMPY' ? 'CRITICAL' : 'CALCULATION_UNAVAILABLE';
const number = (value: number | null, digits = 2) => value == null ? null : value.toFixed(digits);

export default function DemandProfileTable({ profiles }: { profiles: Profile[] }) {
  const [type, setType] = useState('ALL');
  const [availability, setAvailability] = useState('ALL');
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => profiles.filter((profile) => {
    const matchesType = type === 'ALL' || profile.demand_type === type;
    const unavailable = profile.demand_type == null;
    const matchesAvailability = availability === 'ALL' || (availability === 'AVAILABLE' ? !unavailable : unavailable);
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || profile.item_id.toLowerCase().includes(query) || (profile.item_name ?? '').toLowerCase().includes(query);
    return matchesType && matchesAvailability && matchesSearch;
  }), [availability, profiles, search, type]);
  const value = (item: number | null, reason: string | null) => item == null ? <EmptyValue reasonCode={reason ?? 'CALCULATION_UNAVAILABLE'} /> : number(item);
  return <>
    <div className="filter-bar">
      <label>Demand Type<select className="field" value={type} onChange={(event) => setType(event.target.value)}><option value="ALL">전체</option><option value="SMOOTH">SMOOTH</option><option value="INTERMITTENT">INTERMITTENT</option><option value="ERRATIC">ERRATIC</option><option value="LUMPY">LUMPY</option></select></label>
      <label>계산 상태<select className="field" value={availability} onChange={(event) => setAvailability(event.target.value)}><option value="ALL">전체</option><option value="AVAILABLE">계산 가능</option><option value="UNAVAILABLE">계산 불가</option></select></label>
      <label>SKU 검색<input className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="SKU 또는 품목명" /></label>
    </div>
    <div className="data-table-wrap"><table className="data-table"><thead><tr><th>SKU</th><th>품목명</th><th>ADI</th><th>CV²</th><th>Zero-demand Rate</th><th>Trend</th><th>Demand Type</th><th>Seasonality</th><th>Reason</th></tr></thead><tbody>{filtered.map((profile) => <tr key={profile.item_id}><td>{profile.item_id}</td><td>{profile.item_name ?? <EmptyValue reasonCode="ITEM_NAME_UNAVAILABLE" />}</td><td className="numeric">{value(profile.adi, profile.reason_code)}</td><td className="numeric">{value(profile.cv_squared, profile.reason_code)}</td><td className="numeric">{value(profile.zero_demand_rate, profile.reason_code)}</td><td className="numeric">{value(profile.trend, profile.reason_code)}</td><td><Badge status={typeStatus(profile.demand_type)}>{profile.demand_type ?? 'CALCULATION_UNAVAILABLE'}</Badge></td><td>{profile.seasonality == null ? <EmptyValue reasonCode={profile.reason_code ?? 'INSUFFICIENT_PERIODS'} /> : profile.seasonality ? 'DETECTED' : 'NOT_DETECTED'}</td><td>{profile.reason_code ?? '—'}</td></tr>)}{!filtered.length && <tr><td colSpan={9}>조회 결과가 없습니다.</td></tr>}</tbody></table></div>
  </>;
}

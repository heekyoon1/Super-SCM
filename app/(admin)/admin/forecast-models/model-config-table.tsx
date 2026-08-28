'use client';

import { useState } from 'react';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';

type Model = { model_id: string; model_name: string; family: string; engine: string; version: string; enabled: boolean; applicable_demand_type: string[]; parameters: Record<string, unknown>; description: string | null };
export default function ModelConfigTable({ models }: { models: Model[] }) {
  const [rows, setRows] = useState(models);
  const [message, setMessage] = useState('');
  async function save(model: Model) {
    const response = await fetch(`/api/admin/forecast-models/${model.model_id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: model.enabled, parameters: model.parameters }) });
    const body = await response.json();
    setMessage(response.ok ? `${model.model_id} 저장 완료` : body.error ?? '저장 실패');
  }
  return <div className="data-table-wrap"><table className="data-table"><thead><tr><th>모델</th><th>Family</th><th>Engine</th><th>Version</th><th>적용 Demand Type</th><th>Parameters</th><th>상태</th><th>관리</th></tr></thead><tbody>{rows.map((model) => <tr key={model.model_id}><td><strong>{model.model_id}</strong><br /><small>{model.model_name}</small></td><td>{model.family}</td><td>{model.engine}</td><td>{model.version}</td><td>{model.applicable_demand_type.join(', ')}</td><td><input className="field" value={JSON.stringify(model.parameters)} onChange={(event) => { try { const parameters = JSON.parse(event.target.value) as Record<string, unknown>; setRows((items) => items.map((item) => item.model_id === model.model_id ? { ...item, parameters } : item)); } catch { setMessage('Parameters는 유효한 JSON이어야 합니다.'); } }} /></td><td><Badge status={model.enabled ? 'SAFE' : 'WARNING'}>{model.enabled ? 'ENABLED' : 'DISABLED'}</Badge></td><td><div className="button-row"><Button type="button" onClick={() => setRows((items) => items.map((item) => item.model_id === model.model_id ? { ...item, enabled: !item.enabled } : item))}>{model.enabled ? '끄기' : '켜기'}</Button><Button type="button" onClick={() => save(model)}>저장</Button></div></td></tr>)}</tbody></table>{message && <p role="status">{message}</p>}</div>;
}

'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
export default function ForecastRunActions() { const [message, setMessage] = useState(''); async function run() { setMessage('실행 중…'); const response = await fetch('/api/admin/forecast-runs', { method: 'POST' }); const body = await response.json(); setMessage(response.ok ? `실행 완료: ${body.runId}` : body.error ?? '실행 실패'); } return <div className="button-row"><Button variant="primary" type="button" onClick={run}>Baseline Forecast 실행</Button>{message && <span role="status">{message}</span>}</div>; }

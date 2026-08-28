'use client';

import Button from '@/components/ui/button';
import { useState } from 'react';

export default function ImportHistoryActions({ batchId, rollbackSupported }: { batchId: string; rollbackSupported: boolean }) { const [message, setMessage] = useState(''); return <div className="button-row"><a className="button" href={`/api/import/${batchId}/errors`}>Errors</a><Button type="button" disabled={!rollbackSupported} onClick={async () => { const response = await fetch(`/api/import/${batchId}/rollback`, { method: 'POST' }); const body = await response.json(); setMessage(response.ok ? '완료' : body.error ?? '실패'); }}>{rollbackSupported ? 'Rollback' : '제한됨'}</Button>{message && <span role="status">{message}</span>}</div>; }

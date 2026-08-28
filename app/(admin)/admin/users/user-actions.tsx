'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import { updateUserActive, updateUserRole } from './actions';

export default function UserActions({ userId, role, active, isSelf }: { userId: string; role: 'ADMIN' | 'USER'; active: boolean; isSelf: boolean }) {
  const [message, setMessage] = useState('');
  async function changeRole() { const result = await updateUserRole(userId, role === 'ADMIN' ? 'USER' : 'ADMIN'); setMessage(result.error ?? '저장됨'); }
  async function changeActive() { const result = await updateUserActive(userId, !active); setMessage(result.error ?? '저장됨'); }
  return <div className="button-row"><Button type="button" disabled={isSelf} onClick={changeRole}>{role === 'ADMIN' ? 'USER로 변경' : 'ADMIN으로 변경'}</Button><Button type="button" disabled={isSelf} onClick={changeActive}>{active ? '비활성화' : '활성화'}</Button>{message && <span role="status">{message}</span>}</div>;
}

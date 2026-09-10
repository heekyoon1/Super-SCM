import { NextResponse } from 'next/server';
import { AuthorizationError } from '@/lib/auth';

export function apiErrorResponse(error: unknown, fallback: string, fallbackStatus = 400) {
  const status = error instanceof AuthorizationError ? error.status : fallbackStatus;
  return NextResponse.json({ error: error instanceof Error ? error.message : fallback }, { status });
}

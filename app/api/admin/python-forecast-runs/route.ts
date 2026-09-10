import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    await requireAdminApi();
    const base = process.env.FORECAST_SERVICE_URL;
    if (!base) return NextResponse.json({ error: 'FORECAST_SERVICE_NOT_CONFIGURED' }, { status: 503 });
    const response = await fetch(`${base.replace(/\/$/, '')}/forecast/run`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(process.env.FORECAST_SERVICE_TOKEN ? { 'x-service-token': process.env.FORECAST_SERVICE_TOKEN } : {}) }, body: await request.text(), cache: 'no-store' });
    const body = await response.json();
    return NextResponse.json(body, { status: response.status });
  } catch (error) { return apiErrorResponse(error, 'PYTHON_FORECAST_FAILED', 503); }
}

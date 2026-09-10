import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAdminApi();
    const body = await request.json() as { forecastRunId?: string };
    if (!body.forecastRunId) return NextResponse.json({ error: 'FORECAST_RUN_REQUIRED' }, { status: 400 });
    const { data, error } = await supabase.schema('core').rpc('run_backtest', { p_forecast_run_id: body.forecastRunId });
    if (error) throw new Error(error.message);
    return NextResponse.json({ backtestRunId: data });
  } catch (error) { return apiErrorResponse(error, 'BACKTEST_FAILED'); }
}

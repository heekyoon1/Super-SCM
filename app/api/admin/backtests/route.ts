import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAdmin();
    const body = await request.json() as { forecastRunId?: string };
    if (!body.forecastRunId) return NextResponse.json({ error: 'FORECAST_RUN_REQUIRED' }, { status: 400 });
    const { data, error } = await supabase.schema('core').rpc('run_backtest', { p_forecast_run_id: body.forecastRunId });
    if (error) throw new Error(error.message);
    return NextResponse.json({ backtestRunId: data });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'BACKTEST_FAILED' }, { status: 403 }); }
}

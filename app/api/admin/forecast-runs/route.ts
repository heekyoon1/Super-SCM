import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function POST() {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase.schema('core').rpc('run_baseline_forecast');
    if (error) throw new Error(error.message);
    return NextResponse.json({ runId: data });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'FORECAST_RUN_FAILED' }, { status: 403 }); }
}

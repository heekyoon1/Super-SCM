import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-auth';

export async function POST() {
  try {
    const { supabase } = await requireAdminApi();
    const { data, error } = await supabase.schema('core').rpc('run_baseline_forecast');
    if (error) throw new Error(error.message);
    return NextResponse.json({ runId: data });
  } catch (error) { return apiErrorResponse(error, 'FORECAST_RUN_FAILED'); }
}

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAdmin();
    const body = await request.json() as { backtestRunId?: string; itemId?: string; modelId?: string; reasonText?: string };
    if (!body.backtestRunId || !body.itemId || !body.modelId || !body.reasonText?.trim()) return NextResponse.json({ error: 'MANUAL_CHAMPION_REASON_REQUIRED' }, { status: 400 });
    const { data, error } = await supabase.schema('core').rpc('set_manual_champion', { p_backtest_run_id: body.backtestRunId, p_item_id: body.itemId, p_model_id: body.modelId, p_reason_text: body.reasonText.trim() });
    if (error) throw new Error(error.message);
    return NextResponse.json({ championId: data });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'MANUAL_CHAMPION_FAILED' }, { status: 403 }); }
}

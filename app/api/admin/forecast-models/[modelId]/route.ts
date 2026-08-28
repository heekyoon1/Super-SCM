import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ modelId: string }> }) {
  try {
    const { supabase, user } = await requireAdmin();
    const modelId = (await params).modelId;
    const body = await request.json() as { enabled?: boolean; parameters?: Record<string, unknown> };
    const { data: before, error: readError } = await supabase.schema('core').from('model_config').select('*').eq('model_id', modelId).maybeSingle();
    if (readError || !before) return NextResponse.json({ error: 'MODEL_NOT_FOUND' }, { status: 404 });
    const update = { enabled: body.enabled ?? before.enabled, parameters: body.parameters ?? before.parameters, updated_by: user.id, updated_at: new Date().toISOString() };
    const { data: after, error } = await supabase.schema('core').from('model_config').update(update).eq('model_id', modelId).select('*').single();
    if (error) throw new Error(error.message);
    await supabase.schema('core').from('audit_log').insert({ actor: user.id, action: 'MODEL_CONFIG_UPDATED', target_type: 'model_config', target_id: modelId, before, after });
    return NextResponse.json({ model: after });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'MODEL_UPDATE_FAILED' }, { status: 403 }); }
}

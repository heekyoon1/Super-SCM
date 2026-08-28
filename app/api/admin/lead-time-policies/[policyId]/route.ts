import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ policyId: string }> }) {
  try {
    const { supabase, user } = await requireAdmin();
    const policyId = (await params).policyId;
    const body = await request.json() as { confirmedLeadTimeDays?: number | null; effectiveFrom?: string; effectiveTo?: string | null; active?: boolean };
    if (body.confirmedLeadTimeDays != null && (!Number.isFinite(body.confirmedLeadTimeDays) || body.confirmedLeadTimeDays < 0)) return NextResponse.json({ error: 'INVALID_LEAD_TIME' }, { status: 400 });
    const { data: before } = await supabase.schema('core').from('lead_time_policy').select('*').eq('policy_id', policyId).maybeSingle();
    if (!before) return NextResponse.json({ error: 'POLICY_NOT_FOUND' }, { status: 404 });
    const { data: after, error } = await supabase.schema('core').from('lead_time_policy').update({ confirmed_lead_time_days: body.confirmedLeadTimeDays ?? null, effective_from: body.effectiveFrom ?? before.effective_from, effective_to: body.effectiveTo ?? before.effective_to, active: body.active ?? before.active, updated_by: user.id }).eq('policy_id', policyId).select('*').single();
    if (error) throw new Error(error.message);
    await supabase.schema('core').from('audit_log').insert({ actor: user.id, action: 'LEAD_TIME_POLICY_UPDATED', target_type: 'lead_time_policy', target_id: policyId, before, after });
    return NextResponse.json({ policy: after });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'LEAD_TIME_POLICY_UPDATE_FAILED' }, { status: 403 }); }
}

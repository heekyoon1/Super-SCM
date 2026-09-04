import { createSupabaseServerClient } from '@/lib/supabase/server';
import { normalizeBomRequirement, normalizeDemandProfile, normalizeOlAccuracy, normalizeShipmentTrend, type BomRequirement, type DemandProfileRt, type OlAccuracy, type ScmSourceRow, type ShipmentTrend } from '@/lib/scm-model';

async function readView<T>(view: string, filter?: (query: any) => any): Promise<ScmSourceRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.schema('analytics').from(view).select('*');
  if (filter) query = filter(query);
  const { data, error } = await query;
  if (error) throw new Error(`analytics.${view} 조회 실패: ${error.message}`);
  return (data ?? []) as ScmSourceRow[];
}

export async function getShipmentTrend(itemCode?: string): Promise<ShipmentTrend[]> {
  const rows = await readView('v_shipment_trend', itemCode ? (query) => query.eq('item_code', itemCode) : undefined);
  return rows.map(normalizeShipmentTrend);
}

export async function getDemandProfileRt(itemCode?: string): Promise<DemandProfileRt[]> {
  const rows = await readView('v_item_demand_profile', itemCode ? (query) => query.eq('item_code', itemCode) : undefined);
  return rows.map(normalizeDemandProfile);
}

export async function getOlAccuracy(modelBase?: string): Promise<OlAccuracy[]> {
  const rows = await readView('v_ol_accuracy', modelBase ? (query) => query.eq('model_base', modelBase) : undefined);
  return rows.map(normalizeOlAccuracy);
}

export async function getBomRequirement(modelBase: string): Promise<BomRequirement[]> {
  const rows = await readView('v_bom_requirement_x', (query) => query.eq('model_base', modelBase));
  return rows.map(normalizeBomRequirement);
}

export type ReasonCode = string | null;

export type ShipmentTrend = {
  itemCode: string | null;
  period: string | null;
  shipmentQty: number | null;
  nMonths: number | null;
  avg3m: number | null;
  avg12m: number | null;
  reasonCode: ReasonCode;
};

export type DemandProfileRt = {
  itemCode: string | null;
  itemName: string | null;
  nPeriods: number | null;
  nNonzeroPeriods: number | null;
  adi: number | null;
  cv: number | null;
  cvSquared: number | null;
  zeroDemandRate: number | null;
  trend: number | null;
  recentChangeRate: number | null;
  peakPeriod: string | null;
  demandType: string | null;
  seasonality: boolean | null;
  reasonCode: ReasonCode;
  stability: string | null;
};

export type OlAccuracy = {
  modelBase: string | null;
  period: string | null;
  nPeriods: number | null;
  actualQty: number | null;
  forecastQty: number | null;
  wape: number | null;
  mape: number | null;
  bias: number | null;
  rmse: number | null;
  mae: number | null;
  reasonCode: ReasonCode;
};

export type BomRequirement = {
  modelBase: string | null;
  parentItemCode: string | null;
  componentItemCode: string | null;
  requirementQty: number | null;
  period: string | null;
  reasonCode: ReasonCode;
};

export type ScmSourceRow = Record<string, unknown> & { reason_code?: unknown; reasonCode?: unknown };

const key = (row: ScmSourceRow, ...names: string[]) => names.map((name) => row[name]).find((value) => value !== undefined) ?? null;

export const nullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
};

export const nullableString = (value: unknown): string | null => value === null || value === undefined || value === '' ? null : String(value);

export const reasonCode = (row: ScmSourceRow) => nullableString(key(row, 'reason_code', 'reasonCode'));

export function normalizeShipmentTrend(row: ScmSourceRow): ShipmentTrend {
  return { itemCode: nullableString(key(row, 'item_code', 'item_id', 'item_code_id')), period: nullableString(key(row, 'period', 'month', 'shipment_month')), shipmentQty: nullableNumber(key(row, 'shipment_qty', 'quantity', 'qty')), nMonths: nullableNumber(key(row, 'n_months', 'months')), avg3m: nullableNumber(key(row, 'avg_3m')), avg12m: nullableNumber(key(row, 'avg_12m')), reasonCode: reasonCode(row) };
}

export function normalizeDemandProfile(row: ScmSourceRow): DemandProfileRt {
  return { itemCode: nullableString(key(row, 'item_code', 'item_id')), itemName: nullableString(key(row, 'item_name', 'name')), nPeriods: nullableNumber(key(row, 'n_periods')), nNonzeroPeriods: nullableNumber(key(row, 'n_nonzero_periods')), adi: nullableNumber(key(row, 'adi')), cv: nullableNumber(key(row, 'cv')), cvSquared: nullableNumber(key(row, 'cv_squared', 'cv2')), zeroDemandRate: nullableNumber(key(row, 'zero_demand_rate')), trend: nullableNumber(key(row, 'trend', 'trend_per_period')), recentChangeRate: nullableNumber(key(row, 'recent_change_rate')), peakPeriod: nullableString(key(row, 'peak_period')), demandType: nullableString(key(row, 'demand_type')), seasonality: typeof key(row, 'seasonality') === 'boolean' ? key(row, 'seasonality') as boolean : null, reasonCode: reasonCode(row), stability: nullableString(key(row, 'stability')) };
}

export function normalizeOlAccuracy(row: ScmSourceRow): OlAccuracy {
  return { modelBase: nullableString(key(row, 'model_base', 'model_id', 'model')), period: nullableString(key(row, 'period', 'month')), nPeriods: nullableNumber(key(row, 'n_periods')), actualQty: nullableNumber(key(row, 'actual_qty', 'actual')), forecastQty: nullableNumber(key(row, 'forecast_qty', 'forecast')), wape: nullableNumber(key(row, 'wape')), mape: nullableNumber(key(row, 'mape')), bias: nullableNumber(key(row, 'bias')), rmse: nullableNumber(key(row, 'rmse')), mae: nullableNumber(key(row, 'mae')), reasonCode: reasonCode(row) };
}

export function normalizeBomRequirement(row: ScmSourceRow): BomRequirement {
  return { modelBase: nullableString(key(row, 'model_base', 'model_id', 'model')), parentItemCode: nullableString(key(row, 'parent_item_code', 'parent_item_id', 'parent_sku')), componentItemCode: nullableString(key(row, 'component_item_code', 'component_item_id', 'component_sku')), requirementQty: nullableNumber(key(row, 'requirement_qty', 'required_qty', 'qty')), period: nullableString(key(row, 'period', 'month')), reasonCode: reasonCode(row) };
}

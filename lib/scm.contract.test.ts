import type { BomRequirement, DemandProfileRt, OlAccuracy, ShipmentTrend } from '@/lib/scm-model';
import { getBomRequirement, getDemandProfileRt, getOlAccuracy, getShipmentTrend } from '@/lib/scm';

export const scmQueryContract: [
  typeof getShipmentTrend,
  typeof getDemandProfileRt,
  typeof getOlAccuracy,
  typeof getBomRequirement,
] = [getShipmentTrend, getDemandProfileRt, getOlAccuracy, getBomRequirement];

export type ScmQueryModels = ShipmentTrend | DemandProfileRt | OlAccuracy | BomRequirement;

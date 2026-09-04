// DEPRECATED 2026-09-04 하드코딩 목업. 신규 코드는 lib/scm.ts 사용

export type LeadTimeRow = { id: string; supplier: string; lane: string; plannedDays: number | null; actualDays: number | null; status: 'SAFE' | 'WARNING' | 'CRITICAL' | 'CALCULATION_UNAVAILABLE'; reasonCode?: string };
export const leadTimeRows: LeadTimeRow[] = [
  { id: 'lt-1', supplier: '상해 Supplier A', lane: '상해 → 부산', plannedDays: 18, actualDays: 19, status: 'SAFE' },
  { id: 'lt-2', supplier: '네덜란드 Supplier B', lane: '로테르담 → 부산', plannedDays: 32, actualDays: 41, status: 'WARNING' },
  { id: 'lt-3', supplier: '도쿄 Supplier C', lane: '도쿄 → 인천', plannedDays: null, actualDays: null, status: 'CALCULATION_UNAVAILABLE', reasonCode: 'NO_HISTORY' },
  { id: 'lt-4', supplier: '심천 Supplier D', lane: '심천 → 부산', plannedDays: 15, actualDays: 28, status: 'CRITICAL' },
];

export type StockoutRow = { id: string; item: string; category: string; available: number | null; demand: number | null; risk: 'SAFE' | 'WARNING' | 'CRITICAL' | 'CALCULATION_UNAVAILABLE'; reasonCode?: string };
export const stockoutRows: StockoutRow[] = [
  { id: 'so-1', item: 'PRT-A3-001', category: '기기', available: 35, demand: 120, risk: 'SAFE' },
  { id: 'so-2', item: 'OPT-001', category: '옵션', available: 18, demand: 30, risk: 'WARNING' },
  { id: 'so-3', item: 'PART-009', category: '부품', available: 8, demand: 20, risk: 'CRITICAL' },
  { id: 'so-4', item: 'CONSUM-022', category: '소모품', available: null, demand: null, risk: 'CALCULATION_UNAVAILABLE', reasonCode: 'NO_STOCK_SNAPSHOT' },
];

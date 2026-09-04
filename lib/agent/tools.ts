import type { BomRequirement, DemandProfileRt, OlAccuracy, ShipmentTrend } from '@/lib/scm-model';

export type AgentRole = 'USER' | 'ADMIN';
export type ToolResult<T> = { ok: boolean; data: T; numbers: Record<string, number | null>; dataAsOf: string | null; reason: string | null };
export type AgentTool<TParams, TData> = { name: string; description: string; parameters: { type: 'object'; additionalProperties: false; properties: Record<string, unknown>; required: string[] }; roles: AgentRole[]; run: (params: TParams, role?: AgentRole) => Promise<ToolResult<TData>> };

const shipmentParameters = { type: 'object' as const, additionalProperties: false as const, properties: { itemCode: { anyOf: [{ type: 'string' }, { type: 'null' }] } }, required: ['itemCode'] };
const modelParameters = { type: 'object' as const, additionalProperties: false as const, properties: { modelBase: { anyOf: [{ type: 'string' }, { type: 'null' }] }, fy: { anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'null' }] } }, required: ['modelBase', 'fy'] };
const bomParameters = { type: 'object' as const, additionalProperties: false as const, properties: { modelBase: { type: 'string' } }, required: ['modelBase'] };

const values = (data: unknown): Record<string, number | null> => { const numbers: Record<string, number | null> = {}; const visit = (value: unknown, path: string) => { if (typeof value === 'number' || value === null) { if (path) numbers[path] = value; return; } if (Array.isArray(value)) { value.forEach((entry, index) => visit(entry, `${path}[${index}]`)); return; } if (value && typeof value === 'object') Object.entries(value).forEach(([key, entry]) => visit(entry, path ? `${path}.${key}` : key)); }; visit(data, 'data'); return numbers; };
const dataAsOf = (data: unknown) => { if (!Array.isArray(data)) return null; const first = data[0]; if (!first || typeof first !== 'object') return null; const row = first as Record<string, unknown>; return typeof row.data_as_of === 'string' ? row.data_as_of : typeof row.dataAsOf === 'string' ? row.dataAsOf : typeof row.loaded_at === 'string' ? row.loaded_at : null; };
const failure = <T>(reason: string): ToolResult<T> => ({ ok: false, data: [] as T, numbers: {}, dataAsOf: null, reason });
const forbidden = <T>(): ToolResult<T> => failure<T>('FORBIDDEN');

async function execute<T>(roles: AgentRole[], role: AgentRole | undefined, loader: () => Promise<T>): Promise<ToolResult<T>> { if (role && !roles.includes(role)) return forbidden<T>(); try { const data = await loader(); return { ok: true, data, numbers: values(data), dataAsOf: dataAsOf(data), reason: Array.isArray(data) && data.length === 0 ? 'NO_DATA' : null }; } catch { return failure<T>('QUERY_FAILED'); } }

export const getShipmentTrendTool: AgentTool<{ itemCode: string | null }, ShipmentTrend[]> = { name: 'getShipmentTrend', description: '품목의 월별 출고 추이와 이동평균을 조회합니다.', parameters: shipmentParameters, roles: ['USER', 'ADMIN'], run: async ({ itemCode }, role) => execute(['USER', 'ADMIN'], role, async () => (await import('@/lib/scm')).getShipmentTrend(itemCode ?? undefined)) };
export const getDemandProfileTool: AgentTool<{ itemCode: string | null }, DemandProfileRt[]> = { name: 'getDemandProfile', description: '품목의 학습기간 수요 특성과 수요유형을 조회합니다.', parameters: shipmentParameters, roles: ['USER', 'ADMIN'], run: async ({ itemCode }, role) => execute(['USER', 'ADMIN'], role, async () => (await import('@/lib/scm')).getDemandProfile(itemCode ?? undefined)) };
export const getOlAccuracyTool: AgentTool<{ modelBase: string | null; fy: string | number | null }, OlAccuracy[]> = { name: 'getOlAccuracy', description: '모델과 회계연도별 Sales OL 및 SCM OL 정확도를 조회합니다.', parameters: modelParameters, roles: ['USER', 'ADMIN'], run: async ({ modelBase, fy }, role) => execute(['USER', 'ADMIN'], role, async () => (await import('@/lib/scm')).getOlAccuracy(modelBase ?? undefined, fy ?? undefined)) };
export const getBomRequirementTool: AgentTool<{ modelBase: string }, BomRequirement[]> = { name: 'getBomRequirement', description: '기종 판매 1대에 필요한 CAP, 필수 옵션, SCC/Label, 구성품과 수량을 조회합니다.', parameters: bomParameters, roles: ['USER', 'ADMIN'], run: async ({ modelBase }, role) => execute(['USER', 'ADMIN'], role, async () => (await import('@/lib/scm')).getBomRequirement(modelBase)) };

export const agentTools = [getShipmentTrendTool, getDemandProfileTool, getOlAccuracyTool, getBomRequirementTool] as const;

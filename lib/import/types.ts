export const IMPORT_TYPES = ['usage_history', 'business_event', 'sales_order', 'item_substitute'] as const;
export type ImportType = typeof IMPORT_TYPES[number];
export type ImportMode = 'append' | 'upsert' | 'replace';
export type ValidationStatus = 'SUCCESS' | 'WARNING' | 'ERROR';
export type RawRecord = Record<string, string | number | boolean | null | undefined>;
export type ColumnMapping = Record<string, string>;
export type ValidationIssue = { rowNumber: number; fieldName: string; errorCode: string; errorMessage: string; severity: 'WARNING' | 'ERROR'; originalValue: string | null };
export type ParseResult = { headers: string[]; rows: RawRecord[] };

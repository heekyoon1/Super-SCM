import { importSchemas } from './schema';
import type { ImportType, RawRecord, ValidationIssue, ValidationStatus } from './types';

export type ValidationContext = { itemIds?: Set<string>; itemPolicyConfigured?: boolean };
const blank = (value: unknown) => value === null || value === undefined || String(value).trim() === '';
const validDate = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

export function validateRows(type: ImportType, rows: RawRecord[], context: ValidationContext = {}) {
  const fields = importSchemas[type];
  const issues: ValidationIssue[] = [];
  const seen = new Map<string, number>();
  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    for (const field of fields) {
      const value = row[field.key];
      if (field.required && blank(value)) issues.push({ rowNumber, fieldName: field.key, errorCode: 'REQUIRED_VALUE_MISSING', errorMessage: `${field.label} 값이 없습니다.`, severity: 'ERROR', originalValue: value == null ? null : String(value) });
      if (!blank(value) && field.kind === 'number' && !Number.isFinite(Number(value))) issues.push({ rowNumber, fieldName: field.key, errorCode: 'INVALID_NUMBER', errorMessage: `${field.label}은(는) 숫자여야 합니다.`, severity: 'ERROR', originalValue: String(value) });
      if (!blank(value) && field.kind === 'number' && Number(value) < 0) issues.push({ rowNumber, fieldName: field.key, errorCode: 'NEGATIVE_VALUE', errorMessage: `${field.label}은(는) 음수일 수 없습니다.`, severity: 'ERROR', originalValue: String(value) });
      if (!blank(value) && field.kind === 'date' && !validDate(value)) issues.push({ rowNumber, fieldName: field.key, errorCode: 'INVALID_DATE', errorMessage: `${field.label} 형식은 YYYY-MM-DD여야 합니다.`, severity: 'ERROR', originalValue: String(value) });
      if (!blank(value) && field.kind === 'boolean' && !['true', 'false', 'TRUE', 'FALSE', '1', '0', 'Y', 'N'].includes(String(value).trim())) issues.push({ rowNumber, fieldName: field.key, errorCode: 'INVALID_BOOLEAN', errorMessage: `${field.label}은(는) true/false 값이어야 합니다.`, severity: 'ERROR', originalValue: String(value) });
    }
    if (type === 'sales_order' && validDate(row.order_date) && validDate(row.requested_date) && String(row.requested_date) < String(row.order_date)) issues.push({ rowNumber, fieldName: 'requested_date', errorCode: 'DATE_LOGIC_ERROR', errorMessage: '요청일은 주문일보다 빠를 수 없습니다.', severity: 'ERROR', originalValue: String(row.requested_date) });
    const duplicateKey = type === 'sales_order' ? `${row.order_id}|${row.item_id}` : type === 'usage_history' ? `${row.item_id}|${row.usage_date}` : type === 'item_substitute' ? `${row.item_id}|${row.substitute_item_id}` : null;
    if (duplicateKey && !duplicateKey.includes('undefined') && !duplicateKey.includes('null')) { if (seen.has(duplicateKey)) issues.push({ rowNumber, fieldName: 'row', errorCode: 'DUPLICATE_ROW', errorMessage: `행 ${seen.get(duplicateKey)}번과 중복됩니다.`, severity: 'ERROR', originalValue: duplicateKey }); else seen.set(duplicateKey, rowNumber); }
    if (context.itemPolicyConfigured && context.itemIds && row.item_id && !context.itemIds.has(String(row.item_id))) issues.push({ rowNumber, fieldName: 'item_id', errorCode: 'UNKNOWN_ITEM', errorMessage: 'core.item_policy에 존재하지 않는 품목코드입니다.', severity: 'ERROR', originalValue: String(row.item_id) });
  });
  const byRow = new Map<number, ValidationIssue[]>();
  for (const issue of issues) byRow.set(issue.rowNumber, [...(byRow.get(issue.rowNumber) ?? []), issue]);
  const statuses = rows.map((_, index): ValidationStatus => { const rowIssues = byRow.get(index + 2) ?? []; return rowIssues.some((issue) => issue.severity === 'ERROR') ? 'ERROR' : rowIssues.length ? 'WARNING' : 'SUCCESS'; });
  return { issues, statuses, status: issues.some((issue) => issue.severity === 'ERROR') ? 'ERROR' : issues.length ? 'WARNING' : 'SUCCESS' };
}

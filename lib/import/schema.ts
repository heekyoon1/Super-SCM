import type { ImportType, ColumnMapping, RawRecord } from './types';

export type ImportField = { key: string; label: string; required?: boolean; kind: 'text' | 'number' | 'date' | 'boolean' };
export const importSchemas: Record<ImportType, ImportField[]> = {
  usage_history: [
    { key: 'item_id', label: '품목코드', required: true, kind: 'text' },
    { key: 'usage_date', label: '사용일', required: true, kind: 'date' },
    { key: 'quantity', label: '사용수량', required: true, kind: 'number' },
    { key: 'event_type', label: '이벤트 유형', kind: 'text' },
  ],
  business_event: [
    { key: 'event_type', label: '이벤트 유형', required: true, kind: 'text' },
    { key: 'event_date', label: '이벤트일', required: true, kind: 'date' },
    { key: 'item_id', label: '품목코드', kind: 'text' },
    { key: 'quantity', label: '수량', kind: 'number' },
  ],
  sales_order: [
    { key: 'order_id', label: '주문번호', required: true, kind: 'text' },
    { key: 'order_date', label: '주문일', required: true, kind: 'date' },
    { key: 'item_id', label: '품목코드', required: true, kind: 'text' },
    { key: 'quantity', label: '주문수량', required: true, kind: 'number' },
    { key: 'requested_date', label: '요청일', kind: 'date' },
    { key: 'customer_id', label: '고객코드', kind: 'text' },
    { key: 'status', label: '상태', kind: 'text' },
  ],
  item_substitute: [
    { key: 'item_id', label: '품목코드', required: true, kind: 'text' },
    { key: 'substitute_item_id', label: '대체품목코드', required: true, kind: 'text' },
    { key: 'priority', label: '우선순위', kind: 'number' },
    { key: 'active', label: '활성', kind: 'boolean' },
  ],
};

const aliases: Record<string, string[]> = {
  item_id: ['item_id', 'itemid', '품목코드', '품목', '제품코드', '상품코드'],
  usage_date: ['usage_date', 'use_date', 'date', '사용일', '출고일', '사용일자'],
  quantity: ['quantity', 'qty', '수량', '출고수량', '사용수량', '주문수량'],
  event_type: ['event_type', 'type', '이벤트유형', '이벤트 유형', '구분'],
  event_date: ['event_date', '이벤트일', '이벤트일자'],
  order_id: ['order_id', 'orderid', '주문번호', '판매주문번호'],
  order_date: ['order_date', '주문일', '주문일자'],
  requested_date: ['requested_date', '요청일', '요청일자'],
  customer_id: ['customer_id', 'customerid', '고객코드', '고객번호'],
  substitute_item_id: ['substitute_item_id', '대체품목코드', '대체품목', 'substitute'],
  priority: ['priority', '우선순위', '순위'],
  active: ['active', '활성', '사용여부'],
  status: ['status', '상태'],
};

const normalize = (value: string) => value.toLowerCase().replace(/[\s_\-]/g, '');
export function inferMapping(type: ImportType, headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  for (const field of importSchemas[type]) {
    const candidate = headers.find((header) => aliases[field.key]?.some((alias) => normalize(alias) === normalize(header)));
    if (candidate) mapping[field.key] = candidate;
  }
  return mapping;
}

export function applyMapping(row: RawRecord, mapping: ColumnMapping): RawRecord {
  return Object.fromEntries(Object.entries(mapping).map(([standardKey, sourceKey]) => [standardKey, row[sourceKey] ?? null]));
}

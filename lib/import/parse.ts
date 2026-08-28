import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { ParseResult, RawRecord } from './types';

export async function parseImportFile(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) {
    const text = await file.text();
    const parsed = Papa.parse<RawRecord>(text, { header: true, skipEmptyLines: true, dynamicTyping: false });
    if (parsed.errors.length) throw new Error(`CSV_PARSE_ERROR: ${parsed.errors[0].message}`);
    const rows = parsed.data;
    return { headers: parsed.meta.fields ?? Object.keys(rows[0] ?? {}), rows };
  }
  if (name.endsWith('.xlsx')) {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) throw new Error('EMPTY_WORKBOOK');
    const rows = XLSX.utils.sheet_to_json<RawRecord>(firstSheet, { defval: null, raw: false });
    return { headers: rows.length ? Object.keys(rows[0]) : [], rows };
  }
  throw new Error('UNSUPPORTED_FILE_TYPE');
}

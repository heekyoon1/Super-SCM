import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-auth';
import { parseImportFile } from '@/lib/import/parse';
import { applyMapping, inferMapping } from '@/lib/import/schema';
import { createUploadBatch, getItemIds } from '@/lib/import/repository';
import { validateRows } from '@/lib/import/validate';
import { IMPORT_TYPES, type ImportMode, type ImportType } from '@/lib/import/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { user } = await requireAdminApi();
    const form = await request.formData();
    const file = form.get('file');
    const importType = String(form.get('importType') ?? '') as ImportType;
    const importMode = String(form.get('importMode') ?? 'append') as ImportMode;
    if (!(file instanceof File) || !file.name) return NextResponse.json({ error: 'FILE_REQUIRED' }, { status: 400 });
    if (!IMPORT_TYPES.includes(importType)) return NextResponse.json({ error: 'UNSUPPORTED_IMPORT_TYPE' }, { status: 400 });
    if (!['append', 'upsert', 'replace'].includes(importMode)) return NextResponse.json({ error: 'UNSUPPORTED_IMPORT_MODE' }, { status: 400 });
    const parsed = await parseImportFile(file);
    const mapping = inferMapping(importType, parsed.headers);
    const mappedRows = parsed.rows.map((row) => applyMapping(row, mapping));
    const itemPolicy = await getItemIds();
    const result = validateRows(importType, mappedRows, { itemIds: itemPolicy.ids, itemPolicyConfigured: itemPolicy.configured });
    const batchId = await createUploadBatch({ fileName: file.name, importType, importMode, uploadedBy: user.id, totalRows: parsed.rows.length, mapping, originalRows: parsed.rows, mappedRows, statuses: result.statuses, issues: result.issues });
    return NextResponse.json({ batchId, headers: parsed.headers, mapping, preview: parsed.rows.slice(0, 20), statuses: result.statuses.slice(0, 20), status: result.status, issueCount: result.issues.length, errorCount: result.statuses.filter((s) => s === 'ERROR').length, warningCount: result.statuses.filter((s) => s === 'WARNING').length });
  } catch (error) { return apiErrorResponse(error, 'IMPORT_PARSE_FAILED'); }
}

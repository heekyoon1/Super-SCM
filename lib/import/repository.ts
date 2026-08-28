import type { ImportType, ImportMode, ColumnMapping, RawRecord, ValidationIssue, ValidationStatus } from './types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { applyMapping } from './schema';

export async function getItemIds() { const supabase = await createSupabaseServerClient(); const { data, error } = await supabase.schema('core').from('item_policy').select('item_id'); if (error) throw new Error(error.message); return { ids: new Set((data ?? []).map((row) => String(row.item_id))), configured: (data ?? []).length > 0 }; }
export async function createUploadBatch(input: { fileName: string; importType: ImportType; importMode: ImportMode; uploadedBy: string; totalRows: number; mapping: ColumnMapping; originalRows: RawRecord[]; mappedRows: RawRecord[]; statuses: ValidationStatus[]; issues: ValidationIssue[] }) {
  const supabase = await createSupabaseServerClient();
  const errorRows = input.statuses.filter((status) => status === 'ERROR').length;
  const warningRows = input.statuses.filter((status) => status === 'WARNING').length;
  const successRows = input.statuses.filter((status) => status === 'SUCCESS').length;
  const { data: batch, error } = await supabase.schema('core').from('upload_batch').insert({ file_name: input.fileName, import_type: input.importType, import_mode: input.importMode, total_rows: input.totalRows, success_rows: successRows, warning_rows: warningRows, error_rows: errorRows, uploaded_by: input.uploadedBy, status: errorRows ? 'VALIDATION_FAILED' : 'READY', mapping: input.mapping }).select('batch_id').single();
  if (error || !batch) throw new Error(error?.message ?? 'BATCH_CREATE_FAILED');
  const staging = input.originalRows.map((originalData, index) => ({ batch_id: batch.batch_id, row_number: index + 2, original_data: originalData, mapped_data: input.mappedRows[index], validation_status: input.statuses[index] }));
  for (let offset = 0; offset < staging.length; offset += 500) { const { error: stagingError } = await supabase.schema('core').from('import_staging').insert(staging.slice(offset, offset + 500)); if (stagingError) throw new Error(stagingError.message); }
  if (input.issues.length) { for (let offset = 0; offset < input.issues.length; offset += 500) { const { error: issueError } = await supabase.schema('core').from('validation_error').insert(input.issues.slice(offset, offset + 500).map((issue) => ({ batch_id: batch.batch_id, row_number: issue.rowNumber, field_name: issue.fieldName, error_code: issue.errorCode, error_message: issue.errorMessage, severity: issue.severity, original_value: issue.originalValue }))); if (issueError) throw new Error(issueError.message); } }
  await supabase.schema('core').from('column_mapping').upsert({ user_id: input.uploadedBy, import_type: input.importType, mapping_name: 'default', mapping: input.mapping, updated_at: new Date().toISOString() }, { onConflict: 'user_id,import_type,mapping_name' });
  return batch.batch_id as string;
}

export async function revalidateBatch(batchId: string, mapping: ColumnMapping) {
  const supabase = await createSupabaseServerClient();
  const { data: batch, error: batchError } = await supabase.schema('core').from('upload_batch').select('batch_id, import_type, uploaded_by').eq('batch_id', batchId).maybeSingle();
  if (batchError || !batch) throw new Error('IMPORT_BATCH_NOT_FOUND');
  const { data: staging, error: stagingError } = await supabase.schema('core').from('import_staging').select('staging_id,row_number,original_data').eq('batch_id', batchId).order('row_number');
  if (stagingError) throw new Error(stagingError.message);
  const { validateRows } = await import('./validate');
  const originalRows = (staging ?? []).map((row) => row.original_data as RawRecord);
  const mappedRows = originalRows.map((row) => applyMapping(row, mapping));
  const itemPolicy = await getItemIds();
  const result = validateRows(batch.import_type as ImportType, mappedRows, { itemIds: itemPolicy.ids, itemPolicyConfigured: itemPolicy.configured });
  await supabase.schema('core').from('validation_error').delete().eq('batch_id', batchId);
  for (let offset = 0; offset < (staging ?? []).length; offset += 500) { const updates = (staging ?? []).slice(offset, offset + 500).map((row, index) => ({ staging_id: row.staging_id, batch_id: batchId, row_number: row.row_number, original_data: row.original_data, mapped_data: mappedRows[offset + index], validation_status: result.statuses[offset + index] })); const { error } = await supabase.schema('core').from('import_staging').upsert(updates, { onConflict: 'staging_id' }); if (error) throw new Error(error.message); }
  if (result.issues.length) { const { error } = await supabase.schema('core').from('validation_error').insert(result.issues.map((issue) => ({ batch_id: batchId, row_number: issue.rowNumber, field_name: issue.fieldName, error_code: issue.errorCode, error_message: issue.errorMessage, severity: issue.severity, original_value: issue.originalValue }))); if (error) throw new Error(error.message); }
  const errorRows = result.statuses.filter((status) => status === 'ERROR').length;
  await supabase.schema('core').from('upload_batch').update({ mapping, success_rows: result.statuses.filter((status) => status === 'SUCCESS').length, warning_rows: result.statuses.filter((status) => status === 'WARNING').length, error_rows: errorRows, status: errorRows ? 'VALIDATION_FAILED' : 'READY' }).eq('batch_id', batchId);
  return result;
}

export async function commitBatch(batchId: string, confirmReplace: boolean) { const supabase = await createSupabaseServerClient(); const { data, error } = await supabase.schema('core').rpc('commit_import_batch', { p_batch_id: batchId, p_confirm_replace: confirmReplace }); if (error) throw new Error(error.message); return data; }
export async function rollbackBatch(batchId: string) { const supabase = await createSupabaseServerClient(); const { data, error } = await supabase.schema('core').rpc('rollback_import_batch', { p_batch_id: batchId }); if (error) throw new Error(error.message); return data; }

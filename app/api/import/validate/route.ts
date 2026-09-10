import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-auth';
import { revalidateBatch } from '@/lib/import/repository';
import type { ColumnMapping } from '@/lib/import/types';

export async function POST(request: Request) { try { await requireAdminApi(); const body = await request.json() as { batchId?: string; mapping?: ColumnMapping }; if (!body.batchId || !body.mapping) return NextResponse.json({ error: 'BATCH_AND_MAPPING_REQUIRED' }, { status: 400 }); const result = await revalidateBatch(body.batchId, body.mapping); return NextResponse.json({ status: result.status, issueCount: result.issues.length, errorCount: result.statuses.filter((s) => s === 'ERROR').length, warningCount: result.statuses.filter((s) => s === 'WARNING').length }); } catch (error) { return apiErrorResponse(error, 'VALIDATION_FAILED'); } }

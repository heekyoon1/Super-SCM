import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-auth';
import { rollbackBatch } from '@/lib/import/repository';

export async function POST(_: Request, { params }: { params: Promise<{ batchId: string }> }) { try { await requireAdminApi(); return NextResponse.json(await rollbackBatch((await params).batchId)); } catch (error) { return apiErrorResponse(error, 'ROLLBACK_FAILED'); } }

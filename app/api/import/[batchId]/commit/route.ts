import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-auth';
import { commitBatch } from '@/lib/import/repository';

export async function POST(request: Request, { params }: { params: Promise<{ batchId: string }> }) { try { await requireAdminApi(); const body = await request.json().catch(() => ({})) as { confirmReplace?: boolean }; return NextResponse.json(await commitBatch((await params).batchId, body.confirmReplace === true)); } catch (error) { return apiErrorResponse(error, 'IMPORT_FAILED'); } }

import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { commitBatch } from '@/lib/import/repository';

export async function POST(request: Request, { params }: { params: Promise<{ batchId: string }> }) { try { await requireUser(); const body = await request.json().catch(() => ({})) as { confirmReplace?: boolean }; return NextResponse.json(await commitBatch((await params).batchId, body.confirmReplace === true)); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'IMPORT_FAILED' }, { status: 400 }); } }

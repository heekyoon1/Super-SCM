import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { rollbackBatch } from '@/lib/import/repository';

export async function POST(_: Request, { params }: { params: Promise<{ batchId: string }> }) { try { await requireUser(); return NextResponse.json(await rollbackBatch((await params).batchId)); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'ROLLBACK_FAILED' }, { status: 400 }); } }

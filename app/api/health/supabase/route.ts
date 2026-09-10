import { NextResponse } from 'next/server';
import { hasPublicSupabaseConfig } from '@/lib/supabase/env';

export async function GET() {
  return NextResponse.json({
    ok: hasPublicSupabaseConfig(),
    configured: hasPublicSupabaseConfig(),
    checkedAt: new Date().toISOString(),
  }, { status: hasPublicSupabaseConfig() ? 200 : 503 });
}

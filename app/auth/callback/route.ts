import { NextResponse, type NextRequest } from 'next/server';
import { safeNextPath } from '@/lib/auth-policy';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(safeNextPath(request.nextUrl.searchParams.get('next')), request.url));
}

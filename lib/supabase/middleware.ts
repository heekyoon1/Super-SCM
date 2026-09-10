import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hasPublicSupabaseConfig, getPublicSupabaseConfig } from './env';

export async function updateSupabaseSession(request: NextRequest) {
  if (!hasPublicSupabaseConfig()) return NextResponse.next({ request });
  const { url, key } = getPublicSupabaseConfig();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isPublic = pathname === '/login' || pathname.startsWith('/_next') || pathname.includes('.');
  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = `?next=${encodeURIComponent(`${pathname}${request.nextUrl.search}`)}`;
    return NextResponse.redirect(loginUrl);
  }
  if (user && pathname.startsWith('/admin/')) {
    const { data: profile } = await supabase.schema('core').from('app_user').select('role, active').eq('user_id', user.id).maybeSingle();
    if (!profile || profile.role !== 'ADMIN' || !profile.active) return new NextResponse('Forbidden', { status: 403 });
  }
  return response;
}

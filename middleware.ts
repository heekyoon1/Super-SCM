import { updateSupabaseSession } from '@/lib/supabase/middleware';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) { return updateSupabaseSession(request); }

export const config = { matcher: ['/dashboard/:path*', '/lead-time/:path*', '/stockout-risk/:path*', '/demand/:path*', '/supply/:path*', '/analysis/:path*', '/recommendations/:path*', '/agent/:path*', '/workflow/:path*', '/admin/:path*'] };

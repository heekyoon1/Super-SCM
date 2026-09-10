import type { AppRole } from '@/lib/auth';

export function safeNextPath(value: string | null | undefined): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}

export type RouteAccessDecision = 'ALLOW' | 'LOGIN_REQUIRED' | 'FORBIDDEN';

export function routeAccessDecision({ pathname, authenticated, active, role }: { pathname: string; authenticated: boolean; active: boolean; role: AppRole | null }): RouteAccessDecision {
  if (!authenticated) return 'LOGIN_REQUIRED';
  if (!active || (pathname.startsWith('/admin/') && role !== 'ADMIN')) return 'FORBIDDEN';
  return 'ALLOW';
}

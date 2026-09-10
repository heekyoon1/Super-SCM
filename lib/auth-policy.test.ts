import test from 'node:test';
import assert from 'node:assert/strict';
import { routeAccessDecision, safeNextPath } from '@/lib/auth-policy';

test('next 경로는 내부 경로만 허용한다', () => {
  assert.equal(safeNextPath('/analysis/demand-profile'), '/analysis/demand-profile');
  assert.equal(safeNextPath('//attacker.example'), '/dashboard');
  assert.equal(safeNextPath('https://attacker.example'), '/dashboard');
});

test('보호 경로는 로그인과 ADMIN 권한을 구분한다', () => {
  assert.equal(routeAccessDecision({ pathname: '/dashboard', authenticated: false, active: false, role: null }), 'LOGIN_REQUIRED');
  assert.equal(routeAccessDecision({ pathname: '/admin/users', authenticated: true, active: true, role: 'USER' }), 'FORBIDDEN');
  assert.equal(routeAccessDecision({ pathname: '/admin/users', authenticated: true, active: true, role: 'ADMIN' }), 'ALLOW');
  assert.equal(routeAccessDecision({ pathname: '/dashboard', authenticated: true, active: false, role: 'USER' }), 'FORBIDDEN');
});

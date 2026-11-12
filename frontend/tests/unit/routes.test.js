import test from 'node:test';
import assert from 'node:assert/strict';
import { getDashboardRoute, getHomeRoute } from '../../src/utils/routes.js';

test('getDashboardRoute routes admin to admin dashboard', () => {
  assert.equal(getDashboardRoute({ role: 'admin' }), '/admin/dashboard');
});

test('getDashboardRoute routes bloodbank to blood bank dashboard', () => {
  assert.equal(getDashboardRoute({ role: 'bloodbank' }), '/blood-bank/dashboard');
  assert.equal(getDashboardRoute({ role: 'blood_bank' }), '/blood-bank/dashboard');
});

test('getDashboardRoute routes donor/seeker/default to /dashboard', () => {
  assert.equal(getDashboardRoute({ role: 'donor' }), '/dashboard');
  assert.equal(getDashboardRoute({ role: 'seeker' }), '/dashboard');
  assert.equal(getDashboardRoute(null), '/dashboard');
  assert.equal(getDashboardRoute({}), '/dashboard');
});

test('getHomeRoute mirrors dashboard route', () => {
  assert.equal(getHomeRoute({ role: 'admin' }), '/admin/dashboard');
});

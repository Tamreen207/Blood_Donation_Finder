import test from 'node:test';
import assert from 'node:assert/strict';
import { withServer } from './_helper.js';

test('POST /api/auth/login rejects invalid payload', withServer(async (_t, req) => {
  const res = await req('/api/auth/login', { method: 'POST', body: { email: 'bad', password: '' } });
  assert.ok(res.status >= 400);
  assert.equal(res.json.success, false);
}));

test('POST /api/auth/register rejects invalid payload', withServer(async (_t, req) => {
  const res = await req('/api/auth/register', { method: 'POST', body: { name: 'A', email: 'x', password: '1', role: 'nope' } });
  assert.ok(res.status >= 400);
  assert.equal(res.json.success, false);
}));

test('GET /api/auth/me without token returns 401', withServer(async (_t, req) => {
  const res = await req('/api/auth/me');
  assert.equal(res.status, 401);
}));

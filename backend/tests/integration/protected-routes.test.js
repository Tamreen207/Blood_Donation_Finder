import test from 'node:test';
import assert from 'node:assert/strict';
import { withServer } from './_helper.js';

for (const path of ['/api/requests', '/api/notifications', '/api/admin/dashboard', '/api/inventory', '/api/donations', '/api/matching/donors?bloodGroup=A%2B']) {
  test(`GET ${path} requires auth`, withServer(async (_t, req) => {
    const res = await req(path);
    assert.equal(res.status, 401);
  }));
}

test('GET /api/unknown returns 404 json', withServer(async (_t, req) => {
  const res = await req('/api/does-not-exist');
  assert.equal(res.status, 404);
  assert.equal(res.json.success, false);
}));

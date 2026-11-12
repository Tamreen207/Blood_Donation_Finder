import test from 'node:test';
import assert from 'node:assert/strict';
import { withServer } from './_helper.js';

test('GET /api/health returns 200', withServer(async (_t, req) => {
  const res = await req('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.json.success, true);
  assert.ok(res.json.timestamp);
}));

import test from 'node:test';
import assert from 'node:assert/strict';
import { requireRole } from '../../middleware/roleMiddleware.js';

function run(mw, req) {
  return new Promise((resolve) => {
    let statusCode = null, payload = null, nextCalled = false;
    const res = { status: (s) => { statusCode = s; return { json: (p) => { payload = p; } }; } };
    mw(req, res, () => { nextCalled = true; resolve({ nextCalled, statusCode, payload }); });
    // if responded
    setImmediate(() => resolve({ nextCalled, statusCode, payload }));
  });
}

test('requireRole rejects unauthenticated request', async () => {
  const r = await run(requireRole('admin'), {});
  assert.equal(r.statusCode, 401);
  assert.equal(r.payload.success, false);
});

test('requireRole rejects wrong role', async () => {
  const r = await run(requireRole('admin'), { user: { role: 'seeker' } });
  assert.equal(r.statusCode, 403);
});

test('requireRole allows matching role', async () => {
  const r = await run(requireRole('admin', 'bloodbank'), { user: { role: 'admin' } });
  assert.equal(r.nextCalled, true);
});

test('requireRole allows bloodbank role', async () => {
  const r = await run(requireRole('bloodbank'), { user: { role: 'bloodbank' } });
  assert.equal(r.nextCalled, true);
});

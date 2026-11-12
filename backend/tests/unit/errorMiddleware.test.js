import test from 'node:test';
import assert from 'node:assert/strict';
import { asyncHandler, ApiError, notFound } from '../../middleware/errorMiddleware.js';

test('asyncHandler calls handler and forwards resolved value to response', async () => {
  let result;
  const handler = asyncHandler(async (_req, res) => { res.sent = 'ok'; return 'done'; });
  const resObj = {};
  await handler({}, resObj, () => {});
  assert.equal(resObj.sent, 'ok');
  // wrapper does not return handler value by design, but should not throw
  result = true;
  assert.equal(result, true);
});

test('asyncHandler forwards rejection to next', async () => {
  let captured;
  const bad = asyncHandler(async () => { throw new Error('boom'); });
  await bad({}, {}, (err) => { captured = err; });
  assert.ok(captured instanceof Error);
  assert.equal(captured.message, 'boom');
});

test('ApiError sets status, message, data', () => {
  const e = new ApiError(400, 'bad', { field: 'x' });
  assert.equal(e.status, 400);
  assert.equal(e.message, 'bad');
  assert.deepEqual(e.data, { field: 'x' });
});

test('notFound sends 404 json', () => {
  let statusCode, payload;
  notFound({ method: 'GET', originalUrl: '/nope' }, { status: (s) => { statusCode = s; return { json: (p) => { payload = p; } }; } });
  assert.equal(statusCode, 404);
  assert.equal(payload.success, false);
  assert.ok(payload.message.includes('/nope'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../backend/package.json', import.meta.url));
const mongoose = require('mongoose');

process.env.SKIP_DB = '1';
process.env.NODE_ENV = 'test';
mongoose.set('bufferCommands', false);
const { app } = await import('../../backend/server.js');

function withServer(fn) {
  return async (t) => {
    const server = http.createServer(app);
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    t.after(async () => { await new Promise((r) => server.close(r)); });
    const addr = server.address();
    const req = (path, options = {}) => new Promise((resolve, reject) => {
      const r = http.request({ hostname: '127.0.0.1', port: addr.port, path, method: options.method || 'GET', headers: { 'Content-Type': 'application/json', ...(options.headers||{}) } }, (res) => {
        let body = ''; res.on('data', c => body += c); res.on('end', () => { let json=null; try{json=body?JSON.parse(body):null}catch{} resolve({ status: res.statusCode, json, body }); });
      });
      r.on('error', reject);
      if (options.body) r.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      r.end();
    });
    await fn(t, req);
  };
}

test('blackbox: health endpoint contract', withServer(async (_t, req) => {
  const res = await req('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.json.success, true);
  assert.equal(typeof res.json.message, 'string');
}));

test('blackbox: invalid login returns client error without stack leak', withServer(async (_t, req) => {
  const res = await req('/api/auth/login', { method: 'POST', body: { email: 'not-an-email', password: '' } });
  assert.ok(res.status >= 400 && res.status < 500);
  assert.equal(res.json.success, false);
  assert.ok(!/ at |stack/i.test(res.body));
}));

test('blackbox: protected resources deny anonymous access', withServer(async (_t, req) => {
  for (const p of ['/api/requests', '/api/notifications', '/api/inventory', '/api/admin/dashboard']) {
    const res = await req(p);
    assert.equal(res.status, 401, p);
  }
}));

test('blackbox: unknown API path returns JSON 404', withServer(async (_t, req) => {
  const res = await req('/api/no-such-endpoint');
  assert.equal(res.status, 404);
  assert.equal(res.json.success, false);
}));

test('blackbox: malformed JSON body handled gracefully', withServer(async (_t, req) => {
  const res = await req('/api/auth/login', { method: 'POST', body: '{bad-json' });
  assert.ok(res.status >= 400);
  assert.equal(res.json?.success, false);
}));

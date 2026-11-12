import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');

test('App.jsx defines core routes (integration/config)', () => {
  const src = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');
  for (const route of ['/login', '/register', '/dashboard', '/find-blood', '/find-donor', '/blood-banks', '/request-blood', '/emergency-request', '/request-tracking', '/admin/dashboard', '/blood-bank/dashboard']) {
    assert.ok(src.includes(route), `missing route ${route}`);
  }
});

test('requestService targets /api/requests contract', () => {
  const src = fs.readFileSync(path.join(root, 'src/services/requestService.js'), 'utf8');
  assert.ok(src.includes('/api/requests'));
  assert.ok(!src.includes('/api/blood-requests'));
});

test('vite config has chunk splitting and api proxy', () => {
  const src = fs.readFileSync(path.join(root, 'vite.config.js'), 'utf8');
  assert.ok(src.includes('manualChunks'));
  assert.ok(src.includes("'/api'"));
});

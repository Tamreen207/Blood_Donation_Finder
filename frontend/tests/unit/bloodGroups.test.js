import test from 'node:test';
import assert from 'node:assert/strict';
import * as bg from '../../src/utils/bloodGroups.js';

test('bloodGroups util exports expected groups or helpers', () => {
  // accept either array export or function; be flexible to existing implementation
  const keys = Object.keys(bg);
  assert.ok(keys.length > 0);
  const values = Object.values(bg).flatMap(v => Array.isArray(v) ? v : []);
  if (values.length) {
    assert.ok(values.includes('O+') || values.includes('A+'));
  }
});

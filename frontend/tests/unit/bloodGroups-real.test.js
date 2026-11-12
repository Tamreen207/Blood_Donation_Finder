import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOOD_GROUPS, isValidBloodGroup, normalizeBloodGroup } from '../../src/utils/bloodGroups.js';

test('BLOOD_GROUPS has 8 standard groups', () => {
  assert.ok(Array.isArray(BLOOD_GROUPS));
  assert.equal(BLOOD_GROUPS.length, 8);
  for (const g of ['A+','A-','B+','B-','AB+','AB-','O+','O-']) assert.ok(BLOOD_GROUPS.includes(g));
});

test('isValidBloodGroup validates correctly', () => {
  assert.equal(isValidBloodGroup('A+'), true);
  assert.equal(isValidBloodGroup('AB-'), true);
  assert.equal(isValidBloodGroup('X+'), false);
  assert.equal(isValidBloodGroup(null), false);
});

test('normalizeBloodGroup normalizes input', () => {
  assert.equal(normalizeBloodGroup('a+'), 'A+');
  assert.equal(normalizeBloodGroup(' ab- '), 'AB-');
  assert.equal(normalizeBloodGroup('xx'), '');
});

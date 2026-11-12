import test from 'node:test';
import assert from 'node:assert/strict';
import { getCompatibleDonorGroups } from '../../src/utils/bloodCompatibility.js';

test('frontend compatibility: A+ receives A+,A-,O+,O-', () => {
  assert.deepEqual(getCompatibleDonorGroups('A+'), ['A+', 'A-', 'O+', 'O-']);
});

test('frontend compatibility: O- receives only O-', () => {
  assert.deepEqual(getCompatibleDonorGroups('O-'), ['O-']);
});

test('frontend compatibility: AB+ receives all groups', () => {
  assert.equal(getCompatibleDonorGroups('AB+').length, 8);
});

test('frontend compatibility: unknown returns empty array', () => {
  assert.deepEqual(getCompatibleDonorGroups('X'), []);
});

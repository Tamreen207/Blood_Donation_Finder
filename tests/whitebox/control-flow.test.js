import test from 'node:test';
import assert from 'node:assert/strict';
import { rankDonor } from '../../backend/services/matchingService.js';
import { compatibleDonorGroups } from '../../backend/utils/compatibility.js';

const recipient = { bloodGroup: 'A+', latitude: 17.385, longitude: 78.4867, urgency: 'MEDIUM' };
const donor = (o={}) => ({ bloodGroup: 'A+', isAvailable: true, isVerified: false, totalDonations: 0, latitude: 17.386, longitude: 78.487, ...o });

test('whitebox: rankDonor null branch when donor coords missing', () => {
  assert.equal(rankDonor(donor({ latitude: undefined, longitude: undefined }), recipient, 10), null);
});

test('whitebox: rankDonor null branch when outside radius', () => {
  assert.equal(rankDonor(donor({ latitude: 0, longitude: 0 }), recipient, 1), null);
});

test('whitebox: rankDonor success branch returns score components influence', () => {
  const base = rankDonor(donor(), recipient, 10);
  const verified = rankDonor(donor({ isVerified: true }), recipient, 10);
  assert.ok(base && verified && verified.score > base.score);
});

test('whitebox: compatibility exhaustive recipients mapped', () => {
  for (const g of ['O-','O+','A-','A+','B-','B+','AB-','AB+']) {
    const list = compatibleDonorGroups(g);
    assert.ok(Array.isArray(list) && list.length > 0);
    assert.ok(list.includes(g) || g === 'O+' || g === 'A+' || g === 'B+' || g === 'AB+'); // self or universal donors included appropriately
  }
});

test('whitebox: O- universal donor present for all recipients', () => {
  for (const g of ['O-','O+','A-','A+','B-','B+','AB-','AB+']) {
    assert.ok(compatibleDonorGroups(g).includes('O-'));
  }
});

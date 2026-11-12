import test from 'node:test';
import assert from 'node:assert/strict';
import { rankDonor } from '../../services/matchingService.js';

const recipient = { bloodGroup: 'A+', latitude: 17.385, longitude: 78.4867, urgency: 'HIGH' };

function baseDonor(overrides = {}) {
	return {
		_id: 'd1',
		bloodGroup: 'O+',
		isAvailable: true,
		isVerified: true,
		totalDonations: 5,
		latitude: 17.386,
		longitude: 78.487,
		lastDonationDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
		...overrides,
	};
}

test('rankDonor returns score and distance for compatible nearby donor', () => {
	const result = rankDonor(baseDonor(), recipient, 10);
	assert.ok(result);
	assert.ok(typeof result.score === 'number');
	assert.ok(result.distance >= 0);
});

test('rankDonor returns null when out of radius', () => {
	const far = baseDonor({ latitude: 20.0, longitude: 80.0 });
	const result = rankDonor(far, recipient, 5);
	assert.equal(result, null);
});

test('rankDonor returns null when donor has no coordinates', () => {
	const result = rankDonor(baseDonor({ latitude: null, longitude: null }), recipient, 10);
	assert.equal(result, null);
});

test('rankDonor returns null when recipient has no coordinates', () => {
	const result = rankDonor(baseDonor(), { ...recipient, latitude: null, longitude: null }, 10);
	assert.equal(result, null);
});

test('closer donor scores higher than farther donor (all else equal)', () => {
	const near = rankDonor(baseDonor({ latitude: 17.3855, longitude: 78.487 }), recipient, 25);
	const far = rankDonor(baseDonor({ latitude: 17.45, longitude: 78.55 }), recipient, 25);
	assert.ok(near && far);
	assert.ok(near.score >= far.score);
});

test('CRITICAL urgency yields >= MEDIUM urgency score', () => {
	const crit = rankDonor(baseDonor(), { ...recipient, urgency: 'CRITICAL' }, 10);
	const med = rankDonor(baseDonor(), { ...recipient, urgency: 'MEDIUM' }, 10);
	assert.ok(crit.score >= med.score);
});

test('verified donor scores higher than unverified', () => {
	const v = rankDonor(baseDonor({ isVerified: true }), recipient, 10);
	const u = rankDonor(baseDonor({ isVerified: false }), recipient, 10);
	assert.ok(v.score > u.score);
});

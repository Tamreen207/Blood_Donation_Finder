import test from 'node:test';
import assert from 'node:assert/strict';
import { haversineKm, withinRadius } from '../../utils/distance.js';

test('same point distance is 0', () => {
	const d = haversineKm({ lat: 17.385, lng: 78.4867 }, { lat: 17.385, lng: 78.4867 });
	assert.ok(Math.abs(d) < 0.0001);
});

test('Hyderabad to Secunderabad approx distance small (<15km)', () => {
	const d = haversineKm({ lat: 17.385, lng: 78.4867 }, { lat: 17.4399, lng: 78.4983 });
	assert.ok(d > 3 && d < 15, `got ${d}`);
});

test('null/undefined inputs return null', () => {
	assert.equal(haversineKm(null, { lat: 1, lng: 2 }), null);
	assert.equal(haversineKm({ lat: 1, lng: 2 }, null), null);
});

test('supports latitude/longitude key names', () => {
	const d = haversineKm({ latitude: 17.385, longitude: 78.4867 }, { latitude: 17.385, longitude: 78.4867 });
	assert.ok(Math.abs(d) < 0.0001);
});

test('withinRadius true for close points', () => {
	assert.equal(withinRadius({ lat: 17.385, lng: 78.4867 }, { lat: 17.386, lng: 78.487 }, 5), true);
});

test('withinRadius false for far points', () => {
	assert.equal(withinRadius({ lat: 17.385, lng: 78.4867 }, { lat: 28.6139, lng: 77.209 }, 10), false);
});

test('withinRadius returns false on invalid input', () => {
	assert.equal(withinRadius(null, { lat: 1, lng: 2 }, 10), false);
});

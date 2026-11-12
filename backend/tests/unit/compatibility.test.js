import test from 'node:test';
import assert from 'node:assert/strict';
import { canDonateTo, compatibleDonorGroups, compatibleRecipientGroups, COMPATIBILITY } from '../../utils/compatibility.js';

test('COMPATIBILITY map contains all 8 blood groups', () => {
	const groups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
	groups.forEach((g) => assert.ok(Array.isArray(COMPATIBILITY[g]), `${g} missing`));
});

test('O- can donate to every group', () => {
	['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].forEach((r) => {
		assert.equal(canDonateTo('O-', r), true, `O- -> ${r}`);
	});
});

test('AB+ can receive from every group', () => {
	const donors = compatibleDonorGroups('AB+');
	assert.deepEqual(donors, ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']);
});

test('A+ cannot donate to B+', () => {
	assert.equal(canDonateTo('A+', 'B+'), false);
});

test('A+ can donate to A+ and AB+', () => {
	assert.equal(canDonateTo('A+', 'A+'), true);
	assert.equal(canDonateTo('A+', 'AB+'), true);
});

test('AB- receives only O-,A-,B-,AB-', () => {
	assert.deepEqual(compatibleDonorGroups('AB-'), ['O-', 'A-', 'B-', 'AB-']);
});

test('invalid groups return false/empty safely', () => {
	assert.equal(canDonateTo(null, 'A+'), false);
	assert.equal(canDonateTo('A+', null), false);
	assert.deepEqual(compatibleDonorGroups('X+'), []);
});

test('compatibleRecipientGroups for O- includes all groups', () => {
	const recipients = compatibleRecipientGroups('O-');
	assert.equal(recipients.length, 8);
});

test('compatibleRecipientGroups for AB+ includes only AB+', () => {
	assert.deepEqual(compatibleRecipientGroups('AB+'), ['AB+']);
});

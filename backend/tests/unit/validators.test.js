import test from 'node:test';
import assert from 'node:assert/strict';
import { isEmail, validateLogin, validateRegister } from '../../utils/validators.js';

test('isEmail accepts valid email', () => {
	assert.equal(isEmail('user@example.com'), true);
	assert.equal(isEmail('a.b+c@domain.co.in'), true);
});

test('isEmail rejects invalid email', () => {
	assert.equal(isEmail('bad'), false);
	assert.equal(isEmail('a@b'), false);
	assert.equal(isEmail(''), false);
	assert.equal(isEmail(null), false);
});

test('validateLogin requires valid email and password', () => {
	const errs = validateLogin({ email: 'bad', password: '' });
	assert.ok(errs.length >= 2);
});

test('validateLogin passes for valid input', () => {
	const errs = validateLogin({ email: 'user@example.com', password: 'secret' });
	assert.equal(errs.length, 0);
});

test('validateRegister catches missing/invalid fields', () => {
	const errs = validateRegister({ name: 'A', email: 'x', password: '123', role: 'alien' });
	assert.ok(errs.some((e) => e.includes('name')));
	assert.ok(errs.some((e) => e.includes('email')));
	assert.ok(errs.some((e) => e.includes('password')));
	assert.ok(errs.some((e) => e.includes('role')));
});

test('validateRegister passes for valid seeker', () => {
	const errs = validateRegister({ name: 'Alice', email: 'alice@example.com', password: 'secret1', role: 'seeker' });
	assert.equal(errs.length, 0);
});

test('validateRegister passes for donor', () => {
	const errs = validateRegister({ name: 'Bob Donor', email: 'bob@example.com', password: 'secret1', role: 'donor' });
	assert.equal(errs.length, 0);
});

test('validateRegister rejects bad phone', () => {
	const errs = validateRegister({ name: 'Alice', email: 'a@b.com', password: 'secret1', role: 'seeker', phone: 'abc' });
	assert.ok(errs.some((e) => e.includes('phone')));
});

test('validateRegister accepts valid phone', () => {
	const errs = validateRegister({ name: 'Alice', email: 'a@b.com', password: 'secret1', role: 'seeker', phone: '+91 9876543210' });
	assert.equal(errs.length, 0);
});

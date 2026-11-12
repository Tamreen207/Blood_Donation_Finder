import test from 'node:test';
import assert from 'node:assert/strict';
import { signToken, verifyToken } from '../../utils/jwt.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

test('signToken returns a string token', () => {
	const token = signToken({ id: '123', role: 'seeker' });
	assert.equal(typeof token, 'string');
	assert.ok(token.split('.').length === 3);
});

test('verifyToken decodes signed payload', () => {
	const token = signToken({ id: 'abc', role: 'donor' });
	const decoded = verifyToken(token);
	assert.equal(decoded.id, 'abc');
	assert.equal(decoded.role, 'donor');
});

test('verifyToken throws on invalid token', () => {
	assert.throws(() => verifyToken('not.a.token'));
});

test('verifyToken throws on tampered token', () => {
	const token = signToken({ id: 'abc', role: 'donor' });
	const tampered = token.slice(0, -2) + 'xx';
	assert.throws(() => verifyToken(tampered));
});

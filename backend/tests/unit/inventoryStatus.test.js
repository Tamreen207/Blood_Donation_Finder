import test from 'node:test';
import assert from 'node:assert/strict';
import { Inventory } from '../../models/Inventory.js';

function make(units, low = 5, critical = 2) {
	return new Inventory({ bloodGroup: 'A+', unitsAvailable: units, lowStockThreshold: low, criticalStockThreshold: critical, bloodBankId: '507f1f77bcf86cd799439011' });
}

test('inventory status OUT_OF_STOCK at 0', () => {
	assert.equal(make(0).status, 'OUT_OF_STOCK');
});

test('inventory status CRITICAL at or below critical threshold', () => {
	assert.equal(make(1).status, 'CRITICAL');
	assert.equal(make(2).status, 'CRITICAL');
});

test('inventory status LOW above critical and at/below low', () => {
	assert.equal(make(3).status, 'LOW');
	assert.equal(make(5).status, 'LOW');
});

test('inventory status AVAILABLE above low', () => {
	assert.equal(make(6).status, 'AVAILABLE');
	assert.equal(make(20).status, 'AVAILABLE');
});

test('toJSON includes virtual status', () => {
	const obj = make(10).toJSON();
	assert.equal(obj.status, 'AVAILABLE');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const exists = (p) => fs.existsSync(path.join(root, p));

test('system: root has single-command package and README', () => {
  assert.ok(exists('package.json'));
  assert.ok(exists('README.md'));
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(typeof pkg.scripts.start, 'string');
  assert.ok(pkg.scripts.start.includes('frontend'));
});

test('system: backend and frontend entrypoints exist', () => {
  assert.ok(exists('backend/server.js'));
  assert.ok(exists('backend/package.json'));
  assert.ok(exists('frontend/package.json'));
  assert.ok(exists('frontend/src/App.jsx'));
  assert.ok(exists('frontend/index.html'));
});

test('system: critical backend modules exist', () => {
  for (const p of ['backend/routes/authRoutes.js','backend/routes/requestRoutes.js','backend/routes/bloodBankRoutes.js','backend/controllers/requestController.js','backend/models/User.js','backend/models/BloodRequest.js','backend/services/matchingService.js']) {
    assert.ok(exists(p), `missing ${p}`);
  }
});

test('system: critical frontend pages exist', () => {
  for (const p of ['frontend/src/pages/LoginPage.jsx','frontend/src/pages/RegisterPage.jsx','frontend/src/pages/FindBloodPage.jsx','frontend/src/pages/EmergencyRequestPage.jsx','frontend/src/pages/BloodBanksPage.jsx','frontend/src/pages/DashboardPage.jsx']) {
    assert.ok(exists(p), `missing ${p}`);
  }
});

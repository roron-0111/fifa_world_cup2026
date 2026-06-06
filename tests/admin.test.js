const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_ADMIN_TOKEN,
  verifyAdminToken,
  makeDataRefreshStatus,
  applyDataRefreshSuccess,
} = require('../lib/admin');

test('default admin token is WC2026', () => {
  assert.equal(DEFAULT_ADMIN_TOKEN, 'WC2026');
  assert.deepEqual(verifyAdminToken('WC2026'), { ok: true });
});

test('verifyAdminToken rejects missing server token', () => {
  assert.deepEqual(verifyAdminToken('abc', ''), {
    ok: false,
    status: 503,
    error: '管理者トークンがサーバーに設定されていません',
  });
});

test('verifyAdminToken rejects incorrect token', () => {
  assert.deepEqual(verifyAdminToken('wrong', 'secret'), {
    ok: false,
    status: 403,
    error: '管理者トークンが違います',
  });
});

test('applyDataRefreshSuccess records latest refresh metadata without cooldown', () => {
  const state = {};
  const now = '2026-06-06T12:00:00.000Z';

  applyDataRefreshSuccess(state, {
    now,
    source: 'world-football-archive',
    generatedAt: '2026-06-06T11:59:00.000Z',
  });

  assert.deepEqual(makeDataRefreshStatus(state), {
    lastUpdatedAt: now,
    source: 'world-football-archive',
    generatedAt: '2026-06-06T11:59:00.000Z',
    status: 'success',
    error: '',
  });
});

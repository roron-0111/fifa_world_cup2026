function verifyAdminToken(inputToken, serverToken) {
  const expected = String(serverToken || '').trim();
  if (!expected) {
    return {
      ok: false,
      status: 503,
      error: '管理者トークンがサーバーに設定されていません',
    };
  }
  if (String(inputToken || '') !== expected) {
    return {
      ok: false,
      status: 403,
      error: '管理者トークンが違います',
    };
  }
  return { ok: true };
}

function makeDataRefreshStatus(state) {
  const meta = state?.meta?.dataRefresh || {};
  return {
    lastUpdatedAt: meta.lastUpdatedAt || '',
    source: meta.source || '',
    generatedAt: meta.generatedAt || '',
    status: meta.status || 'unknown',
    error: meta.error || '',
  };
}

function applyDataRefreshSuccess(state, { now = new Date().toISOString(), source, generatedAt } = {}) {
  state.meta ||= {};
  state.meta.dataRefresh = {
    lastUpdatedAt: now,
    source: source || '',
    generatedAt: generatedAt || '',
    status: 'success',
    error: '',
  };
  return state.meta.dataRefresh;
}

function applyDataRefreshFailure(state, { now = new Date().toISOString(), source, error } = {}) {
  state.meta ||= {};
  state.meta.dataRefresh = {
    ...(state.meta.dataRefresh || {}),
    lastAttemptAt: now,
    source: source || state.meta.dataRefresh?.source || '',
    status: 'error',
    error: String(error || '更新に失敗しました'),
  };
  return state.meta.dataRefresh;
}

module.exports = {
  verifyAdminToken,
  makeDataRefreshStatus,
  applyDataRefreshSuccess,
  applyDataRefreshFailure,
};

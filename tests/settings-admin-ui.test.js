const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'project', 'World Cup 2026.html'), 'utf8');

test('settings removes result-confirmation explanation section', () => {
  assert.doesNotMatch(html, /<h3>🏁 結果確定<\/h3>/);
  assert.doesNotMatch(html, /確定トリガー/);
});

test('admin token input has no placeholder and supports result updates', () => {
  assert.doesNotMatch(html, /placeholder="WC26_ADMIN_TOKEN"/);
  assert.match(html, /applyAdminResults/);
  assert.match(html, /\/api\/admin\/update-results/);
  assert.match(html, /勝敗情報を更新/);
});

test('knockout stadium labels can wrap to two lines', () => {
  assert.match(html, /\.ko-match-meta em\{[\s\S]*-webkit-line-clamp:2/);
  assert.doesNotMatch(html, /\.ko-match-meta em\{[^}]*white-space:nowrap/);
});

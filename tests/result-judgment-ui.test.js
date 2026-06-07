const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'project', 'World Cup 2026.html'), 'utf8');

test('group match cards expose compact judgment badges', () => {
  assert.match(html, /function getGroupJudgment/);
  assert.match(html, /className=\{`match-status-badge \$\{groupJudgment\.state\}`\}/);
  assert.match(html, /判定待ち/);
  assert.match(html, /的中/);
  assert.match(html, /不一致/);
});

test('knockout nodes reserve the right side for a compact judgment badge', () => {
  assert.match(html, /function getKoJudgment/);
  assert.match(html, /className="ko-match-stadium"/);
  assert.match(html, /className=\{`ko-match-status \$\{koJudgment\.state\}`\}/);
  assert.match(html, /ko-match-meta/);
  assert.match(html, /ko-match-time/);
});

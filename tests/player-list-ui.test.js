const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'project', 'World Cup 2026.html'), 'utf8');

test('country player modal provides position filters', () => {
  assert.match(html, /player-filter-bar/);
  assert.match(html, /\['ALL','FW','MF','DF','GK'\]\.map/);
  assert.match(html, /setPositionFilter/);
});

test('country player modal uses colored position badges', () => {
  assert.match(html, /positionClass\(p\.position\)/);
  assert.match(html, /\.pos-badge\.gk/);
  assert.match(html, /\.pos-badge\.df/);
  assert.match(html, /\.pos-badge\.mf/);
  assert.match(html, /\.pos-badge\.fw/);
});

test('country player rows use compact metadata layout without club-goal noise', () => {
  assert.match(html, /function playerInfoParts\(player\)/);
  assert.doesNotMatch(html, /25-26 \$\{clubGoalsText/);
  assert.doesNotMatch(html, /W杯 \$\{player\?\.worldCupGoals/);
  assert.match(html, /player-detail-grid/);
  assert.match(html, /<span className=\{`pos-badge \$\{positionClass\(p\.position\)\}`\}/);
  assert.match(html, /playerPhysicalMeta\(p\)&&<span className="player-meta-line">/);
  assert.match(html, /player-club-line/);
  assert.match(html, /\.player-row\{[\s\S]*?padding:8px 10px/);
  assert.match(html, /\.player-list\{[\s\S]*?gap:6px/);
});

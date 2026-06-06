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
  assert.doesNotMatch(html, /placeholder='\{"A-1"/);
  assert.doesNotMatch(html, /<textarea value=\{adminResultsJson\}/);
  assert.match(html, /<input value=\{adminResultsJson\}/);
  assert.match(html, /applyAdminResults/);
  assert.match(html, /\/api\/admin\/update-results/);
  assert.match(html, /勝敗情報を更新/);
  assert.doesNotMatch(html, /World Football Archiveを取得し/);
  assert.doesNotMatch(html, />管理者トークン</);
  assert.doesNotMatch(html, /試合IDごとの実スコアをJSONで投入します/);
  assert.doesNotMatch(html, />勝敗情報JSON</);
  assert.ok(html.indexOf('🎯 {l.pointSettings}') < html.indexOf('🔐 管理者更新'));
});

test('knockout stadium labels can wrap to two lines', () => {
  assert.match(html, /\.ko-match-meta em\{[\s\S]*-webkit-line-clamp:2/);
  assert.doesNotMatch(html, /\.ko-match-meta em\{[^}]*white-space:nowrap/);
});

test('knockout date and time are never squeezed into stadium label', () => {
  assert.match(html, /className="ko-match-time"/);
  assert.match(html, /\.ko-match-time\{[^}]*flex:0 0 78px/);
  assert.doesNotMatch(html, /\.ko-match-time\{[^}]*text-overflow:ellipsis/);
});

test('leaderboard player info uses the shared player detail source', () => {
  assert.match(html, /function playerInfoParts\(player\)/);
  assert.match(html, /\.filter\(\(p\)=>Number\(p\.worldCupGoals\|\|0\)>0\)/);
  assert.match(html, /得点者はいません/);
  assert.match(html, /\{i\+1\}位/);
  assert.match(html, /className=\{`rank-pos \$\{positionClass\(p\.position\)\}`\}/);
  assert.doesNotMatch(html, /25-26 \$\{clubGoalsText\(player\)\}/);
});

test('home hides internal member codes and shows readable timestamp formats', () => {
  assert.match(html, /function displayUserLabel\(user,roomOrMembers\)\{[\s\S]*return user\.username \|\| '--';/);
  assert.match(html, /\$\{parts\.month\}\/\$\{parts\.day\}\(\$\{parts\.weekday\}\) \$\{parts\.hour\}:\$\{parts\.minute\}/);
  assert.match(html, /\.info-card \.ival\{font-family:'Inter'/);
});

test('home result update history is visible and compact', () => {
  assert.doesNotMatch(html, /FIFA公式スカッド を基準に表示しています/);
  assert.doesNotMatch(html, /時刻は選択中の表示タイムゾーン基準です/);
  assert.match(html, /RESULT_STATUS=BOOTSTRAP\?\.resultStatus/);
  assert.match(html, /resultUpdateItems=\(RESULT_STATUS\.history\|\|\[\]\)\.slice\(0,5\)/);
  assert.match(html, /時点の結果を反映/);
  assert.match(html, /\.result-update-list\{[^}]*max-height:154px;overflow-y:auto/);
});

test('ambiguous placeholder teams do not render multiple flag images', () => {
  assert.match(html, /parts\.some\(\(part\)=>!TEAM_JA\[part\]/);
  assert.match(html, /return <span className=\{\('flag-fallback ' \+ className\)\.trim\(\)\}/);
});

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
  assert.match(html, /\.info-card \.ival\{[^}]*font-size:16px/);
  assert.doesNotMatch(html, /fontSize:24}>更新済み/);
});

test('home result update history is visible and compact', () => {
  assert.doesNotMatch(html, /FIFA公式スカッド を基準に表示しています/);
  assert.doesNotMatch(html, /時刻は選択中の表示タイムゾーン基準です/);
  assert.doesNotMatch(html, />情報更新ステータス</);
  assert.match(html, /RESULT_STATUS=BOOTSTRAP\?\.resultStatus/);
  assert.match(html, /resultUpdateItems=\(RESULT_STATUS\.history\|\|\[\]\)\.slice\(0,5\)/);
  assert.match(html, /<span>結果反映履歴<\/span>/);
  assert.match(html, /className="result-update-stamp">: \{latestDataStamp\} 更新済み<\/span>/);
  assert.match(html, /home-status-card/);
  assert.match(html, /\.result-update-list\{[^}]*max-height:154px;overflow-y:auto/);
});

test('ambiguous placeholder teams do not render multiple flag images', () => {
  assert.match(html, /parts\.some\(\(part\)=>!TEAM_JA\[part\]/);
  assert.match(html, /return <span className=\{\('flag-fallback ' \+ className\)\.trim\(\)\}/);
});

test('settings save button stays horizontal on narrow screens', () => {
  assert.match(html, /\.settings-save-btn\{[^}]*min-width:72px/);
  assert.match(html, /\.settings-save-btn\{[^}]*white-space:nowrap/);
  assert.match(html, /className="btn settings-save-btn"/);
});

test('home point breakdown uses consistent count and point columns', () => {
  assert.match(html, /\.home-compare-row\{[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(66px,\.7fr\) minmax\(66px,\.7fr\)/);
  assert.match(html, /groupCompareRows=\[/);
  assert.match(html, /koCompareRows=\[/);
  assert.match(html, /<div className="home-compare-row home-compare-head"><span>項目<\/span><b>自分<\/b><b>相手<\/b><\/div>/);
  assert.match(html, /<span>\{row\.label\}<\/span><b className="me">\{row\.me\}<\/b><b className="opp">\{opp\?row\.opp:'-'\}<\/b>/);
});

test('home hero score cards use aligned metrics and centered VS', () => {
  assert.match(html, /\.vs-txt\{[^}]*align-self:center/);
  assert.match(html, /\.room-score-sub\{[^}]*grid-template-columns:minmax\(0,1fr\) 36px 44px/);
  assert.match(html, /<span>勝敗的中<\/span><b>\{mySummary\.resultHits\}件<\/b><b className="hero-points">\+\{mySummary\.resultPoints\}pt<\/b>/);
  assert.match(html, /<span>決勝T<\/span><b>合計<\/b><b className="hero-points">\+\{myKoSummary\.total\}pt<\/b>/);
});

test('auth page offers recent room recovery', () => {
  assert.match(html, /recentProfiles=Object\.values\(authProfiles\)/);
  assert.match(html, /過去に参加したルーム情報/);
  assert.doesNotMatch(html, /ルームコードを忘れた場合/);
  assert.match(html, /ユーザー名：\{profile\.username\}/);
  assert.match(html, /ルームコード：\{profile\.roomCode\}/);
  assert.match(html, /\.auth-recent-list\{[^}]*max-height:116px;overflow-y:auto/);
  assert.match(html, /function useRecentProfile\(profile\)/);
});

test('pending prediction summary includes opponent state', () => {
  assert.match(html, /const oppPredCount=oppId\?Object\.keys\(preds\[oppId\]\|\|\{\}\)\.length:0/);
  assert.match(html, /const oppGroupMiss=oppId\?GROUP_MATCHES\.length-oppPredCount:0/);
  assert.match(html, /<span>相手<b>\{oppGroupMiss\}<\/b><\/span>/);
  assert.match(html, /<div className="sc gold split-only">/);
  assert.doesNotMatch(html, /<div className="n">\{myGroupMiss\}<\/div>/);
  assert.match(html, /\.sc \.split\{[^}]*font-size:12px/);
});

test('top stat labels sit above their numbers', () => {
  assert.match(html, /<div className="sc acc"><div className="l top">\{l\.predicted\}<\/div><div className="n">\{myPredCount\}<\/div><\/div>/);
  assert.match(html, /<div className="sc grn"><div className="l top">\{l\.confirmed\}<\/div><div className="n">\{resultCount\}<\/div><\/div>/);
  assert.match(html, /\.sc \.l\.top\{[^}]*margin:0 0 4px/);
});

test('knockout score row uses score hit wording', () => {
  assert.match(html, /\{label:'スコア的中',me:koScorePts\(myKoSummary\),opp:koScorePts\(oppKoSummary\)\}/);
  assert.doesNotMatch(html, /スコア \/ PK/);
});

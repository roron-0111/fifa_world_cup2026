const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'project', 'World Cup 2026.html'), 'utf8');

test('settings removes result-confirmation explanation section', () => {
  assert.doesNotMatch(html, /<h3>🏁 結果確定<\/h3>/);
  assert.doesNotMatch(html, /確定トリガー/);
});

test('admin token input stays with player refresh and result reflection moved home', () => {
  assert.match(html, /sessionStorage\.getItem\('wc26AdminToken'\)\|\|DEFAULT_ADMIN_TOKEN/);
  assert.doesNotMatch(html, /placeholder="WC26_ADMIN_TOKEN"/);
  assert.doesNotMatch(html, /placeholder='\{"A-1"/);
  assert.doesNotMatch(html, /<div className="sl">勝敗情報更新<\/div>/);
  assert.doesNotMatch(html, /試合IDごとの実スコアをJSONで投入します/);
  assert.doesNotMatch(html, /World Football Archiveを取得し/);
  assert.doesNotMatch(html, />管理者トークン</);
  assert.ok(html.indexOf('🎯 {l.pointSettings}') < html.indexOf('🔐 管理者更新'));
});

test('home exposes the batch result reflection card', () => {
  assert.match(html, /className="result-judge-card"/);
  assert.match(html, /結果反映/);
  assert.match(html, /試合結果一覧/);
  assert.match(html, /applyAdminResults/);
  assert.doesNotMatch(html, /result-judge-input/);
  assert.doesNotMatch(html, /選手: \{latestDataStamp\} 更新済み/);
  assert.doesNotMatch(html, /result-judge-stamp-sub/);
});

test('knockout stadium labels can wrap to two lines', () => {
  assert.match(html, /\.ko-match-meta\{[^}]*grid-template-columns:minmax\(0,1fr\) auto/);
  assert.match(html, /\.ko-match-stadium\{[\s\S]*-webkit-line-clamp:2/);
  assert.doesNotMatch(html, /\.ko-match-stadium\{[^}]*white-space:nowrap/);
});

test('knockout date and time are never squeezed into stadium label', () => {
  assert.match(html, /className="ko-match-time"/);
  assert.match(html, /\.ko-match-time\{[^}]*display:flex/);
  assert.match(html, /\.ko-match-time\{[^}]*flex-wrap:wrap/);
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
  assert.match(html, /\$\{parts\.month\}\/\$\{parts\.day\}（\$\{parts\.weekday\}） \$\{parts\.hour\}:\$\{parts\.minute\}/);
  assert.match(html, /\.info-card \.ival\{font-family:'Inter'/);
  assert.match(html, /\.info-card \.ival\{[^}]*font-size:16px/);
  assert.doesNotMatch(html, /fontSize:24}>更新済み/);
});

test('home result judge area is reordered and scrollable', () => {
  assert.doesNotMatch(html, /FIFA公式スカッド を基準に表示しています/);
  assert.doesNotMatch(html, /時刻は選択中の表示タイムゾーン基準です/);
  assert.doesNotMatch(html, />情報更新ステータス</);
  assert.match(html, /RESULT_STATUS=BOOTSTRAP\?\.resultStatus/);
  assert.match(html, /const homeResultItems=Object\.entries\(results\)/);
  assert.match(html, /normalizeKoRecord\(koPreds\[user\.id\]\?\.\[matchId\]\)/);
  assert.doesNotMatch(html, /<span>結果反映履歴<\/span>/);
  assert.match(html, /Webから試合結果を取得し、ポイントと判定バッジを再計算します/);
  assert.match(html, /Web取得した試合結果は既に反映済みです/);
  assert.match(html, /\/api\/admin\/refresh-results/);
  assert.match(html, /className="home-breakdown"[\s\S]*<div className="home-status-card">[\s\S]*<div className="result-judge-card">/);
  assert.match(html, /className="result-judge-list"/);
  assert.match(html, /className="result-match-item"/);
  assert.match(html, /\.result-judge-btn\{[^}]*align-self:center/);
  assert.match(html, /\.result-judge-list\{[^}]*overflow-y:auto/);
  assert.doesNotMatch(html, /result-judge-input/);
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
  assert.match(html, /\.home-compare-row\{[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(82px,1fr\) minmax\(82px,1fr\)/);
  assert.match(html, /groupCompareRows=\[/);
  assert.match(html, /koCompareRows=\[/);
  assert.match(html, /<div className="home-compare-row home-compare-head"><span>項目<\/span><b>自分<\/b><b>相手<\/b><\/div>/);
  assert.match(html, /<span>\{row\.label\}<\/span><b className="me">\{row\.me\}<\/b><b className="opp">\{opp\?row\.opp:'-'\}<\/b>/);
  assert.match(html, /\.home-compare-row > b\{[^}]*justify-self:center/);
});

test('home hero score cards use aligned metrics and centered VS', () => {
  assert.match(html, /\.vs-txt\{[^}]*align-self:center/);
  assert.match(html, /\.hpc-total\{[^}]*align-items:baseline/);
  assert.match(html, /\.hpc-total \.unit\{[^}]*font-size:12px/);
  assert.match(html, /<div className="hpc-total"><span className="num">\{myTotal\}<\/span><span className="unit">pt<\/span><\/div>/);
  assert.match(html, /<div className="hpc-total"><span className="num">\{oppTotal\}<\/span><span className="unit">pt<\/span><\/div>/);
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

test('static hosting uses shared Firestore rooms instead of per-device local rooms', () => {
  assert.match(html, /const STATIC_SHARED_ROOM_BACKEND=!HAS_BACKEND&&!!FIREBASE_PROJECT_ID;/);
  assert.match(html, /async function fetchSharedRoomPayload\(roomCode\)/);
  assert.match(html, /async function saveSharedRoomPayload\(payload\)/);
  assert.match(html, /function applySharedRoomPayload\(payload\)/);
  assert.match(html, /if\(STATIC_SHARED_ROOM_BACKEND\)\{[\s\S]*?const shared=normalizeSharedRoomPayload\(await fetchSharedRoomPayload\(code\),code\);/);
  assert.match(html, /syncStaticSharedRoomState\(roomId,\(state\)=>\{state\[key\]=v;\}\)/);
  assert.match(html, /syncStaticSharedRoomState\(roomId,\(state\)=>\{[\s\S]*?state\.predictionsV2\[userId\]\[matchId\]=prediction;/);
  assert.match(html, /if\(STATIC_SHARED_ROOM_BACKEND&&!HAS_BACKEND\)\{[\s\S]*?const shared=await fetchSharedRoomPayload\(code\);/);
  assert.match(html, /const timer=setInterval\(sync,10000\);/);
  assert.doesNotMatch(html, /setInterval\(sync,4000\)/);
});

test('pending prediction summary includes opponent state', () => {
  assert.match(html, /const oppPredCount=oppId\?Object\.keys\(preds\[oppId\]\|\|\{\}\)\.length:0/);
  assert.match(html, /const oppGroupMiss=oppId\?GROUP_MATCHES\.length-oppPredCount:0/);
  assert.match(html, /<div className="stats-frame">/);
  assert.match(html, /<div className="stats-table">/);
  assert.match(html, /<div className="stats-row"><span>\{l\.predicted\}<\/span><b className="me">\{myPredCount\}件<\/b><b className="opp">\{opp\?oppPredCount:'-'\}件<\/b><\/div>/);
  assert.match(html, /<div className="stats-row"><span>\{l\.unpredicted\}<\/span><b className="me">\{myGroupMiss\}件<\/b><b className="opp">\{opp\?oppGroupMiss:'-'\}件<\/b><\/div>/);
  assert.match(html, /<div className="stats-row total"><span>\{l\.confirmed\}<\/span><b className="me">\{resultCount\}件<\/b><b className="opp">\{opp\?Object\.keys\(results\)\.length:'-'\}件<\/b><\/div>/);
});

test('knockout score row uses score hit wording', () => {
  assert.match(html, /\{label:'スコア的中',me:koScorePts\(myKoSummary\),opp:koScorePts\(oppKoSummary\)\}/);
  assert.doesNotMatch(html, /スコア \/ PK/);
});

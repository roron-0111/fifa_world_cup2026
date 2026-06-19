const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'project', 'World Cup 2026.html'), 'utf8');

test('settings removes result-confirmation explanation section', () => {
  assert.doesNotMatch(html, /<h3>🏁 結果確定<\/h3>/);
  assert.doesNotMatch(html, /確定トリガー/);
});

test('settings removes standalone player refresh controls', () => {
  assert.match(html, /const homeAdminToken=String\(sessionStorage\.getItem\('wc26AdminToken'\)\|\|DEFAULT_ADMIN_TOKEN\)\.trim\(\);/);
  assert.doesNotMatch(html, /placeholder="WC26_ADMIN_TOKEN"/);
  assert.doesNotMatch(html, /placeholder='\{"A-1"/);
  assert.doesNotMatch(html, /<div className="sl">勝敗情報更新<\/div>/);
  assert.doesNotMatch(html, /試合IDごとの実スコアをJSONで投入します/);
  assert.doesNotMatch(html, /World Football Archiveを取得し/);
  assert.doesNotMatch(html, />管理者トークン</);
  assert.doesNotMatch(html, /<h3>🔐 管理者更新<\/h3>/);
  assert.doesNotMatch(html, /<div className="sl">選手データ更新<\/div>/);
  assert.doesNotMatch(html, />選手データを更新</);
  assert.doesNotMatch(html, /refreshOfficialData/);
  assert.doesNotMatch(html, /adminRefreshing/);
  assert.doesNotMatch(html, /const \[adminToken,setAdminToken\]/);
});

test('home exposes the batch result reflection card', () => {
  assert.match(html, /className="result-judge-card"/);
  assert.match(html, /試合結果を反映/);
  assert.match(html, /試合結果一覧/);
  assert.match(html, /applyAdminResults/);
  assert.match(html, /Webから試合結果を取得し、ポイントと判定バッジを再計算します/);
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
  assert.match(html, /function buildScorerRankingRows\(players=ALL_PLAYERS\)\{/);
  assert.match(html, /\.filter\(\(player\)=>Number\(player\?\.worldCupGoals\|\|0\)>0&&scorerPlayerKey\(player\)\)/);
  assert.match(html, /const rankingStamp=PLAYER_DATA_META\.meta\?\.worldFootballArchiveRankingUpdatedAt/);
  assert.match(html, /得点データ更新: \{rankingStamp\}/);
  assert.match(html, /Number\(row\.worldCupAssists\|\|0\)>0&&<span>アシスト \{row\.worldCupAssists\}<\/span>/);
  assert.match(html, /scorerMinutes\(row\)!==null&&<span>出場 \{scorerMinutes\(row\)\}分<\/span>/);
  assert.match(html, /const scorerPreds=gr\(roomId,'scorerPreds',\{\}\);/);
  assert.match(html, /function saveScorerPrediction\(slotKey,playerKey\)/);
  assert.match(html, /国を選択/);
  assert.match(html, /選手を選択/);
  assert.match(html, /playersByCountry=PLAYER_DATA\[selectedCountry\]\|\|\[\]/);
  assert.match(html, /sr\(roomId,'scorerPreds',next\);/);
  assert.match(html, /得点者はいません/);
  assert.match(html, /row\.isTied\?`同率\$\{row\.rank\}位`:`\$\{row\.rank\}位`/);
  assert.match(html, /className=\{`rank-pos \$\{positionClass\(row\.position\)\}`\}/);
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
  assert.match(html, /const myPred=meta\.kind==='ko'/);
  assert.match(html, /const oppPred=oppId\?meta\.kind==='ko'/);
  assert.match(html, /const myJudgment=meta\.kind==='ko'\?getKoJudgment\(myPred,actual\):getGroupJudgment\(myPred,actual\);/);
  assert.match(html, /const oppJudgment=oppId\?\(meta\.kind==='ko'\?getKoJudgment\(oppPred,actual\):getGroupJudgment\(oppPred,actual\)\):null;/);
  assert.match(html, /const scoreText=scorePairText\(actual,'未反映'\);/);
  assert.match(html, /const myPredText=scorePairText\(myPred,'未予想'\);/);
  assert.match(html, /const oppPredText=scorePairText\(oppPred,'未予想'\);/);
  assert.match(html, /const bt=matchKickoffDate\(b\.match\)\?\.getTime\(\)\|\|0;/);
  assert.match(html, /const at=matchKickoffDate\(a\.match\)\?\.getTime\(\)\|\|0;/);
  assert.match(html, /return bt-at\|\|a\.order-b\.order;/);
  assert.doesNotMatch(html, /<span>結果反映履歴<\/span>/);
  assert.match(html, /Webから試合結果を取得し、ポイントと判定バッジを再計算します/);
  assert.match(html, /Web取得した試合結果は既に反映済みです/);
  assert.match(html, /\/api\/admin\/refresh-results/);
  assert.match(html, /className="home-breakdown"[\s\S]*<div className="home-status-card">[\s\S]*<div className="result-judge-card">/);
  assert.match(html, /className="result-judge-list"/);
  assert.match(html, /className="result-match-item"/);
  assert.doesNotMatch(html, /result-match-stadium/);
  assert.match(html, /className="result-match-judge-col me"/);
  assert.match(html, /className="result-match-judge-col opp"/);
  assert.match(html, /item\.oppJudgment\?\.label\|\|'-'/);
  assert.match(html, /<span className="result-match-judge-label" title=\{myLabel\}>\{myLabel\}<\/span>/);
  assert.match(html, /<span className="result-match-judge-label" title=\{oppLabel\}>\{opp\?oppLabel:'相手'\}<\/span>/);
  assert.match(html, /<span className="result-pred-score">\{item\.myPredText\}<\/span>/);
  assert.match(html, /<span className="result-pred-score">\{item\.oppPredText\}<\/span>/);
  assert.match(html, /\.result-judge-btn\{[^}]*align-self:center/);
  assert.match(html, /\.result-judge-list\{[^}]*overflow-y:auto/);
  assert.match(html, /@media \(max-width: 520px\)\{[\s\S]*?\.result-match-item\{grid-template-columns:1fr/);
  assert.match(html, /@media \(max-width: 520px\)\{[\s\S]*?\.result-match-side\{grid-template-columns:minmax\(58px,\s*\.52fr\) repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(html, /@media \(max-width: 520px\)\{[\s\S]*?\.result-match-score\{font-size:34px;justify-self:center/);
  assert.match(html, /@media \(max-width: 520px\)\{[\s\S]*?\.result-match-teams\{font-size:13px/);
  assert.doesNotMatch(html, /result-judge-input/);
});

test('static hosting can refresh official results into shared rooms', () => {
  assert.match(html, /const FIFA_MATCHES_URL='https:\/\/api\.fifa\.com\/api\/v3\/calendar\/matches\?language=en&count=500&idSeason=285023';/);
  assert.match(html, /async function fetchFifaWorldCupResultsClient\(\)/);
  assert.match(html, /function mapFifaCalendarMatchesToResults\(matches=\[\]\)/);
  assert.match(html, /async function refreshStaticSharedRoomResults\(roomId\)/);
  assert.match(html, /payload\.state\.results=mergedResults;/);
  assert.match(html, /saved=await saveSharedRoomPayload\(payload\);/);
  assert.match(html, /:STATIC_SHARED_ROOM_BACKEND\s*\?\s*await refreshStaticSharedRoomResults\(roomId\)/);
  assert.doesNotMatch(html, /if\(!HAS_BACKEND\)\{setHomeToast\('サーバー接続時のみ更新できます'\);return;\}/);
});

test('official result refresh ignores non-final fifa scores', () => {
  assert.match(html, /function isFifaCalendarMatchFinal\(match\)\{/);
  assert.match(html, /match\?\.ResultType\?\?match\?\.resultType/);
  assert.match(html, /if\(!isFifaCalendarMatchFinal\(match\)\)return null;/);
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

test('mobile page container can shrink and scroll inside the app shell', () => {
  assert.match(html, /\.shell\{[^}]*height:100dvh;[^}]*display:flex;[^}]*flex-direction:column/);
  assert.match(html, /\.page\{[^}]*flex:1;[^}]*min-height:0;[^}]*overflow-y:auto/);
  assert.match(html, /\.page\{[^}]*-webkit-overflow-scrolling:touch/);
});

test('main page scrollbar is visible when content overflows', () => {
  assert.match(html, /\.page\{[^}]*scrollbar-width:thin/);
  assert.match(html, /\.page::-webkit-scrollbar\{[^}]*width:8px/);
  assert.match(html, /\.page::-webkit-scrollbar-thumb\{[^}]*background:rgba\(30,110,240,\.38\)/);
  assert.doesNotMatch(html, /\.page\{[^}]*scrollbar-width:none/);
  assert.doesNotMatch(html, /\.page::-webkit-scrollbar\{display:none;\}/);
});

test('home point breakdown uses consistent count and point columns', () => {
  assert.match(html, /\.stats-head,\.stats-row\{[^}]*grid-template-columns:minmax\(52px,\s*\.52fr\) minmax\(88px,1fr\) minmax\(88px,1fr\)/);
  assert.match(html, /\.home-break-totals\{[^}]*grid-template-columns:minmax\(52px,\s*\.52fr\) minmax\(88px,1fr\) minmax\(88px,1fr\)/);
  assert.match(html, /\.home-break-total-spacer\{[^}]*min-width:0/);
  assert.match(html, /\.home-break-total\.opp strong\{[^}]*color:var\(--gold\)/);
  assert.match(html, /\.home-compare-row\{[^}]*grid-template-columns:minmax\(52px,\s*\.52fr\) minmax\(88px,1fr\) minmax\(88px,1fr\)/);
  assert.match(html, /groupCompareRows=\[/);
  assert.match(html, /koCompareRows=\[/);
  assert.match(html, /scorerCompareRows=\[/);
  assert.match(html, /<div className="stats-head"><span>項目<\/span><span title=\{myLabel\}>\{myLabel\}<\/span><span title=\{oppLabel\}>\{opp\?oppLabel:'相手'\}<\/span><\/div>/);
  assert.match(html, /<div className="home-break-total-spacer" aria-hidden="true"><\/div>/);
  assert.match(html, /<div className="home-break-total opp"><span className="total-label" title=\{oppLabel\}>相手: \{opp\?oppLabel:'-'\}<\/span><div className="total-score"><strong>\{opp\?oppSummary\.total:'-'\}<\/strong>\{opp&&<span>pt<\/span>\}<\/div><\/div>/);
  assert.match(html, /<div className="home-break-total opp"><span className="total-label" title=\{oppLabel\}>相手: \{opp\?oppLabel:'-'\}<\/span><div className="total-score"><strong>\{opp\?oppKoSummary\.total:'-'\}<\/strong>\{opp&&<span>pt<\/span>\}<\/div><\/div>/);
  assert.match(html, /<h3>得点ランキング<\/h3>/);
  assert.match(html, /<strong>\{myScorerSummary\.total\}<\/strong><span>pt<\/span>/);
  assert.match(html, /<strong>\{opp\?oppScorerSummary\.total:'-'\}<\/strong>\{opp&&<span>pt<\/span>\}/);
  assert.match(html, /<div className="home-compare-row home-compare-head"><span>ユーザー名<\/span><b title=\{myLabel\}>\{myLabel\}<\/b><b title=\{oppLabel\}>\{opp\?oppLabel:'相手'\}<\/b><\/div>/);
  assert.match(html, /<span>\{row\.label\}<\/span><b className="me">\{row\.me\}<\/b><b className="opp">\{opp\?row\.opp:'-'\}<\/b>/);
  assert.match(html, /\.home-compare-row > b\{[^}]*justify-self:center/);
});

test('home hero score cards use aligned metrics and centered VS', () => {
  assert.match(html, /\.vs-txt\{[^}]*align-self:center/);
  assert.match(html, /\.hpc-total\{[^}]*align-items:baseline/);
  assert.match(html, /\.hpc-total \.unit\{[^}]*font-size:12px/);
  assert.match(html, /const myTotal=mySummary\.total\+myKoSummary\.total\+myScorerSummary\.total;/);
  assert.match(html, /const oppTotal=oppSummary\.total\+oppKoSummary\.total\+oppScorerSummary\.total;/);
});

test('auth page offers recent room recovery', () => {
  assert.match(html, /recentProfiles=Object\.values\(authProfiles\)/);
  assert.match(html, /\.slice\(0,2\)/);
  assert.match(html, /過去に参加したルーム情報/);
  assert.doesNotMatch(html, /ルームコードを忘れた場合/);
  assert.match(html, /ユーザー名：\{profile\.username\}/);
  assert.match(html, /ルームコード：\{profile\.roomCode\}/);
  assert.match(html, /\.auth-recent\{[^}]*padding:8px/);
  assert.match(html, /\.auth-recent-list\{[^}]*max-height:68px;overflow-y:auto/);
  assert.match(html, /\.auth-recent-btn\{[^}]*padding:6px 8px/);
  assert.match(html, /\.auth-bg\{[^}]*overflow-y:auto/);
  assert.doesNotMatch(html, /\.auth-bg\{[^}]*overflow:hidden/);
  assert.match(html, /function useRecentProfile\(profile\)/);
});

test('static hosting uses shared Firestore rooms instead of per-device local rooms', () => {
  assert.match(html, /const STATIC_SHARED_ROOM_BACKEND=!HAS_BACKEND&&!!FIREBASE_PROJECT_ID;/);
  assert.match(html, /async function fetchSharedRoomPayload\(roomCode\)/);
  assert.match(html, /async function saveSharedRoomPayload\(payload\)/);
  assert.match(html, /function applySharedRoomPayload\(payload\)/);
  assert.match(html, /function reconcileCurrentUserWithSharedRoom\(payload\)/);
  assert.match(html, /if\(STATIC_SHARED_ROOM_BACKEND\)\{[\s\S]*?const shared=normalizeSharedRoomPayload\(await fetchSharedRoomPayload\(code\),code\);/);
  assert.match(html, /syncStaticSharedRoomState\(roomId,\(state\)=>\{state\[key\]=v;\}\)/);
  assert.match(html, /syncStaticSharedRoomState\(roomId,\(state\)=>\{[\s\S]*?state\.predictionsV2\[userId\]\[matchId\]=prediction;/);
  assert.match(html, /ss\(roomDataKey\(normalized\.room\.id,'scorerPreds'\),normalized\.state\.scorerPreds\|\|\{\}\);/);
  assert.match(html, /ss\(roomDataKey\(roomId,'scorerPreds'\),roomState\.scorerPreds\|\|\{\}\);/);
  assert.match(html, /if\(STATIC_SHARED_ROOM_BACKEND&&!HAS_BACKEND\)\{[\s\S]*?const shared=await fetchSharedRoomPayload\(code\);/);
  assert.match(html, /const reconciled=reconcileCurrentUserWithSharedRoom\(shared\);/);
  assert.match(html, /if\(reconciled\.changed&&reconciled\.user\)\{[\s\S]*?setUser\(reconciled\.user\);/);
  assert.match(html, /async function syncCurrentRoom\(options=\{\}\)/);
  assert.match(html, /onManualSync=\{syncCurrentRoom\}/);
  assert.match(html, /最新状態に更新/);
  assert.doesNotMatch(html, /setInterval\(sync,10000\)/);
  assert.doesNotMatch(html, /setInterval\(sync,4000\)/);
});

test('pending prediction summary includes opponent state', () => {
  assert.match(html, /const KO_MATCHES=KO_ROUNDS\.flatMap\(\(round\)=>round\.matches\.map\(\(match\)=>\(\{\.\.\.match,roundId:round\.id\}\)\)\);/);
  assert.match(html, /const TOTAL_PREDICTABLE_ITEMS=GROUP_MATCHES\.length\+KO_MATCHES\.length\+SCORER_PREDICTION_SLOTS\.length;/);
  assert.match(html, /function koMatchPredictionCount\(userKoPreds=\{\}\)\{/);
  assert.match(html, /function scorerPredictionCount\(userScorerPreds=\{\}\)\{/);
  assert.match(html, /const myPredCount=myGroupPredCount\+myKoPredCount\+myScorerPredCount;/);
  assert.match(html, /const oppPredCount=oppGroupPredCount\+oppKoPredCount\+oppScorerPredCount;/);
  assert.match(html, /const myUnpredictedCount=TOTAL_PREDICTABLE_ITEMS-myPredCount;/);
  assert.match(html, /const oppUnpredictedCount=oppId\?TOTAL_PREDICTABLE_ITEMS-oppPredCount:0/);
  assert.match(html, /<div className="stats-frame">/);
  assert.match(html, /<div className="stats-table">/);
  assert.match(html, /<div className="stats-row"><span>\{l\.predicted\}<\/span><b className="me">\{myPredCount\}件<\/b><b className="opp">\{opp\?oppPredCount:'-'\}件<\/b><\/div>/);
  assert.match(html, /<div className="stats-row"><span>\{l\.unpredicted\}<\/span><b className="me">\{myUnpredictedCount\}件<\/b><b className="opp">\{opp\?oppUnpredictedCount:'-'\}件<\/b><\/div>/);
  assert.match(html, /<div className="stats-row total"><span>\{l\.confirmed\}<\/span><b className="me">\{resultCount\}件<\/b><b className="opp">\{opp\?Object\.keys\(results\)\.length:'-'\}件<\/b><\/div>/);
});

test('knockout score row uses score hit wording', () => {
  assert.match(html, /\{label:'スコア的中',me:koScorePts\(myKoSummary\),opp:koScorePts\(oppKoSummary\)\}/);
  assert.doesNotMatch(html, /スコア \/ PK/);
});

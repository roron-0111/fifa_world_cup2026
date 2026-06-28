const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'project', 'World Cup 2026.html'), 'utf8');
const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

test('scorer ranking predictions are part of every shared room state shape', () => {
  assert.match(html, /return \{predictionsV2:\{\},results:\{\},koFixtures:\{\},locked:\{\},koPreds:\{\},scorerPreds:\{\},settings:\{\.\.\.DEFAULT_ROOM_SETTINGS\}\};/);
  assert.match(html, /\['predictions','predictionsV2','results','koFixtures','locked','koPreds','scorerPreds'\]/);
  assert.match(server, /koFixtures:\s*\{\}/);
  assert.match(server, /state\.roomStates\[roomId\]\.koFixtures \|\|= \{\};/);
  assert.match(server, /key === 'koFixtures'/);
  assert.match(server, /scorerPreds:\s*\{\}/);
  assert.match(server, /state\.roomStates\[roomId\]\.scorerPreds \|\|= \{\};/);
  assert.match(server, /key === 'scorerPreds'/);
});

test('scorer ranking points are configurable independently from knockout podium points', () => {
  assert.match(html, /scorerFirstPts:3/);
  assert.match(html, /scorerSecondPts:2/);
  assert.match(html, /scorerThirdPts:1/);
  assert.match(server, /scorerFirstPts:\s*3/);
  assert.match(server, /scorerSecondPts:\s*2/);
  assert.match(server, /scorerThirdPts:\s*1/);
  assert.match(html, /得点ランキング 1位的中/);
  assert.match(html, /changePts\('scorerFirstPts',-1\)/);
  assert.match(html, /changePts\('scorerSecondPts',-1\)/);
  assert.match(html, /changePts\('scorerThirdPts',-1\)/);
});

test('server room settings defaults match requested point values', () => {
  assert.match(server, /resultPts:\s*1/);
  assert.match(server, /exactPts:\s*1/);
  assert.match(server, /koWinnerPts:\s*1/);
  assert.match(server, /koExactPts:\s*1/);
  assert.match(server, /koPenaltyPts:\s*0/);
  assert.match(server, /koChampionPts:\s*3/);
  assert.match(server, /koRunnerUpPts:\s*2/);
  assert.match(server, /koThirdPlacePts:\s*1/);
  assert.match(server, /koRunnerUpEnabled:\s*true/);
  assert.match(server, /koThirdPlaceEnabled:\s*true/);
});

test('scorer ranking prediction panel is compact and collapsible', () => {
  assert.match(html, /const myScorerPredCount=scorerPredictionCount\(myScorerPreds\);/);
  assert.match(html, /<details className="scorer-pred-panel">/);
  assert.match(html, /<summary className="scorer-pred-summary">/);
  assert.match(html, /className="scorer-pred-counts"/);
  assert.match(html, /className="scorer-pred-body"/);
  assert.match(html, /className="scorer-pred-controls"/);
  assert.match(html, /\.scorer-pred-panel:not\(\[open\]\) \.scorer-pred-body\{display:none;\}/);
  assert.match(html, /\.scorer-pred-card\{[^}]*grid-template-columns:minmax\(48px,\.32fr\) minmax\(0,1fr\)/);
  assert.match(html, /\.scorer-pred-controls\{[^}]*grid-template-columns:minmax\(82px,\.38fr\) minmax\(0,1\.62fr\)/);
});

test('scorer ranking list uses computed tie-aware ranks', () => {
  assert.match(html, /function buildScorerRankingRows\(players=ALL_PLAYERS\)\{/);
  assert.match(html, /const rankedScorerRows=buildScorerRankingRows\(players\);/);
  assert.match(html, /function sameScorerRankBucket\(a,b\)\{\s*if\(scorerStatNumber\(a\?\.worldCupGoals\)!==scorerStatNumber\(b\?\.worldCupGoals\)\)return false;\s*return true;\s*\}/);
  assert.match(html, /row\.isTied\?`同率\$\{row\.rank\}位`:`\$\{row\.rank\}位`/);
  assert.doesNotMatch(html, /<div className="rank-card-rank">\{i\+1\}位<\/div>/);
});

test('scorer ranking prediction panel always exposes opponent picks', () => {
  assert.match(html, /<span>相手 <b>\{oppId\?`\$\{oppScorerPredCount\}\/3`:'-'\}<\/b><\/span>/);
  assert.match(html, /<span>相手: \{oppId\?scorerPredictionLabel\(oppScorerPreds\[slot\.key\]\):'-'\}<\/span>/);
  assert.doesNotMatch(html, /\{oppId&&<span>相手:/);
});

test('scorer ranking predictions close at the final kickoff', () => {
  assert.match(
    html,
    /function isScorerPredictionClosed\(now=new Date\(\)\)\{return isMatchPredictionClosed\(koGetMatch\('F',0\),now\);\}/,
  );
  assert.match(
    html,
    /const scorerPredictionClosed=isScorerPredictionClosed\(\);/,
  );
  assert.match(
    html,
    /if\(readOnly\|\|isScorerPredictionClosed\(\)\)return;/,
  );
  assert.match(
    html,
    /disabled=\{readOnly\|\|scorerPredictionClosed\}/,
  );
  assert.match(
    html,
    /disabled=\{readOnly\|\|scorerPredictionClosed\|\|!selectedCountry\}/,
  );
});

test('scorer ranking point summaries wait for the confirmed final result in app screens', () => {
  assert.match(html, /function isScorerResultFinalized\(results=\{\}\)\{return !!normalizeKoRecord\(results\?\.?\['F-0'\]\);\}/);
  assert.match(html, /calcScorerPointSummary\(scorerPreds,user\.id,settings,ALL_PLAYERS,results\)/);
  assert.match(html, /calcScorerPointSummary\(scorerPreds,oppId,settings,ALL_PLAYERS,results\)/);
  assert.match(html, /const results=gr\(roomId,'results',\{\}\);[\s\S]*?const scorerSummary=calcScorerPointSummary\(scorerPreds,user\.id,settings,ALL_PLAYERS,results\);/);
});

test('scorer ranking player cards show country names', () => {
  assert.match(html, /<span>\{row\.countryJa\|\|teamJa\(row\.country\)\}<\/span>/);
});

test('scorer ranking pending picks use judgment-waiting wording', () => {
  assert.match(html, /<strong>\{hit\?'現在的中':'判定待ち'\}<\/strong>/);
  assert.doesNotMatch(html, /<strong>\{hit\?'現在的中':'未的中'\}<\/strong>/);
});

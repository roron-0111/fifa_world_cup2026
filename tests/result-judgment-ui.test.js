const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'project', 'World Cup 2026.html'), 'utf8');

test('group match cards expose compact judgment badges', () => {
  assert.match(html, /function getGroupJudgment/);
  assert.match(html, /className=\{`match-status-badge \$\{groupJudgment\.state\}`\}/);
  assert.match(html, /判定待ち/);
  assert.match(html, /スコア\+勝敗/);
  assert.match(html, /勝敗的中/);
  assert.match(html, /不一致/);
});

test('knockout nodes reserve the right side for a compact judgment badge', () => {
  assert.match(html, /function getKoJudgment/);
  assert.match(html, /className="ko-match-stadium"/);
  assert.match(html, /className=\{`ko-match-status \$\{koJudgment\.state\}`\}/);
  assert.match(html, /ko-match-meta/);
  assert.match(html, /ko-match-time/);
  assert.match(html, /スコア\+勝者/);
  assert.match(html, /勝者的中/);
});

test('group prediction confirm persists prediction and lock atomically for static shared rooms', () => {
  assert.match(html, /function saveLocalPrediction\(roomId,userId,matchId,prediction\)/);
  assert.match(html, /function saveAndLockGroupPrediction\(roomId,userId,matchId,prediction\)/);
  assert.match(html, /function saveAndLockGroupPrediction\(roomId,userId,matchId,prediction\)\{[\s\S]*?const nextPreds=saveLocalPrediction\(roomId,userId,matchId,prediction\);/);
  assert.doesNotMatch(html, /function saveAndLockGroupPrediction\(roomId,userId,matchId,prediction\)\{[\s\S]*?const nextPreds=savePrediction\(roomId,userId,matchId,prediction\);/);
  assert.match(html, /state\.predictionsV2\[userId\]\[matchId\]=prediction;/);
  assert.match(html, /state\.locked\[userId\]=arr;/);
  assert.match(html, /function savePred\(matchId,pred,localOnly=false\)/);
  assert.match(html, /if\(localOnly\)\{/);
  assert.match(html, /const scoreDraftRef=useRef\(\{home:myPred\?\.home\?\?0,away:myPred\?\.away\?\?0\}\);/);
  assert.match(html, /function updateScore\(side,delta\)\{/);
  assert.match(html, /const prediction=\{\.\.\.scoreDraftRef\.current\};/);
  assert.match(html, /saveAndLockGroupPrediction\(roomId,userId,match\.id,prediction\);/);
  assert.doesNotMatch(html, /onSave\(match\.id,\{home,away\}\);[\s\S]{0,220}sr\(roomId,'locked',lk\);/);
});

test('group exact score earns both result and exact score points', () => {
  const match = html.match(/(function calcPointSummary\(preds,results,userId,settings\)\{[\s\S]*?)\nfunction calcKoPointSummary/);
  assert.ok(match, 'calcPointSummary should be extractable');
  const context = { GROUP_MATCHES: [], KO_MATCHES: [] };
  vm.runInNewContext(`${match[1]}; this.summary=calcPointSummary(
    {opponent:{'A-1':{home:2,away:0}}},
    {'A-1':{home:2,away:0}},
    'opponent',
    {resultPts:1,exactPts:2}
  );`, context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.summary)), {
    total: 3,
    resultHits: 1,
    exactHits: 1,
    resultPoints: 1,
    exactPoints: 2,
    resultPts: 1,
    exactPts: 2,
  });
  assert.match(html, /return\{pts:s\.resultPts\+s\.exactPts,type:'exact'\}/);
});

test('knockout PK-decided tie does not earn normal exact-score points', () => {
  const match = html.match(/(function calcKoPointSummary\(koPreds,results,userId,settings\)\{[\s\S]*?)\nconst SCORER_PREDICTION_SLOTS=/);
  assert.ok(match, 'calcKoPointSummary should be extractable');
  const context = {
    KO_MATCHES: [{ id: 'F-0' }],
    normalizeKoRecord: (record) => record || null,
    koRecordHasScore: (record) => Number.isFinite(record?.home) && Number.isFinite(record?.away),
    koRecordWinnerSide: (record) => {
      if (!record) return null;
      if (record.decidedBy === 'PK') {
        if (record.homePen > record.awayPen) return 'home';
        if (record.homePen < record.awayPen) return 'away';
        return record.winnerSide || null;
      }
      if (record.home > record.away) return 'home';
      if (record.home < record.away) return 'away';
      return record.winnerSide || null;
    },
    koPodiumPredictions: () => ({}),
    koActualPodium: () => ({}),
    koSeedLabel: (value) => value,
  };
  vm.runInNewContext(`${match[1]}; this.summary=calcKoPointSummary(
    {user:{'F-0':{home:1,away:1,decidedBy:'PK',homePen:4,awayPen:3,winnerSide:'home'}}},
    {'F-0':{home:1,away:1,decidedBy:'PK',homePen:4,awayPen:3,winnerSide:'home'}},
    'user',
    {koWinnerPts:1,koExactPts:2,koPenaltyPts:1,koChampionPts:5}
  );`, context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.summary)), {
    total: 2,
    winnerHits: 1,
    exactHits: 0,
    penaltyHits: 1,
    championHit: 0,
    runnerUpHit: 0,
    thirdPlaceHit: 0,
    koWinnerPts: 1,
    koExactPts: 2,
    koPenaltyPts: 1,
    koChampionPts: 5,
    koRunnerUpPts: 3,
    koThirdPlacePts: 2,
  });
});

test('scorer ranking predictions score the top three goal tiers with ties', () => {
  const match = html.match(/(const SCORER_PREDICTION_SLOTS=\[[\s\S]*?)\nfunction displayUserLabel/);
  assert.ok(match, 'scorer ranking summary should be extractable');
  const context = { GROUP_MATCHES: [], KO_MATCHES: [] };
  vm.runInNewContext(`${match[1]}; this.summary=calcScorerPointSummary(
    {user:{first:'MEX::same-first',second:'ARG::same-second',third:'BRA::third'}},
    'user',
    {scorerFirstPts:5,scorerSecondPts:3,scorerThirdPts:2},
    [
      {country:'USA',id:'first',worldCupGoals:4},
      {country:'MEX',id:'same-first',worldCupGoals:4},
      {country:'CAN',id:'second',worldCupGoals:2},
      {country:'ARG',id:'same-second',worldCupGoals:2},
      {country:'BRA',id:'third',worldCupGoals:1}
    ]
  );`, context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.summary)), {
    total: 10,
    firstHit: 1,
    secondHit: 1,
    thirdHit: 1,
    firstPoints: 5,
    secondPoints: 3,
    thirdPoints: 2,
    scorerFirstPts: 5,
    scorerSecondPts: 3,
    scorerThirdPts: 2,
  });
});

test('scorer ranking predictions use assists and minutes before treating players as tied', () => {
  const match = html.match(/(const SCORER_PREDICTION_SLOTS=\[[\s\S]*?)\nfunction displayUserLabel/);
  assert.ok(match, 'scorer ranking summary should be extractable');
  const context = { GROUP_MATCHES: [], KO_MATCHES: [] };
  vm.runInNewContext(`${match[1]}; this.summary=calcScorerPointSummary(
    {user:{first:'MEX::few-minutes',second:'USA::more-minutes',third:'CAN::fewer-assists'}} ,
    'user',
    {scorerFirstPts:5,scorerSecondPts:3,scorerThirdPts:2},
    [
      {country:'USA',id:'more-minutes',worldCupGoals:4,worldCupAssists:2,worldCupMinutes:300},
      {country:'MEX',id:'few-minutes',worldCupGoals:4,worldCupAssists:2,worldCupMinutes:120},
      {country:'CAN',id:'fewer-assists',worldCupGoals:4,worldCupAssists:1},
      {country:'BRA',id:'lower-goals',worldCupGoals:2,worldCupAssists:8}
    ]
  );`, context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.summary)), {
    total: 10,
    firstHit: 1,
    secondHit: 1,
    thirdHit: 1,
    firstPoints: 5,
    secondPoints: 3,
    thirdPoints: 2,
    scorerFirstPts: 5,
    scorerSecondPts: 3,
    scorerThirdPts: 2,
  });
});

test('scorer ranking predictions keep same-goal same-assist players tied when minutes are missing', () => {
  const match = html.match(/(const SCORER_PREDICTION_SLOTS=\[[\s\S]*?)\nfunction displayUserLabel/);
  assert.ok(match, 'scorer ranking summary should be extractable');
  const context = { GROUP_MATCHES: [], KO_MATCHES: [] };
  vm.runInNewContext(`${match[1]}; this.summary=calcScorerPointSummary(
    {user:{first:'USA::known-minutes',second:'CAN::fewer-assists'}} ,
    'user',
    {scorerFirstPts:5,scorerSecondPts:3,scorerThirdPts:2},
    [
      {country:'MEX',id:'missing-minutes',worldCupGoals:4,worldCupAssists:2},
      {country:'USA',id:'known-minutes',worldCupGoals:4,worldCupAssists:2,worldCupMinutes:300},
      {country:'CAN',id:'fewer-assists',worldCupGoals:4,worldCupAssists:1}
    ]
  );`, context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.summary)), {
    total: 8,
    firstHit: 1,
    secondHit: 1,
    thirdHit: 0,
    firstPoints: 5,
    secondPoints: 3,
    thirdPoints: 0,
    scorerFirstPts: 5,
    scorerSecondPts: 3,
    scorerThirdPts: 2,
  });
});

test('group match cards show only finished state after results and score both users', () => {
  assert.match(html, /function PredictionPointTag\(\{score\}\)/);
  assert.match(html, /const oppScore=oppPred&&result\?getPts\(oppPred,result\):null;/);
  assert.match(html, /result\?\s*<span className="match-finished-tag">終了<\/span>/);
  assert.match(html, /<PredictionPointTag score=\{myScore\}\/>/);
  assert.match(html, /<PredictionPointTag score=\{oppScore\}\/>/);
  assert.doesNotMatch(html, /結果: \{result\.home\}/);
});

test('finished group match cards cannot be edited or unlocked', () => {
  assert.match(html, /const isFinished=!!result;/);
  assert.match(html, /const isPredictionReadOnly=readOnly\|\|isFinished\|\|isPredictionClosed;/);
  assert.match(html, /function doConfirm\(\)\{\s*if\(readOnly\|\|isFinished\|\|isMatchPredictionClosed\(match\)\)return;/);
  assert.match(html, /function doUnlock\(\)\{\s*if\(readOnly\|\|isFinished\|\|isMatchPredictionClosed\(match\)\)return;/);
  assert.match(html, /\(localLocked\|\|isPredictionReadOnly\)/);
  assert.match(html, /isFinished\s*\?\s*null\s*:\s*readOnly/);
});

test('group match predictions close at kickoff time before results arrive', () => {
  assert.match(html, /function matchKickoffDate\(match\)\{/);
  assert.match(html, /function isMatchPredictionClosed\(match,now=new Date\(\)\)\{/);
  assert.match(html, /const isPredictionClosed=isMatchPredictionClosed\(match\);/);
  assert.match(html, /if\(isPredictionReadOnly\|\|localLocked\|\|isMatchPredictionClosed\(match\)\)return;/);
  assert.match(html, /isPredictionClosed\s*\?\s*<div className="readonly-note">試合開始後のため予想は変更できません<\/div>/);
});

test('prediction placeholder text uses compact non-score styling', () => {
  assert.match(html, /\.pred-value\.no-pred\{[^}]*font-family:'Inter',sans-serif;[^}]*font-size:15px;[^}]*line-height:1\.2;/);
  assert.match(html, /\.pred-value\.big\.no-pred\{[^}]*font-size:16px/);
  assert.match(html, /className=\{`pred-value big\$\{myPred\?'':' no-pred'\}`\}/);
  assert.match(html, /className=\{`pred-value\$\{oppPred\?'':' no-pred'\}`\}/);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'project', 'World Cup 2026.html'), 'utf8');

test('knockout matches include scheduled UTC kickoff data', () => {
  assert.doesNotMatch(html, /date:'日程未定'/);
  assert.match(
    html,
    /id:'R32-0'[\s\S]*?matchNo:73[\s\S]*?date:'2026-06-28'[\s\S]*?kickoff:'19:00'[\s\S]*?stadium:'Los Angeles Stadium'/,
  );
  assert.match(
    html,
    /id:'F-0'[\s\S]*?matchNo:104[\s\S]*?date:'2026-07-19'[\s\S]*?kickoff:'19:00'[\s\S]*?stadium:'New York New Jersey Stadium'/,
  );
});

test('knockout match predictions close at kickoff time before results arrive', () => {
  assert.match(
    html,
    /if\(!canEditKo\|\|normalizeKoRecord\(results\[match\.id\]\)\|\|isMatchPredictionClosed\(match\)\)return;/,
  );
  assert.match(
    html,
    /if\(normalizeKoRecord\(results\[editing\.match\.id\]\)\|\|isMatchPredictionClosed\(editing\.match\)\)\{setStatus\('試合開始後のため予想は変更できません'\);return;\}/,
  );
  assert.match(
    html,
    /function clearDraft\(\)\{\s*if\(!editing\|\|!canEditKo\)return;\s*if\(normalizeKoRecord\(results\[editing\.match\.id\]\)\|\|isMatchPredictionClosed\(editing\.match\)\)\{setStatus\('試合開始後のため予想は変更できません'\);return;\}/,
  );
  assert.match(
    html,
    /const canEditMatch=canEditKo&&!actual&&!isPredictionClosed;/,
  );
  assert.match(
    html,
    /disabled=\{!canEditMatch\}/,
  );
});

test('knockout route uses official match-number bracket sources', () => {
  assert.match(
    html,
    /id:'R16-0'[\s\S]*?matchNo:89[\s\S]*?sourceRefs:\{home:\{round:'R32',index:1\},away:\{round:'R32',index:4\}\}/,
  );
  assert.match(
    html,
    /id:'QF-1'[\s\S]*?matchNo:98[\s\S]*?sourceRefs:\{home:\{round:'R16',index:4\},away:\{round:'R16',index:5\}\}/,
  );
  assert.match(
    html,
    /id:'3RD-0'[\s\S]*?sourceRefs:\{home:\{round:'SF',index:0,loser:true\},away:\{round:'SF',index:1,loser:true\}\}/,
  );
});

test('knockout card renders localized stadium labels', () => {
  assert.match(
    html,
    /className="ko-match-stadium"/,
  );
  assert.doesNotMatch(html, /<em>\{match\.stadium\}<\/em>/);
});

test('knockout predictions do not visually advance teams as official winners', () => {
  assert.match(
    html,
    /function koOfficialWinnerSideForMatch\(match,results=\{\}\)/,
  );
  assert.match(
    html,
    /function koOfficialResolvedTeam\(roundId,matchIndex,side,results=\{\},koFixtures=\{\}\)/,
  );
  assert.match(
    html,
    /const winnerSide=koRecordWinnerSide\(actual\);/,
  );
  assert.match(
    html,
    /const homeLabel=koOfficialResolvedTeam\(round\.id,index,'home',results,koFixtures\)\|\|match\.home;/,
  );
  assert.match(
    html,
    /const awayLabel=koOfficialResolvedTeam\(round\.id,index,'away',results,koFixtures\)\|\|match\.away;/,
  );
  assert.match(
    html,
    /function koModalTeamValue\(side\)\{[\s\S]*?return koOfficialResolvedTeam\(editing\.roundId,editing\.index,side,results,koFixtures\)\|\|editing\.match\[side\];/,
  );
});

test('knockout seeds resolve only from confirmed group ranks', () => {
  assert.match(
    html,
    /function calcGroupQualificationMeta\(groupId,results=\{\}\)\{/,
  );
  assert.match(
    html,
    /const rankConfirmed=complete&&index<2\?index\+1:null;/,
  );
  assert.match(
    html,
    /function groupSeedTeam\(seedLabel,results=\{\}\)\{/,
  );
  assert.match(
    html,
    /return Object\.entries\(meta\)\.find\(\(\[,value\]\)=>value\.rankConfirmed===desiredRank\)\?\.\[0\]\|\|null;/,
  );
  assert.match(
    html,
    /return groupSeedTeam\(seed,results\)\|\|seed;/,
  );
});

test('knockout official fixtures override ambiguous third-place seeds', () => {
  assert.match(
    html,
    /function koFixtureTeam\(roundId,matchIndex,side,koFixtures=\{\}\)\{/,
  );
  assert.match(
    html,
    /function koOfficialResolvedTeam\(roundId,matchIndex,side,results=\{\},koFixtures=\{\}\)\{/,
  );
  assert.match(
    html,
    /const fixtureTeam=koFixtureTeam\(roundId,matchIndex,side,koFixtures\);/,
  );
  assert.match(
    html,
    /if\(fixtureTeam\)return fixtureTeam;/,
  );
  assert.match(
    html,
    /const homeLabel=koOfficialResolvedTeam\(round\.id,index,'home',results,koFixtures\)\|\|match\.home;/,
  );
  assert.match(
    html,
    /const awayLabel=koOfficialResolvedTeam\(round\.id,index,'away',results,koFixtures\)\|\|match\.away;/,
  );
});

test('group standings mark qualified and rank-confirmed teams clearly', () => {
  assert.match(
    html,
    /const qualificationMeta=calcGroupQualificationMeta\(activeG,results\);/,
  );
  assert.match(
    html,
    /const badgeLabel=fixtureBadgeLabel\|\|\(q\.rankConfirmed\?`\$\{q\.rankConfirmed\}位確定`:q\.qualified\?'突破確定':''\);/,
  );
  assert.match(
    html,
    /const badgeRank=fixtureMeta\.rank\|\|q\.rankConfirmed\|\|'';/,
  );
  assert.match(
    html,
    /const badgeText=badgeRank\|\|'✓';/,
  );
  assert.match(
    html,
    /className=\{`str\$\{i<2\?' qual':''\}\$\{fixtureMeta\.qualified\|\|q\.rankConfirmed\?' rank-confirmed':''\}`\}/,
  );
  assert.match(
    html,
    /<span className=\{`qual-badge\$\{fixtureMeta\.qualified\|\|q\.rankConfirmed\?' rank':''\}`\} title=\{badgeLabel\} aria-label=\{badgeLabel\}>\{badgeText\}<\/span>/,
  );
  assert.doesNotMatch(html, /">\{badge\}<\/span>/);
  assert.match(
    html,
    /\.str\.rank-confirmed/,
  );
  assert.match(
    html,
    /\.qual-badge\{[^}]*width:18px/,
  );
  assert.match(
    html,
    /\.qual-badge\{[^}]*height:18px/,
  );
});

test('group standings mark teams found in official knockout fixtures', () => {
  assert.match(
    html,
    /function calcFixtureQualificationMeta\(koFixtures=\{\}\)\{/,
  );
  assert.match(
    html,
    /const fixtureQualificationMeta=calcFixtureQualificationMeta\(koFixtures\);/,
  );
  assert.match(
    html,
    /const fixtureBadgeLabel=fixtureMeta\.qualified\?`\$\{fixtureMeta\.rank\|\|''\}位突破確定`:'';/,
  );
  assert.match(
    html,
    /const badgeLabel=fixtureBadgeLabel\|\|\(q\.rankConfirmed\?`\$\{q\.rankConfirmed\}位確定`:q\.qualified\?'突破確定':''\);/,
  );
});

test('knockout route highlights use official results only', () => {
  assert.match(
    html,
    /const homeWinner=koOfficialWinnerSideForMatch\(koGetMatch\(homeRef\.round,homeRef\.index\),results\);/,
  );
  assert.match(
    html,
    /const awayWinner=koOfficialWinnerSideForMatch\(koGetMatch\(awayRef\.round,awayRef\.index\),results\);/,
  );
  assert.match(
    html,
    /const finalWinner=koOfficialWinnerSideForMatch\(finalMatch,results\);/,
  );
});

test('third-place route does not render an extra dotted guide line', () => {
  assert.doesNotMatch(
    html,
    /key=\{`third-\$\{index\}`\}/,
  );
  assert.doesNotMatch(
    html,
    /key="third-place-line"/,
  );
});

test('knockout bracket zoom is user adjustable without changing board geometry', () => {
  assert.match(
    html,
    /const \[viewMode,setViewMode\]=useState\(\(\)=>gs\('koViewMode','normal'\)\);/,
  );
  assert.match(
    html,
    /const canvasZoom=viewMode==='overview'\?0\.72:1;/,
  );
  assert.match(
    html,
    /function toggleViewMode\(\)\{/,
  );
  assert.match(
    html,
    /<button className="ko-zoom-toggle" onClick=\{toggleViewMode\} aria-label="決勝トーナメント表示倍率を切り替え">\{viewMode==='overview'\?'拡大':'縮小'\}<\/button>/,
  );
  assert.match(
    html,
    /style=\{\{width:BOARD_WIDTH,height:BOARD_HEIGHT,zoom:canvasZoom\}\}/,
  );
  assert.match(
    html,
    /className="ko-round-band-inner" style=\{\{width:BOARD_WIDTH\*canvasZoom\}\}/,
  );
  assert.match(
    html,
    /style=\{\{left:roundX\(round\.id\)\*canvasZoom,width:BOARD\.w\*canvasZoom\}\}/,
  );
  assert.match(
    html,
    /\.ko-zoom-toggle\{position:fixed;right:16px;bottom:72px;/,
  );
  assert.match(
    html,
    /\.ko-zoom-toggle\{[^}]*display:inline-flex/,
  );
  assert.match(
    html,
    /\.ko-zoom-toggle\{[^}]*width:max-content/,
  );
  assert.match(
    html,
    /\.ko-zoom-toggle\{[^}]*max-width:88px/,
  );
  assert.match(
    html,
    /\.ko-zoom-toggle\{[^}]*white-space:nowrap/,
  );
  assert.doesNotMatch(
    html,
    /<div className="ko-view-controls"/,
  );
  assert.doesNotMatch(
    html,
    /\.ko-canvas\{zoom:\.72;\}/,
  );
});

test('knockout podium picks expose opponent selections', () => {
  assert.match(
    html,
    /const oppPodium=oppId\?koPodiumPredictions\(oppPreds,\{\},koFixtures\):\{\};/,
  );
  assert.match(
    html,
    /function podiumPickLabel\(value\)\{/,
  );
  assert.match(
    html,
    /className="ko-podium-opp"/,
  );
  assert.match(
    html,
    /\{oppId\?podiumPickLabel\(oppPodium\[item\.key\]\):'-'\}/,
  );
});

test('knockout prediction modal places team labels next to score inputs', () => {
  assert.match(html, /function koModalTeamLabel\(side\)\{/);
  assert.match(html, /\.ko-modal-matchup\{display:grid;grid-template-columns:minmax\(0,1fr\) auto minmax\(0,1fr\);/);
  assert.match(html, /className="ko-modal-matchup"/);
  assert.match(html, /className=\{`ko-score-side \$\{side\}`\}/);
  assert.match(html, /<div className="ko-score-separator" aria-hidden="true">-<\/div>/);
  assert.match(html, /<span className="ko-score-team-name">\{koModalTeamLabel\(side\)\}<\/span>/);
  assert.match(html, /value=\{draft\[side\]\}/);
  assert.doesNotMatch(html, /左側.*が勝利/);
  assert.doesNotMatch(html, /右側.*が勝利/);
  assert.doesNotMatch(html, /className="ko-pick-row"/);
  assert.doesNotMatch(html, /\.ko-pick-row/);
  assert.doesNotMatch(html, /\.ko-modal-teams/);
  assert.doesNotMatch(html, /\.ko-modal-matchup\{grid-template-columns:1fr;\}/);
  assert.doesNotMatch(html, /\.ko-modal-matchup\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\);/);
});

test('knockout PK inputs appear only for tied scores after checking PK', () => {
  assert.match(html, /同点の場合のみPK戦を選べます/);
  assert.match(html, /const wantsPk=tied&&draft\.decidedBy==='PK';/);
  assert.match(html, /if\(tied&&draft\.decidedBy!=='PK'\)\{setStatus\('同点の場合はPK戦で決着にチェックしてください'\);return;\}/);
  assert.match(html, /if\(wantsPk&&!pkWinner\)\{setStatus\('PKの得点差がつくように入力してください'\);return;\}/);
  assert.match(html, /decidedBy:wantsPk\?'PK':'REG'/);
  assert.match(html, /\{koDraftScoresTied\(\)&&\(/);
  assert.match(html, /type="checkbox" checked=\{draft\.decidedBy==='PK'\}/);
  assert.match(html, /koDraftScoresTied\(\)&&draft\.decidedBy==='PK'&&\(/);
  assert.match(html, /className="ko-score-editor pk"/);
  assert.doesNotMatch(html, /選択した国をPK勝者として扱います/);
});

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
    /function koOfficialResolvedTeam\(roundId,matchIndex,side,results=\{\}\)/,
  );
  assert.match(
    html,
    /const winnerSide=koRecordWinnerSide\(actual\);/,
  );
  assert.match(
    html,
    /const homeLabel=koOfficialResolvedTeam\(round\.id,index,'home',results\)\|\|match\.home;/,
  );
  assert.match(
    html,
    /const awayLabel=koOfficialResolvedTeam\(round\.id,index,'away',results\)\|\|match\.away;/,
  );
  assert.match(
    html,
    /<TeamFlag team=\{koOfficialResolvedTeam\(editing\.roundId,editing\.index,side,results\)\|\|editing\.match\[side\]\}\/>/,
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
  assert.doesNotMatch(
    html,
    /<div className="ko-view-controls"/,
  );
  assert.doesNotMatch(
    html,
    /\.ko-canvas\{zoom:\.72;\}/,
  );
});

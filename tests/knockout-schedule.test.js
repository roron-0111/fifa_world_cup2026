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

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'project', 'World Cup 2026.html'), 'utf8');

test('group stage kickoff times follow official fifa utc timestamps', () => {
  assert.match(
    html,
    /id:'A-1'[\s\S]*?date:'2026-06-11'[\s\S]*?kickoff:'19:00'[\s\S]*?stadium:'Mexico City Stadium'/,
  );
  assert.match(
    html,
    /id:'A-2'[\s\S]*?date:'2026-06-12'[\s\S]*?kickoff:'02:00'[\s\S]*?stadium:'Estadio Guadalajara'/,
  );
  assert.match(
    html,
    /id:'B-1'[\s\S]*?date:'2026-06-12'[\s\S]*?kickoff:'19:00'[\s\S]*?stadium:'Toronto Stadium'/,
  );
  assert.match(
    html,
    /id:'F-1'[\s\S]*?date:'2026-06-14'[\s\S]*?kickoff:'20:00'[\s\S]*?stadium:'Dallas Stadium'/,
  );
  assert.match(
    html,
    /id:'F-5'[\s\S]*?date:'2026-06-25'[\s\S]*?kickoff:'23:00'[\s\S]*?stadium:'Dallas Stadium'/,
  );
  assert.match(
    html,
    /id:'K-1'[\s\S]*?date:'2026-06-17'[\s\S]*?kickoff:'17:00'[\s\S]*?stadium:'Houston Stadium'/,
  );
  assert.match(
    html,
    /id:'L-5'[\s\S]*?date:'2026-06-27'[\s\S]*?kickoff:'21:00'[\s\S]*?stadium:'New York New Jersey Stadium'/,
  );
});

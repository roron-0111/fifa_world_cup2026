const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'import-player-data.js'), 'utf8');

test('WFA player merge uses the full supplemental player pool for club-goal matching', () => {
  assert.match(script, /const supplementalPlayersByCountry = \{\};/);
  assert.match(script, /buildWorldFootballArchivePlayersByCountry\(supplementalPlayersByCountry\)/);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'import-player-data.js'), 'utf8');

test('WFA player merge uses the full supplemental player pool for club-goal matching', () => {
  assert.match(script, /const supplementalPlayersByCountry = \{\};/);
  assert.match(script, /buildWorldFootballArchivePlayersByCountry\(supplementalPlayersByCountry\)/);
});

test('WFA tournament rankings update generated World Cup scorer fields', () => {
  assert.match(script, /parseWorldFootballArchiveTournamentRankings/);
  assert.match(script, /const RANKING_OVERRIDES_FILE = path\.join\(DATA_DIR, 'world-cup-ranking-overrides\.json'\);/);
  assert.match(script, /function mergeWorldCupRankingOverrides\(rankings, overrides\) \{/);
  assert.match(script, /Math\.max\(before, value\)/);
  assert.match(script, /function applyWorldCupRankingStats\(playersByCountry, rankings\)/);
  assert.match(script, /function isRankingNameMatch\(candidateKey, targetKey\)/);
  assert.match(script, /targetKey\.includes\(candidateKey\)\|\|candidateKey\.includes\(targetKey\)/);
  assert.match(script, /player\.worldCupGoals = Number\(goal\.goals \|\| 0\);/);
  assert.match(script, /player\.worldCupAssists = Number\(assist\.assists \|\| 0\);/);
  assert.match(script, /mergeWorldCupRankingOverrides\(\s*parseWorldFootballArchiveTournamentRankings\(rankingHtml\),\s*readWorldCupRankingOverrides\(\),\s*\);/);
  assert.match(script, /applyWorldCupRankingStats\(finalPlayersByCountry, rankings\);/);
  assert.match(script, /worldCupRankingOverrides: 'data\/world-cup-ranking-overrides\.json'/);
});

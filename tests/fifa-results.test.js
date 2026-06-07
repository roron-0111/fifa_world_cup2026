const test = require('node:test');
const assert = require('node:assert/strict');

const {
  FIFA_MATCHES_URL,
  fetchFifaWorldCupResults,
  mapFifaCalendarMatchesToResults,
  resultSnapshotSignature,
} = require('../lib/fifa-results');

test('maps fifa calendar matches into app result records by match number', () => {
  const results = mapFifaCalendarMatchesToResults(
    [
      {
        MatchNumber: 1,
        HomeTeamScore: 2,
        AwayTeamScore: 1,
        MatchStatus: 'Completed',
        ResultType: 'Regular',
      },
      {
        MatchNumber: 73,
        HomeTeamScore: 1,
        AwayTeamScore: 1,
        HomeTeamPenaltyScore: 4,
        AwayTeamPenaltyScore: 3,
        MatchStatus: 'Completed',
        ResultType: 'Penalties',
      },
    ],
    [
      { id: 'A-1', matchNo: 1, stage: 'group' },
      { id: 'R32-0', matchNo: 73, stage: 'ko' },
    ],
  );

  assert.deepEqual(results['A-1'], { home: 2, away: 1, status: 'final' });
  assert.deepEqual(results['R32-0'], {
    home: 1,
    away: 1,
    winnerSide: 'home',
    decidedBy: 'PK',
    homePen: 4,
    awayPen: 3,
    locked: true,
    status: 'final',
  });
});

test('fetches fifa calendar matches from the live fixtures endpoint', async () => {
  let requestedUrl = '';
  const fakeFetch = async (url) => {
    requestedUrl = String(url);
    return {
      ok: true,
      json: async () => ({ Results: [] }),
    };
  };

  await fetchFifaWorldCupResults({ fetchImpl: fakeFetch, matchMeta: [] });

  assert.equal(requestedUrl, FIFA_MATCHES_URL);
});

test('result snapshot signature treats identical reflected results as unchanged', () => {
  const before = {
    'A-1': { home: 2, away: 1, status: 'final' },
    'R32-0': {
      home: 1,
      away: 1,
      winnerSide: 'home',
      decidedBy: 'PK',
      homePen: 4,
      awayPen: 3,
      locked: true,
      status: 'final',
    },
  };
  const after = {
    'R32-0': {
      away: 1,
      home: 1,
      awayPen: 3,
      homePen: 4,
      decidedBy: 'PK',
      winnerSide: 'home',
      locked: true,
      status: 'final',
    },
    'A-1': { away: 1, home: 2, status: 'final' },
  };
  assert.equal(resultSnapshotSignature(before), resultSnapshotSignature(after));
});

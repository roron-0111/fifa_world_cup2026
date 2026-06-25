const test = require('node:test');
const assert = require('node:assert/strict');

const {
  FIFA_MATCHES_URL,
  fetchFifaWorldCupResults,
  mapFifaCalendarMatchesToResults,
  mapFifaCalendarMatchesToKoFixtures,
  matchIdFromMatchNumber,
  resultSnapshotSignature,
} = require('../lib/fifa-results');

test('maps fifa calendar group-stage matches by official team pairing', () => {
  const results = mapFifaCalendarMatchesToResults([
    {
      MatchNumber: 3,
      Home: { ShortClubName: 'Canada' },
      Away: { ShortClubName: 'Bosnia And Herzegovina' },
      HomeTeamScore: 2,
      AwayTeamScore: 1,
      MatchStatus: 0,
      ResultType: 1,
    },
    {
      MatchNumber: 25,
      Home: { ShortClubName: 'Czechia' },
      Away: { ShortClubName: 'South Africa' },
      HomeTeamScore: 1,
      AwayTeamScore: 0,
      MatchStatus: 0,
      ResultType: 1,
    },
    {
      MatchNumber: 53,
      Home: { ShortClubName: 'Czechia' },
      Away: { ShortClubName: 'Mexico' },
      HomeTeamScore: 0,
      AwayTeamScore: 1,
      MatchStatus: 0,
      ResultType: 1,
    },
    {
      MatchNumber: 67,
      Home: { ShortClubName: 'Panama' },
      Away: { ShortClubName: 'England' },
      HomeTeamScore: 1,
      AwayTeamScore: 3,
      MatchStatus: 0,
      ResultType: 1,
    },
  ]);

  assert.deepEqual(results['B-1'], { home: 2, away: 1, status: 'final' });
  assert.deepEqual(results['A-3'], { home: 1, away: 0, status: 'final' });
  assert.deepEqual(results['A-5'], { home: 0, away: 1, status: 'final' });
  assert.deepEqual(results['L-5'], { home: 1, away: 3, status: 'final' });
});

test('ignores in-progress fifa scores until the result is final', () => {
  const results = mapFifaCalendarMatchesToResults([
    {
      MatchNumber: 1,
      Home: { ShortClubName: 'Mexico' },
      Away: { ShortClubName: 'South Africa' },
      HomeTeamScore: 1,
      AwayTeamScore: 0,
      MatchStatus: 1,
      ResultType: 0,
    },
  ]);

  assert.deepEqual(results, {});
});

test('maps fifa knockout matches by official match number', () => {
  const results = mapFifaCalendarMatchesToResults([
    {
      MatchNumber: 73,
      HomeTeamScore: 1,
      AwayTeamScore: 1,
      HomeTeamPenaltyScore: 4,
      AwayTeamPenaltyScore: 3,
      MatchStatus: 'Completed',
      ResultType: 'Penalties',
    },
    {
      MatchNumber: 104,
      Home: { ShortClubName: 'Netherlands' },
      Away: { ShortClubName: 'Japan' },
      HomeTeamScore: 2,
      AwayTeamScore: 0,
      MatchStatus: 'Completed',
      ResultType: 'Regular',
    },
  ]);

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
  assert.deepEqual(results['F-0'], {
    home: 2,
    away: 0,
    winnerSide: 'home',
    decidedBy: 'REG',
    homePen: null,
    awayPen: null,
    status: 'final',
    locked: true,
  });
});

test('maps official knockout fixture teams before match results are final', () => {
  const fixtures = mapFifaCalendarMatchesToKoFixtures([
    {
      MatchNumber: 73,
      Home: { ShortClubName: 'South Africa' },
      Away: { ShortClubName: 'Canada' },
      MatchStatus: 1,
      ResultType: 0,
    },
    {
      MatchNumber: 74,
      Home: { ShortClubName: 'Germany' },
      Away: null,
      MatchStatus: 1,
      ResultType: 0,
    },
    {
      MatchNumber: 87,
      Home: { ShortClubName: 'United States' },
      Away: { ShortClubName: 'Congo DR' },
      MatchStatus: 1,
      ResultType: 0,
    },
    {
      MatchNumber: 25,
      Home: { ShortClubName: 'Czechia' },
      Away: { ShortClubName: 'South Africa' },
      MatchStatus: 0,
      ResultType: 1,
    },
  ]);

  assert.deepEqual(fixtures['R32-0'], {
    home: 'South Africa',
    away: 'Canada',
    matchNo: 73,
  });
  assert.deepEqual(fixtures['R32-1'], {
    home: 'Germany',
    matchNo: 74,
  });
  assert.deepEqual(fixtures['R32-14'], {
    home: 'USA',
    away: 'Congo',
    matchNo: 87,
  });
  assert.equal(fixtures['A-3'], undefined);
});

test('group-stage numbers do not map through the knockout helper anymore', () => {
  assert.equal(matchIdFromMatchNumber(25), null);
  assert.equal(matchIdFromMatchNumber(73), 'R32-0');
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

  await fetchFifaWorldCupResults({ fetchImpl: fakeFetch });

  assert.equal(requestedUrl, FIFA_MATCHES_URL);
});

test('fetches fifa calendar results with knockout fixtures', async () => {
  const fakeFetch = async () => ({
    ok: true,
    json: async () => ({
      Results: [
        {
          MatchNumber: 73,
          Home: { ShortClubName: 'South Africa' },
          Away: { ShortClubName: 'Canada' },
          MatchStatus: 1,
          ResultType: 0,
        },
      ],
    }),
  });

  const data = await fetchFifaWorldCupResults({ fetchImpl: fakeFetch });

  assert.deepEqual(data.results, {});
  assert.deepEqual(data.koFixtures, {
    'R32-0': {
      home: 'South Africa',
      away: 'Canada',
      matchNo: 73,
    },
  });
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

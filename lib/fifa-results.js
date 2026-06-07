const FIFA_MATCHES_URL = 'https://api.fifa.com/api/v3/calendar/matches?language=en&count=500&idSeason=285023';

function toFiniteNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function inferWinnerSide(home, away) {
  const homeScore = toFiniteNumber(home);
  const awayScore = toFiniteNumber(away);
  if (homeScore === null || awayScore === null) return null;
  if (homeScore > awayScore) return 'home';
  if (awayScore > homeScore) return 'away';
  return null;
}

function matchIdFromMatchNumber(matchNumber) {
  const no = toFiniteNumber(matchNumber);
  if (no === null) return null;
  if (no >= 1 && no <= 72) {
    const groupIndex = Math.floor((no - 1) / 6);
    const group = String.fromCharCode(65 + groupIndex);
    const matchIndex = ((no - 1) % 6) + 1;
    return `${group}-${matchIndex}`;
  }
  if (no >= 73 && no <= 88) return `R32-${no - 73}`;
  if (no >= 89 && no <= 96) return `R16-${no - 89}`;
  if (no >= 97 && no <= 100) return `QF-${no - 97}`;
  if (no >= 101 && no <= 102) return `SF-${no - 101}`;
  if (no === 103) return '3RD-0';
  if (no === 104) return 'F-0';
  return null;
}

function parseFifaResult(match) {
  if (!match || typeof match !== 'object') return null;
  const matchId = matchIdFromMatchNumber(match.MatchNumber ?? match.matchNumber ?? match.matchNo);
  if (!matchId) return null;

  const home = toFiniteNumber(match.HomeTeamScore ?? match.homeTeamScore ?? match.homeScore);
  const away = toFiniteNumber(match.AwayTeamScore ?? match.awayTeamScore ?? match.awayScore);
  if (home === null || away === null) return null;

  const homePen = toFiniteNumber(match.HomeTeamPenaltyScore ?? match.homeTeamPenaltyScore ?? match.homePenalty);
  const awayPen = toFiniteNumber(match.AwayTeamPenaltyScore ?? match.awayTeamPenaltyScore ?? match.awayPenalty);
  const isKo = matchId.startsWith('R32-')
    || matchId.startsWith('R16-')
    || matchId.startsWith('QF-')
    || matchId.startsWith('SF-')
    || matchId === '3RD-0'
    || matchId === 'F-0';

  if (!isKo) {
    return {
      matchId,
      result: {
        home,
        away,
        status: 'final',
      },
    };
  }

  const result = {
    home,
    away,
    winnerSide: inferWinnerSide(home, away),
    decidedBy: 'REG',
    homePen: null,
    awayPen: null,
    status: 'final',
    locked: true,
  };

  if (home === away) {
    if (homePen === null || awayPen === null) return null;
    result.decidedBy = 'PK';
    result.homePen = homePen;
    result.awayPen = awayPen;
    result.winnerSide = inferWinnerSide(homePen, awayPen);
    if (!result.winnerSide) return null;
  }

  return { matchId, result };
}

function mapFifaCalendarMatchesToResults(matches = []) {
  const results = {};
  for (const match of matches) {
    const parsed = parseFifaResult(match);
    if (!parsed) continue;
    results[parsed.matchId] = parsed.result;
  }
  return results;
}

function normalizeStoredResult(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const home = toFiniteNumber(value.home ?? value.homeScore ?? value.homeGoal);
  const away = toFiniteNumber(value.away ?? value.awayScore ?? value.awayGoal);
  const normalized = {
    home,
    away,
    status: String(value.status || 'final'),
  };
  if ('winnerSide' in value || 'decidedBy' in value || 'homePen' in value || 'awayPen' in value || 'locked' in value) {
    normalized.winnerSide = value.winnerSide || null;
    normalized.decidedBy = value.decidedBy || null;
    normalized.homePen = toFiniteNumber(value.homePen ?? value.homePenalty);
    normalized.awayPen = toFiniteNumber(value.awayPen ?? value.awayPenalty);
    normalized.locked = value.locked !== false;
  }
  return normalized;
}

function resultSnapshotSignature(results = {}) {
  return JSON.stringify(
    Object.keys(results)
      .sort()
      .map((matchId) => [matchId, normalizeStoredResult(results[matchId])]),
  );
}

async function fetchFifaWorldCupResults({ fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch が利用できません');
  }
  const response = await fetchImpl(FIFA_MATCHES_URL, {
    headers: {
      Accept: 'application/json',
    },
  });
  if (!response || !response.ok) {
    const status = response?.status ? ` (${response.status})` : '';
    throw new Error(`FIFA試合結果の取得に失敗しました${status}`);
  }
  const payload = await response.json();
  const matches = Array.isArray(payload?.Results)
    ? payload.Results
    : Array.isArray(payload?.results)
      ? payload.results
      : [];
  const results = mapFifaCalendarMatchesToResults(matches);
  return {
    results,
    fetchedCount: matches.length,
    updatedCount: Object.keys(results).length,
  };
}

module.exports = {
  FIFA_MATCHES_URL,
  matchIdFromMatchNumber,
  mapFifaCalendarMatchesToResults,
  fetchFifaWorldCupResults,
  normalizeStoredResult,
  resultSnapshotSignature,
};

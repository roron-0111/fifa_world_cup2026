const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const FIFA_MATCHES_URL = 'https://api.fifa.com/api/v3/calendar/matches?language=en&count=500&idSeason=285023';
const PROJECT_HTML_PATH = path.join(__dirname, '..', 'project', 'World Cup 2026.html');

const TEAM_NAME_ALIASES = {
  'Bosnia And Herzegovina': 'Bosnia and Herzegovina',
  'Congo DR': 'Congo',
  'DR Congo': 'Congo',
  'Democratic Republic of the Congo': 'Congo',
  "Côte D'Ivoire": "Côte d'Ivoire",
  'Iran': 'IR Iran',
  'Republic of Korea': 'Korea Republic',
  'South Korea': 'Korea Republic',
  'Turkey': 'Türkiye',
  'Turkiye': 'Türkiye',
  'Czech Republic': 'Czechia',
  'United States': 'USA',
  'United States of America': 'USA',
};

let groupStageMatchLookupCache;

function toFiniteNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeKey(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function normalizeTeamName(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const alias = TEAM_NAME_ALIASES[raw] || raw;
  return normalizeKey(alias);
}

function getOfficialTeamName(team) {
  if (!team) return null;
  if (typeof team === 'string') return team.trim() || null;
  if (typeof team !== 'object') return null;
  const candidates = [
    team.ShortClubName,
    Array.isArray(team.TeamName) ? team.TeamName.find((entry) => entry && entry.Description)?.Description : null,
    team.TeamName && team.TeamName[0] ? team.TeamName[0].Description : null,
    team.Name,
    team.name,
    team.Abbreviation,
  ];
  const name = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim());
  return name ? String(name).trim() : null;
}

function pairKey(homeName, awayName) {
  return `${normalizeTeamName(homeName)}|${normalizeTeamName(awayName)}`;
}

function loadGroupStageMatchLookup() {
  if (groupStageMatchLookupCache) return groupStageMatchLookupCache;
  const html = fs.readFileSync(PROJECT_HTML_PATH, 'utf8');
  const match = html.match(/const\s+GROUP_STAGE_DEFS\s*=\s*(\[[\s\S]*?\]);\s*const\s+GROUPS_RAW\s*=/);
  if (!match) {
    throw new Error('GROUP_STAGE_DEFS を読み取れませんでした');
  }
  const defs = vm.runInNewContext(`(${match[1]})`);
  if (!Array.isArray(defs)) {
    throw new Error('GROUP_STAGE_DEFS の解析に失敗しました');
  }
  const lookup = new Map();
  for (const group of defs) {
    const matches = group && Array.isArray(group.matches) ? group.matches : [];
    for (const fixture of matches) {
      if (!fixture || !fixture.id || !fixture.home || !fixture.away) continue;
      lookup.set(pairKey(fixture.home, fixture.away), fixture.id);
    }
  }
  groupStageMatchLookupCache = lookup;
  return lookup;
}

function inferWinnerSide(home, away) {
  const homeScore = toFiniteNumber(home);
  const awayScore = toFiniteNumber(away);
  if (homeScore === null || awayScore === null) return null;
  if (homeScore > awayScore) return 'home';
  if (awayScore > homeScore) return 'away';
  return null;
}

function finalSignalFromValue(value, kind) {
  if (value === '' || value === null || value === undefined) return null;
  const num = toFiniteNumber(value);
  if (num !== null) return kind === 'status' ? num === 0 : num > 0;
  const text = String(value).trim().toLowerCase();
  if (!text) return null;
  if (/(regular|penalt|completed|complete|finished|final|full[-\s]?time)/.test(text)) return true;
  if (/(live|progress|half|scheduled|fixture|not[-\s]?started|pre[-\s]?match|ongoing)/.test(text)) return false;
  return null;
}

function isFifaCalendarMatchFinal(match) {
  if (!match || typeof match !== 'object') return false;
  const resultTypeFinal = finalSignalFromValue(match.ResultType ?? match.resultType, 'resultType');
  if (resultTypeFinal !== null) return resultTypeFinal;
  const statusCandidates = [
    match.MatchStatusName,
    match.MatchStatusDescription,
    match.MatchStatus,
    match.OfficialityStatus,
  ];
  for (const value of statusCandidates) {
    const statusFinal = finalSignalFromValue(value, 'status');
    if (statusFinal !== null) return statusFinal;
  }
  return true;
}

function matchIdFromMatchNumber(matchNumber) {
  const no = toFiniteNumber(matchNumber);
  if (no === null) return null;
  if (no >= 73 && no <= 88) return `R32-${no - 73}`;
  if (no >= 89 && no <= 96) return `R16-${no - 89}`;
  if (no >= 97 && no <= 100) return `QF-${no - 97}`;
  if (no >= 101 && no <= 102) return `SF-${no - 101}`;
  if (no === 103) return '3RD-0';
  if (no === 104) return 'F-0';
  return null;
}

function resolveMatchId(match) {
  const matchNumber = toFiniteNumber(match.MatchNumber ?? match.matchNumber ?? match.matchNo);
  const numberedMatchId = matchIdFromMatchNumber(matchNumber);
  if (numberedMatchId) return numberedMatchId;
  const homeName = getOfficialTeamName(match.Home ?? match.home);
  const awayName = getOfficialTeamName(match.Away ?? match.away);
  if (homeName && awayName) {
    const groupMatchId = loadGroupStageMatchLookup().get(pairKey(homeName, awayName));
    if (groupMatchId) return groupMatchId;
  }
  return null;
}

function parseFifaResult(match) {
  if (!match || typeof match !== 'object') return null;
  const matchId = resolveMatchId(match);
  if (!matchId) return null;
  if (!isFifaCalendarMatchFinal(match)) return null;

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
  isFifaCalendarMatchFinal,
  matchIdFromMatchNumber,
  mapFifaCalendarMatchesToResults,
  fetchFifaWorldCupResults,
  normalizeStoredResult,
  resultSnapshotSignature,
};

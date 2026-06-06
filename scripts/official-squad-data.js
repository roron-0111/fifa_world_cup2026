const COUNTRY_ALIASES = {
  'Bosnia And Herzegovina': 'Bosnia and Herzegovina',
  "Côte D'Ivoire": "Côte d'Ivoire",
  'Congo DR': 'Congo',
};

function normalizeCountryName(country) {
  return COUNTRY_ALIASES[country] || country;
}

function normalizeKey(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function titleCaseToken(token) {
  if (!token) return '';
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

function makeDisplayName(playerName) {
  const compact = String(playerName || '').trim().replace(/\s+/g, ' ');
  const parts = compact.split(' ');
  if (parts.length >= 2 && /^[A-ZÀ-Þ'’.-]+$/.test(parts[0]) && !/^[A-ZÀ-Þ'’.-]+$/.test(parts[1])) {
    return `${titleCaseToken(parts[1])} ${parts[0]}`;
  }
  if (parts.length < 2) return compact;
  const firstUpperIndex = parts.findIndex((part) => /^[A-ZÀ-Þ'’.-]+$/.test(part) && part.length > 1);
  if (firstUpperIndex <= 0) return compact;
  const firstNames = parts.slice(0, firstUpperIndex).map(titleCaseToken);
  const lastNames = parts.slice(firstUpperIndex);
  return [...firstNames, ...lastNames].join(' ');
}

function toIsoDate(value) {
  const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return String(value || '');
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function ageOnDate(isoDate, referenceDate = new Date()) {
  const match = String(isoDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return 0;
  const ref = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  if (Number.isNaN(ref.getTime())) return 0;
  let age = ref.getUTCFullYear() - Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (ref.getUTCMonth() < month || (ref.getUTCMonth() === month && ref.getUTCDate() < day)) {
    age -= 1;
  }
  return age > 0 ? age : 0;
}

function parsePlayerLine(line, countryCode, index) {
  const match = String(line || '').match(/^(GK|DF|MF(?:\/FW)?|FW)\s*(.+?)\s+(\d{2}\/\d{2}\/\d{4})(.+?)\s+(\d{2,3})$/);
  if (!match) return null;
  const [, position, rawName, dob, club, height] = match;
  return {
    id: `fifa-${countryCode}-${index + 1}`,
    name: makeDisplayName(rawName),
    officialNameJa: '',
    displayNameJa: '',
    firstName: '',
    lastName: '',
    country: '',
    countryJa: '',
    countryName: '',
    position,
    subPosition: position,
    club: club.trim(),
    clubId: '',
    clubGoals: 0,
    internationalGoals: 0,
    goals: 0,
    worldCupGoals: 0,
    internationalCaps: 0,
    marketValue: 0,
    lastSeason: '',
    imageUrl: '',
    profileUrl: '',
    currentNationalTeamId: countryCode,
    dateOfBirth: toIsoDate(dob),
    heightCm: Number(height),
    rank: index + 1,
    source: 'fifa-official-squad',
  };
}

function parseOfficialSquadText(text) {
  const lines = String(text || '')
    .replace(/\u0000/g, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const pages = [];
  let current = null;

  for (const line of lines) {
    const teamMatch = line.match(/^(.+?)\s+\(([A-Z]{3})\)$/);
    if (teamMatch) {
      if (current) pages.push(current);
      current = {
        country: normalizeCountryName(teamMatch[1].trim()),
        code: teamMatch[2],
        players: [],
      };
      continue;
    }
    if (!current || current.players.length >= 26 || line.startsWith('ROLE COACH')) continue;
    const player = parsePlayerLine(line, current.code, current.players.length);
    if (player) {
      player.country = current.country;
      player.countryName = current.country;
      current.players.push(player);
    }
  }

  if (current) pages.push(current);
  return pages;
}

function findExistingPlayer(existingPlayers, officialPlayer) {
  const key = normalizeKey(officialPlayer.name);
  return existingPlayers.find((player) => {
    return (
      normalizeKey(player.name) === key ||
      normalizeKey(player.displayNameJa) === key ||
      normalizeKey(player.officialNameJa) === key
    );
  });
}

function mergeOfficialSquadsWithExistingPlayers(officialByCountry, existingByCountry = {}) {
  const merged = {};
  for (const [country, officialPlayers] of Object.entries(officialByCountry || {})) {
    const existingPlayers = existingByCountry[country] || [];
    merged[country] = officialPlayers.map((officialPlayer, index) => {
      const existing = findExistingPlayer(existingPlayers, officialPlayer) || {};
      return {
        ...officialPlayer,
        ...existing,
        id: existing.id || officialPlayer.id,
        name: officialPlayer.name || existing.name,
        officialNameJa: existing.officialNameJa || existing.displayNameJa || officialPlayer.officialNameJa || '',
        displayNameJa: existing.displayNameJa || existing.officialNameJa || officialPlayer.displayNameJa || officialPlayer.name,
        position: officialPlayer.position || existing.position,
        subPosition: officialPlayer.subPosition || existing.subPosition || officialPlayer.position,
        club: officialPlayer.club || existing.club || '',
        country,
        countryName: country,
        source: 'fifa-official-squad',
        rank: index + 1,
      };
    });
  }
  return merged;
}

function fillMissingPlayerFieldsFromOfficial(primaryByCountry, officialByCountry = {}, referenceDate = new Date()) {
  const supplemented = {};
  for (const [country, players] of Object.entries(primaryByCountry || {})) {
    const officialPlayers = officialByCountry[country] || [];
    supplemented[country] = players.map((player) => {
      const key = normalizeKey(player.name);
      const official = officialPlayers.find((candidate) => {
        return (
          normalizeKey(candidate.name) === key ||
          normalizeKey(candidate.displayNameJa) === key ||
          normalizeKey(candidate.officialNameJa) === key
        );
      });
      if (!official) return player;
      const next = { ...player };
      let changed = false;
      if (!next.club && official.club) {
        next.club = official.club;
        changed = true;
      }
      if (!next.dateOfBirth && official.dateOfBirth) {
        next.dateOfBirth = official.dateOfBirth;
        changed = true;
      }
      if (!next.heightCm && official.heightCm) {
        next.heightCm = Number(official.heightCm) || 0;
        changed = true;
      }
      if (!next.age && next.dateOfBirth) {
        next.age = ageOnDate(next.dateOfBirth, referenceDate);
        changed = changed || Boolean(next.age);
      }
      if (changed) next.supplementSource = 'fifa-official-squad';
      return next;
    });
  }
  return supplemented;
}

module.exports = {
  parseOfficialSquadText,
  fillMissingPlayerFieldsFromOfficial,
  mergeOfficialSquadsWithExistingPlayers,
  normalizeCountryName,
  normalizeKey,
};

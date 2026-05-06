const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');
const readline = require('readline');
const romajiConv = require('@koozaki/romaji-conv');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const OUT_FILE = path.join(DATA_DIR, 'players.generated.json');
const SOURCES_FILE = path.join(DATA_DIR, 'sources.json');
const NAME_OVERRIDES_FILE = path.join(DATA_DIR, 'player-name-overrides.json');
const SEASON_START = new Date('2025-07-01T00:00:00Z');
const SEASON_END = new Date('2026-07-01T00:00:00Z');

const TEAM_SPECS = [
  { country: 'Mexico', ja: 'メキシコ', aliases: ['Mexico'] },
  { country: 'South Africa', ja: '南アフリカ', aliases: ['South Africa'] },
  { country: 'Korea Republic', ja: '韓国', aliases: ['South Korea', 'Korea, South', 'Korea Republic'] },
  { country: 'Czechia', ja: 'チェコ', aliases: ['Czechia', 'Czech Republic'] },
  { country: 'Canada', ja: 'カナダ', aliases: ['Canada'] },
  { country: 'Switzerland', ja: 'スイス', aliases: ['Switzerland'] },
  { country: 'Qatar', ja: 'カタール', aliases: ['Qatar'] },
  { country: 'Brazil', ja: 'ブラジル', aliases: ['Brazil'] },
  { country: 'Morocco', ja: 'モロッコ', aliases: ['Morocco'] },
  { country: 'Haiti', ja: 'ハイチ', aliases: ['Haiti'] },
  { country: 'Scotland', ja: 'スコットランド', aliases: ['Scotland'] },
  { country: 'USA', ja: 'アメリカ', aliases: ['USA', 'United States', 'United States of America'] },
  { country: 'Australia', ja: 'オーストラリア', aliases: ['Australia'] },
  { country: 'Paraguay', ja: 'パラグアイ', aliases: ['Paraguay'] },
  { country: 'Germany', ja: 'ドイツ', aliases: ['Germany'] },
  { country: 'Ecuador', ja: 'エクアドル', aliases: ['Ecuador'] },
  { country: "Côte d'Ivoire", ja: 'コートジボワール', aliases: ['Ivory Coast', "Cote d'Ivoire", "Côte d'Ivoire"] },
  { country: 'Curaçao', ja: 'キュラソー', aliases: ['Curacao', 'Curaçao'] },
  { country: 'Netherlands', ja: 'オランダ', aliases: ['Netherlands'] },
  { country: 'Japan', ja: '日本', aliases: ['Japan'] },
  { country: 'Tunisia', ja: 'チュニジア', aliases: ['Tunisia'] },
  { country: 'Sweden', ja: 'スウェーデン', aliases: ['Sweden'] },
  { country: 'Belgium', ja: 'ベルギー', aliases: ['Belgium'] },
  { country: 'IR Iran', ja: 'イラン', aliases: ['Iran', 'IR Iran'] },
  { country: 'Egypt', ja: 'エジプト', aliases: ['Egypt'] },
  { country: 'New Zealand', ja: 'ニュージーランド', aliases: ['New Zealand'] },
  { country: 'Spain', ja: 'スペイン', aliases: ['Spain'] },
  { country: 'Uruguay', ja: 'ウルグアイ', aliases: ['Uruguay'] },
  { country: 'Saudi Arabia', ja: 'サウジアラビア', aliases: ['Saudi Arabia'] },
  { country: 'Cabo Verde', ja: 'カーボベルデ', aliases: ['Cape Verde', 'Cabo Verde'] },
  { country: 'France', ja: 'フランス', aliases: ['France'] },
  { country: 'Senegal', ja: 'セネガル', aliases: ['Senegal'] },
  { country: 'Norway', ja: 'ノルウェー', aliases: ['Norway'] },
  { country: 'Iraq', ja: 'イラク', aliases: ['Iraq'] },
  { country: 'Argentina', ja: 'アルゼンチン', aliases: ['Argentina'] },
  { country: 'Austria', ja: 'オーストリア', aliases: ['Austria'] },
  { country: 'Algeria', ja: 'アルジェリア', aliases: ['Algeria'] },
  { country: 'Jordan', ja: 'ヨルダン', aliases: ['Jordan'] },
  { country: 'Portugal', ja: 'ポルトガル', aliases: ['Portugal'] },
  { country: 'Colombia', ja: 'コロンビア', aliases: ['Colombia'] },
  { country: 'Uzbekistan', ja: 'ウズベキスタン', aliases: ['Uzbekistan'] },
  { country: 'England', ja: 'イングランド', aliases: ['England'] },
  { country: 'Croatia', ja: 'クロアチア', aliases: ['Croatia'] },
  { country: 'Panama', ja: 'パナマ', aliases: ['Panama'] },
  { country: 'Ghana', ja: 'ガーナ', aliases: ['Ghana'] },
];

const FALLBACK_CLUBS = [
  'レアル・サンプル',
  'インテル・サンプル',
  'サンプルFC',
  'シティ・サンプル',
  'アトラスSC',
  'ユナイテッドSC',
];
const FALLBACK_ROLES = [
  { pos: 'FW', suffix: 'のエース' },
  { pos: 'MF', suffix: 'の司令塔' },
  { pos: 'DF', suffix: 'の守備職人' },
];

const JAPAN_OFFICIAL_ROSTER = [
  { id: 'Japan-official-1', name: 'Kaoru Mitoma', officialNameJa: '三笘 薫', country: 'Japan', countryJa: '日本', countryName: 'Japan', position: 'MF/FW', subPosition: 'MF/FW', club: 'Brighton & Hove Albion FC / England' },
  { id: 'Japan-official-2', name: 'Takumi Minamino', officialNameJa: '南野 拓実', country: 'Japan', countryJa: '日本', countryName: 'Japan', position: 'MF/FW', subPosition: 'MF/FW', club: 'AS Monaco / France' },
  { id: 'Japan-official-3', name: 'Junya Ito', officialNameJa: '伊東 純也', country: 'Japan', countryJa: '日本', countryName: 'Japan', position: 'MF/FW', subPosition: 'MF/FW', club: 'KRC Genk / Belgium' },
  { id: 'Japan-official-4', name: 'Daichi Kamada', officialNameJa: '鎌田 大地', country: 'Japan', countryJa: '日本', countryName: 'Japan', position: 'MF/FW', subPosition: 'MF/FW', club: 'Crystal Palace / England' },
  { id: 'Japan-official-5', name: 'Ayase Ueda', officialNameJa: '上田 綺世', country: 'Japan', countryJa: '日本', countryName: 'Japan', position: 'FW', subPosition: 'FW', club: 'Feyenoord / Netherlands' },
  { id: 'Japan-official-6', name: 'Ritsu Doan', officialNameJa: '堂安 律', country: 'Japan', countryJa: '日本', countryName: 'Japan', position: 'MF/FW', subPosition: 'MF/FW', club: 'Eintracht Frankfurt / Germany' },
];

const JAPANESE_LATIN_REPLACEMENTS = [
  [/Æ/g, 'Ae'],
  [/æ/g, 'ae'],
  [/Œ/g, 'Oe'],
  [/œ/g, 'oe'],
  [/Ø/g, 'O'],
  [/ø/g, 'o'],
  [/Ü/g, 'Ue'],
  [/ü/g, 'ue'],
  [/Ö/g, 'Oe'],
  [/ö/g, 'oe'],
  [/Ä/g, 'Ae'],
  [/ä/g, 'ae'],
  [/ß/g, 'ss'],
  [/Ł/g, 'L'],
  [/ł/g, 'l'],
  [/Đ/g, 'D'],
  [/đ/g, 'd'],
  [/Þ/g, 'Th'],
  [/þ/g, 'th'],
  [/Ç/g, 'C'],
  [/ç/g, 'c'],
  [/Ñ/g, 'N'],
  [/ñ/g, 'n'],
];

function normalizeKey(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function transliterateNameToJa(value) {
  const raw = String(value || '').trim();
  if (!raw) return raw;
  if (/[\u3040-\u30ff\u3400-\u9fff]/.test(raw)) return raw;
  const prepared = JAPANESE_LATIN_REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    raw,
  );
  const ascii = prepared
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[-_]/g, ' ')
    .replace(/[^A-Za-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (!ascii) return raw;
  const consonants = new Set('bcdfghjklmnpqrstvwxyz'.split(''));
  const extendLooseConsonants = (word) => {
    const chars = [...word];
    let out = '';
    for (let i = 0; i < chars.length; i += 1) {
      const c = chars[i];
      const n = chars[i + 1];
      if (!consonants.has(c)) {
        out += c;
        continue;
      }
      if (c === 'n' && (!n || (consonants.has(n) && n !== 'y'))) {
        out += 'n';
        continue;
      }
      if (n && n === c) {
        out += c + c;
        i += 1;
        continue;
      }
      if (!n || (consonants.has(n) && n !== 'y')) {
        out += c + 'u';
        continue;
      }
      out += c;
    }
    return out;
  };
  const romajiLike = ascii
    .replace(/ey/g, 'ei')
    .split(' ')
    .filter(Boolean)
    .map((word) =>
      extendLooseConsonants(
        word
          .replace(/\bky/g, 'ki')
          .replace(/\bgy/g, 'gi')
          .replace(/\bny/g, 'ni')
          .replace(/\bhy/g, 'hi')
          .replace(/\bmy/g, 'mi')
          .replace(/\bry/g, 'ri')
          .replace(/\bpy/g, 'pi')
          .replace(/\bby/g, 'bi')
          .replace(/\bsch/g, 'sh')
          .replace(/qu/g, 'ku')
          .replace(/ph/g, 'f')
          .replace(/th/g, 't')
          .replace(/ck/g, 'k')
          .replace(/gh/g, 'g')
          .replace(/x/g, 'ks')
          .replace(/c(?=[eiy])/g, 's')
          .replace(/c/g, 'k')
          .replace(/g(?=[eiy])/g, 'j')
          .replace(/l/g, 'r')
          .replace(/v/g, 'b')
          .replace(/y\b/g, 'i'),
      ),
    )
    .join(' ');
  const converted = romajiConv.toKatakana(romajiLike);
  if (!converted || converted === ascii) return raw;
  return converted.replace(/\s+/g, '・');
}

function parseCsvLine(line) {
  const out = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === ',') {
      out.push(current);
      current = '';
    } else if (ch === '"') {
      inQuotes = true;
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out.map((v) => v.replace(/\r$/, ''));
}

function download(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location &&
          redirects < 5
        ) {
          const nextUrl = new URL(res.headers.location, url).toString();
          res.resume();
          resolve(download(nextUrl, redirects + 1));
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const stream =
          res.headers['content-encoding'] === 'gzip' || url.endsWith('.gz')
            ? res.pipe(zlib.createGunzip())
            : res;
        resolve(stream);
      })
      .on('error', reject);
  });
}

async function readCsv(url, onRow) {
  const stream = await download(url);
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let headers = null;
  for await (const line of rl) {
    if (!line) continue;
    if (!headers) {
      headers = parseCsvLine(line);
      continue;
    }
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    onRow(row);
  }
}

function getSources() {
  return JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf8'));
}

function readJsonFile(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function isSeasonDate(dateValue) {
  if (!dateValue) return false;
  const d = new Date(`${String(dateValue).trim()}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  return d >= SEASON_START && d < SEASON_END;
}

function loadNameOverrides() {
  return readJsonFile(NAME_OVERRIDES_FILE, {});
}

function buildCountryLookup(nationalTeams) {
  const byName = new Map();
  nationalTeams.forEach((row) => {
    const names = [row.country_name, row.name, row.team_code];
    names.forEach((name) => {
      if (!name) return;
      byName.set(normalizeKey(name), row);
    });
  });
  return byName;
}

function buildTeamAliasLookup() {
  const lookup = new Map();
  for (const spec of TEAM_SPECS) {
    for (const alias of spec.aliases) {
      lookup.set(normalizeKey(alias), spec);
    }
  }
  return lookup;
}

function buildFallbackPlayers(spec) {
  return FALLBACK_ROLES.map((role, index) => ({
    id: `${spec.country}-fallback-${index + 1}`,
    name: `${spec.ja}${role.suffix}`,
    officialNameJa: `${spec.ja}${role.suffix}`,
    displayNameJa: `${spec.ja}${role.suffix}`,
    firstName: spec.ja,
    lastName: role.suffix,
    country: spec.country,
    countryJa: spec.ja,
    countryName: spec.country,
    position: role.pos,
    subPosition: role.pos,
    club: FALLBACK_CLUBS[index % FALLBACK_CLUBS.length],
    clubId: '',
    clubGoals: Math.max(0, 4 - index),
    internationalGoals: 0,
    goals: 0,
    internationalCaps: 0,
    marketValue: 0,
    lastSeason: '',
    imageUrl: '',
    profileUrl: '',
    currentNationalTeamId: '',
    rank: index + 1,
    source: 'fallback',
  }));
}

function resolveOfficialNameJa(nameOverrides, country, playerName) {
  const countryOverrides = nameOverrides?.[country];
  if (!countryOverrides) return '';
  const raw = String(playerName || '').trim();
  if (!raw) return '';
  const direct = countryOverrides[raw] ?? countryOverrides[normalizeKey(raw)];
  if (!direct) return '';
  if (typeof direct === 'string') return direct.trim();
  if (typeof direct === 'object') {
    return String(direct.officialNameJa || direct.displayNameJa || direct.nameJa || '').trim();
  }
  return '';
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const sources = getSources();
  const nameOverrides = loadNameOverrides();

  const nationalTeams = [];
  await readCsv(sources.players.nationalTeamsCsv, (row) => {
    nationalTeams.push(row);
  });
  const nationalTeamsByName = buildCountryLookup(nationalTeams);
  const teamAliasLookup = buildTeamAliasLookup();

  const targetTeams = new Map();
  for (const spec of TEAM_SPECS) {
    const match = spec.aliases
      .map((alias) => nationalTeamsByName.get(normalizeKey(alias)))
      .find(Boolean);
    if (match) {
      targetTeams.set(match.national_team_id, {
        country: spec.country,
        countryJa: spec.ja,
        transfermarktName: match.country_name,
        nationalTeamId: match.national_team_id,
      });
    }
  }

  const playersByCountry = new Map();
  const playersById = new Map();
  const japanRows = [];

  await readCsv(sources.players.playersCsv, (row) => {
    let team = targetTeams.get(row.current_national_team_id);
    if (!team) {
      const aliasHit =
        teamAliasLookup.get(normalizeKey(row.country_of_citizenship)) ||
        teamAliasLookup.get(normalizeKey(row.country_of_birth));
      if (aliasHit) {
        team = {
          country: aliasHit.country,
          countryJa: aliasHit.ja,
          transfermarktName: row.country_of_citizenship || row.country_of_birth || aliasHit.country,
          nationalTeamId: row.current_national_team_id || '',
        };
      }
    }
    if (!team) return;
    if (team.country === 'Japan') {
      japanRows.push({
        ...row,
        team,
      });
      return;
    }
    const player = {
      id: row.player_id,
      name: row.name,
      officialNameJa: resolveOfficialNameJa(nameOverrides, team.country, row.name),
      displayNameJa: resolveOfficialNameJa(nameOverrides, team.country, row.name) || row.name,
      firstName: row.first_name,
      lastName: row.last_name,
      country: team.country,
      countryJa: team.countryJa,
      countryName: team.transfermarktName,
      position: row.sub_position || row.position || 'Unknown',
      subPosition: row.sub_position || '',
      club: row.current_club_name || 'Unknown',
      clubId: row.current_club_id || '',
      clubGoals: 0,
      internationalGoals: Number(row.international_goals || 0),
      goals: Number(row.international_goals || 0),
      internationalCaps: Number(row.international_caps || 0),
      marketValue: Number(row.market_value_in_eur || 0),
      lastSeason: row.last_season || '',
      imageUrl: row.image_url || '',
      profileUrl: row.url || '',
      currentNationalTeamId: row.current_national_team_id || '',
    };
    if (playersById.has(player.id)) return;
    playersById.set(player.id, player);
    if (!playersByCountry.has(team.country)) playersByCountry.set(team.country, []);
    playersByCountry.get(team.country).push(player);
  });

  const japanRowsByName = new Map();
  japanRows.forEach((row) => {
    const key = normalizeKey(row.name);
    if (!japanRowsByName.has(key)) japanRowsByName.set(key, row);
  });
  const japanRoster = JAPAN_OFFICIAL_ROSTER.map((player, index) => {
    const matched = japanRowsByName.get(normalizeKey(player.name));
    return {
      id: matched?.player_id || player.id,
      name: matched?.name || player.name,
      officialNameJa: player.officialNameJa,
      displayNameJa: player.officialNameJa,
      firstName: matched?.first_name || player.name.split(' ')[0] || '',
      lastName: matched?.last_name || player.name.split(' ').slice(1).join(' ') || '',
      country: 'Japan',
      countryJa: '日本',
      countryName: matched?.country_name || player.countryName || 'Japan',
      position: matched?.sub_position || matched?.position || player.position,
      subPosition: matched?.sub_position || player.subPosition || '',
      club: matched?.current_club_name || player.club,
      clubId: matched?.current_club_id || '',
      clubGoals: 0,
      internationalGoals: Number(matched?.international_goals || 0),
      goals: Number(matched?.international_goals || 0),
      internationalCaps: Number(matched?.international_caps || 0),
      marketValue: Number(matched?.market_value_in_eur || 0),
      lastSeason: matched?.last_season || '',
      imageUrl: matched?.image_url || '',
      profileUrl: matched?.url || '',
      currentNationalTeamId: matched?.current_national_team_id || 'Japan-official',
      rank: index + 1,
    };
  });
  playersByCountry.set('Japan', japanRoster);
  japanRoster.forEach((player) => {
    playersById.set(player.id, player);
  });

  const candidateIds = new Set(playersById.keys());
  await readCsv(sources.players.appearancesCsv, (row) => {
    if (!candidateIds.has(row.player_id)) return;
    const player = playersById.get(row.player_id);
    if (!player) return;
    if (!isSeasonDate(row.date)) return;
    player.clubGoals += Number(row.goals || 0);
  });

  const finalPlayersByCountry = {};
  for (const [country, players] of playersByCountry.entries()) {
    const sorted = players
      .slice()
      .sort(
        (a, b) =>
          (b.internationalGoals || 0) - (a.internationalGoals || 0) ||
          (b.clubGoals || 0) - (a.clubGoals || 0) ||
          (b.marketValue || 0) - (a.marketValue || 0) ||
          a.name.localeCompare(b.name, 'ja'),
      )
      .slice(0, 6)
      .map((p, index) => ({
        ...p,
        rank: index + 1,
      }));
    finalPlayersByCountry[country] = sorted;
  }

  const missingTeams = TEAM_SPECS.filter((spec) => !finalPlayersByCountry[spec.country]);
  for (const spec of missingTeams) {
    finalPlayersByCountry[spec.country] = buildFallbackPlayers(spec);
  }

  const output = {
    generatedAt: new Date().toISOString(),
    sources: {
      googleScheduleSearch: sources.teams.googleScheduleSearch,
      fifaTeamsPage: sources.teams.fifaTeamsPage,
      fifaSchedulePage: sources.teams.fifaSchedulePage,
      worldcdbNationalNews: sources.teams.worldcdbNationalNews,
      roiblogSchedule: sources.teams.roiblogSchedule,
      googlePlayersSearch: sources.players.googlePlayersSearch,
      fifaPlayersPage: sources.players.fifaTeamsPage,
      worldcdbNationalNewsPlayers: sources.players.worldcdbNationalNews,
      roiblogSchedulePlayers: sources.players.roiblogSchedule,
      playersCsv: sources.players.playersCsv,
      appearancesCsv: sources.players.appearancesCsv,
      nationalTeamsCsv: sources.players.nationalTeamsCsv,
    },
    playersByCountry: finalPlayersByCountry,
    meta: {
      totalCountries: Object.keys(finalPlayersByCountry).length,
      fallbackTeams: missingTeams.map((spec) => spec.country),
    },
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));
  console.log(`Wrote ${OUT_FILE}`);
  console.log(`Countries: ${output.meta.totalCountries}`);
  if (output.meta.fallbackTeams.length) {
    console.log(`Fallback: ${output.meta.fallbackTeams.join(', ')}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

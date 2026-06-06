const WFA_BASE_URL = 'https://worldfootballarchive.com/wc/2026/team/';

function decodeHtml(value) {
  return String(value || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function htmlToText(html) {
  return decodeHtml(
    String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, '\n')
      .replace(/<style[\s\S]*?<\/style>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|tr|td|th|li|h[1-6]|section|article|table|thead|tbody)>/gi, '\n')
      .replace(/<[^>]+>/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{2,}/g, '\n'),
  );
}

function buildWorldFootballArchiveTeamUrl(spec) {
  const slug = spec.wfaSlug || spec.ja;
  return `${WFA_BASE_URL}${encodeURIComponent(slug)}/`;
}

function parseUpdateLabel(lines) {
  const line = lines.find((entry) => /^更新日：/.test(entry) || /最終更新：/.test(entry));
  if (!line) return '';
  const raw = line.replace(/^.*?[：:]\s*/, '').trim();
  const slash = raw.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (slash) {
    return `${slash[1]}-${slash[2].padStart(2, '0')}-${slash[3].padStart(2, '0')}`;
  }
  return raw;
}

function isPositionStart(line) {
  return /^(\d{1,2}\s+)?(GK|DF|MF|FW)\b/.test(line);
}

function isJapaneseName(line) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(line) && !/[（）]/.test(line) && !/[：｜]/.test(line);
}

function isEnglishName(line) {
  return /^[A-Za-zÀ-ÖØ-öø-ÿ' .-]+$/.test(line) && /[A-Za-z]/.test(line);
}

function parseBio(line) {
  const dob = line.match(/(\d{4}-\d{2}-\d{2})生/);
  const age = line.match(/｜(\d{1,2})歳/);
  const height = line.match(/｜(\d{2,3})cm/);
  return {
    dateOfBirth: dob?.[1] || '',
    age: age ? Number(age[1]) : 0,
    heightCm: height ? Number(height[1]) : 0,
  };
}

function parsePositionLine(line) {
  const match = line.match(/^(\d{1,2})?\s*(GK|DF|MF|FW)\b/);
  if (!match) return null;
  return {
    shirtNumber: match[1] ? Number(match[1]) : null,
    position: match[2],
  };
}

function parsePlayerBlock(lines, startIndex, spec, rank) {
  const start = parsePositionLine(lines[startIndex]);
  if (!start) return null;
  let i = startIndex + 1;
  while (i < lines.length && !isJapaneseName(lines[i]) && !isPositionStart(lines[i])) i += 1;
  if (i >= lines.length || isPositionStart(lines[i])) return null;
  const displayNameJa = lines[i++];
  while (i < lines.length && !isEnglishName(lines[i]) && !isPositionStart(lines[i])) i += 1;
  if (i >= lines.length || isPositionStart(lines[i])) return null;
  const name = lines[i++];

  while (i < lines.length && !/（/.test(lines[i]) && !isPositionStart(lines[i])) i += 1;
  if (i < lines.length && /（/.test(lines[i])) i += 1;

  while (i < lines.length && (!lines[i] || /^(出場|備考|代表デビュー|招集歴)/.test(lines[i]) || /\d{4}-\d{2}-\d{2}生/.test(lines[i])) && !isPositionStart(lines[i])) i += 1;
  const club = i < lines.length && !isPositionStart(lines[i]) ? lines[i++] : '';

  while (i < lines.length && !/\d{4}-\d{2}-\d{2}生/.test(lines[i]) && !isPositionStart(lines[i])) i += 1;
  const bio = i < lines.length && !isPositionStart(lines[i]) ? parseBio(lines[i++]) : {};

  let debut = '';
  let history = '';
  let note = '';
  while (i < lines.length && !isPositionStart(lines[i])) {
    const line = lines[i];
    const debutMatch = line.match(/代表デビュー：([0-9-]+)/);
    const historyMatch = line.match(/招集歴：(.+)$/);
    const noteMatch = line.match(/備考：(.+)$/);
    if (debutMatch) debut = debutMatch[1];
    if (historyMatch) history = historyMatch[1].trim();
    if (noteMatch) note = noteMatch[1].trim();
    i += 1;
  }

  return {
    nextIndex: i,
    player: {
      id: `wfa-${spec.country}-${rank}`,
      name,
      officialNameJa: displayNameJa,
      displayNameJa,
      firstName: '',
      lastName: '',
      country: spec.country,
      countryJa: spec.ja,
      countryName: spec.country,
      position: start.position,
      subPosition: start.position,
      club,
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
      currentNationalTeamId: '',
      shirtNumber: start.shirtNumber,
      dateOfBirth: bio.dateOfBirth || '',
      age: bio.age || 0,
      heightCm: bio.heightCm || 0,
      nationalTeamDebut: debut,
      worldCupHistory: history,
      note,
      rank,
      source: 'world-football-archive',
    },
  };
}

function stripTags(value) {
  return decodeHtml(String(value || '').replace(/<[^>]+>/g, ' '));
}

function extractClassText(html, className) {
  const pattern = new RegExp(`class=["'][^"']*${className}[^"']*["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i');
  const match = String(html || '').match(pattern);
  return stripTags(match?.[1] || '');
}

function extractTableName(nameCell) {
  const ja = extractClassText(nameCell, 'name2-ja');
  const en = extractClassText(nameCell, 'name2-en');
  if (ja || en) {
    return {
      displayNameJa: ja || en,
      name: en || ja,
    };
  }

  const mobile = extractClassText(nameCell, 'name-mobile-inline');
  const desktop = extractClassText(nameCell, 'name-desktop');
  const fallback = mobile || desktop;
  return {
    displayNameJa: fallback,
    name: fallback,
  };
}

function cellValues(rowHtml) {
  return [...String(rowHtml || '').matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => match[1]);
}

function parseWorldFootballArchiveTableRows(html, spec) {
  const rows = [...String(html || '').matchAll(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/gi)];
  const players = [];
  for (const row of rows) {
    const attrs = row[1] || '';
    const cells = cellValues(row[2]);
    if (cells.length < 10) continue;
    const position = stripTags(cells[1]);
    if (!/^(GK|DF|MF|FW)$/.test(position)) continue;
    const nameCell = cells[2];
    const { displayNameJa, name } = extractTableName(nameCell);
    if (!displayNameJa || !name) continue;
    const player = {
      id: `wfa-${spec.country}-${players.length + 1}`,
      name,
      officialNameJa: displayNameJa,
      displayNameJa,
      firstName: '',
      lastName: '',
      country: spec.country,
      countryJa: spec.ja,
      countryName: spec.country,
      position,
      subPosition: position,
      club: stripTags(cells[3]),
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
      currentNationalTeamId: '',
      shirtNumber: stripTags(cells[0]) ? Number(stripTags(cells[0])) : null,
      nationalTeamDebut: stripTags(cells[4]),
      worldCupHistory: stripTags(cells[5]),
      dateOfBirth: stripTags(cells[6]),
      age: Number(stripTags(cells[7]) || 0),
      heightCm: Number(stripTags(cells[8]) || 0),
      note: stripTags(cells[9]),
      rank: players.length + 1,
      source: 'world-football-archive',
      isFinalMember: /row-highlight/.test(attrs) || /最終メンバー/.test(stripTags(cells[9])),
    };
    players.push(player);
  }
  return players;
}

function parseWorldFootballArchiveTeamText(textOrHtml, spec) {
  const fromTable = /<tr\b/i.test(textOrHtml) ? parseWorldFootballArchiveTableRows(textOrHtml, spec) : [];
  const text = /<[^>]+>/.test(textOrHtml) ? htmlToText(textOrHtml) : String(textOrHtml || '');
  const lines = text
    .split(/\r?\n/)
    .map((line) => decodeHtml(line))
    .filter(Boolean);
  const htmlUpdate = String(textOrHtml || '').match(/class="updated-date"[^>]*>([\s\S]*?)<\/span>/i)?.[1];
  const updatedAtLabel = stripTags(htmlUpdate || '') || parseUpdateLabel(lines);
  const players = [];

  for (let i = 0; i < lines.length; i += 1) {
    if (!isPositionStart(lines[i])) continue;
    const parsed = parsePlayerBlock(lines, i, spec, players.length + 1);
    if (!parsed) continue;
    players.push(parsed.player);
    i = Math.max(i, parsed.nextIndex - 1);
  }

  const candidates = fromTable.length ? fromTable : players;
  const finalPlayers = candidates.filter((player) => player.isFinalMember || /最終メンバー/.test(player.note));
  const worldCup26Players = candidates.filter((player) => /\b26\b/.test(player.worldCupHistory));
  const selected = (finalPlayers.length >= 26 ? finalPlayers : worldCup26Players.length >= 26 ? worldCup26Players : candidates)
    .slice(0, 26)
    .map((player, index) => ({ ...player, rank: index + 1 }));

  return {
    updatedAtLabel,
    players: selected,
    rawCount: candidates.length,
  };
}

module.exports = {
  WFA_BASE_URL,
  buildWorldFootballArchiveTeamUrl,
  parseWorldFootballArchiveTeamText,
  htmlToText,
};

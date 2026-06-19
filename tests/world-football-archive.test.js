const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildWorldFootballArchiveTeamUrl,
  parseWorldFootballArchiveTournamentRankings,
  parseWorldFootballArchiveTeamText,
} = require('../scripts/world-football-archive');

test('buildWorldFootballArchiveTeamUrl uses encoded Japanese slug', () => {
  assert.equal(
    buildWorldFootballArchiveTeamUrl({ ja: 'フランス' }),
    'https://worldfootballarchive.com/wc/2026/team/%E3%83%95%E3%83%A9%E3%83%B3%E3%82%B9/',
  );
});

test('parseWorldFootballArchiveTeamText extracts Japanese names, English names, clubs, and final member notes', () => {
  const text = [
    '更新日： 2026-06-02',
    '#Pos 選手名 所属クラブ 代表デビュー W杯招集歴 生年月日 年齢 身長 備考 出場 G A',
    '1 GK',
    'ブライス・サンバ',
    'Brice Samba',
    'ブライス・サンバ（Brice Samba）',
    'スタッド・レンヌFC',
    '1994-04-25生｜32歳｜187cm',
    '代表デビュー：2023-06｜招集歴：26',
    '出場：-',
    '備考：最終メンバー',
    'スタッド・レンヌFC 2023-06 26 1994-04-25 32 187 最終メンバー -',
    '16 GK',
    'マイク・メニャン',
    'Mike Maignan',
    'マイク・メニャン（Mike Maignan）',
    'ACミラン',
    '1995-07-03生｜30歳｜191cm',
    '代表デビュー：2020-10｜招集歴：26',
    '出場：-',
    '備考：最終メンバー',
    'ACミラン 2020-10 26 1995-07-03 30 191 最終メンバー -',
  ].join('\n');

  const result = parseWorldFootballArchiveTeamText(text, {
    country: 'France',
    ja: 'フランス',
  });

  assert.equal(result.updatedAtLabel, '2026-06-02');
  assert.deepEqual(
    result.players.map((player) => ({
      shirtNumber: player.shirtNumber,
      position: player.position,
      name: player.name,
      displayNameJa: player.displayNameJa,
      club: player.club,
      age: player.age,
      dateOfBirth: player.dateOfBirth,
      heightCm: player.heightCm,
      note: player.note,
    })),
    [
      {
        shirtNumber: 1,
        position: 'GK',
        name: 'Brice Samba',
        displayNameJa: 'ブライス・サンバ',
        club: 'スタッド・レンヌFC',
        age: 32,
        dateOfBirth: '1994-04-25',
        heightCm: 187,
        note: '最終メンバー',
      },
      {
        shirtNumber: 16,
        position: 'GK',
        name: 'Mike Maignan',
        displayNameJa: 'マイク・メニャン',
        club: 'ACミラン',
        age: 30,
        dateOfBirth: '1995-07-03',
        heightCm: 191,
        note: '最終メンバー',
      },
    ],
  );
});

test('parseWorldFootballArchiveTeamText keeps English-only rows with physical data', () => {
  const html = `
    <table>
      <tbody>
        <tr class="row-highlight" data-search="noureddin bani attiah アル・ファイサリーsc gk ヨルダン">
          <td>12</td>
          <td>GK</td>
          <td>
            <div class="namecell-main">
              <div class="name-desktop">Noureddin Bani Attiah</div>
              <div class="name-mobile-inline">Noureddin Bani Attiah</div>
            </div>
          </td>
          <td>アル・ファイサリーSC</td>
          <td>2025-10</td>
          <td><span title="2026">26</span></td>
          <td>1993-01-25</td>
          <td>33</td>
          <td>179</td>
          <td>最終メンバー</td>
          <td>-</td>
        </tr>
      </tbody>
    </table>
  `;

  const result = parseWorldFootballArchiveTeamText(html, {
    country: 'Jordan',
    ja: 'ヨルダン',
  });

  assert.equal(result.players.length, 1);
  assert.deepEqual(
    {
      shirtNumber: result.players[0].shirtNumber,
      position: result.players[0].position,
      name: result.players[0].name,
      displayNameJa: result.players[0].displayNameJa,
      club: result.players[0].club,
      age: result.players[0].age,
      dateOfBirth: result.players[0].dateOfBirth,
      heightCm: result.players[0].heightCm,
      note: result.players[0].note,
    },
    {
      shirtNumber: 12,
      position: 'GK',
      name: 'Noureddin Bani Attiah',
      displayNameJa: 'Noureddin Bani Attiah',
      club: 'アル・ファイサリーSC',
      age: 33,
      dateOfBirth: '1993-01-25',
      heightCm: 179,
      note: '最終メンバー',
    },
  );
});

test('parseWorldFootballArchiveTournamentRankings extracts current goal and assist tables', () => {
  const html = `
    <p><span class="update-date">｜最終更新：2026/6/14</span></p>
    <section id="rankings">
      <div class="rank-card">
        <h3>🥇 得点ランキング</h3>
        <table class="rank" aria-label="WC2026 goal ranking">
          <thead><tr><th>順位</th><th>選手</th><th>国</th><th>得点</th></tr></thead>
          <tbody>
            <tr><td class="rank"><b>1</b></td><td>フォラリン・バログン</td><td><a href="/wc/2026/team/%E3%82%A2%E3%83%A1%E3%83%AA%E3%82%AB/">アメリカ</a></td><td class="num"><b>2</b></td></tr>
            <tr><td class="rank"><b>2</b></td><td>ラウル・ヒメネス</td><td><a href="/wc/2026/team/%E3%83%A1%E3%82%AD%E3%82%B7%E3%82%B3/">メキシコ</a></td><td class="num"><b>1</b></td></tr>
          </tbody>
        </table>
      </div>
      <div class="rank-card">
        <h3>🎯 アシストランキング</h3>
        <table class="rank" aria-label="WC2026 assist ranking">
          <tbody>
            <tr><td class="rank"><b>1</b></td><td>クリスチャン・プルシック</td><td><a href="/wc/2026/team/%E3%82%A2%E3%83%A1%E3%83%AA%E3%82%AB/">アメリカ</a></td><td class="num"><b>1</b></td></tr>
          </tbody>
        </table>
      </div>
    </section>
  `;

  const rankings = parseWorldFootballArchiveTournamentRankings(html);

  assert.equal(rankings.updatedAtLabel, '2026-06-14');
  assert.deepEqual(rankings.goals, [
    { rank: 1, name: 'フォラリン・バログン', countryJa: 'アメリカ', goals: 2 },
    { rank: 2, name: 'ラウル・ヒメネス', countryJa: 'メキシコ', goals: 1 },
  ]);
  assert.deepEqual(rankings.assists, [
    { rank: 1, name: 'クリスチャン・プルシック', countryJa: 'アメリカ', assists: 1 },
  ]);
});

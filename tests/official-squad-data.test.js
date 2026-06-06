const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseOfficialSquadText,
  fillMissingPlayerFieldsFromOfficial,
  mergeOfficialSquadsWithExistingPlayers,
} = require('../scripts/official-squad-data');

test('parseOfficialSquadText extracts team and player rows from FIFA squad text', () => {
  const text = [
    'Japan (JPN)',
    '# POS PLAYER NAME FIRST NAME(S) LAST NAME(S)NAME ON SHIRT DOB CLUB HEIGHT (CM)',
    'GK HAYAKAWA Tomoki Tomoki HAYAKAWA HAYAKAWA 03/03/1999Kashima Antlers (JPN) 187',
    'DF TOMIYASU Takehiro Takehiro TOMIYASU TOMIYASU 05/11/1998Ajax (NED) 188',
    'MF/FW ENDO Wataru Wataru ENDO ENDO 09/02/1993Liverpool FC (ENG) 178',
    'ROLE COACH NAME FIRST NAME(S) LAST NAME(S) NATIONALITY',
  ].join('\n');

  const pages = parseOfficialSquadText(text);

  assert.equal(pages.length, 1);
  assert.equal(pages[0].country, 'Japan');
  assert.equal(pages[0].code, 'JPN');
  assert.deepEqual(
    pages[0].players.map((p) => ({
      name: p.name,
      position: p.position,
      club: p.club,
      dateOfBirth: p.dateOfBirth,
      heightCm: p.heightCm,
      source: p.source,
    })),
    [
      { name: 'Tomoki HAYAKAWA', position: 'GK', club: 'Kashima Antlers (JPN)', dateOfBirth: '1999-03-03', heightCm: 187, source: 'fifa-official-squad' },
      { name: 'Takehiro TOMIYASU', position: 'DF', club: 'Ajax (NED)', dateOfBirth: '1998-11-05', heightCm: 188, source: 'fifa-official-squad' },
      { name: 'Wataru ENDO', position: 'MF/FW', club: 'Liverpool FC (ENG)', dateOfBirth: '1993-02-09', heightCm: 178, source: 'fifa-official-squad' },
    ],
  );
});

test('mergeOfficialSquadsWithExistingPlayers preserves Japanese names and existing metrics', () => {
  const official = {
    Japan: [
      {
        id: 'fifa-JPN-1',
        name: 'Tomoki HAYAKAWA',
        position: 'GK',
        club: 'Kashima Antlers (JPN)',
        source: 'fifa-official-squad',
      },
    ],
  };
  const existing = {
    Japan: [
      {
        id: '123',
        name: 'Tomoki Hayakawa',
        officialNameJa: '早川 友基',
        displayNameJa: '早川 友基',
        worldCupGoals: 2,
        clubGoals: 4,
        marketValue: 1000,
      },
    ],
  };

  const merged = mergeOfficialSquadsWithExistingPlayers(official, existing);

  assert.equal(merged.Japan.length, 1);
  assert.equal(merged.Japan[0].displayNameJa, '早川 友基');
  assert.equal(merged.Japan[0].worldCupGoals, 2);
  assert.equal(merged.Japan[0].clubGoals, 4);
  assert.equal(merged.Japan[0].marketValue, 1000);
  assert.equal(merged.Japan[0].source, 'fifa-official-squad');
});

test('fillMissingPlayerFieldsFromOfficial supplements blanks without replacing WFA identity', () => {
  const primary = {
    Paraguay: [
      {
        id: 'wfa-Paraguay-1',
        name: 'Gastón Olveira',
        displayNameJa: 'ガストン・オルベイラ',
        officialNameJa: 'ガストン・オルベイラ',
        club: 'クラブ・オリンピア',
        dateOfBirth: '',
        age: 0,
        heightCm: 0,
        source: 'world-football-archive',
      },
    ],
  };
  const official = {
    Paraguay: [
      {
        name: 'Gaston Olveira',
        club: 'Club Olimpia (PAR)',
        dateOfBirth: '1993-04-21',
        heightCm: 191,
      },
    ],
  };

  const supplemented = fillMissingPlayerFieldsFromOfficial(primary, official, '2026-06-06T00:00:00.000Z');

  assert.deepEqual(supplemented.Paraguay[0], {
    id: 'wfa-Paraguay-1',
    name: 'Gastón Olveira',
    displayNameJa: 'ガストン・オルベイラ',
    officialNameJa: 'ガストン・オルベイラ',
    club: 'クラブ・オリンピア',
    dateOfBirth: '1993-04-21',
    age: 33,
    heightCm: 191,
    source: 'world-football-archive',
    supplementSource: 'fifa-official-squad',
  });
});

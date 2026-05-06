# Result Update Operations

This document defines how to ask Codex to update real World Cup results and what Codex must do when applying those updates.

The app currently uses `roomStates[roomId].results` as the source of truth for finished match results. Group standings, winner display, knockout progression, and point calculations are derived from that data.

## User Request Templates

Use one of these prompts when asking for updates.

### Daily Result Update

```text
/goal 今日終了したワールドカップの試合結果を反映して。
対象日: YYYY-MM-DD
対象: グループリーグ / 決勝トーナメント / 両方
結果:
- Match ID or fixture: Team A 2-1 Team B
- Match ID or fixture: Team C 1-1 Team D, PK 4-3

公式情報を確認して、data/state.json と画面表示に反映し、ブラウザで確認して。
```

### Source-Verified Update

```text
/goal ワールドカップの実結果を公式情報で確認して反映して。
対象日: YYYY-MM-DD
対象: グループリーグ / 決勝トーナメント / 両方
確認元: FIFA公式、または指定URL
反映後に、グループ順位表、決勝Tの勝ち上がり、ポイント表示を確認して。
```

### Correction Update

```text
/goal 反映済みの試合結果を修正して。
対象: matchId
誤: Team A 2-1 Team B
正: Team A 1-1 Team B, PK 5-4
修正後にポイントと決勝Tの勝ち上がりを再確認して。
```

### Top Scorer Update

```text
/goal 得点ランキングを更新して。
対象日: YYYY-MM-DD
得点者:
- Player Name / Country / +N goals
- Player Name / Country / total N goals

得点ランキング画面、国別選手一覧、表示順を確認して。
```

## What Codex Must Do

### 1. Confirm Scope

Before editing, identify:

- update date
- target stage
- target matches
- data source
- whether the request contains final scores, PK scores, or scorer data

If the user asks Codex to verify real-world results, browse current official or reliable sources before editing. Prefer FIFA official match data when available.

### 2. Map Fixtures to Match IDs

Group-stage IDs are defined in `GROUP_STAGE_DEFS`:

- `A-1` to `A-6`
- `B-1` to `B-6`
- ...
- `L-1` to `L-6`

Knockout IDs are defined in `KO_ROUNDS`:

- Round of 32: `R32-0` to `R32-15`
- Round of 16: `R16-0` to `R16-7`
- Quarterfinals: `QF-0` to `QF-3`
- Semifinals: `SF-0` to `SF-1`
- Final: `F-0`
- Third-place match: `3RD-0`

When the user provides only team names, Codex must find the matching fixture in the app data before writing results.

### 3. Write Result Data

Group-stage result shape:

```json
{
  "home": 2,
  "away": 1,
  "status": "final"
}
```

Knockout regular-time or extra-time result shape:

```json
{
  "home": 2,
  "away": 1,
  "winnerSide": "home",
  "decidedBy": "REG",
  "homePen": null,
  "awayPen": null,
  "status": "final",
  "locked": true
}
```

Knockout PK result shape:

```json
{
  "home": 1,
  "away": 1,
  "winnerSide": "away",
  "decidedBy": "PK",
  "homePen": 3,
  "awayPen": 4,
  "status": "final",
  "locked": true
}
```

Rules:

- `winnerSide` must be `home` or `away`.
- If `home !== away`, `winnerSide` must match the higher regular score.
- If `home === away` in knockout, PK data or a winner decision is required.
- PK scores must not be equal.
- Group-stage draws do not need `winnerSide`.

### 4. Persist to the Current Storage

Current storage:

- local app state: `data/state.json`
- server API: `POST /api/state/result`
- browser fallback: room-local localStorage when running the HTML directly

Preferred update path while using the local server:

1. Read the current room id from `data/state.json` or the active user.
2. Update `roomStates[roomId].results`.
3. Keep existing predictions and settings unchanged.
4. Do not clear unrelated room data.

If the app is later migrated to Firebase, the same result objects should be written to the room state's `results` field.

### 5. Recalculate Derived Views

The app derives these from `results`; Codex should verify them after every update:

- group standings: played, wins, draws, losses, goals for, goals against, goal difference, points
- group-stage prediction points: winner hit and exact score hit
- knockout route: winner advances to the next round
- knockout result display: score, PK score if needed, winner badge, red route line
- knockout points: winner hit, exact score or PK scoring, final podium points
- home score summary: group and knockout point breakdown

### 6. Update Top Scorer Data

Top scorer data currently comes from `data/players.generated.json`.

When updating scorer totals:

- update the player's `goals`
- preserve `clubGoals` and other existing player fields
- add a player only when the app needs to display a scorer who is missing
- keep country keys aligned with app team names, such as `Korea Republic`, `Côte d'Ivoire`, `IR Iran`, and `Cabo Verde`
- verify the leaderboard sort order after editing

### 7. Browser Verification

After updating results, Codex must verify:

- Group page shows the final score on the relevant match card.
- Group standings changed correctly.
- Knockout page shows the score in the center of the card.
- Knockout winner badge appears next to the winning team.
- Next-round participant is updated.
- Home page total and breakdown reflect the new points.
- Leaderboard reflects scorer updates when scorer data changed.

Use the correct app URL. If port `3000` is occupied by another app, use the direct local HTML file or a clean alternate port and clearly state which one was verified.

### 8. Commit / Deploy Guidance

For production updates:

1. Apply the result data.
2. Run syntax checks.
3. Verify in browser.
4. Commit with a message such as `Update World Cup results YYYY-MM-DD`.
5. Push to `main`.
6. Deploy hosting.

Only commit unrelated generated files such as `data/players.generated.json` when the request includes scorer updates or player data refresh.

## Known Gaps To Build Later

- Admin-only result input screen.
- Bulk result import from CSV or JSON.
- Automated daily result fetch job.
- Official scorer import for the top scorer ranking.
- Match kickoff locking based on real kickoff time.


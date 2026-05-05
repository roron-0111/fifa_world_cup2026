# Knockout Bracket Design

## Goal

Replace the current knockout page with a tournament-board interface similar to a printed bracket.
The page must support score predictions, penalty shootout handling, clear winner display, and stable layout on both desktop and mobile.

## Core Experience

- Use a single wide bracket canvas instead of round-by-round cards.
- Show teams and matches from left to right.
- Use red lines for the selected or confirmed winning route.
- Use pale lines for unresolved or losing routes.
- Let users tap a match node to enter a prediction.
- Keep the current room sync path by storing knockout data under `koPreds`.

## Bracket Scope

The board represents:

- Round of 32: 16 matches
- Round of 16: 8 matches
- Quarter-finals: 4 matches
- Semi-finals: 2 matches
- Final: 1 match
- Third-place match: 1 match, derived from the semi-final losers
- Champion slot: derived from the final winner

The current public group-stage standings are not sufficient to derive actual 2026 best-third allocations yet.
Until the official knockout paths are wired in, Round of 32 slots use qualification placeholders such as `Group A 1st`, `Group B 2nd`, and `Best 3rd 1`.

## Prediction Data

Predictions are stored per room and per user:

```json
{
  "koPreds": {
    "user-id": {
      "R32-0": {
        "home": 2,
        "away": 1,
        "winnerSide": "home",
        "decidedBy": "REG",
        "homePen": null,
        "awayPen": null,
        "locked": true,
        "updatedAt": "2026-05-05T00:00:00.000Z"
      }
    }
  }
}
```

Legacy predictions that are stored as `"home"` or `"away"` are normalized to the new structure when rendered.

## Result Data

Actual results can use the existing `results` store with the same match ids:

```json
{
  "results": {
    "R32-0": {
      "home": 1,
      "away": 1,
      "winnerSide": "away",
      "decidedBy": "PK",
      "homePen": 3,
      "awayPen": 4,
      "status": "final"
    }
  }
}
```

Display priority:

1. Actual result, if present
2. Selected viewer's prediction, if present
3. Placeholder seed

Each match card shows prediction rows:

- Own prediction: editable for logged-in room members.
- Opponent prediction: read-only display inside the same card.
- Guest: read-only display only.

## Prediction Modal

Each match opens a bottom modal with:

- Home score
- Away score
- Winner selector
- Penalty shootout toggle
- Penalty score fields when PK is enabled
- Save button
- Clear button

Rules:

- If the regular score is tied, a winner must be selected.
- If PK is enabled, both PK scores are shown and the PK winner controls `winnerSide`.
- If the regular score is not tied, PK is disabled for the saved prediction.
- A match can be predicted only when both sides are known enough to display. Placeholder seeds are allowed.
- The modal must never rely on long inline labels that can break narrow screens.

## Points

Knockout points are calculated independently from group-stage points.
Room settings include:

- `resultPts`: group-stage result hit
- `exactPts`: group-stage exact score hit
- `koWinnerPts`: winner prediction hit
- `koExactPts`: exact score hit
- `koPenaltyPts`: penalty winner hit when the actual match is decided by PK
- `koChampionPts`: champion hit
- `koRunnerUpPts`: runner-up hit
- `koThirdPlacePts`: third-place hit
- `koRunnerUpEnabled`: whether runner-up scoring is active
- `koThirdPlaceEnabled`: whether third-place scoring is active

Scoring rules:

- Group-stage result/exact settings are shown separately from knockout result/exact settings.
- Winner hit: prediction winner equals actual winner.
- Exact hit: prediction home/away score equals actual home/away score.
- Penalty hit: actual `decidedBy` is `PK` and predicted PK winner equals actual winner.
- Champion hit: predicted final winner equals actual final winner.
- Runner-up hit: enabled only when `koRunnerUpEnabled` is true; predicted final loser equals actual final loser.
- Third-place hit: enabled only when `koThirdPlaceEnabled` is true; predicted third-place match winner equals actual third-place match winner.

## Podium Predictions

The knockout page includes explicit selectors for:

- Champion
- Runner-up
- Third place

These are stored under `koPreds[userId]._podium`.

```json
{
  "_podium": {
    "champion": "A組1位",
    "runnerUp": "B組2位",
    "third": "C組1位"
  }
}
```

The bracket-derived picks are used as fallbacks when explicit podium picks are not present.
This lets users either fill the whole bracket path or directly set the final podium.
Runner-up and third-place scoring can be disabled from settings when a room wants to score only the champion.

## Layout Rules

- The bracket canvas has fixed logical coordinates and scrolls horizontally on mobile.
- Floating round controls are not shown on the knockout page.
- Mobile movement is done by directly swiping the bracket canvas horizontally.
- Desktop keeps a minimal native horizontal scrollbar at the bottom of the viewport and syncs it with the bracket canvas, so users can move sideways without scrolling to the very bottom of the tournament table.
- The bracket's own native horizontal scrollbar is visually hidden so the fixed bottom scrollbar is the only visible horizontal control.
- The global top navigation stays fixed on desktop; the knockout page does not show a duplicate page title below it.
- Round names are shown once as centered column labels above the bracket instead of inside every match card, with subtle vertical dashed guide lines marking each round column. The final and third-place match share a column label as `決勝（3位決定戦）`.
- Match cards use a fixed compact height. Teams are shown left/right with the actual score in the center, so adding a result never changes card height or overlaps lower matches.
- Team names clamp to two lines.
- Score blocks use fixed-width numerals.
- PK details render on a separate compact row.
- Connector lines are SVG paths behind the nodes.
- Red paths are drawn from the winner side toward the next round.
- Final and champion nodes receive stronger visual emphasis.
- Third-place match is separated below the final path to avoid visual clutter.

## Implementation Notes

- Keep the existing `koPreds` server API and storage key.
- Add helper functions for prediction normalization, score formatting, winner resolution, and knockout scoring.
- Replace the old `BracketScreen` and its card-grid CSS with a bracket canvas.
- Keep legacy helpers only where needed for compatibility during migration.
- Update the bottom navigation label from `決勝T(未)` to `決勝T`.

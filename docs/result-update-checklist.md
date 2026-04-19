# Result Update Checklist

This document is the running checklist for match/result updates during the tournament.
If we keep the app on a free Firebase setup, manual updates will be the default operation.

## 1. Match result updates

Update the actual score for each finished match.

- `home` score
- `away` score
- match completion status
- overtime / penalty shootout handling, if needed

## 2. Group standings

After each result update, recalculate:

- matches played
- wins
- draws
- losses
- goals for
- goals against
- goal difference
- points

If tie-break rules need to be reflected more strictly later, record the rule source before changing the logic.

## 3. Player scoring

Update player goal totals when goals are confirmed.

- `2026 World Cup goals`
- player ranking order
- top scorer display

If assist data or other scoring stats become necessary later, add them here.

## 4. Knockout qualification

When group-stage advancement is decided, update:

- qualified teams
- round of 16 seeds
- knockout bracket entries
- third-place match entries, if used

## 5. Knockout round propagation

When knockout rounds progress, update:

- winners
- losers
- next-round match participants
- champion / runner-up / third place

## 6. Prediction locking

When a match kickoff is reached:

- lock new predictions for that match
- prevent re-editing unless explicitly unlocked

## 7. Points

Recalculate after every result update:

- result-hit points
- exact-score points
- total points for each user
- opponent comparison

## 8. Operational notes

- This app currently treats `results` as the source that drives point calculation.
- If updates are done manually, follow the order:
  1. Update result
  2. Recalculate standings
  3. Recalculate player goals
  4. Propagate knockout advancement
  5. Lock or unlock predictions as needed
  6. Refresh the live UI


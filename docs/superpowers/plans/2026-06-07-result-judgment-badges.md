# Result Judgment Badges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move batch result reflection to the home screen, and add compact judgment badges to group-stage cards and knockout bracket nodes without breaking the current dense layouts.

**Architecture:** Keep the existing single-file HTML app and the current room/result APIs. Add one shared judgment-status helper inside `project/World Cup 2026.html` so home, group stage, and knockout use the same wording and color states. Home owns the admin result-reflection workflow; group and knockout only render passive status badges from existing `results` and prediction data.

**Tech Stack:** Plain HTML + React UMD, localStorage/sessionStorage helpers already in the app, Node `node:test` string-based UI checks.

---

### Task 1: Lock the new UI contract with tests

**Files:**
- Modify: `tests/settings-admin-ui.test.js`
- Create: `tests/result-judgment-ui.test.js`

- [ ] **Step 1: Add failing assertions for the new home reflection card**

```js
assert.match(html, /結果判定を一括反映/);
assert.match(html, /試合結果一覧/);
assert.match(html, /className="result-judge-card"/);
```

- [ ] **Step 2: Add failing assertions for group-stage judgment badges**

```js
assert.match(html, /className=\{`match-status-badge \$\{groupJudgment\.state\}`\}/);
assert.match(html, /判定待ち/);
assert.match(html, /的中/);
assert.match(html, /不一致/);
```

- [ ] **Step 3: Add failing assertions for knockout badge placement**

```js
assert.match(html, /className="ko-match-meta"/);
assert.match(html, /className="ko-match-stadium"/);
assert.match(html, /className=\{`ko-match-status \$\{koJudgment\.state\}`\}/);
assert.match(html, /7\/10（\w）19:00/);
```

- [ ] **Step 4: Run the new test file and confirm it fails for missing UI**

Run: `node --test tests/result-judgment-ui.test.js`
Expected: FAIL because the new home card and badge classes are not present yet.

### Task 2: Move result reflection to the home screen

**Files:**
- Modify: `project/World Cup 2026.html`

- [ ] **Step 1: Move the admin result input and submit action out of SettingsScreen**
- [ ] **Step 2: Add a home-only card named `result-judge-card` with the primary button text `結果判定を一括反映`**
- [ ] **Step 3: Reuse the stored admin token default (`WC2026`) from the existing token flow so the home action can submit without a second token UI**
- [ ] **Step 4: Keep the existing update history list on home, but relabel the section so it reads as the reflection/status area instead of settings-only admin UI**
- [ ] **Step 5: Remove the old result-update block from SettingsScreen so the settings page only keeps the player-data refresh control**
- [ ] **Step 6: Run the focused UI tests and confirm the home card appears only on the home page contract**

### Task 3: Add shared judgment badges for group matches

**Files:**
- Modify: `project/World Cup 2026.html`
- Modify: `tests/result-judgment-ui.test.js`

- [ ] **Step 1: Add a shared helper that turns `(prediction, actualResult)` into `{state,label}` with `判定待ち`, `的中`, or `不一致`**
- [ ] **Step 2: Render the badge in the group match card header without changing the existing score, lock, or prediction rows**
- [ ] **Step 3: Use the badge for both self and opponent rows only if there is room; otherwise keep one compact header badge so the card stays dense**
- [ ] **Step 4: Run the UI tests and confirm the badge text appears in the HTML contract**

### Task 4: Fit judgment badges into the knockout bracket nodes

**Files:**
- Modify: `project/World Cup 2026.html`
- Modify: `tests/result-judgment-ui.test.js`

- [ ] **Step 1: Re-layout the knockout top meta row so the date/time stays on the first line and the stadium name moves to a second line on the left**
- [ ] **Step 2: Reserve the right side of the meta row for the judgment badge so there is always space for the new state pill**
- [ ] **Step 3: Render the same shared status labels in knockout nodes, but keep the node height and connector geometry stable**
- [ ] **Step 4: Verify the current bracket still shows the round labels, stadium labels, and line routing correctly after the node meta change**

### Task 5: Final verification

**Files:**
- Modify: none

- [ ] **Step 1: Run the full test suite**

Run: `node --test`
Expected: all tests pass.

- [ ] **Step 2: Open the app in the in-app browser and verify**
  - Home shows the result reflection card and the batch button.
  - Group cards show one compact judgment badge.
  - Knockout nodes keep the bracket layout and show the badge in the reserved meta area.

- [ ] **Step 3: Commit the finished changes**

```bash
git add -A
git commit -m "Move result reflection to home and add match judgment badges"
```

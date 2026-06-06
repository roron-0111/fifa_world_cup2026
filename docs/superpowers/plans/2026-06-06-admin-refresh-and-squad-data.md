# Admin Refresh And Squad Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin-triggered data refresh from official squad data, surface last updated time prominently, and keep Japanese-name sourcing where reliable.

**Architecture:** Keep the current JSON-backed Node server. Add small focused modules for admin auth, update metadata, and FIFA squad parsing so the large HTML file and server stay minimally changed. Use FIFA official squad PDF as the canonical all-team roster source, with JFA as the Japanese-name source for Japan and transliteration/overrides for other teams until a full Japanese 1,248-player structured source is available.

**Tech Stack:** Node.js CommonJS, built-in `node:test`, `pdf-parse`, existing single-file React UMD UI.

---

### Task 1: Official Squad Parsing

**Files:**
- Create: `scripts/official-squad-data.js`
- Test: `tests/official-squad-data.test.js`
- Modify: `package.json`

- [ ] Write failing parser tests for extracting a team, 26 players, position, English name, club, and source metadata from FIFA squad text.
- [ ] Run `npm test -- tests/official-squad-data.test.js` and confirm failure because the module does not exist.
- [ ] Implement `parseOfficialSquadText`, `buildOfficialSquadPlayers`, and `mergeOfficialSquadsWithExistingPlayers`.
- [ ] Run the test and confirm pass.

### Task 2: Admin Refresh API

**Files:**
- Create: `lib/admin.js`
- Test: `tests/admin.test.js`
- Modify: `server.js`

- [ ] Write failing tests for token validation and metadata formatting.
- [ ] Run `npm test -- tests/admin.test.js` and confirm failure because the module does not exist.
- [ ] Implement admin token validation, `state.meta.dataRefresh`, and no next-day cooldown.
- [ ] Add `POST /api/admin/refresh-players` guarded by `WC26_ADMIN_TOKEN`.
- [ ] Run tests and `node --check server.js`.

### Task 3: UI Controls And Freshness Display

**Files:**
- Modify: `project/World Cup 2026.html`
- Modify: `server.js`

- [ ] Add bootstrap `dataStatus`.
- [ ] Add a prominent home freshness card using Japan time by default.
- [ ] Add settings admin token input and refresh button.
- [ ] Refresh local player data and freshness status after successful admin update.
- [ ] Run `node --check server.js` and start the app for browser verification.

### Task 4: Source Documentation

**Files:**
- Modify: `data/sources.json`
- Modify: `docs/result-update-checklist.md`

- [ ] Record FIFA official squad PDF, FIFA Japanese announcement, JFA Japan squad, and Japanese media fallback notes.
- [ ] Document that Japanese structured all-country names are not currently available from a single reliable source.
- [ ] Document production update flow: admin updates in app, Codex fallback for corrections.


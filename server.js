const fs = require('fs');
const path = require('path');
const http = require('http');
const { execFile } = require('child_process');
const { URL } = require('url');

const ROOT = __dirname;
const PROJECT_HTML = path.join(ROOT, 'project', 'World Cup 2026.html');
const FLAGS_DIR = path.join(ROOT, 'project', 'flags');
const STATE_FILE = path.join(ROOT, 'data', 'state.json');
const PLAYERS_FILE = path.join(ROOT, 'data', 'players.generated.json');
const SOURCES_FILE = path.join(ROOT, 'data', 'sources.json');
const PORT = Number(process.env.PORT || 3000);

const DEFAULT_STATE = {
  rooms: [],
  users: [],
  roomStates: {},
};

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

let state = readJson(STATE_FILE, DEFAULT_STATE);
const sources = readJson(SOURCES_FILE, {});

function loadPlayerData() {
  const generated = readJson(PLAYERS_FILE, { generatedAt: null, sources: {}, playersByCountry: {} });
  return {
    ...generated,
    playersByCountry: generated.playersByCountry || {},
  };
}

const AUTO_REFRESH_PLAYERS = process.env.WC26_AUTO_REFRESH_PLAYERS !== '0';
const PLAYER_REFRESH_INTERVAL_MS = Number(process.env.WC26_PLAYER_REFRESH_INTERVAL_MS || 6 * 60 * 60 * 1000);
let playerRefreshPromise = null;

function refreshPlayerData() {
  if (playerRefreshPromise) {
    return playerRefreshPromise;
  }
  playerRefreshPromise = new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [path.join(ROOT, 'scripts', 'import-player-data.js')],
      { cwd: ROOT },
      (error, stdout, stderr) => {
        playerRefreshPromise = null;
        if (error) {
          const detail = String(stderr || stdout || error.message || '選手データの更新に失敗しました').trim();
          reject(new Error(detail));
          return;
        }
        resolve(loadPlayerData());
      },
    );
  });
  return playerRefreshPromise;
}

async function runPlayerRefresh(trigger) {
  try {
    const data = await refreshPlayerData();
    const ts = data.generatedAt ? new Date(data.generatedAt).toISOString() : 'unknown';
    console.log(`[player-data] refreshed via ${trigger} at ${ts}`);
    return data;
  } catch (error) {
    console.error(`[player-data] refresh failed via ${trigger}: ${error.message}`);
    return null;
  }
}

function schedulePlayerRefreshes() {
  if (!AUTO_REFRESH_PLAYERS) return;
  setTimeout(() => {
    runPlayerRefresh('startup');
  }, 1000);
  setInterval(() => {
    runPlayerRefresh('interval');
  }, PLAYER_REFRESH_INTERVAL_MS);
}

function persistState() {
  writeJson(STATE_FILE, state);
}

function ensureStateShape() {
  state.rooms ||= [];
  state.users ||= [];
  state.roomStates ||= {};
  state.roomStates = Object.fromEntries(Object.entries(state.roomStates).map(([roomId, roomState]) => {
    const next = { ...(roomState || {}) };
    next.predictionsV2 = next.predictionsV2 || next.predictions || {};
    delete next.predictions;
    next.results ||= {};
    next.locked ||= {};
    next.koPreds ||= {};
    next.settings ||= { resultPts: 1, exactPts: 2 };
    return [roomId, next];
  }));
  state.rooms = state.rooms.map((room) => ({
    ...room,
    members: Array.isArray(room.members) ? [...new Set(room.members)] : [],
    maxMembers: Number(room.maxMembers || 2),
  })).map((room) => {
    const next = { ...room };
    delete next.adminId;
    return next;
  });
  const seenMemberCodes = new Set();
  state.users = state.users.map((user) => {
    const next = { ...user };
    delete next.isAdmin;
    let memberCode = String(next.memberCode || '').trim().toUpperCase();
    while (!memberCode || seenMemberCodes.has(memberCode)) {
      memberCode = genMemberCode();
    }
    next.memberCode = memberCode;
    seenMemberCodes.add(memberCode);
    return next;
  });
}

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function genMemberCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

function makeRoomState() {
  return {
    predictionsV2: {},
    results: {},
    locked: {},
    koPreds: {},
    settings: { resultPts: 1, exactPts: 2 },
  };
}

function ensureRoomState(roomId) {
  ensureStateShape();
  if (!state.roomStates[roomId]) {
    state.roomStates[roomId] = makeRoomState();
  } else {
    state.roomStates[roomId].predictionsV2 ||= {};
    state.roomStates[roomId].results ||= {};
    state.roomStates[roomId].locked ||= {};
    state.roomStates[roomId].koPreds ||= {};
    state.roomStates[roomId].settings ||= { resultPts: 1, exactPts: 2 };
  }
  return state.roomStates[roomId];
}

function getRoomByCode(code) {
  return state.rooms.find((room) => room.code === code);
}

function getRoomById(roomId) {
  return state.rooms.find((room) => room.id === roomId);
}

function getUserById(userId) {
  return state.users.find((user) => user.id === userId);
}

function getUserByMemberCode(memberCode) {
  const code = String(memberCode || '').trim().toUpperCase();
  if (!code) return null;
  return state.users.find((user) => String(user.memberCode || '').toUpperCase() === code);
}

function getRoomSnapshot(room) {
  if (!room) return null;
  const roomState = ensureRoomState(room.id);
  return {
    ...room,
    members: [...room.members],
    state: roomState,
  };
}

function bootstrapPayload() {
  const playerData = loadPlayerData();
  return {
    state,
    playersByCountry: playerData.playersByCountry || {},
    sources,
    generatedAt: playerData.generatedAt || null,
  };
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function saveAndRespond(res, payload, statusCode = 200) {
  persistState();
  sendJson(res, statusCode, payload);
}

function joinRoom({ username, roomCode, memberCode, userId }) {
  const rawName = String(username || '').trim();
  if (!rawName) {
    return { error: 'ユーザー名を入力してください', status: 400 };
  }

  const rooms = state.rooms;
  let room = null;
  if (roomCode && String(roomCode).trim()) {
    const code = String(roomCode).trim().toUpperCase();
    room = getRoomByCode(code);
    if (!room) {
      room = {
        id: `room-${Date.now()}`,
        code,
        members: [],
        maxMembers: 2,
      };
      rooms.push(room);
    }
  } else {
    let code;
    do {
      code = genCode();
    } while (getRoomByCode(code));
    room = {
      id: `room-${Date.now()}`,
      code,
      members: [],
      maxMembers: 2,
    };
    rooms.push(room);
  }

  const requestedMemberCode = String(memberCode || '').trim().toUpperCase();
  const byCode = requestedMemberCode ? getUserByMemberCode(requestedMemberCode) : null;
  const existingUser = byCode && byCode.roomId === room.id ? byCode : null;

  if (room.members.length >= (room.maxMembers || 2) && !existingUser) {
    return { error: 'このルームは満員です', status: 409 };
  }

  if (existingUser) {
    existingUser.roomId = room.id;
    if (!room.members.includes(existingUser.id)) {
      room.members.push(existingUser.id);
    }
    ensureRoomState(room.id);
    return {
      room: getRoomSnapshot(room),
      user: existingUser,
      rooms: state.rooms,
      users: state.users,
    };
  }

  let generatedMemberCode;
  do {
    generatedMemberCode = genMemberCode();
  } while (state.users.some((u) => u.memberCode === generatedMemberCode));

  const user = {
    id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    username: rawName,
    memberCode: generatedMemberCode,
    roomId: room.id,
  };
  state.users.push(user);

  if (!room.members.includes(user.id)) {
    room.members.push(user.id);
  }
  ensureRoomState(room.id);

  return {
    room: getRoomSnapshot(room),
    user,
    rooms: state.rooms,
    users: state.users,
  };
}

function requireRoomAndUser(roomId, userId) {
  const room = getRoomById(roomId);
  if (!room) return { error: 'ルームが見つかりません', status: 404 };
  if (!room.members.includes(userId)) return { error: 'ルームの参加者ではありません', status: 403 };
  return { room };
}

function updateRoomState(roomId, patch) {
  const roomState = ensureRoomState(roomId);
  Object.assign(roomState, patch);
  return roomState;
}

function applyRoomStateKey(roomId, key, value, userId) {
  const room = getRoomById(roomId);
  if (!room) return { error: 'ルームが見つかりません', status: 404 };
  if (!room.members.includes(userId)) return { error: 'ルームの参加者ではありません', status: 403 };

  const roomState = ensureRoomState(roomId);

  if (key === 'predictionsV2' || key === 'locked' || key === 'koPreds' || key === 'results' || key === 'settings') {
    roomState[key] = value;
    return { roomState };
  }

  return { error: `未対応のキーです: ${key}`, status: 400 };
}

function buildPublicState(roomId) {
  const playerData = loadPlayerData();
  return {
    room: getRoomSnapshot(getRoomById(roomId)),
    playersByCountry: playerData.playersByCountry || {},
    roomState: roomId ? ensureRoomState(roomId) : null,
    rooms: state.rooms,
    users: state.users,
  };
}

function serveHtml(res) {
  let html = fs.readFileSync(PROJECT_HTML, 'utf8');
  const boot = `<script>window.__WC26_BOOTSTRAP__=${JSON.stringify(bootstrapPayload())};</script>`;
  html = html.replace(
    '<script src="https://unpkg.com/react@18.3.1/umd/react.development.js"',
    `${boot}\n<script src="https://unpkg.com/react@18.3.1/umd/react.development.js"`,
  );
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(html);
}

function serveStaticFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = {
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
  }[ext] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const { pathname } = requestUrl;

    if (req.method === 'GET' && pathname === '/') {
      serveHtml(res);
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/flags/')) {
      const requested = pathname.replace(/^\/flags\//, '');
      const filePath = path.normalize(path.join(FLAGS_DIR, requested));
      if (!filePath.startsWith(path.normalize(FLAGS_DIR))) {
        sendJson(res, 400, { ok: false, error: 'Invalid flag path' });
        return;
      }
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        sendJson(res, 404, { ok: false, error: 'Flag not found' });
        return;
      }
      serveStaticFile(res, filePath);
      return;
    }

    if (req.method === 'GET' && /^\/[^/]+\.(png|jpe?g|gif|svg|ico)$/i.test(pathname)) {
      const requested = pathname.replace(/^\//, '');
      const filePath = path.normalize(path.join(ROOT, requested));
      if (!filePath.startsWith(path.normalize(ROOT))) {
        sendJson(res, 400, { ok: false, error: 'Invalid asset path' });
        return;
      }
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        sendJson(res, 404, { ok: false, error: 'Asset not found' });
        return;
      }
      serveStaticFile(res, filePath);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/bootstrap') {
      const roomId = requestUrl.searchParams.get('roomId') || '';
      sendJson(res, 200, buildPublicState(roomId));
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/api/room/')) {
      const roomId = pathname.split('/').pop();
      sendJson(res, 200, buildPublicState(roomId));
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/api/players/')) {
      const playerData = loadPlayerData();
      const country = decodeURIComponent(pathname.split('/').pop());
      sendJson(res, 200, {
        country,
        players: playerData.playersByCountry?.[country] || [],
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/auth/join') {
      const body = await readBody(req);
      const result = joinRoom(body);
      if (result.error) {
        sendJson(res, result.status || 400, { ok: false, error: result.error });
        return;
      }
      saveAndRespond(res, { ok: true, ...result });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/state') {
      const body = await readBody(req);
      const result = applyRoomStateKey(body.roomId, body.key, body.value, body.userId);
      if (result.error) {
        sendJson(res, result.status || 400, { ok: false, error: result.error });
        return;
      }
      saveAndRespond(res, { ok: true, ...result });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/state/prediction') {
      const body = await readBody(req);
      const check = requireRoomAndUser(body.roomId, body.userId);
      if (check.error) {
        sendJson(res, check.status, { ok: false, error: check.error });
        return;
      }
      const roomState = ensureRoomState(body.roomId);
      roomState.predictionsV2 ||= {};
      roomState.predictionsV2[body.userId] ||= {};
      roomState.predictionsV2[body.userId][body.matchId] = body.prediction;
      saveAndRespond(res, { ok: true, roomState });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/state/result') {
      const body = await readBody(req);
      const check = requireRoomAndUser(body.roomId, body.userId);
      if (check.error) {
        sendJson(res, check.status, { ok: false, error: check.error });
        return;
      }
      const roomState = ensureRoomState(body.roomId);
      roomState.results ||= {};
      roomState.results[body.matchId] = body.result;
      saveAndRespond(res, { ok: true, roomState });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/state/ko') {
      const body = await readBody(req);
      const check = requireRoomAndUser(body.roomId, body.userId);
      if (check.error) {
        sendJson(res, check.status, { ok: false, error: check.error });
        return;
      }
      const roomState = ensureRoomState(body.roomId);
      roomState.koPreds ||= {};
      roomState.koPreds[body.userId] ||= {};
      roomState.koPreds[body.userId][body.matchId] = body.side;
      saveAndRespond(res, { ok: true, roomState });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/state/settings') {
      const body = await readBody(req);
      const check = requireRoomAndUser(body.roomId, body.userId);
      if (check.error) {
        sendJson(res, check.status, { ok: false, error: check.error });
        return;
      }
      const roomState = ensureRoomState(body.roomId);
      roomState.settings = {
        ...roomState.settings,
        ...body.settings,
      };
      saveAndRespond(res, { ok: true, roomState });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/state/clear') {
      const body = await readBody(req);
      const check = requireRoomAndUser(body.roomId, body.userId);
      if (check.error) {
        sendJson(res, check.status, { ok: false, error: check.error });
        return;
      }
      const current = ensureRoomState(body.roomId);
      state.roomStates[body.roomId] = {
        ...makeRoomState(),
        settings: current.settings || { resultPts: 1, exactPts: 2 },
      };
      saveAndRespond(res, { ok: true, roomState: state.roomStates[body.roomId] });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: error.message }));
  }
});

ensureStateShape();
if (!state.rooms.length) {
  const demoRoom = {
    id: 'room-demo',
    code: 'FIFA26',
    members: ['demo-opp'],
    maxMembers: 2,
  };
  state.rooms.push(demoRoom);
  state.users.push({
    id: 'demo-opp',
    username: 'KENTA',
    roomId: demoRoom.id,
    memberCode: genMemberCode(),
  });
  state.roomStates[demoRoom.id] = makeRoomState();
}
if (!state.roomStates['room-demo']) {
  state.roomStates['room-demo'] = makeRoomState();
}
persistState();
schedulePlayerRefreshes();

server.listen(PORT, () => {
  console.log(`World Cup 2026 app running at http://localhost:${PORT}`);
});

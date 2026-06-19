const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'project', 'World Cup 2026.html'), 'utf8');
const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

test('static shared room login reuses a unique existing username when local member code is missing', () => {
  assert.match(html, /function normalizedUserNameKey\(name\)\{/);
  assert.match(html, /function findUniqueRoomUserByName\(users,roomId,username\)\{/);
  assert.match(html, /const existing=\(reuseMemberCode&&shared\.users\.find/);
  assert.match(html, /\|\|findUniqueRoomUserByName\(shared\.users,shared\.room\.id,rawName\)\|\|null;/);
  assert.match(html, /if\(shared\.room\.members\.length>=shared\.room\.maxMembers&&!existing\)\{setErr\('このルームは満員です'\);return;\}/);
});

test('server room login also reuses a unique existing username before treating the room as full', () => {
  assert.match(server, /function normalizedUserNameKey\(name\) \{/);
  assert.match(server, /function getUniqueRoomUserByName\(roomId, username\) \{/);
  assert.match(server, /const byName = getUniqueRoomUserByName\(room\.id, rawName\);/);
  assert.match(server, /const existingUser = existingByCode \|\| existingById \|\| byName \|\| null;/);
  assert.ok(
    server.indexOf('const existingUser = existingByCode || existingById || byName || null;') <
      server.indexOf("return { error: 'このルームは満員です', status: 409 };"),
  );
});

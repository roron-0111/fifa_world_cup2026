const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'firebase.json'), 'utf8'));
const firestoreRules = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');

test('firebase deploy includes Firestore rules for shared static rooms', () => {
  assert.equal(firebaseConfig.firestore.rules, 'firestore.rules');
  assert.equal(firebaseConfig.firestore.indexes, 'firestore.indexes.json');
});

test('firestore rules allow only shared room documents', () => {
  assert.match(firestoreRules, /match \/rooms\/\{roomCode\}/);
  assert.match(firestoreRules, /allow read: if true;/);
  assert.match(firestoreRules, /allow create, update: if isValidRoomPayload\(\);/);
  assert.match(firestoreRules, /request\.resource\.data\.keys\(\)\.hasOnly\(\['payload', 'updatedAt'\]\)/);
  assert.match(firestoreRules, /match \/\{document=\*\*\} \{\s*allow read, write: if false;/);
});

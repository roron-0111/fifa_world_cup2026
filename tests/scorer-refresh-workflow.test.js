const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const workflowPath = path.join(root, '.github', 'workflows', 'refresh-player-data.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

test('scorer ranking has a real source refresh workflow', () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /cron: "0 3 \* \* \*"/);
  assert.match(workflow, /npm run refresh:data/);
  assert.match(workflow, /data\/players\.generated\.json project\/players\.generated\.json/);
  assert.match(workflow, /firebase-tools deploy --only hosting --project fifa-world-cup2026/);
  assert.equal(packageJson.scripts['refresh:data'], 'npm run import:data && npm test');
});

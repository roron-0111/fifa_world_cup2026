const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'project', 'World Cup 2026.html'), 'utf8');
const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

test('result reflection is limited to match results on the server path', () => {
  assert.match(server, /function playerDataResponseFields\(playerData\) \{/);
  assert.match(server, /async function refreshPlayerDataForResultReflection\(\) \{/);
  assert.doesNotMatch(server, /const playerRefresh = await refreshPlayerDataForResultReflection\(\);/);
  assert.doesNotMatch(server, /\.\.\.playerRefresh,/);
  assert.match(server, /playersByCountry: playerData\.playersByCountry \|\| \{\}/);
  assert.match(server, /meta: playerData\.meta \|\| \{\}/);
  assert.match(server, /dataStatus: makeDataRefreshStatus\(state\)/);
});

test('static hosting loads scorer ranking data on startup and from leaderboard refresh', () => {
  assert.match(html, /async function refreshStaticPlayerData\(\)\{/);
  assert.match(html, /const REMOTE_PLAYER_DATA_JSON_URL='https:\/\/raw\.githubusercontent\.com\/roron-0111\/fifa_world_cup2026\/main\/project\/players\.generated\.json';/);
  assert.match(html, /const GITHUB_PLAYER_DATA_CONTENTS_URL='https:\/\/api\.github\.com\/repos\/roron-0111\/fifa_world_cup2026\/contents\/project\/players\.generated\.json\?ref=main';/);
  assert.match(html, /function decodeBase64Text\(value\)\{/);
  assert.match(html, /async function fetchGitHubContentsJson\(url\)\{/);
  assert.match(html, /const blobRes=await fetch\(meta\.git_url,\{cache:'no-store',headers:\{Accept:'application\/vnd\.github\+json'\}\}\);/);
  assert.match(html, /async function fetchPlayerDataSource\(source\)\{/);
  assert.match(html, /if\(source\.kind==='github-contents'\)return fetchGitHubContentsJson\(source\.url\);/);
  assert.match(html, /\{url:GITHUB_PLAYER_DATA_CONTENTS_URL,label:'github-contents players\.generated\.json',kind:'github-contents'\}/);
  assert.match(html, /url:`\$\{REMOTE_PLAYER_DATA_JSON_URL\}\?refresh=\$\{Date\.now\(\)\}`,label:'github-main players\.generated\.json'/);
  assert.match(html, /url:`\.\/players\.generated\.json\?refresh=\$\{Date\.now\(\)\}`,label:'players\.generated\.json'/);
  assert.match(html, /payload=await fetchPlayerDataSource\(source\);/);
  assert.match(html, /setPlayerDataFromResponse\(payload,true\);/);
  assert.match(html, /useEffect\(\(\)=>\{\s*let alive=true;\s*if\(STATIC_SHARED_ROOM_BACKEND&&!HAS_BACKEND\)\{\s*refreshStaticPlayerData\(\)/);
  assert.match(html, /if\(alive&&payload\.dataStatus\)setDataStatus\(payload\.dataStatus\);/);
  assert.match(html, /async function refreshScorerData\(\)\{/);
  assert.match(html, /const staticOnly=STATIC_SHARED_ROOM_BACKEND&&!HAS_BACKEND;/);
  assert.match(html, /staticOnly\?await refreshStaticPlayerData\(\):await api\('\/api\/admin\/refresh-players'/);
  assert.match(html, /HAS_BACKEND\?'最新を反映':'最新データを確認'/);
  assert.match(html, /得点ランキングデータを更新しました/);
  assert.match(html, /公開済みの得点ランキングデータは変更ありません/);
  assert.doesNotMatch(html, /公開サイトでは更新ジョブで公開済みの得点ランキングJSONを再読み込みします/);
  assert.doesNotMatch(html, /WFAから得点ランキングを取得し、選手データへ反映します/);
});

test('home result reflection does not refresh scorer ranking data', () => {
  assert.match(html, /async function applyAdminResults\(\)\{/);
  assert.doesNotMatch(html, /let playerRefresh=null;/);
  assert.doesNotMatch(html, /playerRefresh=STATIC_SHARED_ROOM_BACKEND&&!HAS_BACKEND\?await refreshStaticPlayerData\(\):null;/);
  assert.doesNotMatch(html, /得点ランキングを更新しました。試合結果は取得できませんでした/);
  assert.doesNotMatch(html, /試合結果は反映済みです。得点ランキングを更新しました/);
  assert.doesNotMatch(html, /Web取得した試合結果\$\{scorerRefreshed\?'と得点ランキング':''\}を反映しました/);
  assert.match(html, /if\(!roomId\)\{\s*setHomeToast\('ルームに入った状態で実行してください'\);/);
  assert.match(html, /ローカルサーバーに接続できません。localhost:3000を起動してから再実行してください/);
  assert.match(html, /Webから試合結果を取得し、ポイントと判定バッジを再計算します/);
});

test('settings no longer exposes a standalone player data refresh path', () => {
  assert.doesNotMatch(html, /refreshOfficialData/);
  assert.doesNotMatch(html, /選手データ更新/);
  assert.doesNotMatch(html, /選手データを更新/);
  assert.doesNotMatch(html, /公開済み選手データを再読み込みしました/);
  assert.doesNotMatch(html, /公開サイトでは公開済みのplayers\.generated\.jsonを再読み込みします/);
});

test('player data response application preserves scorer ranking metadata', () => {
  assert.match(html, /function setPlayerDataFromResponse\(data,shouldNotify=true\)\{/);
  assert.match(html, /meta:data\.meta\|\|PLAYER_DATA_META\.meta/);
  assert.match(html, /sources:data\.sources\|\|PLAYER_DATA_META\.sources/);
  assert.match(html, /setPlayerData\(data\.playersByCountry,\{/);
});

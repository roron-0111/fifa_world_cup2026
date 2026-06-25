# 得点ランキング更新方針

## 結論

公開サイト上の「得点ランキングデータ」ボタンは、Firebase Hosting に公開済みの `players.generated.json` を再読み込みするだけです。
そのため、公開サイトで「最新を反映」と表示すると、WFA から直接最新取得しているように見えて不正確です。

実際の最新取得は GitHub Actions の `Refresh player and scorer data` で実行します。
このジョブは WFA から選手・得点ランキングデータを取得し、`data/players.generated.json` と `project/players.generated.json` を更新して GitHub に push します。
公開サイトの `公開データを再読込` は GitHub の `main/project/players.generated.json` を直接読みます。
GitHub 側の取得に失敗した場合だけ、Firebase Hosting に同梱された `players.generated.json` にフォールバックします。

## 運用

- 通常時: 24時間に1回、日本時間12:00頃にスケジュール実行で更新します。
- 手動更新: GitHub Actions の `Refresh player and scorer data` から `Run workflow` を実行します。
- 公開サイト: 更新ジョブで GitHub に push 済みのデータを `公開データを再読込` で読み直します。

24時間に1回としている理由は、無料運用を優先するためです。
公開リポジトリなら標準ランナーの GitHub Actions は無料ですが、非公開リポジトリでは月間無料分を消費します。
試合直後など急ぐ場合は、手動実行で補います。

## 必要な設定

Firebase Hosting への日次デプロイは行いません。
そのため、`FIREBASE_TOKEN` は不要です。

## なぜ公開サイトのボタンで直接取得しないか

現在の公開サイトは Firebase Hosting の静的配信です。
ブラウザ上のボタンだけでは、WFA から取得した結果を `players.generated.json` に書き込み、Hosting に再デプロイすることはできません。
無料運用のため、WFA 取得とJSON更新は GitHub Actions に任せ、ブラウザは GitHub 上の最新JSONを読みます。

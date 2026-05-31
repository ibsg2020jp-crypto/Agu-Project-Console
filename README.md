# Agu Project Console

Webゲーム・Webアプリを複数管理するための、GitHub Pagesで動く静的Webアプリです。

## Webアプリ

以下のリンクから開けます。

[▶ Agu Project Console を開く](https://ibsg2020jp-crypto.github.io/Agu-Project-Console/)

## できること

- プロジェクト情報の追加・編集・削除
- GitHubリポジトリURL、GitHub Pages URL、スプレッドシートURL、Apps Script URLの管理
- Apps Script JSONP APIからランキング取得
- Apps Script JSONP APIから統計取得
- health APIによる接続確認
- localStorageによる保存
- JSONエクスポート・インポート
- Apps Scriptテンプレート表示
- スマホ・PC対応

## 使い方

1. GitHub Pagesでこのリポジトリを公開する
2. [Agu Project Console](https://ibsg2020jp-crypto.github.io/Agu-Project-Console/) をブラウザで開く
3. 「追加・編集」からプロジェクトを登録する
4. Apps Script URLを登録する
5. 詳細画面で「ランキング取得」または「接続テスト」を押す

## GitHub Pages設定

GitHubのリポジトリ画面で以下を設定してください。

1. Settings
2. Pages
3. Sourceを `Deploy from a branch` にする
4. Branchを `main`、フォルダを `/root` にする
5. Save

公開URL：

[https://ibsg2020jp-crypto.github.io/Agu-Project-Console/](https://ibsg2020jp-crypto.github.io/Agu-Project-Console/)

## データ保存について

このアプリの登録データは、ブラウザの `localStorage` に保存されます。

外部サーバーやログインは使いません。そのため、別ブラウザ・別端末ではデータは共有されません。必要に応じて設定画面からJSONエクスポートを行ってください。

## Apps Script側API

MVPではJSONP方式を使います。

必要なアクション：

- `?action=health`
- `?action=ranking`
- `?action=stats`
- `?action=players`

詳しくは `REQUIREMENTS.md` を参照してください。

## ファイル構成

```text
/project-console
  ├─ index.html
  ├─ README.md
  ├─ REQUIREMENTS.md
  ├─ src/
  │   ├─ main.js
  │   ├─ storage.js
  │   ├─ projects.js
  │   ├─ apiClient.js
  │   ├─ templates.js
  │   ├─ stats.js
  │   └─ utils.js
  └─ styles/
      └─ style.css
```

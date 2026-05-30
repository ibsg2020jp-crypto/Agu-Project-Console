# 要件定義書：Agu Project Console

## 目的

複数のWebゲーム・Webアプリについて、GitHub、GitHub Pages、Googleスプレッドシート、Google Apps Script、ランキング、プレイヤー状況をまとめて管理する静的Webアプリです。

## MVP範囲

- ダッシュボード表示
- プロジェクト一覧
- プロジェクト追加・編集・削除
- プロジェクト詳細
- localStorage保存
- Apps Script URL登録
- JSONP方式によるランキング取得
- JSONP方式による統計取得
- Apps Script health APIによる接続確認
- JSONエクスポート・インポート
- Apps Scriptテンプレート表示
- スマホ対応デザイン

## 保存仕様

管理コンソール本体のデータはブラウザのlocalStorageに保存します。

- `projectConsoleData`
- `projectConsoleSettings`
- `projectConsoleTemplates`

## Apps Script API

各プロジェクトのApps Script WebアプリURLに対して、以下の形式でJSONPアクセスします。

```text
?action=ranking&limit=10&callback=callbackName
?action=stats&callback=callbackName
?action=players&callback=callbackName
?action=health&callback=callbackName
```

## 推奨スプレッドシート構成

### Players

```text
playerId | name | firstSeenAt | lastSeenAt
```

### Scores

```text
updatedAt | playerId | score | stageId | stageName | difficulty | ballSpeed | clearTime | rankKey
```

### Logs

```text
timestamp | playerId | name | eventType | score | stageId | difficulty | ballSpeed | clearTime | detail
```

### Config

```text
key | value
```

## 受け入れ条件

- ブラウザで起動できる
- プロジェクトを追加・編集・削除できる
- 登録内容が再読み込み後も残る
- GitHub URL、Pages URL、スプレッドシートURL、Apps Script URLを保存できる
- Apps Script URLからランキングと統計を取得できる
- プロジェクト詳細画面でランキング上位を見られる
- ダッシュボードにプロジェクト数が表示される
- スマホでも最低限操作できる
- 外部サーバーなしでGitHub Pagesに公開できる

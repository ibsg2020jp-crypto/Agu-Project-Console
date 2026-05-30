import { escapeHtml } from './utils.js';

export function buildConfigSnippet(project) {
  return `const PROJECT_ID = "${project.projectId || 'project-id'}";\nconst PROJECT_NAME = "${project.projectName || 'Project Name'}";\nconst RANKING_API_URL = "${project.appsScriptUrl || 'https://script.google.com/macros/s/xxxx/exec'}";`;
}

export function buildSheetGuide() {
  return `Players: playerId | name | firstSeenAt | lastSeenAt\nScores: updatedAt | playerId | score | stageId | stageName | difficulty | ballSpeed | clearTime | rankKey\nLogs: timestamp | playerId | name | eventType | score | stageId | difficulty | ballSpeed | clearTime | detail\nConfig: key | value`;
}

export function buildAppsScriptTemplate() {
  return `const SHEETS = {\n  players: 'Players',\n  scores: 'Scores',\n  logs: 'Logs',\n  config: 'Config'\n};\n\nfunction doGet(e) {\n  const action = e.parameter.action || 'health';\n  const callback = e.parameter.callback || 'callback';\n  let payload;\n\n  try {\n    if (action === 'health') payload = { ok: true, message: 'ok' };\n    else if (action === 'ranking') payload = getRanking_(Number(e.parameter.limit || 10));\n    else if (action === 'stats') payload = getStats_();\n    else if (action === 'players') payload = getPlayers_();\n    else payload = { ok: false, error: 'unknown action' };\n  } catch (error) {\n    payload = { ok: false, error: String(error) };\n  }\n\n  return ContentService\n    .createTextOutput(callback + '(' + JSON.stringify(payload) + ');')\n    .setMimeType(ContentService.MimeType.JAVASCRIPT);\n}\n\nfunction sheet_(name) {\n  return SpreadsheetApp.getActive().getSheetByName(name);\n}\n\nfunction getRanking_(limit) {\n  const sheet = sheet_(SHEETS.scores);\n  if (!sheet) return { ok: true, ranking: [] };\n  const values = sheet.getDataRange().getValues();\n  const headers = values.shift();\n  const rows = values.map(row => Object.fromEntries(headers.map((h, i) => [h, row[i]])));\n  rows.sort((a, b) => Number(b.score || 0) - Number(a.score || 0) || Number(a.clearTime || 999999) - Number(b.clearTime || 999999));\n  return { ok: true, ranking: rows.slice(0, limit).map((row, index) => ({ rank: index + 1, ...row })) };\n}\n\nfunction getStats_() {\n  const players = sheet_(SHEETS.players);\n  const scores = sheet_(SHEETS.scores);\n  const playerRows = players ? Math.max(players.getLastRow() - 1, 0) : 0;\n  const scoreRows = scores ? Math.max(scores.getLastRow() - 1, 0) : 0;\n  return { ok: true, stats: { totalPlayers: playerRows, activeToday: 0, active7d: 0, active30d: 0, totalScores: scoreRows, lastScoreAt: new Date().toISOString() } };\n}\n\nfunction getPlayers_() {\n  const sheet = sheet_(SHEETS.players);\n  if (!sheet) return { ok: true, players: [] };\n  const values = sheet.getDataRange().getValues();\n  const headers = values.shift();\n  return { ok: true, players: values.map(row => Object.fromEntries(headers.map((h, i) => [h, row[i]]))) };\n}`;
}

export function renderTemplateBlocks(project) {
  return `
    <div class="grid two-columns">
      <article class="panel">
        <h3>ゲーム側設定コード</h3>
        <pre><code>${escapeHtml(buildConfigSnippet(project || {}))}</code></pre>
        <button class="secondary-button" data-copy="config">コピー</button>
      </article>
      <article class="panel">
        <h3>シート構成</h3>
        <pre><code>${escapeHtml(buildSheetGuide())}</code></pre>
        <button class="secondary-button" data-copy="sheets">コピー</button>
      </article>
    </div>
    <article class="panel">
      <h3>Apps Scriptテンプレート</h3>
      <p class="hint">MVP用の簡易版です。ランキング取得・統計取得・接続確認に対応します。</p>
      <pre class="large-code"><code>${escapeHtml(buildAppsScriptTemplate())}</code></pre>
      <button class="secondary-button" data-copy="appsScript">コピー</button>
    </article>
  `;
}

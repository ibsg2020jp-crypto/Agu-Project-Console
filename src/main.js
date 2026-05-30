import { loadData, saveData, loadSettings, saveSettings, exportAll, importAll, clearAllData } from './storage.js';
import { emptyProject, upsertProject, deleteProject, findProject } from './projects.js';
import { checkHealth, fetchRanking, fetchStats } from './apiClient.js';
import { summarizeProjects, getProjectCache, normalizeRanking, normalizeStats } from './stats.js';
import { renderTemplateBlocks, buildAppsScriptTemplate, buildConfigSnippet, buildSheetGuide } from './templates.js';
import { escapeHtml, formatDate, openUrl, downloadText, copyToClipboard } from './utils.js';

let data = loadData();
let settings = loadSettings();
let editingProjectId = null;
let selectedProjectId = data.lastOpenedProjectId || null;

const views = {
  dashboard: document.querySelector('#dashboardView'),
  projects: document.querySelector('#projectsView'),
  form: document.querySelector('#formView'),
  detail: document.querySelector('#detailView'),
  templates: document.querySelector('#templatesView'),
  settings: document.querySelector('#settingsView')
};

function persist() {
  saveData(data);
  saveSettings(settings);
}

function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('show');
  window.setTimeout(() => element.classList.remove('show'), 2400);
}

function setView(name) {
  Object.values(views).forEach((view) => view.classList.remove('active-view'));
  document.querySelectorAll('.tab-button').forEach((button) => button.classList.toggle('active', button.dataset.view === name));
  const target = views[name] || views.dashboard;
  target.classList.add('active-view');
  render();
}

function showDetail(projectId) {
  selectedProjectId = projectId;
  data.lastOpenedProjectId = projectId;
  persist();
  Object.values(views).forEach((view) => view.classList.remove('active-view'));
  document.querySelectorAll('.tab-button').forEach((button) => button.classList.remove('active'));
  views.detail.classList.add('active-view');
  render();
}

function renderDashboard() {
  const summary = summarizeProjects(data.projects, data);
  views.dashboard.innerHTML = `
    <div class="section-title">
      <div><h2>ダッシュボード</h2><p>全プロジェクトの概要を確認します。</p></div>
      <button class="primary-button" data-action="new-project">プロジェクト追加</button>
    </div>
    <div class="stat-grid">
      <article class="stat-card"><span>登録プロジェクト</span><strong>${summary.projectCount}</strong><small>件</small></article>
      <article class="stat-card"><span>公開中</span><strong>${summary.publishedCount}</strong><small>件</small></article>
      <article class="stat-card"><span>総プレイヤー数</span><strong>${summary.totalPlayers}</strong><small>人</small></article>
      <article class="stat-card"><span>総スコア数</span><strong>${summary.totalScores}</strong><small>件</small></article>
    </div>
    <div class="grid two-columns">
      <article class="panel"><h3>最近スコア投稿があったプロジェクト</h3><p class="big-text">${escapeHtml(summary.recentProjectName)}</p></article>
      <article class="panel"><h3>接続エラー</h3><p class="big-text ${summary.errorCount ? 'danger' : ''}">${summary.errorCount}件</p></article>
    </div>
  `;
}

function renderProjects() {
  const cards = data.projects.map((project) => {
    const cache = getProjectCache(data, project.projectId);
    return `
      <article class="project-card">
        <div class="card-head">
          <div><h3>${escapeHtml(project.projectName)}</h3><p>${escapeHtml(project.genre)} / ${escapeHtml(project.status)}</p></div>
          <span class="status-badge">${escapeHtml(project.status)}</span>
        </div>
        <p>${escapeHtml(project.description || '説明は未入力です。')}</p>
        <dl class="mini-stats">
          <div><dt>プレイヤー</dt><dd>${cache.stats?.totalPlayers ?? '-'}</dd></div>
          <div><dt>スコア</dt><dd>${cache.stats?.totalScores ?? '-'}</dd></div>
          <div><dt>最終投稿</dt><dd>${formatDate(cache.stats?.lastScoreAt)}</dd></div>
        </dl>
        ${cache.lastError ? `<p class="error-text">${escapeHtml(cache.lastError)}</p>` : ''}
        <div class="button-row">
          <button data-action="detail" data-id="${project.projectId}">詳細</button>
          <button data-action="edit" data-id="${project.projectId}">編集</button>
          <button data-action="check" data-id="${project.projectId}">接続確認</button>
          <button class="danger-button" data-action="delete" data-id="${project.projectId}">削除</button>
        </div>
      </article>
    `;
  }).join('');

  views.projects.innerHTML = `
    <div class="section-title">
      <div><h2>プロジェクト一覧</h2><p>登録済みプロジェクトをカード形式で表示します。</p></div>
      <button class="primary-button" data-action="new-project">追加</button>
    </div>
    <div class="project-grid">${cards || '<p class="empty">まだプロジェクトがありません。追加ボタンから登録してください。</p>'}</div>
  `;
}

function renderForm() {
  const project = editingProjectId ? findProject(data.projects, editingProjectId) : emptyProject;
  views.form.innerHTML = `
    <div class="section-title"><div><h2>${editingProjectId ? 'プロジェクト編集' : 'プロジェクト追加'}</h2><p>URLや説明を登録します。</p></div></div>
    <form id="projectForm" class="panel form-panel">
      <input type="hidden" name="projectId" value="${escapeHtml(project.projectId)}">
      <input type="hidden" name="createdAt" value="${escapeHtml(project.createdAt)}">
      <label>プロジェクト名 <input name="projectName" required value="${escapeHtml(project.projectName)}" placeholder="Block Breaker"></label>
      <label>説明 <textarea name="description" rows="3" placeholder="どんなゲーム・アプリかを書く">${escapeHtml(project.description)}</textarea></label>
      <div class="form-grid">
        <label>ジャンル <select name="genre"><option>ゲーム</option><option>便利ツール</option><option>実験アプリ</option><option>その他</option></select></label>
        <label>公開状態 <select name="status"><option>作成中</option><option>公開中</option><option>停止中</option><option>実験中</option></select></label>
      </div>
      <label>GitHubリポジトリURL <input name="githubRepoUrl" type="url" value="${escapeHtml(project.githubRepoUrl)}" placeholder="https://github.com/.../..."></label>
      <label>GitHub Pages URL <input name="pagesUrl" type="url" value="${escapeHtml(project.pagesUrl)}" placeholder="https://...github.io/..."></label>
      <label>GoogleスプレッドシートURL <input name="spreadsheetUrl" type="url" value="${escapeHtml(project.spreadsheetUrl)}" placeholder="https://docs.google.com/spreadsheets/..."></label>
      <label>Google Apps Script URL <input name="appsScriptUrl" type="url" value="${escapeHtml(project.appsScriptUrl)}" placeholder="https://script.google.com/macros/s/xxxx/exec"><small>Webアプリとしてデプロイした時に発行される /exec を含むURLです。</small></label>
      <label>メモ <textarea name="memo" rows="4">${escapeHtml(project.memo)}</textarea></label>
      <div class="button-row"><button class="primary-button" type="submit">保存</button><button type="button" data-action="cancel-edit">キャンセル</button></div>
    </form>
  `;
  const form = document.querySelector('#projectForm');
  form.genre.value = project.genre || 'ゲーム';
  form.status.value = project.status || '作成中';
}

function renderDetail() {
  const project = findProject(data.projects, selectedProjectId) || data.projects[0];
  if (!project) {
    views.detail.innerHTML = '<p class="empty">詳細表示できるプロジェクトがありません。</p>';
    return;
  }
  const cache = getProjectCache(data, project.projectId);
  const rankingRows = (cache.ranking || []).map((row, index) => `
    <tr><td>${row.rank ?? index + 1}</td><td>${escapeHtml(row.name || '-')}</td><td>${escapeHtml(row.score ?? '-')}</td><td>${escapeHtml(row.stageName || row.stageId || '-')}</td><td>${escapeHtml(row.clearTime || '-')}</td></tr>
  `).join('');

  views.detail.innerHTML = `
    <div class="section-title">
      <div><h2>${escapeHtml(project.projectName)}</h2><p>${escapeHtml(project.description || '説明は未入力です。')}</p></div>
      <div class="button-row"><button data-action="edit" data-id="${project.projectId}">編集</button><button data-action="refresh" data-id="${project.projectId}" class="primary-button">ランキング取得</button></div>
    </div>
    <div class="grid two-columns">
      <article class="panel">
        <h3>リンク</h3>
        <div class="link-list">
          <button data-action="open" data-url="${escapeHtml(project.pagesUrl)}">公開ページを開く</button>
          <button data-action="open" data-url="${escapeHtml(project.githubRepoUrl)}">GitHubを開く</button>
          <button data-action="open" data-url="${escapeHtml(project.spreadsheetUrl)}">スプレッドシートを開く</button>
          <button data-action="check" data-id="${project.projectId}">Apps Script接続テスト</button>
        </div>
      </article>
      <article class="panel">
        <h3>統計</h3>
        <dl class="detail-stats">
          <div><dt>総プレイヤー</dt><dd>${cache.stats?.totalPlayers ?? '-'}</dd></div>
          <div><dt>今日</dt><dd>${cache.stats?.activeToday ?? '-'}</dd></div>
          <div><dt>7日</dt><dd>${cache.stats?.active7d ?? '-'}</dd></div>
          <div><dt>30日</dt><dd>${cache.stats?.active30d ?? '-'}</dd></div>
          <div><dt>スコア数</dt><dd>${cache.stats?.totalScores ?? '-'}</dd></div>
          <div><dt>最終投稿</dt><dd>${formatDate(cache.stats?.lastScoreAt)}</dd></div>
        </dl>
        ${cache.lastError ? `<p class="error-text">${escapeHtml(cache.lastError)}</p>` : ''}
      </article>
    </div>
    <article class="panel">
      <h3>ランキング上位</h3>
      <div class="table-wrap"><table><thead><tr><th>順位</th><th>名前</th><th>スコア</th><th>ステージ</th><th>タイム</th></tr></thead><tbody>${rankingRows || '<tr><td colspan="5">まだ取得していません。</td></tr>'}</tbody></table></div>
    </article>
  `;
}

function renderTemplates() {
  const project = findProject(data.projects, selectedProjectId) || data.projects[0] || emptyProject;
  views.templates.innerHTML = `
    <div class="section-title"><div><h2>Apps Scriptテンプレート生成</h2><p>次のプロジェクトに貼るコードやシート構成を確認します。</p></div></div>
    ${renderTemplateBlocks(project)}
  `;
}

function renderSettings() {
  views.settings.innerHTML = `
    <div class="section-title"><div><h2>設定</h2><p>テーマ、表示件数、バックアップを管理します。</p></div></div>
    <article class="panel form-panel">
      <label>テーマ <select id="themeSelect"><option value="light">ライト</option><option value="dark">ダーク</option></select></label>
      <label>ランキング表示件数 <input id="rankingLimit" type="number" min="1" max="100" value="${settings.rankingLimit}"></label>
      <div class="button-row">
        <button class="primary-button" data-action="save-settings">設定を保存</button>
        <button data-action="export-json">JSONエクスポート</button>
      </div>
      <label>JSONインポート <textarea id="importJson" rows="8" placeholder="エクスポートしたJSONを貼り付け"></textarea></label>
      <div class="button-row"><button data-action="import-json">インポート</button><button class="danger-button" data-action="clear-all">全データ削除</button></div>
    </article>
  `;
  document.querySelector('#themeSelect').value = settings.theme;
}

function render() {
  document.body.dataset.theme = settings.theme;
  renderDashboard();
  renderProjects();
  renderForm();
  renderDetail();
  renderTemplates();
  renderSettings();
}

async function refreshProject(projectId) {
  const project = findProject(data.projects, projectId);
  if (!project) return;
  try {
    const [rankingResponse, statsResponse] = await Promise.all([
      fetchRanking(project, settings.rankingLimit),
      fetchStats(project)
    ]);
    data.apiCache[projectId] = {
      ...data.apiCache[projectId],
      ranking: normalizeRanking(rankingResponse),
      stats: normalizeStats(statsResponse),
      lastFetchedAt: new Date().toISOString(),
      lastError: ''
    };
    persist();
    toast('ランキングと統計を取得しました。');
  } catch (error) {
    data.apiCache[projectId] = { ...data.apiCache[projectId], lastError: error.message };
    persist();
    toast(error.message);
  }
  render();
}

async function checkProject(projectId) {
  const project = findProject(data.projects, projectId);
  if (!project) return;
  try {
    const result = await checkHealth(project);
    data.apiCache[projectId] = { ...data.apiCache[projectId], health: result.response, lastError: '' };
    persist();
    toast(result.warnings.length ? `接続成功。ただし ${result.warnings.join(' ')}` : '接続成功です。');
  } catch (error) {
    data.apiCache[projectId] = { ...data.apiCache[projectId], lastError: error.message };
    persist();
    toast(error.message);
  }
  render();
}

function readForm(form) {
  const formData = new FormData(form);
  return Object.fromEntries(formData.entries());
}

document.addEventListener('click', async (event) => {
  const target = event.target.closest('button');
  if (!target) return;
  const action = target.dataset.action;

  if (target.classList.contains('tab-button')) setView(target.dataset.view);
  if (target.id === 'themeToggle') {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    persist();
    render();
  }
  if (action === 'new-project') { editingProjectId = null; setView('form'); }
  if (action === 'cancel-edit') { editingProjectId = null; setView('projects'); }
  if (action === 'detail') showDetail(target.dataset.id);
  if (action === 'edit') { editingProjectId = target.dataset.id; setView('form'); }
  if (action === 'delete') {
    if (confirm('このプロジェクトを削除しますか？')) {
      data.projects = deleteProject(data.projects, target.dataset.id);
      delete data.apiCache[target.dataset.id];
      persist();
      toast('削除しました。');
      setView('projects');
    }
  }
  if (action === 'open') openUrl(target.dataset.url);
  if (action === 'check') await checkProject(target.dataset.id);
  if (action === 'refresh') await refreshProject(target.dataset.id);
  if (action === 'save-settings') {
    settings.theme = document.querySelector('#themeSelect').value;
    settings.rankingLimit = Number(document.querySelector('#rankingLimit').value || 10);
    persist();
    toast('設定を保存しました。');
    render();
  }
  if (action === 'export-json') {
    downloadText(`project-console-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(exportAll(), null, 2));
  }
  if (action === 'import-json') {
    try {
      importAll(JSON.parse(document.querySelector('#importJson').value));
      data = loadData();
      settings = loadSettings();
      toast('インポートしました。');
      render();
    } catch (error) { toast(error.message); }
  }
  if (action === 'clear-all') {
    if (confirm('localStorage上の全データを削除しますか？')) {
      clearAllData();
      data = loadData();
      settings = loadSettings();
      toast('削除しました。');
      render();
    }
  }
  if (target.dataset.copy) {
    const project = findProject(data.projects, selectedProjectId) || data.projects[0] || emptyProject;
    const map = { config: buildConfigSnippet(project), sheets: buildSheetGuide(), appsScript: buildAppsScriptTemplate() };
    await copyToClipboard(map[target.dataset.copy]);
    toast('コピーしました。');
  }
});

document.addEventListener('submit', (event) => {
  if (event.target.id !== 'projectForm') return;
  event.preventDefault();
  try {
    const project = readForm(event.target);
    data.projects = upsertProject(data.projects, project);
    selectedProjectId = project.projectId || data.projects[0]?.projectId;
    editingProjectId = null;
    persist();
    toast('保存しました。');
    setView('projects');
  } catch (error) {
    toast(error.message);
  }
});

render();

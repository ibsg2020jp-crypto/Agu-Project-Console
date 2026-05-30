const DATA_KEY = 'projectConsoleData';
const SETTINGS_KEY = 'projectConsoleSettings';
const TEMPLATES_KEY = 'projectConsoleTemplates';

const seededProjects = [
  {
    projectId: 'block-breaker',
    projectName: 'ブロック崩し',
    description: 'ブラウザで遊べる、スマホ対応のシンプルなブロック崩しゲーム。スイッチやワープなどのギミック、スコア、評価ランク、ベストタイム、実績保存に対応。',
    genre: 'ゲーム',
    githubRepoUrl: 'https://github.com/ibsg2020jp-crypto/Block-Breaker',
    pagesUrl: 'https://ibsg2020jp-crypto.github.io/Block-Breaker/',
    spreadsheetUrl: '',
    appsScriptUrl: '',
    status: '公開中',
    createdAt: '2026-05-30T00:00:00.000Z',
    updatedAt: '2026-05-30T00:00:00.000Z',
    memo: '初期サンプルデータ。ランキング用スプレッドシートURLとApps Script URLは未登録。'
  }
];

const defaultData = {
  projects: seededProjects,
  lastOpenedProjectId: 'block-breaker',
  apiCache: {
    'block-breaker': {
      stats: {
        totalPlayers: 0,
        activeToday: 0,
        active7d: 0,
        active30d: 0,
        totalScores: 0,
        lastScoreAt: null
      },
      ranking: [],
      lastError: ''
    }
  }
};

const defaultSettings = {
  theme: 'light',
  rankingLimit: 10
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : structuredClone(fallback);
  } catch (error) {
    console.warn(`Failed to read ${key}`, error);
    return structuredClone(fallback);
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadData() {
  const data = readJson(DATA_KEY, defaultData);
  data.projects = Array.isArray(data.projects) ? data.projects : [];
  data.apiCache = data.apiCache || {};
  return data;
}

export function saveData(data) {
  writeJson(DATA_KEY, data);
}

export function loadSettings() {
  return readJson(SETTINGS_KEY, defaultSettings);
}

export function saveSettings(settings) {
  writeJson(SETTINGS_KEY, settings);
}

export function loadTemplates() {
  return readJson(TEMPLATES_KEY, {});
}

export function saveTemplates(templates) {
  writeJson(TEMPLATES_KEY, templates);
}

export function exportAll() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: loadData(),
    settings: loadSettings(),
    templates: loadTemplates()
  };
}

export function importAll(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('JSONの形式が正しくありません。');
  }
  const data = payload.data || payload;
  const projects = Array.isArray(data.projects) ? data.projects : [];
  saveData({ ...defaultData, ...data, projects });
  if (payload.settings) saveSettings({ ...defaultSettings, ...payload.settings });
  if (payload.templates) saveTemplates(payload.templates);
}

export function clearAllData() {
  localStorage.removeItem(DATA_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(TEMPLATES_KEY);
}

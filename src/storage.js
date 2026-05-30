const DATA_KEY = 'projectConsoleData';
const SETTINGS_KEY = 'projectConsoleSettings';
const TEMPLATES_KEY = 'projectConsoleTemplates';
const SEED_VERSION = 1;

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
  seedVersion: SEED_VERSION,
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...clone(fallback), ...JSON.parse(raw) } : clone(fallback);
  } catch (error) {
    console.warn(`Failed to read ${key}`, error);
    return clone(fallback);
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function applySeedMigration(data) {
  if ((data.seedVersion || 0) >= SEED_VERSION) return data;

  const existingIds = new Set(data.projects.map((project) => project.projectId));
  const missingSeeds = seededProjects.filter((project) => !existingIds.has(project.projectId));

  if (missingSeeds.length) {
    data.projects = [...missingSeeds, ...data.projects];
    data.lastOpenedProjectId = data.lastOpenedProjectId || missingSeeds[0].projectId;
  }

  data.apiCache = {
    ...defaultData.apiCache,
    ...data.apiCache
  };
  data.seedVersion = SEED_VERSION;
  writeJson(DATA_KEY, data);
  return data;
}

export function loadData() {
  const data = readJson(DATA_KEY, defaultData);
  data.projects = Array.isArray(data.projects) ? data.projects : [];
  data.apiCache = data.apiCache || {};
  return applySeedMigration(data);
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
  saveData({ ...defaultData, ...data, projects, seedVersion: SEED_VERSION });
  if (payload.settings) saveSettings({ ...defaultSettings, ...payload.settings });
  if (payload.templates) saveTemplates(payload.templates);
}

export function clearAllData() {
  localStorage.removeItem(DATA_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(TEMPLATES_KEY);
}

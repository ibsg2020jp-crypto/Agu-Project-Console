const DATA_KEY = 'projectConsoleData';
const SETTINGS_KEY = 'projectConsoleSettings';
const TEMPLATES_KEY = 'projectConsoleTemplates';

const defaultData = {
  projects: [],
  lastOpenedProjectId: null,
  apiCache: {}
};

const defaultSettings = {
  theme: 'light',
  rankingLimit: 10
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
  } catch (error) {
    console.warn(`Failed to read ${key}`, error);
    return { ...fallback };
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

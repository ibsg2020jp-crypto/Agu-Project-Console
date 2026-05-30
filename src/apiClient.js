import { looksLikeExecUrl } from './utils.js';

let requestCount = 0;

export function requestJsonp(baseUrl, params = {}, timeoutMs = 9000) {
  return new Promise((resolve, reject) => {
    if (!baseUrl) {
      reject(new Error('Apps Script URLが未入力です。'));
      return;
    }

    const callbackName = `projectConsoleJsonp_${Date.now()}_${requestCount++}`;
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
    url.searchParams.set('callback', callbackName);

    const script = document.createElement('script');
    const timer = window.setTimeout(() => cleanup(new Error('通信がタイムアウトしました。Apps Scriptの公開設定を確認してください。')), timeoutMs);

    function cleanup(error, data) {
      window.clearTimeout(timer);
      script.remove();
      delete window[callbackName];
      if (error) reject(error);
      else resolve(data);
    }

    window[callbackName] = (data) => cleanup(null, data);
    script.onerror = () => cleanup(new Error('Apps Scriptに接続できませんでした。'));
    script.src = url.toString();
    document.body.appendChild(script);
  });
}

export async function fetchRanking(project, limit = 10) {
  return requestJsonp(project.appsScriptUrl, { action: 'ranking', limit });
}

export async function fetchStats(project) {
  return requestJsonp(project.appsScriptUrl, { action: 'stats' });
}

export async function fetchPlayers(project) {
  return requestJsonp(project.appsScriptUrl, { action: 'players' });
}

export async function checkHealth(project) {
  const warnings = [];
  if (!project.appsScriptUrl) throw new Error('Apps Script URLが未入力です。');
  if (!looksLikeExecUrl(project.appsScriptUrl)) warnings.push('/execで終わるURLではない可能性があります。');
  const response = await requestJsonp(project.appsScriptUrl, { action: 'health' });
  return { response, warnings };
}

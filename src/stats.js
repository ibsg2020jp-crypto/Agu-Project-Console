import { safeNumber } from './utils.js';

export function getProjectCache(data, projectId) {
  return data.apiCache?.[projectId] || {};
}

export function summarizeProjects(projects, data) {
  const published = projects.filter((project) => project.status === '公開中').length;
  const totals = projects.reduce((acc, project) => {
    const cache = getProjectCache(data, project.projectId);
    acc.players += safeNumber(cache.stats?.totalPlayers);
    acc.scores += safeNumber(cache.stats?.totalScores);
    return acc;
  }, { players: 0, scores: 0 });

  const recentProject = [...projects]
    .map((project) => ({ project, lastScoreAt: getProjectCache(data, project.projectId).stats?.lastScoreAt }))
    .filter((item) => item.lastScoreAt)
    .sort((a, b) => new Date(b.lastScoreAt) - new Date(a.lastScoreAt))[0]?.project;

  const errorProjects = projects.filter((project) => getProjectCache(data, project.projectId).lastError);

  return {
    projectCount: projects.length,
    publishedCount: published,
    totalPlayers: totals.players,
    totalScores: totals.scores,
    recentProjectName: recentProject?.projectName || '-',
    errorCount: errorProjects.length
  };
}

export function normalizeStats(response) {
  return response?.stats || {
    totalPlayers: safeNumber(response?.totalPlayers),
    activeToday: safeNumber(response?.activeToday),
    active7d: safeNumber(response?.active7d),
    active30d: safeNumber(response?.active30d),
    totalScores: safeNumber(response?.totalScores),
    lastScoreAt: response?.lastScoreAt || null
  };
}

export function normalizeRanking(response) {
  return Array.isArray(response?.ranking) ? response.ranking : [];
}

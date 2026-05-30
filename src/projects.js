import { createId, nowIso, isAppsScriptUrl } from './utils.js';

export const emptyProject = {
  projectId: '',
  projectName: '',
  description: '',
  genre: 'ゲーム',
  githubRepoUrl: '',
  pagesUrl: '',
  spreadsheetUrl: '',
  appsScriptUrl: '',
  status: '作成中',
  createdAt: '',
  updatedAt: '',
  memo: ''
};

export function validateProject(project) {
  const errors = [];
  if (!project.projectName.trim()) errors.push('プロジェクト名は必須です。');
  if (project.appsScriptUrl && !isAppsScriptUrl(project.appsScriptUrl)) {
    errors.push('Apps Script URLは https://script.google.com/ から始めてください。');
  }
  return errors;
}

export function upsertProject(projects, input) {
  const now = nowIso();
  const project = {
    ...emptyProject,
    ...input,
    projectName: input.projectName.trim(),
    projectId: input.projectId || createId('project'),
    createdAt: input.createdAt || now,
    updatedAt: now
  };

  const errors = validateProject(project);
  if (errors.length) throw new Error(errors.join('\n'));

  const index = projects.findIndex((item) => item.projectId === project.projectId);
  if (index >= 0) {
    const next = [...projects];
    next[index] = project;
    return next;
  }
  return [project, ...projects];
}

export function deleteProject(projects, projectId) {
  return projects.filter((project) => project.projectId !== projectId);
}

export function findProject(projects, projectId) {
  return projects.find((project) => project.projectId === projectId) || null;
}

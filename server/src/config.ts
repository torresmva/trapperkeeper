import path from 'path';

const ROOT = path.resolve(__dirname, '..', '..');

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  dataDir: path.join(ROOT, 'data'),
  journalDir: path.join(ROOT, 'data', 'journal'),
  notesDir: path.join(ROOT, 'data', 'notes'),
  templatesDir: path.join(ROOT, 'data', 'templates'),
  assetsDir: path.join(ROOT, 'data', 'assets'),
  tasksFile: path.join(ROOT, 'data', 'tasks.json'),
  receiptsFile: path.join(ROOT, 'data', 'receipts.json'),
  linksFile: path.join(ROOT, 'data', 'links.json'),
  promisesFile: path.join(ROOT, 'data', 'promises.json'),
  runbooksFile: path.join(ROOT, 'data', 'runbooks.json'),
  runbookLogsFile: path.join(ROOT, 'data', 'runbook-logs.json'),
  wallFile: path.join(ROOT, 'data', 'wall.json'),

  wikiDir: path.join(ROOT, 'data', 'wiki'),
  trophiesFile: path.join(ROOT, 'data', 'trophies.json'),

  oublietteDir: path.join(ROOT, 'data', 'oubliette'),
  wireServicesFile: path.join(ROOT, 'data', 'wire-services.json'),
  wireConfigFile: path.join(ROOT, 'data', 'wire-config.json'),
  slogansFile: path.join(ROOT, 'data', 'slogans.json'),
};

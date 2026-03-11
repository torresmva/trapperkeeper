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
};

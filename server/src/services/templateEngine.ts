import fs from 'fs/promises';
import path from 'path';
import { format, getISOWeek } from 'date-fns';
import { config } from '../config';

export async function listTemplates(): Promise<string[]> {
  try {
    const files = await fs.readdir(config.templatesDir);
    return files.filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''));
  } catch {
    return [];
  }
}

export async function getTemplate(name: string): Promise<string | null> {
  const filePath = path.join(config.templatesDir, `${name}.md`);
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

export function expandTemplate(template: string, date: Date = new Date()): string {
  const replacements: Record<string, string> = {
    '{{DATE_LONG}}': format(date, 'EEEE MMMM d, yyyy'),
    '{{DATE_SHORT}}': format(date, 'MMM d, yyyy'),
    '{{DATE_ISO}}': format(date, 'yyyy-MM-dd'),
    '{{NOW_ISO}}': date.toISOString(),
    '{{YEAR}}': format(date, 'yyyy'),
    '{{MONTH}}': format(date, 'MMMM'),
    '{{MONTH_NUM}}': format(date, 'MM'),
    '{{WEEK_NUMBER}}': String(getISOWeek(date)),
    '{{WEEK_START_ISO}}': format(date, 'yyyy-MM-dd'),
  };

  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  return result;
}

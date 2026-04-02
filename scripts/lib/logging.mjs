import fs from 'node:fs/promises';
import path from 'node:path';

export async function appendJsonl(logPath, entry) {
  if (!logPath) return;
  await fs.mkdir(path.dirname(logPath), { recursive: true });
  await fs.appendFile(logPath, `${JSON.stringify(entry)}\n`, 'utf8');
}

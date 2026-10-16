import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const root = join(import.meta.dirname, '..');

export const pluginPaths = ['.codex-plugin', '.mcp.json', 'skills', 'assets'];

const pad = (value: number): string => String(value).padStart(2, '0');

export const timestamp = (date: Date): string =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;

export const outputFile = (date: Date = new Date()): string => `build/trypost-chatgpt-${timestamp(date)}.zip`;

export const buildPluginZip = (date: Date = new Date()): string => {
  const file = outputFile(date);

  mkdirSync(join(root, 'build'), { recursive: true });

  execFileSync('git', ['archive', '--format=zip', '--prefix=trypost/', '-o', file, 'HEAD', ...pluginPaths], {
    cwd: root,
  });

  return join(root, file);
};

if (import.meta.main) {
  console.log(buildPluginZip());
}

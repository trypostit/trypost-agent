import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const root = join(import.meta.dirname, '..');

export const pluginPaths = ['.codex-plugin', '.mcp.json', 'skills', 'assets'];

export const outputFile = 'build/trypost-plugin.zip';

export const buildPluginZip = (): string => {
  mkdirSync(join(root, 'build'), { recursive: true });

  execFileSync('git', ['archive', '--format=zip', '--prefix=trypost/', '-o', outputFile, 'HEAD', ...pluginPaths], {
    cwd: root,
  });

  return join(root, outputFile);
};

if (import.meta.main) {
  console.log(buildPluginZip());
}

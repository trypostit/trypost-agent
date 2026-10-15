import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const root = join(import.meta.dirname, '..');

export const mcpUrl = 'https://app.trypost.it/mcp/trypost';

export const networkCount = /\b\d+\s+(networks|platforms)\b/i;

export const pluginManifests = [
  '.claude-plugin/plugin.json',
  '.cursor-plugin/plugin.json',
  '.grok-plugin/plugin.json',
  '.codex-plugin/plugin.json',
];

export const marketplaceManifests = [
  '.claude-plugin/marketplace.json',
  '.cursor-plugin/marketplace.json',
  '.grok-plugin/marketplace.json',
];

export const mcpConfigs = ['mcp.json', '.mcp.json'];

export const exists = (file: string): boolean => existsSync(join(root, file));

export const read = (file: string): string => readFileSync(join(root, file), 'utf8');

export const readJson = <T>(file: string): T => JSON.parse(read(file)) as T;

export const sizeOf = (file: string): number => statSync(join(root, file)).size;

export const frontMatter = (file: string): Record<string, string> => {
  const [, yaml = ''] = read(file).match(/^---\n([\s\S]*?)\n---/) ?? [];

  return Object.fromEntries(yaml.split('\n').map((line) => line.split(/:\s(.*)/, 2)));
};

export const pngDimensions = (file: string): { width: number; height: number } | null => {
  const png = readFileSync(join(root, file));

  if (png.toString('ascii', 1, 4) !== 'PNG') {
    return null;
  }

  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
};

export const contrastWithWhite = (hex: string): number => {
  const [red = 0, green = 0, blue = 0] = (hex.match(/\w\w/g) ?? [])
    .map((pair) => parseInt(pair, 16) / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));

  return 1.05 / (0.2126 * red + 0.7152 * green + 0.0722 * blue + 0.05);
};

export const toolNames = (text: string): Set<string> => new Set(text.match(/\b[a-z-]+-tool\b/g));

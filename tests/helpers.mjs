import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const MCP_URL = 'https://app.trypost.it/mcp/trypost';

export const PLUGIN_MANIFESTS = [
  '.claude-plugin/plugin.json',
  '.cursor-plugin/plugin.json',
  '.grok-plugin/plugin.json',
  '.codex-plugin/plugin.json',
];

export const MARKETPLACE_MANIFESTS = [
  '.claude-plugin/marketplace.json',
  '.cursor-plugin/marketplace.json',
  '.grok-plugin/marketplace.json',
];

export const MCP_CONFIGS = ['mcp.json', '.mcp.json'];

export const JSON_FILES = [...PLUGIN_MANIFESTS, ...MARKETPLACE_MANIFESTS, ...MCP_CONFIGS];

export const NETWORK_COUNT = /\b\d+\s+(networks|platforms)\b/i;

export const path = (relative) => join(ROOT, relative);

export const exists = (relative) => existsSync(path(relative));

export const readText = (relative) => readFileSync(path(relative), 'utf8');

export const readJson = (relative) => JSON.parse(readText(relative));

export const fileSize = (relative) => statSync(path(relative)).size;

/**
 * Splits a SKILL.md into its YAML front matter (flat `key: value` pairs) and body.
 */
export const parseSkill = (relative) => {
  const text = readText(relative);
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    return { frontMatter: null, body: text };
  }

  const frontMatter = Object.fromEntries(
    match[1]
      .split('\n')
      .filter((line) => line.includes(':'))
      .map((line) => {
        const separator = line.indexOf(':');

        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      }),
  );

  return { frontMatter, body: match[2] };
};

/**
 * Reads the width and height from a PNG's IHDR chunk.
 */
export const pngSize = (relative) => {
  const buffer = readFileSync(path(relative));
  const signature = buffer.subarray(0, 8).toString('hex');

  if (signature !== '89504e470d0a1a0a') {
    return null;
  }

  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
};

/**
 * WCAG contrast ratio between two #RRGGBB colors.
 */
export const contrastRatio = (first, second) => {
  const luminance = (hex) => {
    const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
    const [red, green, blue] = channels.map((channel) =>
      channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );

    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };

  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Every MCP tool name (`something-tool`) written in a text.
 */
export const toolNamesIn = (text) => new Set(text.match(/\b[a-z]+(?:-[a-z]+)*-tool\b/g) ?? []);

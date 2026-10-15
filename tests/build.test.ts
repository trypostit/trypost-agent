import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { describe, test } from 'node:test';

import { buildPluginZip, outputFile, pluginPaths, root } from '../scripts/build.ts';
import { exists, read, readJson } from './helpers.ts';
import type { PluginManifest } from './types.ts';

const zipEntries = (file: string): string[] =>
  execFileSync('unzip', ['-Z1', file], { encoding: 'utf8' }).split('\n').filter(Boolean);

describe('OpenAI plugin build', () => {
  test('packs only paths that exist', () => {
    assert.ok(pluginPaths.every(exists), `a packed path does not exist: ${pluginPaths.join(', ')}`);
  });

  test('packs everything the OpenAI manifest references', () => {
    const manifest = readJson<PluginManifest>('.codex-plugin/plugin.json');
    const needed = ['.codex-plugin', '.mcp.json', 'skills', manifest.interface?.logo, manifest.interface?.composerIcon];

    for (const entry of needed) {
      const file = entry?.replace(/^\.\//, '') ?? '';

      assert.ok(
        pluginPaths.some((path) => file === path || file.startsWith(`${path}/`)),
        `${file} is not packed`,
      );
    }
  });

  test('writes a ZIP into build/ with the plugin under one trypost/ folder', () => {
    const file = buildPluginZip();
    const entries = zipEntries(file);

    assert.equal(file, `${root}/${outputFile}`);

    for (const entry of ['.codex-plugin/plugin.json', '.mcp.json', 'skills/trypost/SKILL.md', 'assets/icon-512.png']) {
      assert.ok(entries.includes(`trypost/${entry}`), `trypost/${entry} is missing from the ZIP`);
    }

    assert.deepEqual(
      entries.filter((entry) => !entry.startsWith('trypost/')),
      [],
    );
    assert.deepEqual(
      entries.filter((entry) => /^trypost\/(tests|scripts|\.github|README\.md|AGENTS\.md)/.test(entry)),
      [],
    );
  });

  test('keeps the build output out of git', () => {
    assert.doesNotThrow(() => execFileSync('git', ['check-ignore', '--quiet', outputFile], { cwd: root }));
  });

  test('the README builds the ZIP with the script', () => {
    assert.ok(read('README.md').includes('node scripts/build.ts'));
    assert.ok(!read('README.md').includes('git archive'));
  });
});

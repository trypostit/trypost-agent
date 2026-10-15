import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { describe, test } from 'node:test';

import { NETWORK_COUNT, ROOT, exists, fileSize, readJson, readText } from './helpers.mjs';

const trackedFiles = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
const readme = readText('README.md');

describe('README', () => {
  test('has at least 40 words outside code blocks', () => {
    const prose = readme.replace(/```[\s\S]*?```/g, '').replace(/<[^>]+>/g, ' ');

    assert.ok(prose.split(/\s+/).filter(Boolean).length >= 40);
  });

  test('never counts networks', () => {
    assert.doesNotMatch(readme, NETWORK_COUNT);
  });

  test('the OpenAI ZIP command packs everything the OpenAI manifest needs', () => {
    const command = readme.match(/git archive [^\n]+/)?.[0];

    assert.ok(command, 'the README has no git archive command');

    const packed = command.split(' HEAD ')[1].split(/\s+/).filter(Boolean);
    const manifest = readJson('.codex-plugin/plugin.json');
    const needed = [
      '.codex-plugin',
      manifest.mcpServers,
      manifest.skills,
      manifest.interface.logo,
      manifest.interface.composerIcon,
    ].map((entry) => entry.replace(/^\.\//, '').replace(/\/$/, ''));

    for (const entry of packed) {
      assert.ok(exists(entry), `${entry} does not exist`);
    }

    for (const entry of needed) {
      assert.ok(
        packed.some((packedPath) => entry === packedPath || entry.startsWith(`${packedPath}/`)),
        `${entry} is not packed`,
      );
    }
  });
});

describe('repository', () => {
  test('ships a license', () => {
    assert.ok(exists('LICENSE'));
  });

  test('tracks no macOS or Windows system files', () => {
    const systemFiles = trackedFiles.filter((file) => /(^|\/)(\.DS_Store|Thumbs\.db|desktop\.ini|__MACOSX)(\/|$)/.test(file));

    assert.deepEqual(systemFiles, []);
  });

  test('tracks no symbolic links', () => {
    const entries = execFileSync('git', ['ls-files', '-s'], { cwd: ROOT, encoding: 'utf8' }).split('\n');

    assert.deepEqual(
      entries.filter((entry) => entry.startsWith('120000')),
      [],
    );
  });

  test('keeps text files under 256 KiB and images under 5 MiB', () => {
    for (const file of trackedFiles) {
      const limit = /\.(png|jpe?g|gif|webp|svg)$/i.test(file) ? 5 * 1024 * 1024 : 256 * 1024;

      assert.ok(fileSize(file) < limit, `${file} is too large`);
    }
  });

  test('has no package manifest or lockfile that would install dependencies with the plugin', () => {
    for (const file of ['package.json', 'package-lock.json', 'npm-shrinkwrap.json', 'bun.lock', 'bun.lockb', '.npmrc']) {
      assert.ok(!exists(file), `${file} would make the plugin install packages`);
    }
  });

  test('has no .gitattributes rule that rewrites or drops files from archives', () => {
    if (!exists('.gitattributes')) {
      return;
    }

    assert.doesNotMatch(readText('.gitattributes'), /export-ignore|export-subst|filter=/);
  });
});

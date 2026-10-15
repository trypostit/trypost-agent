import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { describe, test } from 'node:test';

import { exists, networkCount, read, readJson, root, sizeOf } from './helpers.js';

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);

const trackedFiles = git('ls-files');
const readme = read('README.md');

describe('README', () => {
  test('has at least 40 words outside code blocks', () => {
    const prose = readme.replace(/```[\s\S]*?```/g, '').replace(/<[^>]+>/g, ' ');

    assert.ok(prose.split(/\s+/).filter(Boolean).length >= 40);
  });

  test('never counts networks', () => {
    assert.doesNotMatch(readme, networkCount);
  });

  test('the ZIP command packs everything the OpenAI manifest needs', () => {
    const [, paths = ''] = readme.match(/git archive .+ HEAD (.+)/) ?? [];
    const packed = paths.split(' ');
    const { mcpServers, skills, interface: listing } = readJson('.codex-plugin/plugin.json');
    const needed = ['.codex-plugin', mcpServers, skills, listing.logo, listing.composerIcon].map((entry) =>
      entry.replace(/^\.\//, '').replace(/\/$/, ''),
    );

    assert.ok(packed.every(exists), `the README packs a path that does not exist: ${packed}`);

    for (const entry of needed) {
      assert.ok(
        packed.some((path) => entry === path || entry.startsWith(`${path}/`)),
        `${entry} is not packed`,
      );
    }
  });
});

describe('repository', () => {
  test('ships a license', () => {
    assert.ok(exists('LICENSE'));
  });

  test('tracks no system files or symbolic links', () => {
    assert.deepEqual(
      trackedFiles.filter((file) => /(^|\/)(\.DS_Store|Thumbs\.db|desktop\.ini|__MACOSX)(\/|$)/.test(file)),
      [],
    );
    assert.deepEqual(
      git('ls-files', '-s').filter((entry) => entry.startsWith('120000')),
      [],
    );
  });

  test('keeps text files under 256 KiB and images under 5 MiB', () => {
    for (const file of trackedFiles) {
      const limit = /\.(png|jpe?g|gif|webp|svg)$/i.test(file) ? 5 * 1024 * 1024 : 256 * 1024;

      assert.ok(sizeOf(file) < limit, `${file} is too large`);
    }
  });

  test('has no package manifest or lockfile that would install dependencies', () => {
    for (const file of ['package.json', 'package-lock.json', 'npm-shrinkwrap.json', 'bun.lock', 'bun.lockb', '.npmrc']) {
      assert.ok(!exists(file), `${file} would make the plugin install packages`);
    }
  });

  test('has no .gitattributes rule that rewrites or drops files from archives', () => {
    const attributes = exists('.gitattributes') ? read('.gitattributes') : '';

    assert.doesNotMatch(attributes, /export-ignore|export-subst|filter=/);
  });
});

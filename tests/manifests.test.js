import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { exists, marketplaceManifests, mcpConfigs, networkCount, pluginManifests, read, readJson } from './helpers.js';

const canonical = readJson('.claude-plugin/plugin.json');

describe('JSON files', () => {
  for (const file of [...pluginManifests, ...marketplaceManifests, ...mcpConfigs]) {
    test(`${file} is valid JSON`, () => {
      assert.doesNotThrow(() => JSON.parse(read(file)));
    });
  }
});

describe('plugin manifests', () => {
  for (const file of pluginManifests) {
    const manifest = readJson(file);

    describe(file, () => {
      test('is named trypost', () => {
        assert.equal(manifest.name, 'trypost');
      });

      test('shares the version and description of the other manifests', () => {
        assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
        assert.equal(manifest.version, canonical.version);
        assert.equal(manifest.description, canonical.description);
      });

      test('does not count networks', () => {
        assert.doesNotMatch(manifest.description, networkCount);
      });

      test('has an author, https links and the AGPL license', () => {
        assert.ok(manifest.author?.name);
        assert.match(manifest.author.url, /^https:\/\//);
        assert.match(manifest.homepage, /^https:\/\//);
        assert.equal(manifest.repository, 'https://github.com/trypostit/trypost-agent');
        assert.equal(manifest.license, 'AGPL-3.0');
      });

      test('points at files that exist', () => {
        const skills = Array.isArray(manifest.skills) ? manifest.skills : [];

        for (const skill of skills) {
          assert.ok(exists(`${skill}/SKILL.md`), `${skill}/SKILL.md is missing`);
        }

        if (manifest.logo) {
          assert.ok(exists(manifest.logo), `${manifest.logo} is missing`);
        }
      });
    });
  }
});

describe('marketplace manifests', () => {
  for (const file of marketplaceManifests) {
    const marketplace = readJson(file);
    const plugin = marketplace.plugins.find(({ name }) => name === 'trypost');

    describe(file, () => {
      test('lists the trypost plugin', () => {
        assert.equal(marketplace.name, 'trypost-agent');
        assert.ok(plugin, 'the trypost plugin is not listed');
      });

      test('describes and versions the plugin like its manifest', () => {
        assert.equal(plugin.description, canonical.description);

        for (const version of [marketplace.metadata?.version, plugin.version].filter(Boolean)) {
          assert.equal(version, canonical.version);
        }
      });

      test('does not count networks', () => {
        assert.doesNotMatch(read(file), networkCount);
      });

      test('points at paths that exist', () => {
        const source = plugin.source.path ?? plugin.source;

        for (const entry of [source, ...(plugin.skills ?? []), plugin.logo].filter(Boolean)) {
          assert.ok(exists(entry), `${entry} is missing`);
        }
      });
    });
  }
});

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  JSON_FILES,
  MARKETPLACE_MANIFESTS,
  NETWORK_COUNT,
  PLUGIN_MANIFESTS,
  exists,
  readJson,
  readText,
} from './helpers.mjs';

const plugins = PLUGIN_MANIFESTS.map((file) => ({ file, manifest: readJson(file) }));
const canonical = readJson('.claude-plugin/plugin.json');

describe('JSON files', () => {
  for (const file of JSON_FILES) {
    test(`${file} is valid JSON`, () => {
      assert.doesNotThrow(() => JSON.parse(readText(file)));
    });
  }
});

describe('plugin manifests', () => {
  for (const { file, manifest } of plugins) {
    describe(file, () => {
      test('is named trypost', () => {
        assert.equal(manifest.name, 'trypost');
      });

      test('uses a semantic version', () => {
        assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
      });

      test('shares the version of the other manifests', () => {
        assert.equal(manifest.version, canonical.version);
      });

      test('shares the description of the other manifests', () => {
        assert.equal(manifest.description, canonical.description);
      });

      test('does not count networks in the description', () => {
        assert.doesNotMatch(manifest.description, NETWORK_COUNT);
      });

      test('has an author and https links', () => {
        assert.ok(manifest.author?.name);
        assert.match(manifest.author.url, /^https:\/\//);
        assert.match(manifest.homepage, /^https:\/\//);
        assert.equal(manifest.repository, 'https://github.com/trypostit/trypost-agent');
      });

      test('declares the AGPL license', () => {
        assert.equal(manifest.license, 'AGPL-3.0');
      });
    });
  }

  for (const { file, manifest } of plugins.filter(({ manifest }) => Array.isArray(manifest.skills))) {
    test(`${file} points at skill folders that hold a SKILL.md`, () => {
      for (const skill of manifest.skills) {
        assert.ok(exists(`${skill}/SKILL.md`), `${skill}/SKILL.md is missing`);
      }
    });
  }

  for (const { file, manifest } of plugins.filter(({ manifest }) => typeof manifest.logo === 'string')) {
    test(`${file} points at an existing logo`, () => {
      assert.ok(exists(manifest.logo), `${manifest.logo} is missing`);
    });
  }
});

describe('marketplace manifests', () => {
  for (const file of MARKETPLACE_MANIFESTS) {
    describe(file, () => {
      const marketplace = readJson(file);
      const entry = marketplace.plugins.find((plugin) => plugin.name === 'trypost');

      test('is named trypost-agent and lists the trypost plugin', () => {
        assert.equal(marketplace.name, 'trypost-agent');
        assert.ok(entry, 'the trypost plugin is not listed');
      });

      test('describes the plugin like its manifest', () => {
        assert.equal(entry.description, canonical.description);
      });

      test('does not count networks anywhere', () => {
        assert.doesNotMatch(JSON.stringify(marketplace), NETWORK_COUNT);
      });

      test('carries the manifest version wherever it states one', () => {
        for (const version of [marketplace.metadata?.version, entry.version].filter(Boolean)) {
          assert.equal(version, canonical.version);
        }
      });

      test('points at paths that exist', () => {
        const source = typeof entry.source === 'string' ? entry.source : entry.source?.path;

        assert.ok(exists(source), `${source} is missing`);

        for (const skill of entry.skills ?? []) {
          assert.ok(exists(skill), `${skill} is missing`);
        }

        if (entry.logo) {
          assert.ok(exists(entry.logo), `${entry.logo} is missing`);
        }
      });
    });
  }
});

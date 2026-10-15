import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { MCP_URL, NETWORK_COUNT, parseSkill, readText } from './helpers.mjs';

const NETWORKS = [
  'Instagram',
  'Facebook',
  'LinkedIn',
  'X',
  'TikTok',
  'YouTube',
  'Threads',
  'Pinterest',
  'Bluesky',
  'Mastodon',
  'Telegram',
  'Discord',
  'Google Business Profile',
];

const RETIRED_TERMS = ['platforms[]', 'post_platform', 'partially_published', 'toggle-social-account-tool'];

describe('skill', () => {
  const { frontMatter, body } = parseSkill('skills/trypost/SKILL.md');

  test('the plugin copy matches the root SKILL.md', () => {
    assert.equal(readText('skills/trypost/SKILL.md'), readText('SKILL.md'));
  });

  test('front matter names the skill trypost', () => {
    assert.ok(frontMatter, 'SKILL.md has no front matter');
    assert.equal(frontMatter.name, 'trypost');
  });

  test('description is one line of at most 1024 characters', () => {
    assert.ok(frontMatter.description);
    assert.ok(frontMatter.description.length <= 1024);
  });

  test('metadata line is valid JSON', () => {
    assert.doesNotThrow(() => JSON.parse(frontMatter.metadata));
  });

  test('description covers every supported network', () => {
    for (const network of NETWORKS) {
      assert.ok(frontMatter.description.includes(network), `${network} is missing`);
    }
  });

  test('never counts networks', () => {
    assert.doesNotMatch(readText('SKILL.md'), NETWORK_COUNT);
  });

  test('points at the hosted MCP server', () => {
    assert.ok(body.includes(MCP_URL));
  });

  test('does not describe the pre-2.0 post model', () => {
    for (const term of RETIRED_TERMS) {
      assert.ok(!body.includes(term), `${term} belongs to the pre-2.0 model`);
    }
  });
});

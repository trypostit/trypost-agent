import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { frontMatter, mcpUrl, networkCount, read } from './helpers.js';

const networks = [
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

const retiredTerms = ['platforms[]', 'post_platform', 'partially_published', 'toggle-social-account-tool'];

describe('skill', () => {
  const skill = read('skills/trypost/SKILL.md');
  const { name, description, metadata } = frontMatter('skills/trypost/SKILL.md');

  test('the plugin copy matches the root SKILL.md', () => {
    assert.equal(skill, read('SKILL.md'));
  });

  test('front matter is valid', () => {
    assert.equal(name, 'trypost');
    assert.ok(description && description.length <= 1024);
    assert.doesNotThrow(() => JSON.parse(metadata));
  });

  test('description names every supported network', () => {
    for (const network of networks) {
      assert.ok(description.includes(network), `${network} is missing`);
    }
  });

  test('never counts networks', () => {
    assert.doesNotMatch(skill, networkCount);
  });

  test('points at the hosted MCP server', () => {
    assert.ok(skill.includes(mcpUrl));
  });

  test('does not describe the pre-2.0 post model', () => {
    for (const term of retiredTerms) {
      assert.ok(!skill.includes(term), `${term} belongs to the pre-2.0 model`);
    }
  });
});

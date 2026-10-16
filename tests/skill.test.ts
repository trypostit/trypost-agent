import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { exists, frontMatter, mcpUrl, networkCount, read, readJson, toolNames, unqualifiedToolNames } from './helpers.ts';
import type { PluginManifest } from './types.ts';

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
  const { name, description = '', metadata = '' } = frontMatter('skills/trypost/SKILL.md');

  test('the plugin copy matches the root SKILL.md', () => {
    assert.equal(skill, read('SKILL.md'));
  });

  test('front matter is valid', () => {
    assert.equal(name, 'trypost');
    assert.ok(description.length > 0 && description.length <= 1024);
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

describe('skill tool names and sign-in', () => {
  const skill = read('skills/trypost/SKILL.md');

  test('names every tool with its trypost server', () => {
    assert.deepEqual(unqualifiedToolNames(skill), []);
  });

  test('asks to search for the tools before asking the user to sign in', () => {
    assert.ok(skill.indexOf("search the client's tools for `trypost`") > -1);
    assert.ok(skill.indexOf("search the client's tools for `trypost`") < skill.indexOf("plugin or connector settings"));
  });

  test('explains where the tools come from and how the user signs in', () => {
    assert.ok(skill.includes('## Connecting'));
    assert.ok(skill.includes('mcp__trypost__list_social_accounts_tool'));
    assert.ok(skill.includes('plugin or connector settings'));
    assert.ok(!skill.includes('https://app.trypost.it/login'));
    assert.ok(skill.includes('https://app.trypost.it/register'));
  });
});

describe('setup skill', () => {
  const setup = read('skills/setup/SKILL.md');
  const { name, description = '' } = frontMatter('skills/setup/SKILL.md');
  const onboardingSkill = readJson<PluginManifest>('.codex-plugin/plugin.json').extensions?.['com.openai']?.onboardingSkill ?? '';

  test('is the onboarding skill the OpenAI manifest declares', () => {
    assert.equal(onboardingSkill, './skills/setup/SKILL.md');
    assert.ok(exists(onboardingSkill));
  });

  test('front matter is valid', () => {
    assert.equal(name, 'trypost-setup');
    assert.ok(description.length > 0 && description.length <= 1024);
  });

  test('only uses tools the main skill documents, by their qualified names', () => {
    const documented = toolNames(read('skills/trypost/SKILL.md'));

    assert.deepEqual(unqualifiedToolNames(setup), []);

    for (const tool of toolNames(setup)) {
      assert.ok(documented.has(tool), `${tool} is not in the main skill`);
    }
  });

  test('finds the tools first and asks to sign in only when they are missing', () => {
    assert.match(setup, /^1\. Find the TryPost tools first\./m);
    assert.ok(setup.indexOf("Search the client's tools for `trypost`") < setup.indexOf('connect TryPost from the plugin settings'));
  });

  test('signs the user in through the plugin settings, never the website', () => {
    assert.ok(setup.includes('connect TryPost from the plugin settings'));
    assert.ok(!setup.includes('https://app.trypost.it/login'));
    assert.ok(setup.includes('https://app.trypost.it/register'));
  });
});

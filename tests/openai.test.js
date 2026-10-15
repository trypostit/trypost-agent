import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { contrastWithWhite, exists, pngDimensions, read, readJson, sizeOf, toolNames } from './helpers.js';

const manifest = readJson('.codex-plugin/plugin.json');
const listing = manifest.interface;
const openai = manifest.extensions?.['com.openai'] ?? {};
const testCases = openai.review?.test_cases ?? {};

describe('OpenAI package', () => {
  test('name is kebab case, at most 64 characters', () => {
    assert.match(manifest.name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.ok(manifest.name.length <= 64);
  });

  test('description and author fit their limits', () => {
    assert.ok(manifest.description.length <= 4000);
    assert.ok(manifest.author.name.length <= 120);
    assert.ok(manifest.author.email.length <= 320);
    assert.match(manifest.author.url, /^https:\/\//);
  });

  test('declares the skills folder and the MCP configuration', () => {
    assert.equal(manifest.skills, './skills/');
    assert.equal(manifest.mcpServers, './.mcp.json');
    assert.ok(exists(manifest.mcpServers));
  });

  test('ships no hooks or app references', () => {
    for (const settings of [manifest, openai]) {
      assert.equal(settings.hooks, undefined);
      assert.equal(settings.apps, undefined);
    }
  });
});

describe('OpenAI listing', () => {
  test('text fields fit their limits', () => {
    assert.ok(listing.displayName.length <= 30);
    assert.ok(listing.shortDescription.length <= 30);
    assert.ok(listing.longDescription.length <= 4000);
    assert.ok(listing.developerName.length <= 80);
    assert.ok(listing.category);
    assert.ok(listing.capabilities.length <= 20);
    assert.ok(listing.capabilities.every((capability) => capability.length <= 120));
  });

  test('has the four https URLs that MCP review requires', () => {
    for (const field of ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL']) {
      assert.match(listing[field], /^https:\/\/[^@\s]+$/, field);
    }
  });

  test('has up to three unique starter prompts of 128 characters', () => {
    assert.ok(listing.defaultPrompt.length <= 3);
    assert.equal(new Set(listing.defaultPrompt).size, listing.defaultPrompt.length);
    assert.ok(listing.defaultPrompt.every((prompt) => prompt.length <= 128));
  });

  test('brand color has at least 2:1 contrast against white', () => {
    assert.match(listing.brandColor, /^#[0-9A-Fa-f]{6}$/);
    assert.ok(contrastWithWhite(listing.brandColor) >= 2);
  });

  test('does not advertise prices, trials or discounts', () => {
    const copy = [listing.shortDescription, listing.longDescription, ...listing.defaultPrompt].join(' ');

    assert.doesNotMatch(copy, /\$\d|pricing|free trial|discount|coupon|upgrade|subscribe/i);
  });

  for (const field of ['logo', 'composerIcon']) {
    test(`${field} is a square PNG between 48 and 4096 pixels`, () => {
      const icon = listing[field];
      const dimensions = pngDimensions(icon);

      assert.match(icon, /^\.\/assets\//);
      assert.ok(sizeOf(icon) <= 5 * 1024 * 1024);
      assert.ok(dimensions, `${icon} is not a PNG`);
      assert.equal(dimensions.width, dimensions.height);
      assert.ok(dimensions.width >= 48 && dimensions.width <= 4096);
    });
  }
});

describe('OpenAI review', () => {
  test('has five positive and three negative test cases', () => {
    assert.equal(testCases.positive?.length, 5);
    assert.equal(testCases.negative?.length, 3);
  });

  test('every test case is complete', () => {
    for (const testCase of testCases.positive) {
      for (const field of ['description', 'prompt', 'tools_triggered', 'expected_behavior']) {
        assert.ok(testCase[field]?.trim(), `"${testCase.description}" has no ${field}`);
      }
    }

    for (const testCase of testCases.negative) {
      assert.ok(testCase.description?.trim());
      assert.ok(testCase.prompt?.trim());
    }
  });

  test('positive test cases only use tools the skill documents', () => {
    const documented = toolNames(read('skills/trypost/SKILL.md'));

    for (const testCase of testCases.positive) {
      for (const tool of toolNames(testCase.tools_triggered)) {
        assert.ok(documented.has(tool), `${tool} is not in the skill`);
      }
    }
  });

  test('declares no commerce and keeps reviewer access out of the package', () => {
    assert.equal(openai.review.commerce, false);
    assert.doesNotMatch(JSON.stringify(manifest), /test_credentials|reviewer_instructions|password/i);
  });
});

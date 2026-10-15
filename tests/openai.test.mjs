import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { contrastRatio, exists, fileSize, pngSize, readJson, readText, toolNamesIn } from './helpers.mjs';

/**
 * Limits from https://developers.openai.com/plugins/deploy/submission#manifest-fields
 */
const manifest = readJson('.codex-plugin/plugin.json');
const listing = manifest.interface;
const openai = manifest.extensions?.['com.openai'] ?? {};
const skillTools = toolNamesIn(readText('skills/trypost/SKILL.md'));

describe('OpenAI package identity', () => {
  test('name is lowercase kebab case, at most 64 characters', () => {
    assert.match(manifest.name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.ok(manifest.name.length <= 64);
  });

  test('description is at most 4000 characters', () => {
    assert.ok(manifest.description.length <= 4000);
  });

  test('author name, email and url fit their limits', () => {
    assert.ok(manifest.author.name.length <= 120);
    assert.ok(manifest.author.email.length <= 320);
    assert.match(manifest.author.url, /^https:\/\//);
  });

  test('declares the skills folder and the MCP configuration', () => {
    assert.equal(manifest.skills, './skills/');
    assert.equal(manifest.mcpServers, './.mcp.json');
    assert.ok(exists(manifest.mcpServers));
  });

  test('ships no lifecycle hooks or app references, which the directory refuses', () => {
    assert.equal(manifest.hooks, undefined);
    assert.equal(manifest.apps, undefined);
    assert.equal(openai.hooks, undefined);
    assert.equal(openai.apps, undefined);
  });
});

describe('OpenAI listing', () => {
  test('display name and subtitle are at most 30 characters', () => {
    assert.ok(listing.displayName.length <= 30);
    assert.ok(listing.shortDescription.length <= 30);
  });

  test('long description is at most 4000 characters', () => {
    assert.ok(listing.longDescription.length <= 4000);
  });

  test('developer name is at most 80 characters', () => {
    assert.ok(listing.developerName.length <= 80);
  });

  test('has a category and capability labels within limits', () => {
    assert.ok(listing.category);
    assert.ok(listing.capabilities.length <= 20);

    for (const capability of listing.capabilities) {
      assert.ok(capability.length <= 120);
    }
  });

  test('has the four https URLs MCP review requires', () => {
    for (const field of ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL']) {
      assert.match(listing[field], /^https:\/\/[^@\s]+$/, `${field} must be an https URL`);
      assert.ok(listing[field].length <= 1024);
    }
  });

  test('has at most three unique starter prompts of 128 characters', () => {
    assert.ok(listing.defaultPrompt.length <= 3);
    assert.equal(new Set(listing.defaultPrompt).size, listing.defaultPrompt.length);

    for (const prompt of listing.defaultPrompt) {
      assert.ok(prompt.length <= 128, `"${prompt}" is longer than 128 characters`);
      assert.doesNotMatch(prompt, /@\w/);
    }
  });

  test('brand color is #RRGGBB with at least 2:1 contrast against white', () => {
    assert.match(listing.brandColor, /^#[0-9A-Fa-f]{6}$/);
    assert.ok(contrastRatio(listing.brandColor, '#FFFFFF') >= 2);
  });

  test('does not advertise prices, trials or discounts', () => {
    const text = [listing.shortDescription, listing.longDescription, ...listing.defaultPrompt].join(' ');

    assert.doesNotMatch(text, /\$\d|price|pricing plan|free trial|discount|coupon|upgrade|subscribe/i);
  });
});

describe('OpenAI icons', () => {
  for (const field of ['logo', 'composerIcon']) {
    test(`${field} is a square PNG between 48 and 4096 pixels, at most 5 MiB`, () => {
      const icon = listing[field];

      assert.match(icon, /^\.\/assets\//);
      assert.ok(exists(icon), `${icon} is missing`);
      assert.ok(fileSize(icon) <= 5 * 1024 * 1024);

      const size = pngSize(icon);

      assert.ok(size, `${icon} is not a PNG`);
      assert.equal(size.width, size.height, `${icon} is ${size.width}x${size.height}`);
      assert.ok(size.width >= 48 && size.width <= 4096);
    });
  }
});

describe('OpenAI review information', () => {
  const { positive, negative } = openai.review?.test_cases ?? {};

  test('has exactly five positive and three negative test cases', () => {
    assert.equal(positive?.length, 5);
    assert.equal(negative?.length, 3);
  });

  test('positive cases have a description, prompt, tools and expected behavior', () => {
    for (const testCase of positive) {
      for (const field of ['description', 'prompt', 'tools_triggered', 'expected_behavior']) {
        assert.ok(testCase[field]?.trim(), `"${testCase.description}" has no ${field}`);
      }
    }
  });

  test('negative cases have a description and a prompt', () => {
    for (const testCase of negative) {
      assert.ok(testCase.description?.trim());
      assert.ok(testCase.prompt?.trim());
    }
  });

  test('positive cases only trigger tools the skill documents', () => {
    for (const testCase of positive) {
      for (const tool of testCase.tools_triggered.split(',').map((name) => name.trim())) {
        assert.ok(skillTools.has(tool), `${tool} is not documented in the skill`);
      }
    }
  });

  test('declares that the plugin sells nothing', () => {
    assert.equal(openai.review.commerce, false);
  });

  test('keeps reviewer credentials out of the package', () => {
    const serialized = JSON.stringify(manifest);

    assert.doesNotMatch(serialized, /test_credentials|reviewer_instructions|password/i);
  });
});

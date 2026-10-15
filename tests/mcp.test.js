import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { mcpConfigs, mcpUrl, pluginManifests, readJson } from './helpers.js';

describe('MCP configuration files', () => {
  for (const file of mcpConfigs) {
    const servers = readJson(file).mcpServers;

    test(`${file} declares the hosted TryPost server over HTTP, without headers`, () => {
      assert.deepEqual(Object.keys(servers), ['trypost']);
      assert.equal(servers.trypost.type, 'http');
      assert.equal(servers.trypost.url, mcpUrl);
      assert.equal(servers.trypost.headers, undefined);
    });
  }
});

describe('MCP servers inside plugin manifests', () => {
  for (const file of pluginManifests) {
    const servers = readJson(file).mcpServers;

    if (typeof servers !== 'object') {
      continue;
    }

    test(`${file} points at the hosted TryPost server, without headers`, () => {
      assert.deepEqual(Object.keys(servers), ['trypost']);
      assert.equal(servers.trypost.url, mcpUrl);
      assert.equal(servers.trypost.headers, undefined);
    });
  }
});

describe('OpenAI authentication in .mcp.json', () => {
  const server = readJson('.mcp.json').mcpServers.trypost;
  const auth = server.extensions?.['com.openai']?.auth;

  test('signs in through OAuth with Dynamic Client Registration', () => {
    assert.equal(auth?.type, 'oauth');
    assert.equal(auth.client?.mode, 'dcr');
  });

  test('ships no client credentials', () => {
    assert.doesNotMatch(JSON.stringify(server), /clientSecret|clientId|client_secret|api_key/i);
  });
});

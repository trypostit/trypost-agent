import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { MCP_CONFIGS, MCP_URL, PLUGIN_MANIFESTS, readJson } from './helpers.mjs';

const inlineServers = PLUGIN_MANIFESTS.map((file) => ({ file, servers: readJson(file).mcpServers })).filter(
  ({ servers }) => typeof servers === 'object',
);

describe('MCP configuration files', () => {
  for (const file of MCP_CONFIGS) {
    describe(file, () => {
      const servers = readJson(file).mcpServers;

      test('declares exactly the trypost server', () => {
        assert.deepEqual(Object.keys(servers), ['trypost']);
      });

      test('points at the hosted TryPost MCP server over HTTP', () => {
        assert.equal(servers.trypost.url, MCP_URL);
        assert.equal(servers.trypost.type, 'http');
      });

      test('sends no static headers', () => {
        assert.equal(servers.trypost.headers, undefined);
      });
    });
  }
});

describe('.mcp.json OpenAI authentication', () => {
  const server = readJson('.mcp.json').mcpServers.trypost;
  const auth = server.extensions?.['com.openai']?.auth;

  test('signs in through OAuth with Dynamic Client Registration', () => {
    assert.equal(auth?.type, 'oauth');
    assert.equal(auth.client?.mode, 'dcr');
  });

  test('ships no client credentials', () => {
    const serialized = JSON.stringify(server);

    assert.doesNotMatch(serialized, /clientSecret|clientId|client_secret|api_key/i);
  });
});

describe('MCP servers declared inside plugin manifests', () => {
  for (const { file, servers } of inlineServers) {
    test(`${file} points at the hosted TryPost MCP server`, () => {
      assert.deepEqual(Object.keys(servers), ['trypost']);
      assert.equal(servers.trypost.url, MCP_URL);
      assert.equal(servers.trypost.headers, undefined);
    });
  }
});

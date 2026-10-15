export type Author = {
  name: string;
  email?: string;
  url?: string;
};

export type McpServer = {
  type?: string;
  url: string;
  headers?: Record<string, string>;
  extensions?: {
    'com.openai'?: {
      auth?: {
        type: string;
        client?: { mode: string };
      };
    };
  };
};

export type McpConfig = {
  mcpServers: Record<string, McpServer>;
};

export type Listing = {
  displayName: string;
  shortDescription: string;
  longDescription: string;
  developerName: string;
  category: string;
  capabilities: string[];
  websiteURL: string;
  supportURL: string;
  privacyPolicyURL: string;
  termsOfServiceURL: string;
  defaultPrompt: string[];
  brandColor: string;
  composerIcon: string;
  logo: string;
};

export type ReviewTestCase = {
  description: string;
  prompt: string;
  tools_triggered?: string;
  expected_behavior?: string;
};

export type OpenAiSettings = {
  hooks?: unknown;
  apps?: unknown;
  review?: {
    test_cases?: {
      positive?: ReviewTestCase[];
      negative?: ReviewTestCase[];
    };
    commerce?: boolean;
  };
};

export type PluginManifest = {
  name: string;
  version: string;
  description: string;
  author: Author;
  homepage: string;
  repository: string;
  license: string;
  skills?: string | string[];
  logo?: string;
  mcpServers?: string | Record<string, McpServer>;
  hooks?: unknown;
  apps?: unknown;
  interface?: Listing;
  extensions?: { 'com.openai'?: OpenAiSettings };
};

export type MarketplacePlugin = {
  name: string;
  description: string;
  version?: string;
  source: string | { path: string };
  skills?: string[];
  logo?: string;
};

export type Marketplace = {
  name: string;
  metadata?: { version?: string };
  plugins: MarketplacePlugin[];
};

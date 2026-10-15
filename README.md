<p align="center">
  <img src="assets/logo.svg" alt="TryPost" width="96" />
</p>

<h1 align="center">TryPost Agent</h1>

<p align="center">
  Official ChatGPT, Codex, Cursor, Claude Code, and Grok plugins for <a href="https://trypost.it">TryPost</a> —<br/>
  plan, schedule, and publish social media posts from your AI assistant.
</p>

<p align="center">
  <a href="https://trypost.it"><b>Try on Cloud</b></a> &nbsp;&bull;&nbsp;
  <a href="https://docs.trypost.it/ai/introduction">MCP docs</a> &nbsp;&bull;&nbsp;
  <a href="https://github.com/trypostit/trypost">trypostit/trypost</a>
</p>

## Install as a skill

```bash
npx skills add trypostit/trypost-agent
```

### Claude Code plugin

```bash
/plugin marketplace add trypostit/trypost-agent
/plugin install trypost@trypost-agent
```

The plugin registers the hosted TryPost MCP server (`https://app.trypost.it/mcp/trypost`). Claude opens a browser to sign in on first connection — no API key or local install.

### Grok Build plugin

This repo ships a [Grok Build](https://github.com/xai-org/plugin-marketplace) manifest at `.grok-plugin/plugin.json` and a catalog at `.grok-plugin/marketplace.json`, so it can be added as a marketplace source directly.

The Grok plugin bundles the hosted TryPost MCP server via `mcpServers` — you'll be asked to sign in to TryPost on first connection; no token or local install needed.

```bash
grok plugin marketplace add trypostit/trypost-agent
```

Or install from the [xAI plugin marketplace](https://github.com/xai-org/plugin-marketplace) once the listing is merged.

### ChatGPT and Codex plugin

This repo ships an OpenAI plugin manifest at `.codex-plugin/plugin.json`, with the MCP server and its OAuth settings in `.mcp.json`. The manifest carries the listing text, icon, and the review test cases for the [OpenAI plugin directory](https://developers.openai.com/plugins/deploy/submission).

Build the ZIP to upload at [platform.openai.com/plugins](https://platform.openai.com/plugins):

```bash
node scripts/build.ts
```

It writes `build/trypost-chatgpt.zip` (git-ignored) from the last commit, so commit your changes before building. The demo video URL goes in `.codex-plugin/plugin.json` (`extensions.com.openai.review.demo_recording_url`); reviewer credentials and the domain verification token are entered in the dashboard, never in the package.

### Cursor plugin

This repo ships a [Cursor plugin](https://cursor.com/docs/reference/plugins) manifest at `.cursor-plugin/plugin.json`.

- **From the marketplace / Customize panel:** open **Customize** in the Cursor sidebar, find **trypost**, and select **Install** (project or user scope).
- **Local install (development):**

  ```bash
  git clone https://github.com/trypostit/trypost-agent.git
  ln -s "$(pwd)/trypost-agent" ~/.cursor/plugins/local/trypost
  ```

  then restart Cursor or run **Developer: Reload Window**.

The plugin exposes the `trypost` skill and the hosted MCP server. On first tool call, Cursor opens a browser for TryPost OAuth.

---

## What the agent can do

Once the plugin is installed and you've signed in, ask in plain language:

- "List my connected social accounts"
- "Draft a LinkedIn post for tomorrow at 9am and preview it"
- "Publish this TikTok now"
- "What do I have scheduled this week?"
- "Attach https://example.com/photo.jpg to the draft, then publish"
- "Watch my Instagram reels and republish to TikTok"

The skill drives the official MCP tools (posts, media, queue and posting times, approvals, ideas, labels, signatures, analytics, repurpose, webhooks, API keys, workspace). See [SKILL.md](./SKILL.md) for the full workflow.

---

## MCP server

| | |
|---|---|
| **URL** | `https://app.trypost.it/mcp/trypost` |
| **Auth** | OAuth 2.1 + Dynamic Client Registration (`mcp:use`) |
| **API keys** | REST API only. A Personal Access Token on the MCP URL returns `403`. |

Self-hosted instances use `{APP_URL}/mcp/trypost` (must be public HTTPS for hosted agents like Grok). Cloud MCP requires an active subscription.

Manual client setup (without the plugin):

```json
{
  "mcpServers": {
    "trypost": {
      "type": "http",
      "url": "https://app.trypost.it/mcp/trypost"
    }
  }
}
```

Guides for every client: [docs.trypost.it/ai/introduction](https://docs.trypost.it/ai/introduction).

### What the plugin runs and sends

The plugin runs no code on your machine. It ships a skill (instructions for the assistant) and the address of TryPost's hosted MCP server. Your assistant talks to `https://app.trypost.it` over HTTPS only, after you sign in to TryPost and approve the connection, and acts only in the workspace you picked. TryPost then publishes to the social networks connected to that workspace when you ask it to. See the [privacy policy](https://trypost.it/privacy).

---

## Supported platforms

Native publishing through each network's official API:

Instagram · Facebook · LinkedIn · X · TikTok · YouTube · Threads · Pinterest · Bluesky · Mastodon · Telegram · Discord · Google Business Profile

---

## Repository layout

```
.cursor-plugin/     Cursor plugin + marketplace manifests
.claude-plugin/     Claude Code plugin + marketplace manifests
.grok-plugin/       Grok Build plugin + marketplace manifests
.codex-plugin/      ChatGPT / Codex plugin manifest (OpenAI plugin directory)
.mcp.json           MCP server + OAuth settings (Claude Code and the OpenAI plugin)
skills/trypost/     Agent skill (SKILL.md)
mcp.json            Shared MCP server definition
assets/             Logo and icons
SKILL.md            Same skill, repo root (npx skills add / OpenClaw)
scripts/build.ts    Builds the OpenAI plugin ZIP into build/
tests/              Manifest, MCP, skill and packaging tests (TypeScript, node --test)
tsconfig.json       TypeScript settings for the tests
AGENTS.md           Rules for contributors and coding agents
```

---

## Development

Everything is TypeScript, run directly by Node 24+ (no build step, no `package.json`). Read [AGENTS.md](./AGENTS.md) before changing anything.

```bash
node --test                 # run the tests
node scripts/build.ts       # build the OpenAI plugin ZIP into build/

npm install --no-save --no-package-lock typescript@7.0.2 @types/node@24.19.0
npx tsc -p .                # type-check
```

CI (`.github/workflows/tests.yml`) runs the tests and the type check on every pull request, validates the Claude plugin with `claude plugin validate --strict`, and builds the OpenAI plugin ZIP as an artifact.

---

## License

[AGPL-3.0](./LICENSE) — same license as [TryPost](https://github.com/trypostit/trypost).

---

## Links

- **Website:** [trypost.it](https://trypost.it)
- **Docs:** [docs.trypost.it](https://docs.trypost.it)
- **MCP tools:** [docs.trypost.it/ai/tools-reference](https://docs.trypost.it/ai/tools-reference)
- **App:** [app.trypost.it](https://app.trypost.it)
- **Source:** [trypostit/trypost](https://github.com/trypostit/trypost)

<p align="center">
  <img src="assets/logo.svg" alt="TryPost" width="96" />
</p>

<h1 align="center">TryPost Agent</h1>

<p align="center">
  Official Cursor, Claude Code, and Grok plugins for <a href="https://trypost.it">TryPost</a> —<br/>
  draft, schedule, and publish across 12 networks from your AI assistant.
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

The skill drives the official MCP tools (posts, media, Asset Library, signatures, labels, accounts, webhooks, repurpose, workspace). See [SKILL.md](./SKILL.md) for the full workflow.

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

---

## Supported platforms

Native publishing through each network's official API:

Instagram · Facebook · LinkedIn · X · TikTok · YouTube Shorts · Threads · Pinterest · Bluesky · Mastodon · Telegram · Discord

---

## Repository layout

```
.cursor-plugin/     Cursor plugin + marketplace manifests
.claude-plugin/     Claude Code plugin + marketplace manifests
.grok-plugin/       Grok Build plugin + marketplace manifests
skills/trypost/     Agent skill (SKILL.md)
mcp.json            Shared MCP server definition
assets/             Logo and icon
SKILL.md            Same skill, repo root (npx skills add / OpenClaw)
```

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

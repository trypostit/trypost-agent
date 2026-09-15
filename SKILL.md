---
name: trypost
description: Schedules and publishes social media posts through TryPost's hosted MCP server. Use when the user wants to draft, schedule, publish, preview, or analyze posts across Instagram, Facebook, LinkedIn, X, TikTok, YouTube, Threads, Pinterest, Bluesky, Mastodon, Telegram, or Discord, or when they mention TryPost, social accounts, signatures, labels, webhooks, or repurpose.
homepage: https://trypost.it
metadata: {"openclaw":{"emoji":"📅","requires":{"bins":[],"env":[]}}}
---

# TryPost

TryPost is an open-source social media scheduler with a first-class MCP server. The plugin registers `https://app.trypost.it/mcp/trypost`. On first tool call the client opens a browser for OAuth (`mcp:use`). Do **not** put a Personal Access Token on the MCP URL — API keys are REST-only and return `403`.

Docs: https://docs.trypost.it/ai/introduction
App: https://app.trypost.it
Site: https://trypost.it

Self-hosted: `{APP_URL}/mcp/trypost` (must be public HTTPS). Cloud requires an active subscription (`402` if missing).

## Hard rules

**1 — Use MCP tools, never invent IDs.** Discover `social_account_id`, `content_type`, Pinterest `board_id`, and Discord `channel_id` from tools.

**2 — `create-post-tool` always creates a draft.** `scheduled_at` on create is stored on the draft and does **not** queue publishing. Call `publish-post-tool` to publish now or schedule.

**3 — No `media[]` on create/update.** Attach after create with `attach-media-from-url-tool`, `attach-existing-asset-tool`, or `request-media-upload-tool` + `attach-media-from-upload-tool`.

**4 — Required meta before publish** (validated by `publish-post-tool`; missing values fail):

| Platform | Required `platforms[].meta` | How to resolve |
|---|---|---|
| TikTok | `privacy_level` | `"PUBLIC_TO_EVERYONE"`, `"MUTUAL_FOLLOW_FRIENDS"`, `"FOLLOWER_OF_CREATOR"`, `"SELF_ONLY"` |
| Pinterest | `board_id` | `list-pinterest-boards-tool` |
| Discord | `channel_id` | `list-discord-channels-tool` |

**5 — Call `list-content-types-tool` before choosing `content_type`.** Honor `requires_media`, `max_media_count`, `accept_*`, duration/size caps. There is no `instagram_carousel` / `linkedin_carousel` type — carousels are `instagram_feed` / `linkedin_post` with multiple images or a LinkedIn PDF.

**6 — Confirm destructive tools** (`publish-post-tool`, `delete-*`, `rotate-webhook-secret-tool`) with the user before calling.

## Core workflow

```
1. get-workspace-tool
2. list-social-accounts-tool          # id, platform, display_name, is_active
3. list-content-types-tool            # valid content_type + limits
4. list-pinterest-boards-tool / list-discord-channels-tool if needed
5. create-post-tool                   # draft + platforms + meta
6. attach media (URL / library / signed upload)
7. preview-post-tool                  # compare sanitized_length vs max_content_length
8. publish-post-tool                  # omit scheduled_at = now; ISO 8601 future = queue
9. get-post-metrics-tool              # after published
```

Prefer public URLs (`attach-media-from-url-tool`) or the Asset Library (`list-assets-tool` + `attach-existing-asset-tool`). Use signed upload only for a local file with no public URL.

## Authentication

OAuth 2.1 + Dynamic Client Registration. First tool call opens the browser. Re-auth on `401`. `403` with "MCP OAuth authorization required" means an API key was sent — remove it. `402` means the Cloud account has no active plan.

Workspace is bound to the OAuth grant. Switch workspace in the TryPost UI (Settings → MCP) and reconnect. Viewers are read-only.

## Posts

| Tool | Notes |
|---|---|
| `list-posts-tool` | Filters: `status` (`draft` \| `scheduled` \| `published` \| `failed`), `search`, `limit` (1–100, default 50). `published` includes partially published. |
| `get-post-tool` | Full post: platforms (with `meta`), media, labels. |
| `create-post-tool` | `content` (max 10 000), optional `scheduled_at`, `label_ids[]`, `platforms[]` (`social_account_id` + `content_type` + optional `meta`). Inactive accounts and mismatched content types are rejected. |
| `update-post-tool` | `post_id` plus fields to change. Platform entries use `id` (the `post_platform` UUID). Platforms not listed are **disabled**. `meta` is merged; send `null` to clear a key. `status` may be `draft` or `scheduled` only. Cannot edit a finalized post. |
| `publish-post-tool` | Needs ≥1 enabled platform. Validates required meta and media vs each content type. |
| `preview-post-tool` | Same sanitization as publish (LinkedIn Unicode bold, Telegram HTML, X link defusing). Nothing is truncated — compare lengths. |
| `delete-post-tool` | Permanent. |

### Media

| Tool | When |
|---|---|
| `attach-media-from-url-tool` | Public HTTP(S) URLs. `urls`: `[{url, alt?}]`, max 10. JPEG/PNG/GIF/WebP, MP4/MOV, PDF. |
| `list-assets-tool` / `get-asset-tool` | Browse the workspace library (`search`, `type`, `limit`). |
| `attach-existing-asset-tool` | Reuse a library item (`post_id`, `asset_id`, optional `alt`). Does not copy bytes. Draft/scheduled only. |
| `request-media-upload-tool` | Signed one-shot POST URL (~15 min). Returns `upload_token`, `upload_url`, `field_name` (`media`). |
| `attach-media-from-upload-tool` | After the file is POSTed: `post_id` + `upload_token` + optional `alt`. |

Image alt lives on `media[].meta.alt_text`, set via the attach tools' `alt` field.

Local upload:

```bash
curl -F media=@./clip.mp4 "$UPLOAD_URL"
```

Then `attach-media-from-upload-tool`.

## Content types

Call `list-content-types-tool` for live limits. Common values:

| Platform | Types |
|---|---|
| Instagram | `instagram_feed`, `instagram_reel`, `instagram_story` |
| Facebook | `facebook_post`, `facebook_reel`, `facebook_story` |
| LinkedIn / Page | `linkedin_post`, `linkedin_page_post` |
| X | `x_post` |
| Threads | `threads_post` |
| TikTok | `tiktok_video`, `tiktok_photo` |
| YouTube | `youtube_short` |
| Pinterest | `pinterest_pin`, `pinterest_video_pin`, `pinterest_carousel` |
| Bluesky / Mastodon / Telegram / Discord | `bluesky_post`, `mastodon_post`, `telegram_post`, `discord_message` |

Media-required: Instagram (all), Facebook reel/story, TikTok, YouTube Short, Pinterest. Text-only OK: LinkedIn, X, Threads, Bluesky, Mastodon, Telegram, Facebook post, Discord.

## Per-platform `meta`

Unknown keys are dropped. Enums are exact JSON strings.

| Platform | Optional | Required on publish |
|---|---|---|
| Instagram / Facebook | `aspect_ratio`: `"1:1"` \| `"4:5"` \| `"16:9"` \| `"original"` | — |
| LinkedIn | `document_title` (PDF, max 300) | — |
| TikTok | `allow_comments`, `allow_duet`, `allow_stitch`, `auto_add_music`, `is_aigc`, `disclose`, `brand_content_toggle`, `brand_organic_toggle` | `privacy_level` |
| Pinterest | `title` (max 100), `link` (http/https). Description = post `content`. | `board_id` |
| Discord | `channel_name`, `mentions` (`[{token,label}]`), `embeds` (max 10) | `channel_id` |

## Other tools

**Accounts:** `list-social-accounts-tool`, `toggle-social-account-tool` (Owner/Admin), `list-pinterest-boards-tool`, `list-discord-channels-tool`.

**Signatures:** reusable hashtag/CTA blocks — `list` / `create` / `update` / `delete-signature-tool`.

**Labels:** color tags — `list` / `create` / `update` / `delete-label-tool` (`color` as `#RRGGBB`).

**Workspace:** `get-workspace-tool`.

**API keys (REST, not MCP):** `list` / `create` / `delete-api-key-tool`. `create` returns `token` once. Owner/Admin. Never put that token on the MCP server.

**Repurpose:** watch Instagram/Facebook videos posted *outside* TryPost and replicate them. Create as draft → set destinations (video `content_type` + required meta) → `activate-repurpose-tool`. `list-repurpose-source-formats-tool` for `reel` / `video` / `story`. Only videos published after activate are copied. TryPost-published source videos are skipped.

**Webhooks (Owner/Admin):** events `post.created`, `post.scheduled`, `post.unscheduled`, `post.published`, `post.partially_published`, `post.failed`, `post.deleted`. HMAC-SHA256 in `X-Webhook-Signature`. Pauses after 5 consecutive failures. `send-webhook-test-tool` does not write a log.

## Patterns

### Draft for LinkedIn + X

1. `list-social-accounts-tool` → pick LinkedIn and X ids
2. `create-post-tool` with `content`, `platforms: [{social_account_id, content_type: "linkedin_post"}, {social_account_id, content_type: "x_post"}]`
3. Optional `attach-media-from-url-tool`
4. `preview-post-tool` — if X `sanitized_length` > `max_content_length`, shorten via `update-post-tool`
5. `publish-post-tool` with `scheduled_at` or omit for now

### TikTok video

1. Account + `tiktok_video`
2. Create draft with `meta.privacy_level: "PUBLIC_TO_EVERYONE"` (user saying "post this to TikTok" means public unless they asked otherwise)
3. Attach video (URL or signed upload)
4. Preview → publish

### Pinterest pin

1. `list-pinterest-boards-tool` → `board_id`
2. Create with `pinterest_pin` and `meta: {board_id, title}`
3. Attach image (required)
4. Publish

### Discord message

1. `list-discord-channels-tool` → `channel_id`
2. Create with `discord_message` and `meta.channel_id`
3. Publish

### Local file

1. Create draft with platforms
2. `request-media-upload-tool` → give the user `curl -F media=@file "$upload_url"`
3. After they confirm the upload, `attach-media-from-upload-tool`
4. Preview → publish

## Gotchas

1. API key on MCP → `403`. OAuth only.
2. Create does not publish. Always `publish-post-tool`.
3. `scheduled_at` on create ≠ scheduled. Still a draft until publish.
4. Update platforms: omit an entry and it is disabled. Always resend every platform you want enabled.
5. `update-post-tool` uses `post_platform.id`, not `social_account_id`.
6. TikTok / Pinterest / Discord fail publish without required meta — set it on create.
7. Type must match the account (no `x_post` on LinkedIn).
8. Inactive accounts are rejected.
9. Media type must be accepted by **every** enabled platform.
10. Bluesky and LinkedIn forbid mixed image+video (or PDF) on one post.
11. Stories have no viewer-facing caption.
12. Preview does not truncate — you must shorten over-limit text.
13. Cloud MCP needs an active plan (`402`).
14. Self-hosted MCP must be public HTTPS for hosted agents (Grok). `localhost` fails.

## Example prompts this skill should handle

- "List my connected accounts"
- "Draft a LinkedIn post for tomorrow 9am and preview it"
- "Publish this TikTok video now"
- "What is scheduled this week?"
- "Attach https://example.com/photo.jpg to the draft, then publish"
- "Create a Campaign label in #f59e0b"
- "Watch my Instagram reels and republish to TikTok and YouTube"

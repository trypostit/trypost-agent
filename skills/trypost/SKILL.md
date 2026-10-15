---
name: trypost
description: Schedules and publishes social media posts through TryPost's hosted MCP server. Use when the user wants to draft, schedule, queue, publish, approve, preview, or analyze posts on Instagram, Facebook Pages, LinkedIn (profiles and pages), X, TikTok, YouTube Shorts, Threads, Pinterest, Bluesky, Mastodon, Telegram, Discord, or Google Business Profile, or when they mention TryPost, the posting queue, approvals, ideas, labels, signatures, analytics, repurpose, or webhooks.
homepage: https://trypost.it
metadata: {"openclaw":{"emoji":"📅","requires":{"bins":[],"env":[]}}}
---

# TryPost

TryPost schedules and publishes social posts from one workspace. This plugin registers the hosted MCP server `https://app.trypost.it/mcp/trypost` (self-hosted: `{APP_URL}/mcp/trypost`).

Docs: https://docs.trypost.it/ai/tools-reference
App: https://app.trypost.it

## Connecting

- Every tool here comes from the `trypost` MCP server and is written `trypost:<tool>`. Clients may load MCP tools on demand and show them in another form, for example `trypost.list-social-accounts-tool` or `mcp__trypost__list_social_accounts_tool`. Before saying a TryPost tool is unavailable, search the client's tools for `trypost`.
- Only when that search finds no TryPost tool, or a call asks the user to sign in, is TryPost not connected: the user connects it from the client's plugin or connector settings, which opens TryPost's sign-in (https://app.trypost.it/login), where they pick the workspace to use. No account yet: https://app.trypost.it/register.
- The TryPost web app in a browser is not a substitute for these tools.

## Authentication

- OAuth 2.1 with Dynamic Client Registration and PKCE, scope `mcp:use`. On the first call the client opens a browser: the user signs in, picks the **workspace** this connection may use, and authorizes. Every tool acts on that one workspace; to work in another, connect again and pick it.
- API keys (Personal Access Tokens) are for the REST API only. Sent to the MCP endpoint they are refused with `403` `MCP OAuth authorization required.`
- Other HTTP errors: `401` (token missing, expired or revoked, or the bound workspace was deleted: reconnect), `403` `Workspace access denied.` (the user no longer belongs to the workspace), `402` `Active subscription required.` (TryPost Cloud account without app access; self-hosted skips this check).
- Times in arguments are ISO 8601; without an offset they are read as UTC. Post times in responses are UTC (`Y-m-d H:i:s`). No tool returns the user's own time zone; each channel's zone is `timezone` in `trypost:list-social-accounts-tool`.

## Permissions

`trypost:get-workspace-tool` returns `me.is_admin`, `me.requires_approval` and `me.publishes_directly`.

| Who | Can call |
|---|---|
| Any member | Posts (create, update, publish, preview, delete, media, notes, metrics), ideas and stages, analytics, labels, signatures, accounts and posting-schedule reads, free slots, Pinterest boards, Discord channels, TikTok creator info, Instagram audio, content types, workspace |
| Members who publish directly (owner, admins, members without approval) | Also `trypost:approve-post-tool`, `trypost:reject-post-tool`, `trypost:set-post-recurrence-tool`, `trypost:reorder-queue-tool`, `trypost:move-post-to-slot-tool`, every repurpose tool |
| Admins (and the account owner) | Also `trypost:update-posting-schedule-tool`, `trypost:generate-posting-schedule-tool`, `trypost:copy-posting-schedule-tool`, every webhook tool, every API key tool |

A refused call returns a tool error (`This action is unauthorized.`). Ids from another workspace answer as not found.

## The post model

- A post has exactly **one channel**: `social_account_id`, `content_type` and `meta` sit at the top level of the post. The channel of an existing post cannot change.
- `trypost:create-post-tool` creates one post on one channel. `trypost:create-posts-tool` creates **one independent post per destination**; the posts share a `post_group_id` and are then edited, published, approved and deleted one by one.
- `status` (lifecycle): `draft`, `pending_approval`, `scheduled`, `publishing`, `published`, `failed`. The channel side of a post has its own publication status and `error_message` / `platform_url` (see `trypost:get-post-tool`).
- Create and update take `status`: `draft` (default on create), `scheduled` (with `scheduled_at`, `queue` or `queue_slot`), or `publishing` (publish now). `trypost:publish-post-tool` does the same for an existing draft or scheduled post.
- Posts that are `publishing`, `published` or `failed` cannot be changed or deleted. Deleting a post never removes it from the network.

## Workflow

```
1. trypost:get-workspace-tool             # does the caller need approval?
2. trypost:list-social-accounts-tool      # channel id, status, timezone, max_content_length, has_posting_schedule
3. trypost:list-content-types-tool        # content_type, media rules, required_meta
4. resolve required meta          # trypost:get-tiktok-creator-info-tool / trypost:list-pinterest-boards-tool / trypost:list-discord-channels-tool
5. trypost:create-post-tool or trypost:create-posts-tool   # status draft | scheduled | publishing
6. trypost:preview-post-tool              # exact text the network gets, with length stats
7. trypost:publish-post-tool              # for drafts: now, scheduled_at, or queue
8. trypost:get-post-metrics-tool          # after it is published
```

Accounts with `status` `token_expired` or `disconnected` must be reconnected in the TryPost app; MCP cannot connect, reconnect or disconnect channels.

## Networks and content types

| `platform` | Network | Content types | Text limit |
|---|---|---|---|
| `instagram` | Instagram (Instagram Login) | `instagram_feed`, `instagram_reel`, `instagram_story` | 2200, max 5 hashtags |
| `instagram-facebook` | Instagram connected through a Facebook Page | same as `instagram` | 2200, max 5 hashtags |
| `facebook` | Facebook Page | `facebook_post`, `facebook_reel`, `facebook_story` | 10000 |
| `linkedin` | LinkedIn profile | `linkedin_post` | 3000 |
| `linkedin-page` | LinkedIn Page | `linkedin_page_post` | 3000 |
| `x` | X | `x_post` | 280 (25000 for accounts with `long_posts`) |
| `threads` | Threads | `threads_post`, `threads_ghost_post` | 500 |
| `tiktok` | TikTok | `tiktok_video`, `tiktok_photo` | 2200 |
| `youtube` | YouTube | `youtube_short` | 5000 |
| `pinterest` | Pinterest | `pinterest_pin`, `pinterest_video_pin`, `pinterest_carousel` | 800 |
| `bluesky` | Bluesky | `bluesky_post` | 300 |
| `mastodon` | Mastodon | `mastodon_post` | 500 |
| `telegram` | Telegram | `telegram_post` | 4096 |
| `discord` | Discord | `discord_message` | 2000 |
| `google_business` | Google Business Profile | `google_business_post` | 1500 |

The account's real limit is `max_content_length` in `trypost:list-social-accounts-tool`. `trypost:list-content-types-tool` is the live catalog; summary of the media rules:

| Content type | Media |
|---|---|
| `instagram_feed` | Required. Up to 10 images/videos (carousel); a single video publishes as a Reel |
| `instagram_reel`, `facebook_reel` | Required. One video |
| `instagram_story`, `facebook_story` | Required. One image or video. Captionless: no text is sent or measured |
| `facebook_post`, `threads_post` | Optional. Up to 10 images/videos |
| `threads_ghost_post` | No media. Text-only post archived after 24 hours |
| `linkedin_post`, `linkedin_page_post` | Optional. Up to 10 images, or one video, or one PDF (no mixing; a PDF must be alone) |
| `x_post` | Optional. Up to 4; GIF accepted |
| `bluesky_post` | Optional. Up to 4; GIF accepted; no image+video mix |
| `mastodon_post` | Optional. Up to 4; GIF accepted |
| `telegram_post`, `discord_message` | Optional. Up to 10; GIF accepted |
| `tiktok_video` | Required. One video |
| `tiktok_photo` | Required. 1 to 35 images |
| `youtube_short` | Required. One video, up to 3 minutes |
| `pinterest_pin` / `pinterest_video_pin` | Required. One image / one video |
| `pinterest_carousel` | Required. 2 to 5 images |
| `google_business_post` | Optional. One image |

When `content_type` is omitted it is chosen like the web composer: Pinterest picks video pin / carousel / pin from the media, TikTok picks `tiktok_photo` for images only, every other network takes its `default_content_type`. Media rules (count, size, duration, aspect ratio, GIF, MOV) never block a draft; they are checked when a post is scheduled, queued or published.

## Per-network `meta`

Unknown keys are dropped. Enum values are exact strings. `trypost:update-post-tool` merges `meta` with the stored settings (`null` clears a key; `thread_replies` replaces the whole list).

| Network | Keys | Required to schedule or publish |
|---|---|---|
| TikTok | `privacy_level` (`PUBLIC_TO_EVERYONE` \| `MUTUAL_FOLLOW_FRIENDS` \| `FOLLOWER_OF_CREATOR` \| `SELF_ONLY`, limited to the account's `privacy_level_options`), `allow_comments`, `disclose`, `brand_content_toggle`, `brand_organic_toggle`; video: `allow_duet`, `allow_stitch`, `is_aigc`; photo: `auto_add_music`. `SELF_ONLY` cannot be combined with `brand_content_toggle` | `privacy_level` |
| Pinterest | `board_id`, `title` (max 100), `link`. The pin description is the post text | `board_id` |
| Discord | `channel_id`, `mentions` (`[{token, label}]`), `embeds` (up to 10 `{title, description, url, image, color}`) | `channel_id` |
| YouTube | `title` (max 100, no `<` `>`; defaults to the first non-empty line of the text), `description`, `category_id`, `privacy_status` (`public` \| `unlisted` \| `private`), `license`, `notify_subscribers`, `embeddable`, `made_for_kids`, `is_ai_generated` | A title, or text to derive it from |
| Google Business | `topic_type` (`STANDARD` \| `EVENT` \| `OFFER`), `call_to_action` `{action_type, url}` (`NONE`, `BOOK`, `ORDER`, `SHOP`, `LEARN_MORE`, `SIGN_UP`, `CALL`; `url` needed unless `NONE`/`CALL`; not on `OFFER`), `event` `{title, start_date, end_date, start_time, end_time}`, `offer` `{coupon_code, redeem_online_url, terms_conditions}` | `event` on `EVENT` and `OFFER` |
| Instagram | `is_ai_generated`, `collaborators` (up to 3 usernames; not on stories), reels only: `share_to_feed`, `trial_graduation` (`MANUAL` \| `SS_PERFORMANCE`; not with collaborators), `audio` | — |
| X, Bluesky, Mastodon | `thread_replies` (see Threads below). X also `is_ai_generated`; Mastodon also `spoiler_text` (content warning, counts toward the 500) | — |
| Threads | `topic_tag` (1–50 characters, no `.` or `&`) | — |
| Facebook, Bluesky, LinkedIn | `link_preview` (`false` publishes the link without a preview card) | — |
| LinkedIn, LinkedIn Page | `document_title` (max 300, for PDF posts) | — |
| Telegram, Facebook reels and stories | none | — |

Every scheduled or published post also needs text or media.

**Instagram music**: `meta.audio` works only on `instagram_reel` posts from an `instagram-facebook` account. Find a track with `trypost:search-instagram-audio-tool` and pass `{id}` (optional `title`, `artist`, `cover_url`, `preview_url`, `audio_volume` / `video_volume` 0–100). On an `instagram` account it is refused.

**Per-media settings** (`media[].meta`): `alt_text` (max 2000), `user_tags` (Instagram feed images: up to 20 `{username, x, y}`, x/y from 0 to 1), `cover_offset_ms` (video cover frame where `supports_video_cover`).

### Threads (X, Bluesky, Mastodon)

`meta.thread_replies` holds up to 24 replies published under the post, each `{text, media}` (up to 4 media items by `url`, `id` or `upload_token`) or a plain string for text only. Each reply needs text or media, fits the account's text limit, and follows the media rules of a post on that network.

## Tools

### Posts

| Tool | Notes |
|---|---|
| `trypost:list-posts-tool` | Newest scheduled date first. Filters: `status` (`draft` \| `scheduled` \| `pending_approval` \| `published` \| `failed`), `search`, `channels[]`, `labels[]`, `untagged`, `page` |
| `trypost:get-post-tool` | Text, media, labels, status, `schedule_mode`, `scheduled_at`, `published_at`, recurrence, approval fields, `post_group_id`, and the channel's `content_type`, `meta`, status, `error_message`, `platform_url` |
| `trypost:create-post-tool` | `social_account_id` (required), `content`, `media[]`, `content_type`, `meta`, `status`, `scheduled_at`, `queue` (`next` \| `top`), `queue_slot`, `label_ids[]` |
| `trypost:create-posts-tool` | `status` (required), `destinations[]` (required: `{social_account_id, content_type?, content?, media?, meta?}`), shared `content`, `media[]`, `scheduled_at`, `queue`, `label_ids[]`. No `queue_slot`. Returns `{posts}` |
| `trypost:update-post-tool` | `post_id` plus any of `content`, `media[]` (replaces the list), `content_type`, `meta` (merged), `status`, `scheduled_at`, `queue`, `label_ids[]` (replaces). `status: draft` unschedules |
| `trypost:publish-post-tool` | `post_id`, optional `scheduled_at` or `queue`; omit both to publish now. Validated like a scheduled post; on failure nothing is published and the error names the field |
| `trypost:preview-post-tool` | The exact text the network gets (X links shown defused when that is enabled) with length stats. Nothing is truncated |
| `trypost:delete-post-tool` | Permanent, TryPost only |
| `trypost:get-post-metrics-tool` | Saved analytics of a published post; `unsupported` for unpublished posts or networks without analytics |
| `trypost:approve-post-tool` | `post_id`, optional `scheduled_at` or `publish_now`. Required when the requested time has passed or the author asked to publish now |
| `trypost:reject-post-tool` | Back to draft for its author; no reason stored |
| `trypost:set-post-recurrence-tool` | Scheduled post repeats every `interval` (1–365) `frequency` (`day` \| `week` \| `month` \| `year`), `times` (1–100) more times; last occurrence on or before 2037-12-31 |
| `trypost:clear-post-recurrence-tool` | Stops repeating; the post keeps its time |
| `trypost:list-post-notes-tool` / `trypost:create-post-note-tool` / `trypost:update-post-note-tool` / `trypost:delete-post-note-tool` | Internal team comments, never published. `body` max 2000. Only the author edits or deletes a note |

### Media

Media goes in `media[]` on create/update, each item with exactly one of `url` (public URL serving the file itself; no redirects, no web pages), `upload_token`, or `id` (media already in the workspace, copied for the post). Optional `alt` and `meta`. On update, send the current ids in a new order to reorder and leave one out to remove it.

| Tool | Notes |
|---|---|
| `trypost:attach-media-from-url-tool` | `post_id`, `urls[]` (1–10 `{url, alt?, meta?}`). Appends. Returns `attached_count`, `failed_urls` and `failures[]` (`unreachable`, `type_not_allowed`, `too_large`, `host_not_allowed`) |
| `trypost:request-media-upload-tool` | One-shot signed URL for a local file: `upload_token`, `upload_url`, `field_name` (`media`), `expires_at` (15 minutes by default), `max_bytes`, `max_bytes_by_type` |
| `trypost:attach-media-from-upload-tool` | `post_id`, `upload_token`, optional `alt`, `meta`. Appends |

Local file: `trypost:request-media-upload-tool`, then `curl -F media=@./clip.mp4 "<upload_url>"`, then pass the `upload_token` in `media[]` or call `trypost:attach-media-from-upload-tool`. An upload is kept 24 hours and is spent by the first post that takes it; reuse the file on another post by its media `id`.

Accepted files: JPEG, PNG, GIF, WebP (HEIC/HEIF when the server can convert), MP4, MOV, PDF. Server ceilings by default: 10 MB and 67 megapixels per image, 1 GB per video, 100 MB per PDF; each content type's own limits apply at schedule/publish time.

### Accounts, posting times and queue

| Tool | Notes |
|---|---|
| `trypost:list-social-accounts-tool` | `id`, `platform`, `display_name`, `username`, `status`, `timezone`, `posting_goal`, `has_posting_schedule`, `max_content_length`, `long_posts`, `verified_badge` |
| `trypost:get-posting-schedule-tool` | `account_id`. Time zone, weekly goal, seven days of local times (day 0 = Sunday) |
| `trypost:update-posting-schedule-tool` | `account_id`, `timezone` (IANA), `posting_goal` (1–28 or null), `posting_schedule` (7 `{day, enabled, times[]}`, max 4 `HH:mm` per day, or null to clear) |
| `trypost:generate-posting-schedule-tool` | `account_id`, `mode` (`goal` \| `recommended`), `goal` (1–28). Builds from the network's recommended windows; replaces the schedule |
| `trypost:copy-posting-schedule-tool` | `account_id`, `from` (a channel with a schedule) |
| `trypost:list-free-slots-tool` | Next free slots as UTC instants: at most 30, within 90 days |
| `trypost:move-post-to-slot-tool` | `account_id`, `post_id`, `slot_at`. A scheduled post becomes a queue post in that free slot |
| `trypost:reorder-queue-tool` | `account_id`, `post_ids[]` (exactly the first queued posts, new order). Posts swap among the slots they hold |
| `trypost:list-pinterest-boards-tool` / `trypost:create-pinterest-board-tool` | Board `id` → `meta.board_id`. Create takes `name` (max 50) |
| `trypost:list-discord-channels-tool` | Text/announcement channels the bot can post to; `id` → `meta.channel_id` |
| `trypost:get-tiktok-creator-info-tool` | `privacy_level_options`, `comment_disabled` / `duet_disabled` / `stitch_disabled` (keep the matching `allow_*` false), `max_video_post_duration_sec` (not checked at schedule time), `can_post` |
| `trypost:search-instagram-audio-tool` | `account_id` (`instagram-facebook`), optional `q` (omit for trending), `type` (`music` \| `original_sound`) |
| `trypost:get-instagram-audio-tool` | `account_id`, `audio_id`. Fails when the track is no longer available |

### Ideas

`trypost:list-ideas-tool` (filters `stages[]`, `unassigned`, `labels[]`, `untagged`), `trypost:get-idea-tool`, `trypost:create-idea-tool` (`title`, `body`, `idea_stage_id`, `media_ids[]`, `label_ids[]`; needs a title, body or media), `trypost:update-idea-tool` (`media_ids` / `label_ids` replace), `trypost:duplicate-idea-tool`, `trypost:delete-ideas-tool` (up to 500), `trypost:move-ideas-tool` (`idea_id`, `idea_stage_id` or none, `idea_ids[]` = the full target column in order). Stages: `trypost:list-idea-stages-tool`, `trypost:create-idea-stage-tool` (`name` max 60), `trypost:update-idea-stage-tool`, `trypost:delete-idea-stage-tool` (ideas move to unassigned), `trypost:reorder-idea-stages-tool` (every stage id). Ideas cannot be converted into posts by MCP; create a post with the idea's text.

### Analytics

Ranges: `range` `7d` \| `30d` (default) \| `mtd` \| `custom` with `start` / `end` (`YYYY-MM-DD`), as calendar days in the user's time zone.

| Tool | Notes |
|---|---|
| `trypost:get-analytics-report-tool` | Workspace summary, follower and post charts, top posts, per-account performance. Optional `channels[]` |
| `trypost:get-analytics-publication-tool` | `publication_id` from the report's top posts, including posts imported from the network |
| `trypost:get-channel-insights-tool` | `account_id`; summary, metrics and series vs the previous range, plus 12-month follower `growth`. Filters `labels[]`, `untagged`, `types[]` |
| `trypost:list-channel-publications-tool` | `account_id`; best posts ranked by `sort`, `period` `current` \| `previous`, top 50, paginated |

Channel insights and channel publications are not available for LinkedIn, LinkedIn Page, Telegram, Discord and Google Business.

### Repurpose

Watches one Instagram or Facebook account for one format (`reel`, `video`, `story`) and republishes each new video to its destinations. Videos published through TryPost are never replicated.

| Tool | Notes |
|---|---|
| `trypost:list-repurpose-source-formats-tool` | Watchable formats |
| `trypost:list-repurposes-tool` / `trypost:get-repurpose-tool` | Rows with destinations, status and last polling error |
| `trypost:create-repurpose-tool` | `source_social_account_id`, `source_format` (default `reel`), `publish_mode` (`publish` default \| `draft`), `destinations[]` (`{social_account_id, content_type, meta?}`, a type that accepts video). Starts as draft. One repurpose per source and format; the source cannot be a destination; Google Business cannot be a destination |
| `trypost:update-repurpose-tool` | Changing source or format resets the watermark |
| `trypost:activate-repurpose-tool` | Needs a usable source, one destination and the destinations' required meta. Only videos published from then on are copied |
| `trypost:pause-repurpose-tool` / `trypost:resume-repurpose-tool` | Pause keeps the watermark; resuming a pause made by TryPost starts from now |
| `trypost:disable-repurpose-tool` | Clears the watermark |
| `trypost:list-repurpose-items-tool` | Every source video seen and why one was skipped |
| `trypost:delete-repurpose-tool` | Stops polling; posts already created stay |

### Labels, signatures, workspace, platform

| Tool | Notes |
|---|---|
| `trypost:list-labels-tool`, `trypost:create-label-tool`, `trypost:update-label-tool`, `trypost:delete-label-tool` | `name`, `color` (`#RRGGBB`). Deleting detaches the label from posts |
| `trypost:list-signatures-tool`, `trypost:create-signature-tool`, `trypost:update-signature-tool`, `trypost:delete-signature-tool` | `name`, `content`. A signature is never added automatically: append its content to the post text |
| `trypost:get-workspace-tool` | Current workspace and the caller's `me` flags |
| `trypost:list-content-types-tool` | Per platform: `allowed_media_types`, `default_content_type`, `max_content_length`, `max_hashtags`, `alt_text_max_length`, `required_meta`. Per content type: media counts, accepted types, GIF/MOV, byte caps, duration, aspect ratios, `captionless`, `document_must_be_alone`, `supports_thread_replies` |

### Webhooks (admins)

Events: `post.created`, `post.scheduled`, `post.unscheduled`, `post.published`, `post.failed`, `post.deleted`. Each delivery is a JSON POST signed in `X-Webhook-Signature` (HMAC-SHA256 hex of the body). After 5 failed deliveries in a row the webhook is `paused`.

`trypost:list-webhooks-tool` (no secrets), `trypost:get-webhook-tool` (includes `signing_secret`), `trypost:create-webhook-tool` (`endpoint` public URL, `events[]`; created enabled; no test sent), `trypost:update-webhook-tool` (`endpoint`, `events`, `status` `enabled` \| `disabled`; re-enabling resets failures), `trypost:delete-webhook-tool` (with its logs), `trypost:send-webhook-test-tool` (signed `webhook.test` ping, no log), `trypost:rotate-webhook-secret-tool` (old secret stops at once), `trypost:list-webhook-logs-tool`, `trypost:replay-webhook-log-tool` (`webhook_id`, `log_id`; new delivery even when paused or disabled).

### API keys (admins)

Manage Personal Access Tokens for the REST API (never usable on MCP). `trypost:list-api-keys-tool` (metadata only; OAuth connections excluded), `trypost:create-api-key-tool` (`name`, optional `expires_at`; returns `plain_token` once), `trypost:delete-api-key-tool` (`api_key_id`; integrations using it stop working).

## Queue and slots

- The queue needs posting times on the channel (`has_posting_schedule`). `queue: next` takes the first free slot; `queue: top` takes the first slot and shifts the queued posts behind it to the next gap. Do not combine `queue` with `scheduled_at`.
- `queue_slot` (trypost:create-post-tool) or `trypost:move-post-to-slot-tool` places a post in one exact free slot from `trypost:list-free-slots-tool`. A slot held by any scheduled post or by a queue request pending approval is refused.
- A queued post keeps its slot. Deleting, drafting or re-timing it leaves the slot free; nothing is pulled forward. Schedule changes re-place only posts whose slot disappeared.

## Approvals

When `me.requires_approval` is true, scheduling, queueing or publishing stores the post as `pending_approval` instead (also when such a member edits a scheduled post or attaches media to it). A member who publishes directly then calls `trypost:approve-post-tool` or `trypost:reject-post-tool`. A pending queue request reserves its slot. Pending posts are visible to approvers and to the member who asked.

## Gotchas

1. One post = one channel. For several channels use `trypost:create-posts-tool`; each result is a separate post sharing `post_group_id`.
2. `trypost:create-post-tool` defaults to `draft`. Send `status: scheduled` / `publishing`, or call `trypost:publish-post-tool`.
3. TikTok `privacy_level`, Pinterest `board_id`, Discord `channel_id`, YouTube title, and Google Business `event` (EVENT/OFFER) are required before scheduling or publishing.
4. The text limit is per account: an X account without `long_posts` is 280. Instagram allows at most 5 hashtags. Stories send no text.
5. `trypost:update-post-tool` `media[]` and `label_ids[]` replace the lists; `meta` merges.
6. Instagram music needs an `instagram-facebook` account and an `instagram_reel`.
7. YouTube is Shorts only (`youtube_short`, one video up to 3 minutes).
8. Facebook is a Page, not a personal profile. Google Business Profile posts take at most one image.
9. MCP cannot connect channels, generate content with AI, convert ideas into posts, or manage templates, members or billing; use the web app.
10. `trypost:publish-post-tool`, `trypost:approve-post-tool`, `trypost:rotate-webhook-secret-tool` and the delete tools (except `trypost:delete-repurpose-tool`) are marked destructive; read tools are marked read-only.

---
name: trypost-setup
description: Checks that TryPost is connected after the plugin is installed and helps the user sign in, pick a workspace and see their connected channels. Use right after installing TryPost, or when the TryPost tools are not available.
---

# TryPost setup

1. Call `trypost:get-workspace-tool`. When it answers, tell the user which workspace is connected and whether their posts need approval (`me.requires_approval`).
2. Call `trypost:list-social-accounts-tool` and list the connected channels. A channel with `status` `token_expired` or `disconnected` must be reconnected in the TryPost app (Accounts). With no channel, the user connects one in the TryPost app at https://app.trypost.it: channels cannot be connected through the plugin.
3. If the TryPost tools are not listed, or a call asks the user to sign in, they have not connected TryPost yet. Ask them to connect TryPost from the plugin settings: it opens TryPost's sign-in (https://app.trypost.it/login), where they pick the workspace this connection may use. No account yet: https://app.trypost.it/register. Some clients show the tools as `trypost.<tool>` or `mcp__trypost__<tool_name>`; search for `trypost` before concluding they are missing.
4. To use another workspace, disconnect TryPost in the plugin settings and connect again, picking that workspace.

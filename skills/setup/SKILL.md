---
name: trypost-setup
description: Checks that TryPost is connected after the plugin is installed and helps the user sign in, pick a workspace and see their connected channels. Use right after installing TryPost, or when the TryPost tools are not available.
---

# TryPost setup

1. Find the TryPost tools first. Clients may load MCP tools on demand and name them differently, for example `trypost.get-workspace-tool` or `mcp__trypost__get_workspace_tool`. Search the client's tools for `trypost` before anything else. Only when the search finds none, go to step 4.
2. Call `trypost:get-workspace-tool`. When it answers, tell the user which workspace is connected and whether their posts need approval (`me.requires_approval`). If it asks the user to sign in, go to step 4.
3. Call `trypost:list-social-accounts-tool` and list the connected channels. A channel with `status` `token_expired` or `disconnected` must be reconnected in the TryPost app (Accounts). With no channel, the user connects one in the TryPost app at https://app.trypost.it: channels cannot be connected through the plugin.
4. Only when step 1 found no TryPost tool, or a call asked the user to sign in: TryPost is not connected yet. Ask the user to connect TryPost from the plugin settings: it opens TryPost's sign-in (https://app.trypost.it/login), where they pick the workspace this connection may use. No account yet: https://app.trypost.it/register.
5. To use another workspace, disconnect TryPost in the plugin settings and connect again, picking that workspace.

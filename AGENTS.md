# AGENTS.md

Rules for anyone changing this repository, people and coding agents alike.

This repository packages TryPost as a plugin for Claude Code, Cursor, Grok, ChatGPT and Codex. It ships no server code: a skill (`SKILL.md`), the address of the hosted MCP server (`https://app.trypost.it/mcp/trypost`) and one manifest per host. The MCP server itself lives in [trypostit/trypost](https://github.com/trypostit/trypost).

## TypeScript only

- Every script and test is TypeScript (`.ts`). Never add `.js`, `.mjs`, `.cjs` or `.jsx` files; `tests/repository.test.ts` fails on them.
- Node 24+ runs the `.ts` files directly through type stripping. There is no build step and no compiled output.
- Write erasable TypeScript only (`erasableSyntaxOnly` in `tsconfig.json`): types, interfaces and `import type`, but no `enum`, `namespace` or parameter properties, which Node cannot strip.
- Import local files with their `.ts` extension (`import { read } from './helpers.ts'`) and types with `import type`.
- Use arrow functions and explicit return types on exported functions. Shared shapes of the manifests live in `tests/types.ts`.
- `tsc -p .` must pass. It runs in CI; locally:

  ```bash
  npm install --no-save --no-package-lock typescript@7.0.2 @types/node@24.19.0
  npx tsc -p .
  ```

## No package.json, no dependencies

- Never commit `package.json`, a lockfile or `.npmrc`. The repository root is the plugin folder: Claude Code installs the packages of a lockfile it finds there, and the Claude directory holds such plugins for manual review. `tests/repository.test.ts` enforces this.
- Tests use only Node's built-ins (`node:test`, `node:assert/strict`, `node:fs`, ...). Tools needed only in CI, such as TypeScript or Claude Code, are installed there with `--no-save --no-package-lock` and an exact version.

## Tests

- Every change ships with tests. A new manifest, field, rule or file gets a test in `tests/` that fails without the change; check it by breaking the change on purpose and running the suite.
- Run the whole suite before pushing:

  ```bash
  node --test
  ```

- One test file per area: `manifests`, `mcp`, `openai`, `skill`, `repository`. Helpers go in `tests/helpers.ts`.
- Do not delete or weaken a test to make a change pass. If a rule changed, change the test and say why in the commit.

## CI

`.github/workflows/tests.yml` runs on every pull request and on `main`, and every job must pass before merging:

| Job | What it checks |
| --- | --- |
| Manifest and skill tests | `node --test` |
| TypeScript type check | `tsc -p .` |
| Claude plugin validation | `claude plugin validate --strict` on the plugin, its marketplace and its skills, with a pinned Claude Code version |
| OpenAI plugin package | Builds the upload ZIP, checks its layout and attaches it to the run |

- Pin every tool and action: exact versions for npm packages, a major tag for GitHub actions. Pick versions released at least two weeks earlier.
- `.github/workflows/sync-skill.yml` copies the root `SKILL.md` into `skills/trypost/SKILL.md` on each release. Still keep both files identical in every commit; a test compares them.

## Manifests

- All plugin manifests (`.claude-plugin`, `.cursor-plugin`, `.grok-plugin`, `.codex-plugin`) and marketplaces share the same `name` (`trypost`), `version` and `description`.
- The version follows the TryPost release it documents (TryPost 2.0 → `2.0.0`). Raise it in every manifest at once.
- Never state how many networks TryPost supports ("12 networks"): the list changes. Name the networks or say "social media".
- Every MCP entry points at `https://app.trypost.it/mcp/trypost`, with no headers and no credentials.
- `.mcp.json` and `mcp.json` declare `"type": "http"`. Claude Code reads `.mcp.json` at the plugin root and drops a remote server without a type, and OpenAI's plugins use the same field.

## OpenAI plugin (`.codex-plugin/plugin.json`)

- Respect the directory limits: `displayName` and `shortDescription` up to 30 characters, `longDescription` up to 4000, up to three `defaultPrompt` of 128 characters, the four https URLs (website, support, privacy, terms), a square PNG icon of 48 to 4096 px.
- Review needs exactly five positive and three negative test cases. Positive cases name tools the skill documents.
- Never mention prices, plans, trials, discounts or upgrades in the listing or the skill.
- Never put reviewer credentials, the demo video, client secrets or the domain verification token in the package; they go in the OpenAI dashboard. The verification token is served by the TryPost app at `https://app.trypost.it/.well-known/openai-apps-challenge`.
- Build the upload with the command in the README; a test checks that it packs everything the manifest references.

## Skill (`SKILL.md`)

- Document what the MCP server does today, from the TryPost code (`app/Mcp` in trypostit/trypost), never from memory. Tool names are the kebab case of the class name (`CreatePostTool` → `create-post-tool`).
- Describe tools; do not instruct the assistant how to behave ("always call X first"), tell it to call other plugins, or hide instructions. Both directories reject that.
- Keep the root `SKILL.md` and `skills/trypost/SKILL.md` identical.

## Writing

- Everything in the repository is in English: code, tests, docs, commit messages.
- Commit messages: a short imperative subject, then a body that says why. No `Co-Authored-By` or tool attribution lines.
- Do not commit to `main`. Open a pull request from a branch and wait for CI.

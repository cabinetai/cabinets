# Cabinet Registry

This is a public registry of Cabinet templates. Each top-level directory is a complete cabinet.

## Repos & packages

| What | Where |
|---|---|
| Registry (this repo) | https://github.com/cabinetai/cabinets (public) |
| CLI tool source | https://github.com/cabinetai/cabinets-tool (private) |
| CLI tool on npm | https://www.npmjs.com/package/cabinets (`cabinets@0.1.1`) |
| Scaffolder on npm | https://www.npmjs.com/package/create-cabinet |
| Website | https://github.com/cabinetai/cabinets-website |

### CLI tools

- `npx create-cabinet` — scaffold a blank cabinet from scratch
- `npx cabinets add <name>` — install a template from this registry (or any GitHub repo)
- `npx cabinets browse` — browse available templates in the registry
- `npx cabinets list` — list cabinets in current directory
- `npx cabinets info <name>` — inspect a cabinet without installing

Single-name sources (e.g. `npx cabinets add agency`) resolve to `cabinetai/cabinets/<name>`.

## Conventions

- Cabinet directory names use kebab-case
- Every cabinet must have: `.cabinet`, `.agents/`, `.jobs/`, `index.md`, `.cabinet-state/.gitkeep`
- `.cabinet` files are YAML (no `.yaml` extension)
- Agent personas are markdown with YAML frontmatter at `.agents/<slug>/persona.md`
- Jobs are YAML at `.jobs/<name>.yaml`
- Child cabinets are nested directories that also contain a `.cabinet` file
- `.cabinet-state/` is for runtime state only — keep empty with `.gitkeep`
- Do NOT add website code here — the website lives in the separate `cabinets-website` repo
- Do NOT add the CLI tool code here — it lives in the separate `cabinets-tool` repo

## .cabinet file schema

```yaml
schemaVersion: 1
id: agency-root
name: Digital Agency
kind: root           # root or child
version: 0.1.0
description: Digital agency managing multiple client engagements.
entry: index.md
```

Child cabinets add `parent.shared_context` and `access.mode` fields.

Optional top-level fields read by the manifest builder:

- `domain` — broad category surfaced as a coloured pill in clients (e.g. `Software`, `Education`, `Lifestyle`, `Operations`, `Sales`, `Media`, `E-commerce`, `Professional Services`, `Other`). If omitted, the manifest builder falls back to the `SLUG_DOMAIN` map in `scripts/build-manifest.mjs` — add new cabinets there.
- `connectors`: the services the cabinet reads or writes, so the app can offer the connection before the first run instead of a job failing at 07:00. Root `.cabinet` only.
- `prompts`: things to try in the cabinet, shown by the app. Root `.cabinet` only.

A cabinet that reads or writes a service declares it:

```yaml
# gmail-inbox/.cabinet
schemaVersion: 1
id: gmail-inbox-root
name: Gmail Inbox
kind: root
version: 0.1.1            # bump the patch when connectors or prompts change
description: Every morning, a plain-English summary of the email that arrived overnight.
entry: index.md
domain: Operations

# What this cabinet connects to. References only: accounts, addresses and keys never appear here.
connectors:
  - id: gmail              # exactly one of `id` or `anyOf`; ids from .github/connector-ids.json
    need: needs            # needs: the jobs in usedBy wait until it is connected
                           # better-with: everything runs without it
    access: [read]         # what the template promises to do: read | draft | send | post | change | create
                           # a promise in words; only SEND_EMAIL and SEND_WHATSAPP are enforced by Cabinet
    why: Reads the mail that arrived overnight.   # at most 90 characters, no em-dash or en-dash; never shown on screen
    usedBy: [jobs/morning-inbox-summary]           # jobs/<id> or agents/<slug>; omitted = every job
    hero: true             # the example for gmail on the Integrations pages; one hero per id across the registry

# Things to try in this cabinet. Optional, at most 16, each at most 80 characters.
prompts:
  - text: What needs me in today's mail?
    connector: gmail
```

Alternatives are one entry, `anyOf: [gmail, microsoft-365]`. An entry that any ready connection satisfies, such as a morning briefing that reads "every integration you've connected", adds `open: true` to its `anyOf` (never to `id`). A cabinet declares at most 12 entries.

The id vocabulary is `.github/connector-ids.json`. It is exported from the Cabinet app, never edited by hand: run `pnpm connectors:export-ids --out <this repo>/.github/connector-ids.json` in the app repo and commit the result. A cut id stays in the file marked `cut`, so old declarations still build.

`build-manifest.mjs` validates every root `.cabinet` before it writes anything. Errors fail the build: an unknown id, both or neither of `id` and `anyOf`, a duplicate id, a `need` or `access` word outside the lists, a missing or long `why` or one with a dash, a `usedBy` naming a job or agent the cabinet does not have, `open: true` with `id`, two heroes for one id across the registry, and more than 16 prompts, a prompt over 80 characters or with a dash, or a prompt `connector` the cabinet does not declare. Warnings pass the build but deserve a look: a job prompt or persona naming a known connector (by brand name or tool prefix such as `mcp__claude_ai_Gmail__`) that the cabinet does not declare (sentences with "replace", "instead of" or "keep your" are skipped), a tag equal to a connector id with no entry, and a job prompt that still carries a hand-written "STOP HERE ... integrations screen" step while a `needs` entry holds that job.

## Single-source manifest

`manifest.json` at the repo root is the **single source of truth** for downstream clients (the Cabinet app's home carousel + registry browser, etc.). It is regenerated by CI on every push and committed back to `main`.

```
cabinets/
  manifest.json                       # generated — do not hand-edit
  .github/
    scripts/
      build-manifest.mjs              # the generator (lives under .github so it's
      package.json                    # tracked — top-level scripts/ is gitignored)
      connectors.mjs                  # connector and prompt validation, wire form
      test/, fixtures/                # node --test over fixture repo roots
    connector-ids.json                # connector id vocabulary, exported from the app
    workflows/
      build-manifest.yml              # CI: rebuilds manifest on main, commits with [skip ci];
                                      # on pull requests runs npm test and --check only
      trigger-web-build.yml           # CI: dispatches to cabinets-website on changes
```

> **Note:** The top-level `scripts/` directory is local-only (cover-generation tooling with API keys, see `.gitignore`). The manifest builder lives under `.github/scripts/` so it ships with the repo.

### Manifest entry shape

```jsonc
{
  "slug": "saas-startup",
  "name": "SaaS Startup",
  "description": "B2B SaaS startup with...",
  "version": "0.1.0",
  "domain": "Software",
  "cover": "cover.jpg",        // null if no cover present
  "agentCount": 3,
  "jobCount": 2,
  "childCount": 0,
  "tags": ["saas", "b2b"],
  "connectors": [{ "ids": ["gmail"], "need": "needs", "hero": true }]  // only when declared; open and hero only when true
}
```

Clients build the cover URL as `https://raw.githubusercontent.com/cabinetai/cabinets/HEAD/<slug>/<cover>`.

`details/<slug>.json` carries the full declaration after `children`, again only when declared: `connectors` (`ids`, `need`, `open`, `access`, `why`, `usedBy`, `hero`) and `prompts` (`text`, `connector`). `schemaVersion` stays 1 in both files, so older apps ignore the new keys and install a declared cabinet exactly as before.

### Adding a new cabinet — checklist

1. Create the cabinet directory at the repo root (kebab-case slug) with the standard files (`.cabinet`, `.agents/`, `.jobs/`, `index.md`, `.cabinet-state/.gitkeep`).
2. Generate a `cover.jpg` (1200×630, < 100KB) per `COVER-IMAGE-GENERATION.md`.
3. (Optional) Add `domain:` to the `.cabinet` file. If you don't, add the slug to `SLUG_DOMAIN` in `.github/scripts/build-manifest.mjs`.
4. If it reads or writes a service, declare it under `connectors:`.
5. Run `node .github/scripts/build-manifest.mjs --check`. It must exit 0; read its warnings too.
6. Run `node .github/scripts/build-manifest.mjs` (or `cd .github/scripts && npm run manifest`) locally to verify your entry appears in `manifest.json` correctly. Leave the regenerated `manifest.json` and `details/` out of your PR.
7. Open a PR. Once merged to `main`, CI (`build-manifest.yml`) regenerates `manifest.json` and commits it; downstream clients pick it up within their cache TTL (~10 min).

### Editing existing cabinet metadata

Any change to a cabinet's `.cabinet`, `index.md` frontmatter, `.agents/`, `.jobs/`, or `cover.{jpg,png,webp}` triggers a manifest rebuild on push to `main`. When you change `connectors:` or `prompts:`, bump the cabinet's patch version. There's no other place to update; the manifest is *derived*, never hand-edited.

If `manifest.json` shows up in a PR, the CI bot will overwrite it on next push — leave it out of your changes unless you're testing the generator itself.

## Comparable projects

- [paperclipai/companies](https://github.com/paperclipai/companies) — agent company registry for the Paperclip platform. Uses `COMPANY.md` + `AGENTS.md` + `SKILL.md` format. Installed via `npx companies.sh add`. Key difference: companies are agent-team definitions with org charts; cabinets are structured workspaces that hold both agents and working data/content.

## Security

- All profile/CV data in templates uses placeholders (`you@example.com`, `linkedin.com/in/yourname`, `+49 XXX XXXXXXXX`)
- No real secrets, credentials, or PII in the repo
- The GitHub workflow uses `${{ secrets.CABINETS_WEB_PAT }}` properly (not hardcoded)

# Bright Data — Setup & Usage

The 15 Bright Data skills are vendored in `.claude/skills/brightdata-*/` and propagate from `shiniguchi/toolkit` to every repo. To use them locally — and from non-AiLine projects like `ramen-bones-analytics` or `toolkit` — each developer runs the bootstrap script once.

## One-time setup

From any repo that carries this bundle:

```bash
.claude/scripts/install-brightdata.sh
```

This installs `@brightdata/cli` at the pinned version via npm, creates symlinks from `~/.claude/skills/brightdata-*` → repo skills (so the skills are discoverable in every project on your machine), and prompts for auth.

After install, authenticate (per-developer, one time):

```bash
bdata login --device
```

For headless / CI use, set `BRIGHTDATA_API_KEY` in your shell instead.

Then restart Claude Code (or open a new session) so the skills register.

## What you get

15 skills, all prefixed `brightdata-`:

| Skill | What it does |
|---|---|
| `brightdata-agent-onboarding` | Entry-point router — invoke first when you start a Bright Data task |
| `brightdata-search` | Google/Bing/Yandex SERP via `bdata search` |
| `brightdata-scrape` | Clean markdown/HTML/JSON from any URL via `bdata scrape` |
| `brightdata-data-feeds` | Structured data from 40+ platforms (Amazon, LinkedIn, TikTok, …) |
| `brightdata-mcp` | Orchestrate 60+ MCP tools |
| `brightdata-cli` | Direct CLI reference for `brightdata` / `bdata` |
| `brightdata-proxy` | Generate code routing through Datacenter/ISP/Residential/Mobile |
| `brightdata-python-sdk-best-practices` | `brightdata-sdk` patterns |
| `brightdata-best-practices` | Web Unlocker / SERP / Scraper / Browser API reference |
| `brightdata-scraper-builder` | Guided flow to build production scrapers |
| `brightdata-scraper-studio` | AI-generated scrapers via `bdata scraper create` |
| `brightdata-competitive-intel` | Live competitor analysis |
| `brightdata-seo-audit` | JS-rendered SEO audits with live SERP checks |
| `brightdata-design-mirror` | Replicate a site's visual style |
| `brightdata-browser-debug` | Debug Bright Data Scraping Browser sessions |

## Updating the bundle

Check whether upstream has moved past the pinned SHA:

```bash
.claude/scripts/update-brightdata.sh --check
```

Re-vendor at a new SHA (interactive, requires you to review the diff):

```bash
.claude/scripts/update-brightdata.sh <new-sha>
```

After accepting the update, edit `.claude/vendor/brightdata/AUDIT.md` with what you reviewed and what you found, then commit.

## Troubleshooting

- **Skills don't appear in Claude after install** → restart Claude Code; user-level skills only register on session start
- **`bdata: command not found`** → install script's npm step failed; re-run with `--skip-links` to retry CLI only
- **Symlink target exists and is not a symlink** → some other tool dropped a directory at `~/.claude/skills/brightdata-X/`; remove it manually then re-run the install script
- **`bdata login` opens a browser but never returns** → use `--device` flag for terminal-only flow
- **Want to remove everything** → `rm ~/.claude/skills/brightdata-*` (removes user symlinks only — repo files stay) and `npm uninstall -g @brightdata/cli`

## Files

- `.claude/skills/brightdata-*/` — vendored skill bundles (15 dirs)
- `.claude/vendor/brightdata/SHA` — pinned upstream commit hash
- `.claude/vendor/brightdata/LICENSE` — upstream MIT
- `.claude/vendor/brightdata/AUDIT.md` — review notes & integrity verification procedure
- `.claude/scripts/install-brightdata.sh` — per-developer bootstrap (idempotent)
- `.claude/scripts/update-brightdata.sh` — re-vendor at a new SHA

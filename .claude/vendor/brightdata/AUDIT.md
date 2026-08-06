# BrightData Skills Vendor Audit

**Upstream:** https://github.com/brightdata/skills
**Pinned SHA:** `071e9d4db77c8561e333799f25ea85f11f7b667d` (see `SHA`)
**License:** MIT (preserved in `LICENSE`)
**Vendored:** 2026-05-27 by Shin (iguchise@gmail.com)
**Skills count:** 15

## Why we vendor instead of curl-installing

The upstream install path is `curl -fsSL https://cli.brightdata.com/install.sh | bash`. We do not run this — it has no checksum, no signature, and would also drop skills into `~/.claude/skills/` outside the repo (defeating the shared-docs sync goal). Vendoring at a pinned SHA gives us: auditable diffs on every upstream pull, single source of truth in `shiniguchi/toolkit` that propagates to all 17 repos, plus reach into unsynced projects via the user-level symlinks created by `.claude/scripts/install-brightdata.sh`.

Context: this repo migrated off a compromised `gsd-build/get-shit-done` plugin in commit `bcf1696` after the RokketSec audit flagged retained npm keys. Same hygiene applied here.

## Files reviewed

- 15 `SKILL.md` files (frontmatter + body)
- 3 shell scripts: `design-mirror/scripts/scrape_html.sh`, `design-mirror/scripts/screenshot.sh`, `proxy/scripts/smoke_test.sh`
- 1 binary asset: `proxy/assets/brightdata_proxy_ca.crt` (BrightData proxy CA — required for residential/mobile TLS chain)
- 30+ reference markdown files under `references/`
- 1 eval dataset: `scraper-builder/evals/evals.json`

## Findings

**No malicious patterns found.** All `curl` references fall into three categories: (1) documentation examples of the upstream install command (informational, not auto-executed), (2) example BrightData API calls (`curl -H "Authorization: Bearer $BRIGHTDATA_API_KEY"`), (3) the three legitimate shell scripts above which require `BRIGHTDATA_API_KEY` + `BRIGHTDATA_UNLOCKER_ZONE` env vars and exit cleanly if missing.

**Shell script hygiene:**
- `smoke_test.sh` uses `set -u`, proper tmpfile cleanup via trap, locates CA cert relative to script dir with `BD_CA_CERT` env override
- `scrape_html.sh` and `screenshot.sh` validate env vars before running, use `--output` (no shell expansion of response body)
- All three are skill-invoked only — not auto-executed by Claude on skill load

**No hooks** — no skill installs filesystem hooks or `settings.json` mutations.

## Decisions

1. **Directory namespace.** Renamed every upstream skill dir to `brightdata-<upstream-name>` to match the existing `gstack-*` convention in `.claude/skills/`. Upstream frontmatter `name:` field is preserved (e.g., dir `brightdata-search/` contains a skill whose `name: search`). Risk: bare names like `search`, `scrape`, `agent-onboarding` could collide if another skill bundle ships a same-named skill. Mitigation: this is the only non-gstack non-AiLine bundle today; revisit if a second bundle arrives.
2. **Sync allowlist.** Each of the 15 skill dirs gets an explicit `source/dest` entry in `.github/sync-config.yml`. Bulk `.claude/skills/` sync is not used here — the gstack symlink trap (documented inline in `sync-config.yml`) prevents it.
3. **Auth not in repo.** `BRIGHTDATA_API_KEY` and `bdata login` tokens are per-developer. Never committed. Setup script prompts for `bdata login --device` once.
4. **CLI install not in repo.** `npm install -g @brightdata/cli@<pin>` runs per-developer via `.claude/scripts/install-brightdata.sh`. The pinned version lives in that script, not in any auto-executed config. Current pin: `0.3.0` (sha1 `7be13fd91ac500134e1f65e25b5e2124a2cbe2e0` from `registry.npmjs.org` on 2026-05-27).

## Updating procedure

```bash
.claude/scripts/update-brightdata.sh <new-upstream-sha>
```

The script will: clone upstream at the new SHA, diff against vendored state, prompt for review, then re-vendor on accept. Manual audit step is mandatory — never blind-pull from upstream `main`.

## File integrity

To verify what's vendored matches the pinned upstream SHA:

```bash
SHA=$(cat .claude/vendor/brightdata/SHA)
git clone --quiet https://github.com/brightdata/skills /tmp/bd-verify
(cd /tmp/bd-verify && git checkout -q "$SHA")
for d in .claude/skills/brightdata-*; do
  upstream="${d#.claude/skills/brightdata-}"
  diff -qr "/tmp/bd-verify/skills/$upstream" "$d" || true
done
```

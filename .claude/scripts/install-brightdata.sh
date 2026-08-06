#!/usr/bin/env bash
# install-brightdata.sh
#
# One-time per-developer setup for the vendored Bright Data skill bundle.
# Idempotent: re-run any time to refresh symlinks or upgrade the CLI.
#
# Does:
#   1. Verifies npm is available
#   2. Installs @brightdata/cli at the pinned version (skips if already at pin)
#   3. Symlinks every .claude/skills/brightdata-*/ into ~/.claude/skills/
#      so the skills are also discoverable from non-AiLine repos
#      (ramen-bones-analytics, toolkit, etc.)
#   4. Prompts to run `bdata login --device` if not authenticated
#
# Does NOT:
#   - Write any tokens or auth state to this repo
#   - Modify .claude/settings.json or settings.local.json
#   - Touch the in-repo .claude/skills/brightdata-*/ files (vendored, read-only here)
#
# Auth lives per-developer in ~/.config/brightdata/ (created by `bdata login`).
# To use a CI-style token instead of OAuth, export BRIGHTDATA_API_KEY in your shell.
#
# Flags:
#   --dry-run    : show what would happen, change nothing
#   --skip-cli   : only manage symlinks, don't touch npm
#   --skip-links : only manage CLI, don't touch ~/.claude/skills/
#
# Exit codes: 0 = ok, 1 = missing prereq, 2 = install failed, 3 = symlink conflict.

set -uo pipefail

# Pinned CLI version. Bump after reviewing the npm changelog and re-running
# the audit (see .claude/vendor/brightdata/AUDIT.md).
# Verify shasum against npm registry when bumping:
#   curl -s https://registry.npmjs.org/@brightdata/cli/<version> | jq -r .dist.shasum
PINNED_CLI_VERSION="0.3.0"
PINNED_CLI_SHASUM="7be13fd91ac500134e1f65e25b5e2124a2cbe2e0"

REPO_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
SKILLS_SRC="$REPO_ROOT/.claude/skills"
USER_SKILLS="$HOME/.claude/skills"

DRY_RUN=0
SKIP_CLI=0
SKIP_LINKS=0
for arg in "$@"; do
  case "$arg" in
    --dry-run)    DRY_RUN=1 ;;
    --skip-cli)   SKIP_CLI=1 ;;
    --skip-links) SKIP_LINKS=1 ;;
    -h|--help)
      sed -n '2,30p' "$0"
      exit 0
      ;;
    *) echo "unknown flag: $arg" >&2; exit 1 ;;
  esac
done

run() {
  if [[ $DRY_RUN -eq 1 ]]; then
    echo "[dry-run] $*"
  else
    eval "$@"
  fi
}

say() { printf '%s\n' "$*"; }
warn() { printf '⚠ %s\n' "$*" >&2; }
die()  { printf '✗ %s\n' "$*" >&2; exit "${2:-1}"; }

# --- Pre-flight ---
if [[ ! -d "$SKILLS_SRC" ]]; then
  die "skills source not found at $SKILLS_SRC — run from inside the shared-docs repo" 1
fi

# --- CLI install ---
if [[ $SKIP_CLI -eq 0 ]]; then
  if ! command -v npm >/dev/null 2>&1; then
    die "npm not found — install Node.js first (https://nodejs.org)" 1
  fi

  # JSON output is multi-line:  "@brightdata/cli": {\n  "version": "0.3.0",
  # Use jq if present, otherwise grab the line after the package key.
  if command -v jq >/dev/null 2>&1; then
    current=$(npm list -g --depth=0 --json 2>/dev/null | jq -r '.dependencies["@brightdata/cli"].version // empty')
  else
    current=$(npm list -g --depth=0 --json 2>/dev/null | awk '/"@brightdata\/cli":/{getline; gsub(/[",]/, ""); print $2; exit}')
  fi
  if [[ "$current" == "$PINNED_CLI_VERSION" ]]; then
    say "✓ @brightdata/cli@$PINNED_CLI_VERSION already installed"
  else
    say "→ installing @brightdata/cli@$PINNED_CLI_VERSION (was: ${current:-none})"
    run "npm install -g @brightdata/cli@$PINNED_CLI_VERSION" || die "npm install failed" 2
  fi
fi

# --- Symlinks for cross-project access ---
if [[ $SKIP_LINKS -eq 0 ]]; then
  run "mkdir -p \"$USER_SKILLS\""
  for src in "$SKILLS_SRC"/brightdata-*/; do
    [[ -d "$src" ]] || continue
    name=$(basename "$src")
    target="$USER_SKILLS/$name"
    src_abs=$(cd "$src" && pwd)

    if [[ -L "$target" ]]; then
      current=$(readlink "$target")
      if [[ "$current" == "$src_abs" ]]; then
        say "✓ $name → already linked"
        continue
      fi
      warn "$target points elsewhere ($current) — re-linking to $src_abs"
      run "rm \"$target\""
    elif [[ -e "$target" ]]; then
      warn "$target exists and is not a symlink — leaving it alone (remove manually to re-link)"
      continue
    fi

    run "ln -s \"$src_abs\" \"$target\""
    say "→ linked $name"
  done
fi

# --- Auth check ---
# `bdata budget` is the lightest authenticated call available in CLI 0.3.0
# (no dedicated `whoami` exists). It returns "No API key found" on stderr
# when unauthenticated, and any 2xx response when authenticated.
if [[ $SKIP_CLI -eq 0 ]] && command -v bdata >/dev/null 2>&1; then
  if bdata budget >/dev/null 2>&1; then
    say "✓ bdata authenticated"
  else
    cat <<EOF

Next step — authenticate the CLI (per-developer, one time):

    bdata login --device          # device flow (works in SSH/headless)
    bdata login                   # browser flow

Or set BRIGHTDATA_API_KEY in your shell for headless / CI use.

After that, restart Claude Code to pick up the brightdata-* skills.
EOF
  fi
fi

say ""
say "Done. Reload Claude Code (or open a new session) for skills to register."

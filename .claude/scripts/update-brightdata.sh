#!/usr/bin/env bash
# update-brightdata.sh
#
# Re-vendor the Bright Data skill bundle at a new upstream SHA.
# Manual audit step is MANDATORY — never blind-pull from upstream main.
#
# Usage:
#   .claude/scripts/update-brightdata.sh <new-upstream-sha>
#   .claude/scripts/update-brightdata.sh --check   # just show what would change vs current pin
#
# What it does:
#   1. Shallow-clones github.com/brightdata/skills at <new-sha> to /tmp
#   2. Diffs against currently-vendored .claude/skills/brightdata-*/
#   3. Prompts y/N to proceed
#   4. On accept: rsyncs into place, updates .claude/vendor/brightdata/SHA
#   5. Reminds you to update AUDIT.md with review notes and date
#
# Exit codes: 0 = ok, 1 = bad usage, 2 = git failed, 3 = user aborted.

set -uo pipefail

REPO_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
VENDOR_DIR="$REPO_ROOT/.claude/vendor/brightdata"
SKILLS_DIR="$REPO_ROOT/.claude/skills"
SCRATCH="/tmp/bd-skills-update-$$"
UPSTREAM="https://github.com/brightdata/skills"

CHECK_ONLY=0
NEW_SHA=""
for arg in "$@"; do
  case "$arg" in
    --check) CHECK_ONLY=1 ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) NEW_SHA="$arg" ;;
  esac
done

[[ -d "$VENDOR_DIR" ]] || { echo "✗ vendor dir not found: $VENDOR_DIR" >&2; exit 1; }
CURRENT_SHA=$(cat "$VENDOR_DIR/SHA" 2>/dev/null | tr -d '[:space:]')

if [[ $CHECK_ONLY -eq 1 ]]; then
  NEW_SHA=$(git ls-remote "$UPSTREAM" HEAD | awk '{print $1}')
  echo "current: $CURRENT_SHA"
  echo "upstream HEAD: $NEW_SHA"
  [[ "$CURRENT_SHA" == "$NEW_SHA" ]] && echo "✓ up to date" || echo "→ update available"
  exit 0
fi

[[ -n "$NEW_SHA" ]] || { echo "usage: $0 <new-upstream-sha> | --check" >&2; exit 1; }

trap 'rm -rf "$SCRATCH"' EXIT
echo "→ cloning $UPSTREAM at $NEW_SHA"
git clone --quiet "$UPSTREAM" "$SCRATCH" || { echo "✗ git clone failed" >&2; exit 2; }
(cd "$SCRATCH" && git checkout --quiet "$NEW_SHA") || { echo "✗ git checkout $NEW_SHA failed" >&2; exit 2; }

echo ""
echo "=== diff: current vendor vs upstream@$NEW_SHA ==="
for d in "$SKILLS_DIR"/brightdata-*/; do
  name="${d#$SKILLS_DIR/brightdata-}"
  name="${name%/}"
  # upstream dirs may have prefixes we stripped (bright-data-*, brightdata-*, brd-*)
  for candidate in "$name" "bright-data-$name" "brightdata-$name" "brd-$name"; do
    if [[ -d "$SCRATCH/skills/$candidate" ]]; then
      diff -qr "$d" "$SCRATCH/skills/$candidate" 2>&1 | grep -v "^Only in.*/.git" || true
      break
    fi
  done
done
echo "=== end diff ==="
echo ""

read -p "Apply update from $CURRENT_SHA → $NEW_SHA? [y/N] " ans
[[ "$ans" == "y" || "$ans" == "Y" ]] || { echo "aborted"; exit 3; }

# Re-vendor — same rename logic as initial vendor (audit notes in AUDIT.md)
for src in "$SCRATCH"/skills/*/; do
  upstream_name=$(basename "$src")
  # Apply the same name normalisation used at initial vendor
  case "$upstream_name" in
    brightdata-cli) target_name="brightdata-cli" ;;
    bright-data-best-practices) target_name="brightdata-best-practices" ;;
    bright-data-mcp) target_name="brightdata-mcp" ;;
    brd-browser-debug) target_name="brightdata-browser-debug" ;;
    *) target_name="brightdata-${upstream_name}" ;;
  esac
  dest="$SKILLS_DIR/$target_name"
  rm -rf "$dest"
  mkdir -p "$dest"
  cp -R "$src." "$dest/"
  echo "updated: $target_name"
done

echo "$NEW_SHA" > "$VENDOR_DIR/SHA"
cp "$SCRATCH/LICENSE" "$VENDOR_DIR/LICENSE"
echo ""
echo "✓ vendored at $NEW_SHA"
echo ""
echo "Next: update .claude/vendor/brightdata/AUDIT.md with:"
echo "  - new SHA"
echo "  - what you reviewed (grep, file diffs)"
echo "  - any findings"
echo "  - date + your name"
echo ""
echo "Then commit:"
echo "  git add .claude/skills/brightdata-* .claude/vendor/brightdata/"
echo "  git commit -m \"chore(brightdata): re-vendor skills at $NEW_SHA\""

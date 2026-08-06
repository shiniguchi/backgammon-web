#!/usr/bin/env bash
# validate-planning-docs.sh
#
# Detects drift between .planning/phases/ artifacts and the claims in
# .planning/ROADMAP.md and .planning/STATE.md. Single source of truth used
# by both the next-step-hint Stop hook and CI.
#
# Drift signals:
#   1. ROADMAP phase count != STATE.md frontmatter total_phases
#   2. ROADMAP [x] count   != STATE.md frontmatter completed_phases
#   3. PLAN.md disk count  != STATE.md frontmatter total_plans
#   4. SUMMARY.md disk count != STATE.md frontmatter completed_plans
#   5. Per-phase: all PLAN.md summarised but ROADMAP entry not [x]
#   6. STATE.md last_updated older than newest SUMMARY.md mtime
#
# Flags:
#   --quiet   : print only on drift (no "in sync" message). Used by hook.
#   --strict  : exit 1 on any drift (default). CI uses this.
#   --warn    : exit 0 even on drift, but print findings. Hook uses this.
#
# Exit codes: 0 = in sync (or --warn mode), 1 = drift detected, 2 = missing file.

set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
PHASES="$ROOT/.planning/phases"
ROADMAP="$ROOT/.planning/ROADMAP.md"
STATE="$ROOT/.planning/STATE.md"

QUIET=0
WARN_MODE=0
for arg in "$@"; do
  case "$arg" in
    --quiet) QUIET=1 ;;
    --warn)  WARN_MODE=1 ;;
    --strict) WARN_MODE=0 ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

say() { [ "$QUIET" = "1" ] || echo "$1"; }
warn() { echo "$1"; }  # always shown

[ -f "$ROADMAP" ] || { warn "❌ missing: $ROADMAP"; exit 2; }
[ -f "$STATE" ]   || { warn "❌ missing: $STATE"; exit 2; }
[ -d "$PHASES" ]  || { warn "❌ missing: $PHASES"; exit 2; }

# --- gather facts from disk ---
plan_count=$(find "$PHASES" -maxdepth 2 -name '*-PLAN.md' -type f 2>/dev/null | wc -l | tr -d ' ')
summary_count=$(find "$PHASES" -maxdepth 2 -name '*-SUMMARY.md' -type f 2>/dev/null | wc -l | tr -d ' ')

# --- parse ROADMAP.md ---
roadmap_total=$(grep -cE '^- \[[x ]\] \*\*Phase ' "$ROADMAP" 2>/dev/null || true)
roadmap_done=$(grep -cE '^- \[x\] \*\*Phase ' "$ROADMAP" 2>/dev/null || true)
roadmap_total=${roadmap_total:-0}
roadmap_done=${roadmap_done:-0}

# --- parse STATE.md frontmatter (between leading --- and second ---) ---
fm() {
  awk -v key="$1" '
    /^---$/ { fm = !fm; next }
    fm && $0 ~ "^[ ]*"key":" { sub("^[ ]*"key":[ ]*", ""); gsub(/"/, ""); print; exit }
  ' "$STATE"
}
state_total=$(fm "total_phases")
state_done=$(fm "completed_phases")
state_total_plans=$(fm "total_plans")
state_done_plans=$(fm "completed_plans")
state_updated=$(fm "last_updated")

# --- compare ---
drift=0
report=()

[ -n "$state_total" ] && [ "$roadmap_total" != "$state_total" ] && {
  report+=("❌ phase total drift: ROADMAP has $roadmap_total entries, STATE.md frontmatter total_phases=$state_total")
  drift=1
}
[ -n "$state_done" ] && [ "$roadmap_done" != "$state_done" ] && {
  report+=("❌ phase done drift: ROADMAP has $roadmap_done [x], STATE.md frontmatter completed_phases=$state_done")
  drift=1
}
[ -n "$state_total_plans" ] && [ "$plan_count" != "$state_total_plans" ] && {
  report+=("❌ plan total drift: $plan_count PLAN.md on disk, STATE.md frontmatter total_plans=$state_total_plans")
  drift=1
}
[ -n "$state_done_plans" ] && [ "$summary_count" != "$state_done_plans" ] && {
  report+=("❌ plan done drift: $summary_count SUMMARY.md on disk, STATE.md frontmatter completed_plans=$state_done_plans")
  drift=1
}

# --- per-phase: complete on disk but not [x] in ROADMAP ---
for phase_dir in "$PHASES"/*/; do
  [ -d "$phase_dir" ] || continue
  phase_name=$(basename "$phase_dir")
  phase_num=$(echo "$phase_name" | sed -E 's/^([0-9.]+)-.*/\1/')

  plans=$(find "$phase_dir" -maxdepth 1 -name '*-PLAN.md' -type f 2>/dev/null | wc -l | tr -d ' ')
  summaries=$(find "$phase_dir" -maxdepth 1 -name '*-SUMMARY.md' -type f 2>/dev/null | wc -l | tr -d ' ')

  # No plans yet = phase still in discuss/plan; skip.
  [ "$plans" = "0" ] && continue
  # Not all plans summarised = phase still executing; skip.
  [ "$plans" != "$summaries" ] && continue

  # Phase is complete on disk. Check ROADMAP.
  # Strip leading zero variants for matching: 06 → 6, 01.1 → 1.1, 01.3.1 → 1.3.1
  phase_short=$(echo "$phase_num" | sed -E 's/^0+([1-9])/\1/; s/^0+\./0./')
  if ! grep -qE "^- \[x\] \*\*Phase ($phase_num|$phase_short)[: ]" "$ROADMAP"; then
    report+=("❌ phase $phase_num: $summaries/$plans summaries on disk (complete) — ROADMAP not [x]")
    drift=1
  fi
done

# NOTE: an earlier draft tried a freshness check ("STATE.md last_updated must
# be newer than newest SUMMARY.md commit"). Removed — fs mtime is unreliable
# in CI (fresh checkout sets mtimes to now), and the git-commit-time variant
# tripped on PR-merge-commit timestamps. The four count-based checks above
# already catch the same drift: adding a SUMMARY.md without bumping
# completed_plans triggers "plan done drift". last_updated is informational
# only; humans bump it when they update the frontmatter counts.

# --- output ---
if [ "$drift" = "0" ]; then
  say "✅ planning docs in sync"
  say "  ROADMAP: $roadmap_done/$roadmap_total phases checked"
  say "  STATE  : $state_done_plans/$state_total_plans plans (frontmatter)"
  say "  Disk   : $summary_count/$plan_count plans summarised"
  exit 0
fi

warn "📋 Planning docs drift detected:"
for line in "${report[@]}"; do warn "  $line"; done
warn ""
warn "Fix: update .planning/STATE.md frontmatter and ROADMAP.md to match disk, bump last_updated."

[ "$WARN_MODE" = "1" ] && exit 0 || exit 1

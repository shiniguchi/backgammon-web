---
name: refine-plan-100pct
description: Refine any plan - upgrade from 60% to 100% quality using conversation context
---

Your current plan is only 60% good. Revamp it to 100% professional quality using the context already in this conversation. Default to NOT reading codebases or querying databases — this is a fast critique pass.

## Coverage gate (do this FIRST)

Before refining, sanity-check that the plan isn't built on a prematurely-converged option set
(the #1 cause of a 60% plan):
- Name the **sibling / cross-branch paradigms** that could solve this. Does the plan's chosen
  approach come from the only branch considered? If a *plausibly better* named tool/approach in
  an unexplored branch is missing, that is a real gap.
- **Only if such a gap is found:** do a tightly-scoped web search to name and evaluate the
  missing option(s) — nothing broader. A refine pass must be allowed to recover a best option
  the upstream research missed; it cannot do that from conversation context alone.
- If no gap is found, stay context-only and proceed.

## Critique against 4 pillars

- **Minimal** — remove anything not strictly required. Less code, fewer steps, no gold-plating
- **Scalable** — will this approach hold up as the system grows? Avoid patterns that break at scale
- **Dynamic** — no hardcoding. Use config, env vars, or data-driven logic
- **Universal** — recycle existing functions and patterns. Don't reinvent what already exists

## Make It Specific

**60% Example:** "Add user authentication"
**100% Example:** "Add MFA to NextAuth.js, update `/auth/mfa` endpoint in the backend, add frontend MFA modal, test with 2 pilot users first"

## Output

Rewrite the plan at 100% quality. Be specific — replace vague steps with exact file paths, function names, and implementation details. Output the full revised plan, not just a diff.

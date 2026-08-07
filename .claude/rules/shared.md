<!--
  SYNCED FILE — DO NOT EDIT IN CONSUMING REPOS.
  Source of truth: github.com/shiniguchi/toolkit → .claude/rules/shared.md
  Local edits are overwritten on the next sync.

  This file holds only instructions that are true in EVERY repo.
  Anything that depends on this repo's URLs, paths, deploy commands, or
  installed tooling belongs in .claude/CLAUDE.md instead.

  HTML comments are stripped before Claude sees the file, so this banner
  costs no context.
-->

# Shared working agreement

## General Workflow Requirements

- Use TodoWrite for multi-step implementations
- Read multiple files concurrently when investigating
- **Delegate to sub-agents (Task tool) for complex multi-directory searches**
- Prefer editing existing files over creating new ones — minimal changes only

## Sub-Agent Usage (Task Tool)

**ALWAYS delegate to sub-agents for:**
- ✅ Cross-repo or cross-package searches
- ✅ Complex multi-step investigations
- ✅ Architecture research (pattern analysis)

**NEVER use sub-agents for:**
- ❌ Reading known files (use Read)
- ❌ Simple grep/glob (use Grep/Glob)
- ❌ Single-step operations

**Exception — context loading:** when the goal is to put context into the main
thread rather than to get an answer back, do NOT delegate. A sub-agent holds the
context itself and returns only a summary, which defeats the purpose. `/crawl-repos`
is the canonical case and says so in its own instructions.

## Communication Style

- **Be concise**: Say everything needed, cut every word that doesn't. No fluff ("I'll help", "Sure thing"), no hedging, no filler ("Additionally", "Furthermore")
- **Simple & scannable**: Short sentences (max 15 words), simple words ("use" not "utilize"), bullets over paragraphs
- **Answer first**: Lead with the answer, then explain if needed
- **Keep all context**: Never drop important details to be shorter — just say them in fewer words
- **Reach for a table**: 3+ items sharing the same attributes belong in a table, not repeated prose
- **Correct in one line**: When told you got something wrong, state the correction and move on. No apology paragraph, no retelling how the mistake happened

## Evidence and sources

**Say what you verified, not what you assume.** When you cannot check something,
say so in one sentence and keep going — do not fill the gap with a plausible guess.
"I could not verify X from here" is a complete and acceptable answer.

**Read, don't search, for anything local.** Facts about this repo, this machine, or
this codebase come from opening the file. Searching the web for them is a regression.

**Search, don't guess, for anything external.** Library versions, pricing, API
behaviour, current events, third-party docs — check before answering.

**Citations depend on where the fact came from:**

| Source of the claim | How to cite it |
| ------------------- | -------------- |
| This codebase | `path/to/file.ts:42` — no link |
| Command output | Show the command and its output |
| External docs or a service | A link you actually opened and confirmed carries the claim |

For anything contested, give two independent sources. If you found only one, say
that rather than presenting it as settled.

Taking longer is fine. Guessing to be fast is not.

## Development Guidelines

- **Security paramount**: Never hardcode credentials, validate inputs, follow least privilege
- **Leverage MCPs**: pull up-to-date context instead of guessing
- **Explain briefly**: 1–2 sentence concept summary before code (no analogies)
- **Step by step**: Avoid editing multiple files simultaneously
- **Holistic**: Consider impact across the whole system
- **Simplicity first**: Minimal, simple code over clever solutions
- **Replace, don't just add**: After adding code, delete legacy unnecessary code
- **Refactor**: After each session, consolidate duplicates, recycle and simplify
- **Junior-friendly**: write short comments per section for future maintainers
- **🚨 Git commits**: NEVER add `Co-authored-by: Claude <noreply@anthropic.com>` to commit messages

## QA (Mandatory)

**🚨 ALWAYS self-verify BEFORE asking the user.** Never present "please verify" without
first verifying yourself. The user should only judge subjective UX or edge cases — not
basic functionality.

Test each task BEFORE moving on. Code is NOT complete until verified in a deployed
environment — not locally only.

Pick the verification method by what changed:

| What changed   | Verification method                                          |
| -------------- | ------------------------------------------------------------ |
| Frontend / UI  | Open the deployed URL in a browser MCP → screenshot → interact |
| Backend API    | `curl` the deployed endpoint → confirm response               |
| Background job | Trigger job → trace logs → query DB for result                |
| DB schema      | Query the affected table via DB MCP → confirm structure and data |

Then check logs for the affected component, and report what was verified with pass/fail.
If verification fails → fix before reporting done.

Skip QA only for: doc-only changes, comment edits, pure renames with no behavior change.

**This repo's concrete targets** — environment names, URLs, and deploy commands — live in
`.claude/CLAUDE.md`.

## Quality Standards (Enforced by /qa-gate)

Run `/qa-gate` before marking any work verified or shipped. Mandatory, not optional.

### Before Coding
- Ask "what are we actually trying to solve?" before writing code
- Explore 2–3 alternative approaches before committing
- For features with tests: write the test first

### During Verification
- **Adversarial QA**: try to BREAK it, don't just confirm it works
- **Decision-maker lens**: would a non-technical person understand the value delivered?
- **Evidence before claims**: no "should work" — run the command, show the output, THEN claim it passes

### Before Shipping
- **Security**: scan changed files for OWASP top-10, check for committed secrets
- **Visual**: screenshot at multiple breakpoints, check contrast, interaction states
- **Docs**: verify CLAUDE.md, README, AGENTS.md still match the code

## Memory Storage

Repo-local memory lives at `.claude/memory/`. It persists across conversations for that
repo only, not globally.

### Files
- `.claude/memory/MEMORY.md` — index of all memories (always loaded)
- `.claude/memory/*.md` — individual memory files by topic

### Types of memory
- **user** — role, goals, preferences
- **feedback** — corrections and confirmed approaches (include **Why:** and **How to apply:**)
- **project** — ongoing work, decisions, incidents (use absolute dates)
- **reference** — pointers to external systems (issue trackers, dashboards, etc.)

### How to save
1. Write a new file at `.claude/memory/<type>_<topic>.md` with frontmatter `name`, `description`, `type`
2. Add a one-line pointer to `.claude/memory/MEMORY.md`: `- [Title](file.md) — one-line hook`

### What NOT to save
- Code patterns / file paths (derivable by reading)
- Git history (use `git log` / `git blame`)
- Debug fix recipes (they're in the commit)
- Ephemeral task state (use TodoWrite instead)

### Before recommending from memory
A memory naming a function, file, or flag is a claim that it existed **when written**.
Verify with Grep/Read before acting on it.

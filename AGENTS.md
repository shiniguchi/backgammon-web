# AGENTS.md

Brief for AI coding agents working in this repo (Cursor, Windsurf, Aider, Codex,
Gemini CLI, Claude Code).

## Where the rules live

Read these in order. Claude Code loads them automatically; other agents should
open them explicitly.

1. **Every `.md` in `.claude/rules/`** — the shared working agreement. Read all of
   them; which files exist varies by repo (`shared.md` everywhere, plus an
   org-level file in some).
2. **`.claude/CLAUDE.md`** — this repo's own specifics: environment names, URLs,
   doc paths, deploy commands.
3. **`docs/`** — project context, architecture, roadmap, if present.

Do not restate rules in this file. It went stale the last time someone tried
(a `GEMINI.md` here advertised a 21-row workflow table long after it became 14).
One canonical copy, pointed at from everywhere else.

## Editing these files

`.claude/rules/*.md` is **synced from `github.com/shiniguchi/toolkit`**. Edits made
in a consuming repo are overwritten on the next sync — change it upstream instead.

`.claude/CLAUDE.md` is never synced. Repo-specific instructions belong there.

## Invoking skills

Everything invocable lives in `.claude/skills/`, one directory per skill with a
`SKILL.md`. In Claude Code, run them as `/<skill-name>`. There is no
`.claude/commands/` — that path is deprecated.

Run `/qa-gate` before marking anything verified or shipping.

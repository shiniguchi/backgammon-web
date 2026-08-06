# Claude Code hooks

Scripts that run on Claude Code lifecycle events. Wired up in `.claude/settings.local.json`.

## visual-verify-nudge.js

**Event:** `PostToolUse` (matchers: `Edit`, `Write`, `MultiEdit`)

**Purpose:** When Claude edits a frontend file, inject a system-reminder
that mirrors the Anthropic-internal verification-agent prompt
(`src/tools/AgentTool/built-in/verificationAgent.ts:30` in the Claude Code
source). This forces Claude to use the `claude-in-chrome` MCP to verify the
change in a real browser before declaring the task complete.

### Detection logic

A file qualifies as a "frontend edit" if BOTH:

1. Its path does NOT match any `excludePaths` substring, AND
2. EITHER its extension is in `extensions` OR its path contains a `pathContains` substring from a `rules` entry

### URL resolution

First matching `rules` entry wins (rules are scanned top-to-bottom — order
narrow rules before broad ones). Falls back to `defaultUrl`. If neither, the
reminder tells Claude to figure it out from CLAUDE.md.

### Per-repo customisation

Edit `verify-targets.json` to match your repo's apps and DEV URLs. The hook
script itself is universal — don't fork it.

### Test the hook locally

```bash
echo '{"tool_input":{"file_path":"/abs/path/ailine-frontend/src/Foo.tsx"}}' \
  | node .claude/hooks/visual-verify-nudge.js
```

Expected: JSON with `hookSpecificOutput.additionalContext` containing the
verification reminder. If you see nothing, the file path didn't match a
frontend rule.

### Failure mode

Any error → exit 0 (the hook never breaks Claude) PLUS a one-line stderr
log so the failure surfaces in claude-code harness output. Run
`claude --debug` if you suspect the hook is silently misbehaving — look for
lines starting with `[visual-verify-nudge]`.

### Why `package.json` is in this directory

`visual-verify-nudge.js` uses CommonJS `require()`. When a consuming repo
declares `"type": "module"` at its root (modern SvelteKit, Next.js, Vite
projects), Node would treat this `.js` file as ESM and crash on `require()`.
The sibling `package.json` (`{ "type": "commonjs" }`) scopes ALL `.js`
files in this directory back to CommonJS, regardless of the repo-root
package.json. **Do not delete it** — without it, the hook silently exit-0s
on every fire and Claude never receives the verification reminder.

### Why this exists

See the discussion in the chat session that produced these files. tl;dr:

- The `claude-in-chrome` skill's `whenToUse` triggers on user intent
  ("when the user wants to browse"), not on "Claude just edited frontend
  code." So the skill rarely auto-fires after an Edit.
- The strong verification-agent prompt only ships inside a separate built-in
  agent that the main loop has to explicitly spawn. Nothing tells it to.
- The `verify` skill is gated to `USER_TYPE=ant` (Anthropic-internal).
- CLAUDE.md / AGENTS.md text is advisory; hooks are the only deterministic
  mechanism to enforce behaviour at the tool-call boundary.

This hook closes the gap.

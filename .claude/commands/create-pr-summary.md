---
description: Generate PR description from branch commits and diffs
---

# Branch Summary Generator

**AI Instructions**: Auto-generate executive branch summary for entire branch. Analyze ALL commits from `main..HEAD`, **output raw markdown text in a code block** (plain text markdown, not rendered HTML).

---

## Auto-Context Gathering

Before generating the summary, execute these via `Bash`:

1. **Analyze ALL branch changes**
   - `git log main..HEAD --oneline` — all commits in branch
   - `git diff main..HEAD --stat` — all files changed

2. **Detect current repository**
   - `basename "$(git rev-parse --show-toplevel)"`

Then use the gathered context to auto-populate the summary template below.

---

## Summary Format

**Risk Level**: 🔴 High | 🟡 Medium | 🟢 Low

### ## TL;DR

**Max 2 sentences — simple, direct summary using plain language**

### ## Problem & Root Cause

**What broke and why** (number each item, show actual observations)

Format each as:
1. [Problem description]
   > [Root cause with actual logs/metrics/observations]

### ## Solution

**What we changed to fix it** (number to match problems above, show before/after for each)

1. [Solution for problem #1] ([filename.ts:42](filename.ts#L42))
   - Before: [What the code did before]
   - After: [What the code does now]
   - Why: [Brief explanation]

### ## Impact

**What this means for the system**

**Performance**
1. [Impact] — before/after numbers

**Watch After Deploy**
1. [Metric to watch]

### ## Housekeeping

**Cleanup, deletions, docs, refactoring**

- Files deleted: list them
- Dead code removed: what was removed
- Documentation updated: which files

---

## PR Title

Generate a PR title FIRST, before the summary body.

**Rules**:
- Under 70 characters
- Format: `<type>: <short description>` where type is one of: `feat`, `fix`, `refactor`, `docs`, `chore`, `perf`, `test`
- Imperative mood ("add X" not "added X")
- Focus on the **what**, not the **how**
- If multiple changes, pick the most impactful one for the title

Output as a separate code block before the summary:

```
feat: add webhook deduplication and memory bounds
```

---

## Output Instructions

1. **Output PR title in its own code block first**
2. **Output summary markdown in a separate markdown code block**
3. **Do NOT render as HTML** — output plain text markdown
4. **Use proper markdown**: `##` headings, `-` bullets, `**bold**`, `` `code` ``, `[text](url)`
5. **Keep it concise (KISS)**: group related changes, use file references, focus on impact
6. **Make it copy-paste ready** for GitHub PR descriptions

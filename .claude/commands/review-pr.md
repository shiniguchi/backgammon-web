---
description: Holistic PR alignment - fix cross-file inconsistencies, delete abandoned code, refactor docs to KISS
---

# PR Holistic Alignment

**Objective**: Analyze PR, fix all misalignments, delete dead code, refactor docs to KISS. Make production-ready.

---

## Core Operations

### 1. Detect PR Changes

```bash
git diff $(git merge-base origin/main HEAD)...HEAD
```

### 2. Align Cross-File References

For each changed pattern → grep entire repo → fix mismatches.

Examples:
- Function renamed: find old name usages → update all
- Import path changed: find old imports → update all
- Type signature changed: find old usages → update all
- Env var added: update all config files (`.env.example`, `docker-compose.yml`)

### 3. Find and Delete Unused Files & Code

**Step 3A: Find Potentially Unused Files**

```bash
# List source files
find src -type f \( -name "*.py" -o -name "*.ts" -o -name "*.js" \)
# For each, check references → flag if 0 references
```

**Step 3B: Verify & Delete**

- Entry points (`main.py`, `index.ts`) → KEEP
- Test files testing active code → KEEP
- Truly orphaned → DELETE

**Step 3C: Delete Dead Code Within Files**

- Unused exports (0 imports) → delete
- Commented blocks (>5 lines) → delete
- Legacy code paths replaced by PR → delete old
- Unreferenced functions → delete

### 4. Verify and Update All Documentation

**Step 4A: Verify Accuracy**

For each README/doc file:
1. Read the documentation claims
2. Cross-reference with actual code
3. Flag outdated sections

Files to check:
- `README.md`
- `docs/*.md`
- `.env.example`
- `docker-compose.yml` comments
- `.claude/CLAUDE.md`

**Step 4B: Update Outdated Content**

- Fix wrong function/file references
- Remove documented features that no longer exist
- Add missing critical steps (env var added in code → add to docs)

**Step 4C: Refactor to KISS**

- Paragraphs (>4 sentences) → bullet lists
- Complex explanations → tables or diagrams
- Remove redundant explanations
- Delete obvious inline comments
- Update outdated comments

---

## Repo-Adaptive Validation

Auto-detect repo type → run appropriate checks:

| Repo Type                   | Checks                                    |
| --------------------------- | ----------------------------------------- |
| Python (Flask/FastAPI)      | black, mypy                               |
| TypeScript (NestJS/Next.js) | eslint, tsc                               |
| All repos                   | Cross-package impact, contract alignment  |

---

## Cross-Repo Impact

If PR changes contracts (API endpoints, storage paths, DB schema, event types):
1. Check impact on related repos
2. Update shared docs if applicable
3. Flag which repos need follow-up PRs

---

## Commit & Output

```bash
git add .
git commit -m "refactor: align cross-file references, delete abandoned code, update docs to KISS"
```

**Summary format:**

```
✅ Alignment: Fixed [N] files, [M] imports, [K] configs
🗑️ Cleanup: Deleted [X] unused files, [Y] dead exports, [Z] comment blocks
📚 Docs: Verified [P] files, updated [Q] outdated sections, converted [R] paragraphs → bullets
🔄 Cross-repo: [List impacted repos if any]
📊 Net: -[total] lines removed
```

---

## Success Criteria

- ✅ Zero cross-file inconsistencies
- ✅ Zero unused files (verified and deleted)
- ✅ Zero dead code
- ✅ All docs accurate
- ✅ All docs in KISS format
- ✅ Repo-specific validation passed
- ✅ Changes committed

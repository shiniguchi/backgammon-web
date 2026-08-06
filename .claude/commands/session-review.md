---
description: Review current session's changes - validate, optimize, document
---

# Session Review & Code Optimization

**AI Agent Instructions**: Execute this comprehensive current-session review to track changes ONLY in this session, validate functionality, and optimize code.

---

## 1. Change Analysis & Impact Assessment

1. **Identify current repository and changes**
   - `git status --porcelain` and `git diff --stat`
   - `basename "$(git rev-parse --show-toplevel)"`

2. **Cross-package impact analysis**
   - Look for shared contracts (API endpoints, DB schema, types) touched in this session
   - Map changed files to impact zones

3. **Data validation**
   - If DB MCP is configured, check affected tables for expected state
   - Use `Grep` to find schema/migration changes in modified files

---

## 2. Code Optimization & Quality

1. **Code simplification analysis**
   - `git diff --numstat` to calculate lines added/removed
   - `Grep` for debug logging, typing issues, duplications
   - Recommend consolidation if net code increase detected

---

## 3. Workflow & Deployment Safety

1. **Deployment readiness check**
   - Run appropriate linting/testing commands based on repo
   - Prepare rollback commands with current commit hash

---

## 4. Update markdown documentation thoroughly

1. **Compare actual final code logic with README/doc contexts**
   - Delete irrelevant contexts
   - Add the minimum relevant context

---

## 5. Session Report Output

Provide specific recommendations based on:
- Code complexity changes (optimization opportunities)
- Production-safety requirements (staging vs direct deployment)
- Architecture compliance (project patterns)

---

**Tool Priority Order:**

1. Git/GitHub CLI for change detection in current session ONLY
2. DB MCP for data validation (if configured)
3. Grep/search for code pattern analysis
4. Bash for workflow enforcement
5. Structured output for cross-agent compatibility

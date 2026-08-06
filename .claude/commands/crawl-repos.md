---
description: Crawl related repos (same org or explicit list) to gather complete project context
---

**CRITICAL: DO NOT use Task tool (sub-agents). DO NOT run parallel operations. Do everything sequentially in the main thread using Bash tool directly.**

Crawl related repositories to gather complete project context.

`$ARGUMENTS` should be one of:
- A GitHub org name (e.g. `my-org`) → crawl all repos in that org
- A space-separated list of `owner/repo` → crawl those specific repos

**If empty, default to the current working directory's repo.** Resolve it with `gh repo view --json nameWithOwner -q .nameWithOwner` and crawl that single repo. Only ask the user if the current directory is not a git repo or has no GitHub remote.

**Step 1:** List all repositories in a single command:

```bash
gh repo list <ORG> --limit 50
```

**Step 2:** One repo at a time, sequentially, fetch its tree structure:

```bash
gh api repos/<ORG>/<repo-name>/git/trees/main?recursive=1 --jq '.tree[].path'
```

**Step 3:** For each repo, read only key files (e.g. `package.json`, `Dockerfile`, entry points, `README.md`). Skip `node_modules`, lock files, and generated code.

**Step 4:** After finishing all repos, summarize what you learned:
- Architecture across all repos
- Tech stack and dependencies
- Database schemas and API endpoints
- Inter-service relationships

Then name one random API endpoint and its location so the user knows you have full context.

**DO NOT create any files. DO NOT use Task tool. Process repos ONE AT A TIME.**

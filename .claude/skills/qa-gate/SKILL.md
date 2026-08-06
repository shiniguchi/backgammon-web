---
name: qa-gate
description: "Mandatory quality gate before shipping. Runs mechanical checks: visual QA via Chrome MCP (contrast verification, stale deploy detection), security scan (secrets grep, OWASP patterns, header audit), and doc consistency (version/path verification). Invoke with /qa-gate [scope]."
allowed-tools: mcp__claude-in-chrome__tabs_context_mcp, mcp__claude-in-chrome__tabs_create_mcp, mcp__claude-in-chrome__navigate, mcp__claude-in-chrome__computer, mcp__claude-in-chrome__read_page, mcp__claude-in-chrome__javascript_tool, mcp__claude-in-chrome__resize_window, mcp__claude-in-chrome__read_console_messages, mcp__claude-in-chrome__read_network_requests, Read, Grep, Glob, Bash, Agent
context: fork
---

# QA Gate

Mechanical quality gate. Every step produces a concrete result. No judgment calls.

## When to Run

- After any implementation work the user expects to ship
- Before any PR merge
- Manually via `/qa-gate` anytime

## Input

`$ARGUMENTS` determines scope:
- **Empty** → auto-detect from git diff, run applicable checks
- **`visual`** → only Check 1
- **`security`** → only Check 2
- **`docs`** → only Check 3
- **`all`** → run all checks regardless

## Step 0: Detect Repo Type and Changes

Run:
```bash
git diff --name-only HEAD~5 HEAD 2>/dev/null || git diff --name-only HEAD HEAD
```

Detect repo type:
- Has `src/app/` or `src/components/` → **FRONTEND** (run all checks)
- Has API routes or server-side code only → **BACKEND** (skip visual, run security + docs)
- Has only Dockerfile/infra → **INFRA** (security + docs only)

Classify changed files:
- `.tsx`, `.css`, files in `src/components/` or `src/app/` → run **Check 1: Visual**
- Any code change → always run **Check 2: Security** + **Check 3: Docs**

If `$ARGUMENTS` is set, skip classification and run only the requested check.

---

## Check 1: Visual QA

Skip this check for BACKEND/INFRA repos.

### 1A: Open page and capture

```
1. tabs_context_mcp with createIfEmpty: true
2. tabs_create_mcp → get fresh tabId
3. navigate to the LOCAL dev URL (check .claude/CLAUDE.md or .env for URL)
4. resize_window to 1440x900
5. computer wait 5 seconds (let ALL animations complete)
6. computer screenshot → save as "above-the-fold"
```

### 1B: Contrast verification (MANDATORY — do not skip)

Run this JavaScript on the page via `javascript_tool`:

```js
JSON.stringify(
  [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,button,li,td,th,label,figcaption')]
    .map(el => {
      const s = getComputedStyle(el);
      const text = el.textContent?.trim().slice(0, 50);
      if (!text || text.length < 2) return null;
      const opacity = parseFloat(s.opacity);
      const color = s.color;
      const bg = s.backgroundColor;
      const fontSize = parseFloat(s.fontSize);
      const rgb = color.match(/\d+/g)?.map(Number) || [0,0,0];
      const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
      return { tag: el.tagName, text, color, bg, opacity, fontSize, luminance: Math.round(luminance * 100) / 100 };
    })
    .filter(Boolean)
    .filter(x => x.luminance > 0.6 || x.opacity < 0.5)
    .slice(0, 30)
)
```

**Interpretation rules (no judgment — apply mechanically):**
- `luminance > 0.85` on a light background (bg luminance > 0.9) → **CRITICAL** if tag is h1/h2/h3 or element is a CTA button
- `luminance > 0.85` on a light background → **HIGH** if tag is h4/h5/h6/p and text length > 5
- `luminance > 0.7` on a light background → **MEDIUM** for any text element
- `opacity < 0.5` after page is fully loaded (5s wait) → **HIGH** (content not visible)
- Empty result (no elements match) → contrast is fine, move on

**Do NOT dismiss findings as "intentional design" or "animation." If the JS reports low contrast after 5 seconds, flag it.**

### 1C: Full page scroll-through

```
For each scroll position:
1. computer scroll down 8 ticks
2. computer wait 3 seconds
3. computer screenshot
4. Repeat until footer is visible
```

At EACH screenshot, check:
- Any empty containers (white boxes with no content)?
- Any placeholder text ("Coming in Phase", "TBD", "Lorem")?
- Any broken images (white rectangles where images should be)?

For suspicious empty containers, verify with JS:
```js
JSON.stringify(
  [...document.querySelectorAll('img')]
    .map(img => ({ src: img.src, width: img.naturalWidth, height: img.naturalHeight, alt: img.alt }))
    .filter(img => img.width === 0)
)
```
Any image with `naturalWidth === 0` → **HIGH** (broken image).

### 1D: Network and console check

```
1. read_console_messages with onlyErrors: true
2. read_network_requests
```
- Any 404 or 500 responses → **HIGH**
- Any console errors → **MEDIUM**
- Note: tracking must be started before page load. If empty, navigate to the URL again, wait 3s, then read.

### 1E: Stale deploy check

If a production/staging URL exists in `.claude/CLAUDE.md` or env config:
```
1. Open production URL in a new tab
2. computer screenshot
3. Compare visually against local screenshot
4. If production shows placeholder text that local has replaced → CRITICAL
5. If production is missing sections that local has → HIGH
```

### 1F: Output

```
## Visual QA Report
- Tested URL: [url]
- Contrast check elements flagged: [count from 1B]
- Broken images: [count from 1C]
- Console errors: [count]
- Network failures: [count]
- Deploy stale: [yes/no]

### Findings
| # | Severity | Section | Finding | Evidence |
|---|----------|---------|---------|----------|
```

---

## Check 2: Security Scan

Runs on ALL repo types.

### 2A: Secrets archaeology

Run these EXACT grep commands. Do NOT modify the paths or patterns.

**Connection strings with credentials (CRITICAL if found):**
```bash
grep -rn -E '(postgresql|mongodb|redis|mysql)://[^/]*:[^@]*@' . \
  --include='*.json' --include='*.ts' --include='*.js' --include='*.md' --include='*.yml' --include='*.yaml' --include='*.env*' \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir='.claude/worktrees' --exclude-dir=.git 2>/dev/null
```

**Credential patterns (HIGH if found in non-test files):**
```bash
grep -rn -i -E "(password|passwd|pwd|secret|api_?key|token|bearer|authorization)\s*[:=]\s*[\"'][^\"']{4,}" . \
  --include='*.json' --include='*.ts' --include='*.js' --include='*.md' --include='*.yml' --include='*.yaml' \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir='.claude/worktrees' --exclude-dir=.git 2>/dev/null
```

**MUST also scan these specific files:**
```
- .mcp.json (connection strings with passwords)
- .env, .env.local, .env.production (should not be committed — check with: git ls-files .env*)
- .claude/CLAUDE.md (dev login credentials)
- .claude/settings.local.json (credentials in allowlist patterns)
- .claude/commands/*.md (credentials in command docs)
```

**Severity rules:**
- Connection string with password in a git-tracked file → **CRITICAL**
- Login credentials in a git-tracked file → **HIGH**
- `.env` file committed to git → **CRITICAL**
- Credentials in `.claude/` docs (git-tracked) → **HIGH**
- Credentials in gitignored files → **INFO** (expected)

### 2B: OWASP pattern scan

Run on all `.ts` and `.tsx` files in `src/` (exclude node_modules):

```bash
# XSS: dangerouslySetInnerHTML
grep -rn 'dangerouslySetInnerHTML' src/ --include='*.tsx' --include='*.ts' 2>/dev/null
```
- Found without DOMPurify or `.replace(/</g` sanitization nearby → **MEDIUM**
- Found with sanitization → **INFO** (properly mitigated)

```bash
# Code injection
grep -rn -E '\beval\s*\(|\bnew\s+Function\s*\(' src/ --include='*.ts' --include='*.tsx' 2>/dev/null
```
- Any match → **HIGH**

```bash
# Open CORS
grep -rn "origin:\s*['\"]\\*['\"]" src/ --include='*.ts' --include='*.tsx' 2>/dev/null
```
- Any match → **HIGH**

### 2C: Security headers check

Read `next.config.ts` or `next.config.js` or `next.config.mjs`:

```bash
grep -c 'headers' next.config.* 2>/dev/null
```

If 0 matches → **HIGH** (no security headers configured).

If headers exist, check for these required headers:
```
Content-Security-Policy
X-Frame-Options
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
```

Each missing header → **MEDIUM**. All missing → **HIGH**.

For frontend repos, also verify headers at runtime via `javascript_tool`:
```js
fetch(window.location.href, { method: 'HEAD' }).then(r =>
  JSON.stringify({
    csp: r.headers.get('content-security-policy'),
    xfo: r.headers.get('x-frame-options'),
    xcto: r.headers.get('x-content-type-options'),
    rp: r.headers.get('referrer-policy'),
    pp: r.headers.get('permissions-policy')
  })
)
```

### 2D: Dependency audit

```bash
npm audit --json 2>/dev/null | head -50
```
- Critical vulnerabilities → **CRITICAL**
- High vulnerabilities → **HIGH**
- 0 vulnerabilities → **PASS**

### 2E: Output

```
## Security Scan Report

### Findings
| # | Severity | Category | File:Line | Finding | Fix |
|---|----------|----------|-----------|---------|-----|
```

---

## Check 3: Doc Consistency

Runs on ALL repo types.

### 3A: Version check

```bash
# Get actual version from package.json
node -e "const p=require('./package.json'); console.log(JSON.stringify({next: p.dependencies?.next, react: p.dependencies?.react, tailwindcss: p.dependencies?.tailwindcss || p.devDependencies?.tailwindcss}))" 2>/dev/null
```

Then grep CLAUDE.md files for version references:
```bash
grep -n -i -E 'next\.?js\s+\d+|tailwind\s+(css\s+)?v?\d+|react\s+\d+|framer.motion\s+v?\d+' CLAUDE.md .claude/CLAUDE.md 2>/dev/null
```

Compare. Any mismatch → **MEDIUM**.

### 3B: Path existence check

Extract file paths mentioned in CLAUDE.md:
```bash
grep -oE '`[a-zA-Z0-9_./-]+\.(ts|tsx|js|json|md|css)`' CLAUDE.md .claude/CLAUDE.md 2>/dev/null | sed 's/`//g' | sort -u
```

For each path, check if it exists. Any referenced file that doesn't exist → **MEDIUM**.

### 3C: Stale architecture claims

```bash
grep -n -i -E 'not yet (created|configured|specified|established)|to be created|coming in phase|no .* exists yet|planned|will be' CLAUDE.md .claude/CLAUDE.md 2>/dev/null
```

For each match, check if the referenced thing NOW exists. If it does → **MEDIUM** (doc is stale).

### 3D: Output

```
## Doc Consistency Report

### Findings
| # | Severity | File | Section | Issue | Suggested Fix |
|---|----------|------|---------|-------|---------------|
```

---

## Final Report

```
# QA Gate Report
- Date: [date]
- Repo: [repo name]
- Repo type: [FRONTEND/BACKEND/INFRA]
- Scope: [changed files summary]
- Checks run: [list]

## Overall Verdict: PASS / BLOCK

[Include each check report above]

## Summary
| Check | Status | Critical | High | Medium | Low |
|-------|--------|----------|------|--------|-----|
| Visual | PASS/BLOCK/SKIP | 0 | 0 | 0 | 0 |
| Security | PASS/BLOCK | 0 | 0 | 0 | 0 |
| Docs | PASS/WARN | 0 | 0 | 0 | 0 |

## Blocking Issues (must fix before ship)
[list CRITICAL and HIGH findings]

## Non-Blocking Issues (fix soon)
[list MEDIUM and LOW findings]
```

### Verdict Rules
- Any CRITICAL → **BLOCK**
- 2+ HIGH → **BLOCK**
- 1 HIGH → **BLOCK** (user can override with explicit approval)
- MEDIUM/LOW only → **PASS** with warnings

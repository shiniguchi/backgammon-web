#!/usr/bin/env node
/*
 * next-step-hint.js
 *
 * Stop hook. Detects current phase + completed step from .planning/ artifacts
 * and emits a "→ Next:" hint so the user (and the next conversational turn)
 * always knows the next workflow command.
 *
 * Trigger condition: only fires when the current branch is
 * `feature/phase-<NN>-<slug>`. On any other branch (main, docs/, fix/) the
 * hook stays silent so general chat sessions are not polluted.
 *
 * Step detection from `.planning/phases/<NN>-<slug>/`:
 *   no CONTEXT.md                     → step 1: discuss
 *   CONTEXT.md, no *-PLAN.md          → step 2: plan
 *   *-PLAN.md present, no *-SUMMARY.md→ step 3: execute
 *   plans summarised, no UAT.md       → step 4: epic-end QA
 *   UAT.md present                    → step 5: ship
 *
 * Reach-for suggestions are loaded from .claude/reach-for.json (data, not
 * markdown) and filtered by `after_step` matching the step the user just
 * finished — so the right add-on options surface at the right moment.
 *
 * Failure mode: any error → exit 0, stderr log. Mirrors visual-verify-nudge.js
 * pattern — the hook never breaks Claude.
 *
 * CommonJS: scoped by sibling .claude/hooks/package.json so this works in
 * repos whose root package.json declares "type": "module".
 */

'use strict'

const fs = require('fs')
const path = require('path')
const { execSync, spawnSync } = require('child_process')
const { classifyDiff } = require('./lib/classify')

function logErr(where, err) {
  try {
    const msg = err && (err.stack || err.message || String(err))
    process.stderr.write(`[next-step-hint] ${where}: ${msg}\n`)
  } catch { /* never throw from logger */ }
}

const REPO_ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd()
const PHASES_DIR = path.join(REPO_ROOT, '.planning', 'phases')
const REACH_FOR_PATH = path.join(REPO_ROOT, '.claude', 'reach-for.json')
const VALIDATOR_PATH = path.join(REPO_ROOT, '.claude', 'scripts', 'validate-planning-docs.sh')

const STEP = {
  DISCUSS: 1,
  PLAN: 2,
  EXECUTE: 3,
  QA: 4,
  SHIP: 5,
}

const NEXT_BY_STEP = {
  [STEP.DISCUSS]: '/gsd:discuss-phase "<name>"',
  [STEP.PLAN]: '/gsd:plan-phase <NN>   (or: superpowers:using-git-worktrees + writing-plans, if TDD pays off)',
  [STEP.EXECUTE]: '/gsd:execute-phase <NN>   (or: superpowers:subagent-driven-development, if step 2 used Superpowers)',
  [STEP.QA]: 'Epic-end QA: gh workflow run deploy_dev.yml --ref <branch> → /check-logs <services> → /qa-gate → /gsd:verify-work',
  [STEP.SHIP]: '/gsd:ship   (then: superpowers:finishing-a-development-branch)',
}

function getCurrentBranch() {
  try {
    return execSync('git -C ' + JSON.stringify(REPO_ROOT) + ' branch --show-current', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 2000,
    }).trim()
  } catch (err) {
    logErr('getCurrentBranch', err)
    return ''
  }
}

function parsePhaseFromBranch(branch) {
  const m = branch.match(/^feature\/phase-([0-9.]+)-(.+)$/)
  if (!m) return null
  return { number: m[1], slug: m[2] }
}

function findPhaseDir(phaseNumber) {
  if (!fs.existsSync(PHASES_DIR)) return null
  try {
    const entries = fs.readdirSync(PHASES_DIR)
    const match = entries.find(d => d.startsWith(phaseNumber + '-') || d === phaseNumber)
    return match ? path.join(PHASES_DIR, match) : null
  } catch (err) {
    logErr('findPhaseDir', err)
    return null
  }
}

function detectStep(phaseDir) {
  if (!phaseDir || !fs.existsSync(phaseDir)) return STEP.DISCUSS
  let files
  try { files = fs.readdirSync(phaseDir) } catch { return STEP.DISCUSS }

  const has = (re) => files.some(f => re.test(f))
  const hasContext = has(/CONTEXT\.md$/i)
  const planFiles = files.filter(f => /-PLAN\.md$/i.test(f))
  const summaryFiles = files.filter(f => /-SUMMARY\.md$/i.test(f))
  const hasUAT = has(/^UAT\.md$/i) || has(/-UAT\.md$/i)

  if (!hasContext) return STEP.DISCUSS
  if (planFiles.length === 0) return STEP.PLAN
  // Execute is "ongoing" until every plan has a matching summary.
  if (summaryFiles.length < planFiles.length) return STEP.EXECUTE
  if (!hasUAT) return STEP.QA
  return STEP.SHIP
}

function loadReachFor() {
  try {
    const raw = fs.readFileSync(REACH_FOR_PATH, 'utf8')
    const cfg = JSON.parse(raw)
    return Array.isArray(cfg.rows) ? cfg.rows : []
  } catch (err) {
    logErr('loadReachFor', err)
    return []
  }
}

function pickReachFor(rows, step) {
  // Prefer rows whose after_step matches the just-completed step;
  // also include rows with after_step === null (always-applicable).
  const exact = rows.filter(r => r.after_step === step)
  const anytime = rows.filter(r => r.after_step === null)
  return [...exact, ...anytime].slice(0, 2)
}

function readStdin() {
  return new Promise(resolve => {
    let data = ''
    if (process.stdin.isTTY) return resolve('')
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', c => { data += c })
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', () => resolve(''))
  })
}

// Returns { skipped: bool, reason: string } | null when not applicable.
// Reads the session transcript to detect whether browser/Postgres MCPs were
// actually called. Compares to git diff main...HEAD (frontend files only).
// Catches the "agent declared QA done without ever calling Chrome MCP /
// Playwright MCP / Postgres MCP" failure mode.
function checkVerificationEvidence(transcriptPath) {
  try {
    const cfgPath = path.join(REPO_ROOT, '.claude', 'hooks', 'verify-targets.json')
    if (!fs.existsSync(cfgPath)) return null
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
    const exts = Array.isArray(cfg.extensions) ? cfg.extensions : []
    if (exts.length === 0) return null

    const diffNames = execSync(
      'git -C ' + JSON.stringify(REPO_ROOT) + ' diff --name-only main...HEAD',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], timeout: 2000 }
    )
    const candidateFiles = diffNames.split('\n').filter(f => f && exts.some(e => f.endsWith(e)))
    if (candidateFiles.length === 0) return null

    // Branch-level noise filter: drop files whose branch diff is trivial / type-only / refactor.
    const meaningfulFiles = []
    for (const f of candidateFiles) {
      try {
        const fileDiff = execSync(
          'git -C ' + JSON.stringify(REPO_ROOT) + ' diff main...HEAD -- ' + JSON.stringify(f),
          { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], timeout: 1500 }
        )
        if (classifyDiff(fileDiff) !== 'trivial') meaningfulFiles.push({ file: f, diff: fileDiff })
      } catch { /* skip on per-file error */ }
    }
    if (meaningfulFiles.length === 0) return null

    if (!transcriptPath || !fs.existsSync(transcriptPath)) return null
    // Bound the read: last 500 lines covers a normal session.
    const tail = fs.readFileSync(transcriptPath, 'utf8').split('\n').slice(-500).join('\n')
    const usedChrome     = /"mcp__claude-in-chrome__/.test(tail)
    const usedPlaywright = /"mcp__playwright__/.test(tail)
    const usedBrowser    = usedChrome || usedPlaywright
    const usedPostgres   = /"mcp__postgres-(dev|prod)__/.test(tail)

    if (!usedBrowser) {
      return {
        skipped: true,
        reason: meaningfulFiles.length + ' frontend file(s) changed but no browser MCP calls (mcp__claude-in-chrome__* or mcp__playwright__*) in this session. Run /verify-front before /gsd:ship — Chrome MCP preferred, Playwright as fallback, share one tab.',
      }
    }

    const hasDataChange = meaningfulFiles.some(({ diff }) => classifyDiff(diff) === 'data')
    if (hasDataChange && !usedPostgres) {
      return {
        skipped: true,
        reason: 'Data-fetching code changed but no mcp__postgres-*__query in this session. Verify data exists in source before /gsd:ship.',
      }
    }
    return { skipped: false }
  } catch (err) {
    logErr('checkVerificationEvidence', err)
    return null
  }
}

function runValidator() {
  // Returns { drift: bool, output: string } or null on error/missing.
  // Uses --warn so the script exits 0 even with drift, and --quiet so we
  // only see output when drift exists.
  if (!fs.existsSync(VALIDATOR_PATH)) return null
  try {
    const r = spawnSync('bash', [VALIDATOR_PATH, '--warn', '--quiet'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      timeout: 4000,
    })
    const output = (r.stdout || '') + (r.stderr || '')
    const drift = output.includes('drift detected')
    return { drift, output: output.trim() }
  } catch (err) {
    logErr('runValidator', err)
    return null
  }
}

function formatHint(step, picks, validation, evidence) {
  const next = NEXT_BY_STEP[step] || '(unknown — see docs/workflow.md)'
  const reach = picks.length
    ? picks.map(r => `${r.command}  (${r.signal})`).join('  |  ')
    : '(none flagged for this step — proceed to default Next)'

  const lines = [
    '',
    '─── workflow hint ───',
    '→ Next: ' + next,
    '  Reach-for: ' + reach,
    '  Lookup: docs/workflow.md  •  table: .claude/reach-for.json',
  ]

  // Only inject planning-doc validation block at QA + SHIP steps. Earlier
  // steps haven't produced summaries yet, so drift checks are noise.
  if (validation && validation.drift && (step === STEP.QA || step === STEP.SHIP)) {
    lines.push('')
    lines.push('⚠️  Planning docs drift — must fix before /gsd:ship:')
    for (const ln of validation.output.split('\n')) {
      if (ln.trim()) lines.push('   ' + ln)
    }
  }

  if (evidence && evidence.skipped) {
    lines.push('')
    lines.push('⚠️  Frontend QA evidence missing:')
    lines.push('   ' + evidence.reason)
  }

  lines.push('─────────────────────')
  return lines.join('\n')
}

async function main() {
  const branch = getCurrentBranch()
  if (!branch) return process.exit(0)

  const phase = parsePhaseFromBranch(branch)
  if (!phase) return process.exit(0)  // Not on a phase branch — silent.

  // Read stdin to recover transcript_path for the evidence check. Stop hooks
  // receive { transcript_path, ... } JSON via stdin; absence is non-fatal.
  let payload = {}
  try {
    const raw = await readStdin()
    if (raw.trim()) payload = JSON.parse(raw)
  } catch (err) { logErr('readStdin', err) }

  const phaseDir = findPhaseDir(phase.number)
  const step = detectStep(phaseDir)
  const picks = pickReachFor(loadReachFor(), step)

  // Only run the (relatively expensive) validator + evidence check at QA + SHIP steps.
  const isLateStep = (step === STEP.QA || step === STEP.SHIP)
  const validation = isLateStep ? runValidator() : null
  const evidence   = isLateStep ? checkVerificationEvidence(payload && payload.transcript_path) : null
  const hint = formatHint(step, picks, validation, evidence)

  // Plain stdout — Claude Code surfaces Stop-hook stdout to the user.
  // Non-zero exit is reserved for blocking; we always exit 0.
  process.stdout.write(hint + '\n')
  process.exit(0)
}

main().catch(err => { logErr('main', err); process.exit(0) })

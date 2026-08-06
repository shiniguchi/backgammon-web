#!/usr/bin/env node
/*
 * visual-verify-nudge.js
 *
 * PostToolUse hook (Edit | Write | MultiEdit). When Claude edits a frontend
 * file, this hook injects a system-reminder that mirrors the
 * Anthropic-internal verification-agent prompt — instructing Claude to
 * flag the file as needing visual verification at the QA step via Playwright MCP.
 *
 * Detection rules + dev URLs come from `verify-targets.json` next to this
 * file (per-repo customisable). If the config is missing, the hook falls
 * back to extension-only detection and tells Claude to figure out the URL
 * from CLAUDE.md / repo context.
 *
 * Failure mode: any error → exit 0 (the hook never breaks Claude) PLUS a
 * one-line stderr log so the failure is visible in claude-code harness
 * output instead of vanishing. This was added after a silent ESM-mode
 * require() crash hid a broken hook for an unknown duration in a
 * downstream repo.
 *
 * CommonJS is required: this file uses require() so it works in repos
 * whose root package.json declares "type": "module" only when a sibling
 * .claude/hooks/package.json scopes this directory back to CommonJS.
 * That sibling file is part of the sync set — do not delete it.
 *
 * Universal across repos. Single source of truth lives in
 * AiLine/shared-docs and is propagated via .github/sync-config.yml (AiLine)
 * or bootstrap.sh (toolkit / standalone repos).
 */

'use strict'

const fs = require('fs')
const path = require('path')
const { classifyDiff, getDiff } = require('./lib/classify')

function logErr(where, err) {
  // Stderr does not break Claude (PostToolUse hook only treats non-zero exit
  // codes as blocking). Surfaces in `claude --debug` and harness logs.
  try {
    const msg = err && (err.stack || err.message || String(err))
    process.stderr.write(`[visual-verify-nudge] ${where}: ${msg}\n`)
  } catch { /* never throw from the logger itself */ }
}

const CONFIG_PATH = path.join(__dirname, 'verify-targets.json')

const DEFAULT_EXTENSIONS = [
  '.tsx', '.jsx', '.vue', '.svelte', '.astro',
  '.html', '.css', '.scss', '.sass', '.less',
]

function loadConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8')
    const cfg = JSON.parse(raw)
    return {
      extensions: Array.isArray(cfg.extensions) ? cfg.extensions : DEFAULT_EXTENSIONS,
      rules: Array.isArray(cfg.rules) ? cfg.rules : [],
      defaultUrl: typeof cfg.defaultUrl === 'string' ? cfg.defaultUrl : null,
      excludePaths: Array.isArray(cfg.excludePaths) ? cfg.excludePaths : [],
    }
  } catch (err) {
    logErr('loadConfig', err)
    return { extensions: DEFAULT_EXTENSIONS, rules: [], defaultUrl: null, excludePaths: [] }
  }
}

function isFrontendEdit(filePath, cfg) {
  if (!filePath) return false
  const lower = filePath.toLowerCase()

  for (const ex of cfg.excludePaths) {
    if (lower.includes(ex.toLowerCase())) return false
  }

  const ext = path.extname(lower)
  if (cfg.extensions.includes(ext)) return true

  for (const rule of cfg.rules) {
    if (rule.pathContains && lower.includes(String(rule.pathContains).toLowerCase())) {
      return true
    }
  }
  return false
}

function resolveTarget(filePath, cfg) {
  const lower = filePath.toLowerCase()
  for (const rule of cfg.rules) {
    if (rule.pathContains && lower.includes(String(rule.pathContains).toLowerCase())) {
      return {
        url: rule.url || cfg.defaultUrl || '<unknown — infer from CLAUDE.md or ask the user>',
        name: rule.name || rule.pathContains,
      }
    }
  }
  return {
    url: cfg.defaultUrl || '<unknown — infer from CLAUDE.md or ask the user>',
    name: 'frontend',
  }
}

// Step 1 of every template: tab-discipline. Chrome MCP first, reuse tab,
// fall back to Playwright only if needed. Both MCPs must share one tab.
const TAB_REUSE_STEP = 'Tab discipline: mcp__claude-in-chrome__tabs_context_mcp first → if a tab targets the URL, reuse its tab_id. Only mcp__claude-in-chrome__tabs_create_mcp if none exists. If you must use Playwright (fallback), do not open a second tab — keep operating on the Chrome tab.'

const DEFAULT_TEMPLATES = {
  visual: {
    steps: [
      TAB_REUSE_STEP,
      'Navigate (primary): mcp__claude-in-chrome__navigate — fallback: mcp__playwright__browser_navigate',
      'Capture: mcp__claude-in-chrome__get_page_text or mcp__claude-in-chrome__read_page — fallback: mcp__playwright__browser_take_screenshot',
      'Confirm visual change matches intent',
    ],
  },
  data: {
    steps: [
      'Identify the data source (table / API endpoint) for the new field',
      'mcp__postgres-dev__query → confirm rows exist',
      TAB_REUSE_STEP,
      'Navigate + capture: Chrome MCP primary (navigate + get_page_text/read_page), Playwright fallback (browser_navigate + browser_take_screenshot)',
      'Verify rendered value matches DB value',
    ],
  },
  interaction: {
    steps: [
      TAB_REUSE_STEP,
      'Click / type: mcp__claude-in-chrome__form_input or shortcuts_execute — fallback: mcp__playwright__browser_click / browser_type',
      'Errors: mcp__claude-in-chrome__read_console_messages — fallback: mcp__playwright__browser_console_messages',
      'Capture post-interaction state via the same tab',
    ],
  },
}

function buildReminder(filePath, target, kind, cfg) {
  const rel = path.relative(process.cwd(), filePath) || filePath
  const tpl = (cfg.templates && cfg.templates[kind]) || DEFAULT_TEMPLATES[kind] || DEFAULT_TEMPLATES.visual
  const list = tpl.steps.map((s, i) => `   ${i + 1}. ${s}`).join('\n')
  return `⚠️ [${kind.toUpperCase()}] ${rel} → ${target.url} (${target.name})\n${list}\n   Run /verify-front for the full sequence; both MCPs must share one Chrome tab.`
}

function readStdin() {
  return new Promise(resolve => {
    let data = ''
    if (process.stdin.isTTY) return resolve('')
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', chunk => { data += chunk })
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', () => resolve(''))
  })
}

async function main() {
  const raw = await readStdin()
  if (!raw.trim()) process.exit(0)

  let payload
  try { payload = JSON.parse(raw) } catch (err) { logErr('JSON.parse', err); process.exit(0) }

  const filePath = payload?.tool_input?.file_path || payload?.tool_input?.path || ''
  if (!filePath) process.exit(0)

  const cfg = loadConfig()
  if (!isFrontendEdit(filePath, cfg)) process.exit(0)

  // Diff-aware noise filter: silent on trivial / type-only / refactor / comment-only diffs.
  // The classifier returns a 'kind' label that drives the reminder template.
  const { text: diffText } = getDiff(filePath)
  const kind = classifyDiff(diffText)
  if (kind === 'trivial') process.exit(0)

  const target = resolveTarget(filePath, cfg)
  const reminder = buildReminder(filePath, target, kind, cfg)

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: reminder,
    },
  }))
  process.exit(0)
}

main().catch(err => { logErr('main', err); process.exit(0) })

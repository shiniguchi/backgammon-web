/*
 * lib/classify.js — shared diff classifier for the QA-evidence hooks.
 *
 * Single source of truth used by both visual-verify-nudge.js (PostToolUse)
 * and next-step-hint.js (Stop). Operates on `git diff` output and decides
 * whether a frontend change is render-affecting and what kind it is.
 *
 * classifyDiff(diffText) returns one of:
 *   'trivial'     — comment-only, type-only, refactor, <3 real lines, or no JSX/state/style/data signal
 *   'visual'      — render-affecting but no data fetch and no interaction
 *   'data'        — diff added a data-fetch call (fetch / useSWR / useQuery / supabase / prisma / axios / etc.)
 *   'interaction' — diff added an interaction handler:
 *                     React/Solid:  onClick, onSubmit, onChange, onInput, onKeyDown
 *                     Svelte:       on:click, on:submit, on:change, on:input, on:keydown
 *                     Vue:          @click, @submit, @change, @input, @keydown, v-on:click, v-on:submit
 *                     Angular:      (click), (submit), (change), (input), (keydown)
 *                     Vanilla:      addEventListener, router.push
 *
 * getDiff(filePath, gitArgs) returns { lines, text } from `git diff --unified=0`.
 *
 * CommonJS — must work under .claude/hooks/package.json's "type": "commonjs"
 * scope, because consuming repos may declare "type": "module" at their root.
 */

'use strict'

const { execSync } = require('child_process')

function classifyDiff(diffText) {
  if (!diffText) return 'trivial'

  const addedLines = diffText
    .split('\n')
    .filter(l => l.startsWith('+') && !l.startsWith('+++'))

  // Strip the leading '+' and surrounding whitespace; keep only lines with real code.
  const codeLines = addedLines.filter(l => l.replace(/[+\s]/g, '').length > 0)
  if (codeLines.length < 3) return 'trivial'

  const onlyComments = codeLines.every(l => /^\+\s*(\/\/|\/\*|\*|#)/.test(l))
  if (onlyComments) return 'trivial'

  // type-only / import-only diffs (TypeScript interface edits, import reorgs)
  const onlyTypes = codeLines.every(l =>
    /^\+\s*(interface |type |export type |export interface |import type |import\s)/.test(l)
  )
  if (onlyTypes) return 'trivial'

  const addedText = addedLines.join('\n')

  // Patterns reused by both the rendersUI check and the interaction check below.
  // Multi-framework: React/Solid (onX=), Svelte (on:x), Vue (@x, v-on:x), Angular ((x)).
  const INTERACTION_RE = /onClick|onSubmit|onChange|onInput|onKeyDown|onKeyUp|addEventListener|router\.push|on:click|on:submit|on:change|on:input|on:keydown|on:keyup|@click|@submit|@change|@input|@keydown|@keyup|v-on:click|v-on:submit|v-on:change|\(click\)|\(submit\)|\(change\)|\(input\)|\(keydown\)|\(keyup\)/i
  const DATA_RE = /fetch\(|useSWR|useQuery|supabase\.|prisma\.|\.api\.|axios\./i

  // Pure refactor: no JSX/HTML element, no styling, no state, no router, no data calls,
  // no interaction handler. Covers React (className), Svelte (class=, $state, $:),
  // Vue (ref, reactive, computed, watch, v-model), Solid (createSignal, createEffect).
  const rendersUI = (
    /<[A-Z]|className=|class=|class:|style=|useState|useEffect|setState|router\.|useRouter|\$state|\$derived|\$effect|^\+\s*\$:|ref\(|reactive\(|computed\(|watch\(|createSignal|createEffect|bind:|v-model/im.test(addedText)
    || INTERACTION_RE.test(addedText)
    || DATA_RE.test(addedText)
  )
  if (!rendersUI) return 'trivial'

  if (DATA_RE.test(addedText)) return 'data'
  if (INTERACTION_RE.test(addedText)) return 'interaction'
  return 'visual'
}

// Run `git diff` for one file. gitArgs lets the caller switch between working-tree
// diff (no args) and branch-level diff (e.g. ['main...HEAD']). Returns text plus
// a quick line-count for the cheap-skip path.
function getDiff(filePath, gitArgs = []) {
  try {
    const argStr = gitArgs.length ? gitArgs.join(' ') + ' ' : ''
    const cmd = `git diff --unified=0 ${argStr}-- ${JSON.stringify(filePath)}`
    const text = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], timeout: 2500 })
    const lines = (text.match(/^[+-][^+-]/gm) || []).length
    return { lines, text }
  } catch {
    return { lines: 0, text: '' }
  }
}

module.exports = { classifyDiff, getDiff }

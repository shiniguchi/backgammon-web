---
name: uiux-review
description: "UI/UX design review using Chrome MCP. Screenshots pages, tests responsiveness, checks accessibility, inspects console errors. Outputs prioritized findings. Usage: /uiux-review <url-or-page>"
allowed-tools: mcp__claude-in-chrome__tabs_context_mcp, mcp__claude-in-chrome__tabs_create_mcp, mcp__claude-in-chrome__navigate, mcp__claude-in-chrome__computer, mcp__claude-in-chrome__read_page, mcp__claude-in-chrome__find, mcp__claude-in-chrome__get_page_text, mcp__claude-in-chrome__javascript_tool, mcp__claude-in-chrome__resize_window, mcp__claude-in-chrome__read_console_messages, mcp__claude-in-chrome__read_network_requests, mcp__claude-in-chrome__form_input, Read
context: fork
---

# UI/UX Design Review

## Objective

Review a web app page for UI/UX issues. Output a prioritized findings report.

## Input

`$ARGUMENTS` must be a URL or a page path. If empty, ask the user which URL to review — do NOT guess a default.

## Phase 0: Setup

1. `tabs_context_mcp` with `createIfEmpty: true`
2. `tabs_create_mcp` to get a fresh tab
3. `navigate` to target URL
4. `computer` action `wait` for 3 seconds (let page load)
5. `computer` action `screenshot` — confirm page loaded
6. If login required, stop and tell the user to log in manually, then resume

## Phase 1: Visual & Layout (Desktop 1440px)

1. `resize_window` to 1440x900
2. `computer` action `screenshot` — capture full desktop view
3. `read_page` with `filter: "all"` — get DOM structure
4. Evaluate: **Layout**, **Typography**, **Color & Contrast**, **Visual Hierarchy**

Key checks:
- Consistent spacing (8px grid)
- Typography hierarchy (H1 > H2 > body clear)
- Color contrast (use `javascript_tool` to sample if needed)
- Alignment and visual balance
- No orphaned elements or awkward whitespace

## Phase 2: Responsive (768px + 375px)

1. `resize_window` to 768x1024 → screenshot → evaluate reflow, touch targets, readability
2. `resize_window` to 375x812 → screenshot → evaluate mobile layout
3. `resize_window` back to 1440x900

Key checks:
- No horizontal scrollbar at any viewport
- Touch targets >= 44x44px
- Text remains readable (>= 16px body on mobile)
- Navigation adapts (hamburger menu or equivalent)
- Images scale properly

## Phase 3: Interaction & States

1. `find` interactive elements (buttons, links, inputs, dropdowns)
2. For each major interactive element:
   - `computer` action `hover` → screenshot
   - `computer` action `left_click` → screenshot
3. Test at least one form if present:
   - Submit empty → check error states
   - Check focus ring via `computer` action `key` "Tab"
4. Check loading states for any async content

Key checks:
- All clickable elements have `cursor: pointer`
- Hover states visible and consistent
- Focus rings visible on keyboard navigation
- Error messages appear near the problem field
- Buttons disable during async operations

## Phase 4: Accessibility

1. `read_page` with `filter: "all"`
2. `javascript_tool` for accessibility checks:

```javascript
document.querySelectorAll('img:not([alt])').length
```

```javascript
[...document.querySelectorAll('button, a')].filter(el =>
  !el.textContent.trim() && !el.getAttribute('aria-label')
).length
```

```javascript
[...document.querySelectorAll('input, select, textarea')].filter(el =>
  !el.getAttribute('aria-label') &&
  !document.querySelector(`label[for="${el.id}"]`)
).length
```

```javascript
[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => h.tagName).join(' → ')
```

3. Test tab order: press Tab 10 times, verify logical focus movement

Key checks:
- All images have `alt`
- All icon-only buttons have `aria-label`
- Form inputs have associated labels
- Heading hierarchy is sequential (no h1 → h3 skip)
- Color is not the sole indicator of state

## Phase 5: Console & Network

1. `read_console_messages` with `onlyErrors: true`
2. `read_console_messages` with `pattern: "warning|deprecated"`
3. `read_network_requests`

Key checks:
- Zero uncaught JS errors
- No failed API calls
- No mixed content warnings
- No deprecation warnings from core libraries

## Output Format

```markdown
## UI/UX Review: [page URL]

**Reviewed**: [timestamp]
**Viewports tested**: 1440px, 768px, 375px

### Summary
[1-2 sentence overall assessment]

### Findings

#### Blockers (must fix)
- [B1] [Phase] — [description]

#### High Priority (fix before release)
- [H1] [Phase] — [description]

#### Medium Priority (fix in follow-up)
- [M1] [Phase] — [description]

#### Nitpicks (nice to have)
- [N1] [Phase] — [description]

### Score
| Category | Score |
|----------|-------|
| Layout & Visual | /10 |
| Responsiveness | /10 |
| Interaction | /10 |
| Accessibility | /10 |
| Stability | /10 |
| **Overall** | **/50** |

### Top 3 Recommendations
1. [most impactful fix]
2. [second most impactful]
3. [third most impactful]
```

## Severity Rules

- **Blocker**: Broken functionality, inaccessible content, JS errors blocking interaction
- **High**: Failed accessibility checks, broken responsive layout, missing error states
- **Medium**: Inconsistent spacing/colors, suboptimal hover states, minor alignment issues
- **Nitpick**: Font weight preferences, micro-animation timing, icon style consistency

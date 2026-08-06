---
name: deepsearch-propose-top2
description: Deep research with extended thinking, propose top 2 plans (read-only, no code changes)
---

Deep research this topic and think deeply before responding. Do NOT change any code.

> 🚨 **The failure this command exists to prevent.** Converging on the first 2 plausible
> answers from the most-SEO'd corner of the space, and missing the *best* option that lived
> one query away. Measured failure mode: the obvious top 2 appear by round 1–2; the better,
> non-obvious option reliably lives in rounds 3–7 behind a query you never issued because you
> already had two. **Do NOT stop when you have 2 good answers. Stop when the pool is saturated.**

## Process

### 1. Map the solution space by BRANCH — before any depth
- List the *distinct families / paradigms* that could answer this — **sibling branches**, not
  sub-types of one branch. (E.g. "database for AI" → vector, relational+extension, document,
  graph, **and multi-model** — not five different vector DBs.)
- Require **≥4 sibling branches**. If you can only name one, you have not researched yet:
  search `"alternatives to X"`, `"X vs"`, `"types of <problem> approach"`.
- Categories are NOT answers. Each branch must resolve to specific named products/libraries.
- **Then search the CROSS-BRANCH tools** — ones that combine/span paradigms:
  `"multi-model"`, `"unified"`, `"all-in-one"`, `"<X> + <Y> in one"`. The best option is
  frequently the tool that fits **no single bucket** (e.g. a multi-model DB, a data-infra
  platform vs. "a scraper") — it is invisible to per-branch search **by construction.**

### 2. Research WIDE and externally — never from memory alone
- **Live web search is mandatory, not "if applicable."** Training data is stale and SEO-biased;
  the best option is often a newer/niche named tool that lists never rank.
- Mine practitioner sources, not just first-page Google: **Reddit, Hacker News, GitHub
  `awesome-*` lists + topic search, PyPI/CRAN, Stack Overflow, survey papers, comparison blogs
  from the last ~18 months.**
- **Enumerate ≥15 specific NAMED tools/products/libraries** across the branches before ranking.
- **Scrape ≥1 EXHAUSTIVE curated enumeration** — a GitHub `awesome-<topic>` list, a
  "comprehensive list of <category>" page, or a PyPI/CRAN/registry category index. These
  surface the long tail that per-branch queries and top-10 listicles structurally miss.
- Each round, issue NEW query angles — rename the branch, search siblings, add `reddit` /
  `github` / `2025` / `alternatives` qualifiers.

### 3. Stop on SATURATION, not on "good enough"
- Continue until **2 consecutive search rounds add no new named candidate.**
- **Completeness critic (mandatory before ranking):** list every branch from step 1 — including
  the cross-branch one — and confirm each has **≥1 named candidate.** Any branch you enumerated
  but never populated is an **un-searched branch**: go search it by name before continuing. A
  named paradigm with zero products is the #1 way the best option gets silently dropped.
- In your output, state explicitly: at what round did the obvious 2 appear, and what
  better/non-obvious option appeared **only after** pushing past them? If nothing did, prove
  you searched the sibling branches that could have hidden one.

### 4. Think deeply, then propose Top 2 Plans

For each plan:
- **Summary** — what the approach is in 1-2 sentences
- **How it works** — key implementation steps
- **Pros** — why this approach is good
- **Cons** — risks and downsides
- **Effort** — rough scope (small / medium / large)

The top 2 must be the **winners of the saturated pool**, not the first 2 found. If both come
from the same branch, justify why no other branch produced a contender.

### 5. Recommendation
- State which plan you recommend and why.
- List the strongest options you **considered and rejected**, so the choice is auditable and I
  can spot a missed branch.
- Do NOT implement anything — wait for my decision.

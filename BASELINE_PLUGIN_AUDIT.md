# Diem Plugin — Baseline Audit

**Date:** 2026-05-09
**Plugin ID:** `diem`
**Version:** 1.0.0

## What exists

| File | Purpose |
|---|---|
| `openclaw.plugin.json` | Manifest — id, name, version, activation, configSchema |
| `index.ts` | Entry point — registers `/diem` command, calls `diem.py` via `execSync` |
| `diem.py` | Python script — hits Venice AI API to fetch balance headers |
| `test.mjs` | Offline test suite (added by this audit) |

## Baseline test coverage (test.mjs)

Run: `node --experimental-strip-types test.mjs`

| # | Category | Tests | Status |
|---|---|---|---|
| 1 | Manifest sanity | id, version, activation, configSchema | PASS |
| 2 | Entry point loads | default export is function | PASS |
| 3 | Mock registration | command name, handler, description, acceptsArgs | PASS |
| 4 | formatBalance parsing | normal balance, 402/zero, missing headers, NaN, rounding | PASS |
| 5 | diem.py syntax | py_compile check | PASS |

**Result: 15/15 passed, 0 failed**

## Button/menu/callback UX

Not applicable — this plugin registers a single `/diem` command with no inline keyboards, callback queries, or menu buttons.

## Observations

- **No `@ts-nocheck` issues found:** The `@ts-nocheck` pragma in `index.ts` suppresses type checking. The code is simple enough that this is acceptable, but removing it and adding an `api` type would improve safety.
- **`execSync` blocks the event loop** while `diem.py` runs (up to 10s timeout). For a balance check this is acceptable; a future improvement could use `execFile` with a callback.
- **`resolveScriptPath`** correctly supports `DIEM_SCRIPT_PATH` env override and co-located fallback.
- **`formatBalance`** is not exported, so tests replicate its logic. Exporting it would allow direct unit testing.
- **`diem.py` auth path:** Scans `~/.openclaw/agents/*/agent/auth-profiles.json` — correct for the current OpenClaw layout.

## Remaining gaps

1. **No integration test** — would require valid Venice API credentials.
2. **`formatBalance` not exported** — test replicates logic instead of importing directly.
3. **Rate-limit header display** — `formatBalance` parses `x-ratelimit-*` headers but the formatted output only shows the Diem balance line; rate-limit info is silently discarded.
4. **Error message quality** — handler returns raw `err.message` which may include full stack traces from `execSync` failures.
5. **No `package.json`** — no `npm test` script; tests must be run manually with the node command above.

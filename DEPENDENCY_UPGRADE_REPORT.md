# Dependency Upgrade Report

**Project:** fmf-trade-assistant
**Date:** 2026-06-04
**Goal:** Resolve critical npm audit vulnerabilities and upgrade dependencies to the latest compatible versions without introducing breaking changes.

---

## 1. Security Summary

| Severity | Before | After |
|----------|:------:|:-----:|
| Critical | 2 | **0** |
| High | 0 | 0 |
| Moderate | 6 | 2 |
| **Total** | **8** | **2** |

Both **critical** vulnerabilities were eliminated, along with 4 of the 6 moderate issues.

---

## 2. Critical Vulnerabilities Identified

| # | Package | Advisory | CVSS | Description | Status |
|---|---------|----------|:----:|-------------|--------|
| 1 | `vitest` (`<4.1.0`) | [GHSA-5xrq-8626-4rwp](https://github.com/advisories/GHSA-5xrq-8626-4rwp) | 9.8 | When the Vitest UI server is listening, an arbitrary file can be read and executed (CWE-862, missing authorization). | **Fixed** |
| 2 | `@vitest/coverage-v8` (`<=4.1.0-beta.6`) | inherits via `vitest` | 9.8 | Pulls in the vulnerable `vitest` version above. | **Fixed** |

Both are **devDependencies** (test tooling) and are not shipped in the production bundle, so the runtime/production attack surface was never affected. They were nonetheless resolved because they are the explicit critical targets.

---

## 3. Upgrades Applied

### 3a. Semver-compatible upgrades (no breaking changes)
Applied via `npm update` — all within existing caret (`^`) ranges.

| Package | From | To |
|---------|------|----|
| `@supabase/supabase-js` | 2.106.1 | 2.107.0 |
| `@types/react` | 19.2.15 | 19.2.16 |
| `@types/react-dom` | 19.1.5 | 19.2.3 |
| `@tailwindcss/postcss` | 4.1.7 | 4.3.0 |
| `eslint-config-next` | 15.5.18 | 15.5.19 |
| `next` | 15.5.18 | 15.5.19 |
| `next-intl` | 4.12.0 | 4.13.0 |
| `openai` | 6.39.0 | 6.42.0 |
| `react` | 19.2.6 | 19.2.7 |
| `react-dom` | 19.2.6 | 19.2.7 |
| `yahoo-finance2` | 3.14.1 | 3.15.2 |

### 3b. Major upgrade required to clear the critical (validated as non-breaking for this project)

| Package | From | To | Notes |
|---------|------|----|-------|
| `vitest` | ^2.1.9 | **^4.1.8** | Only available fix for the critical advisory. Dev-only. |
| `@vitest/coverage-v8` | ^2.1.9 | **^4.1.8** | Kept in lockstep with `vitest`. Dev-only. |

> **Why this was necessary:** npm reports the fix for both criticals as `isSemVerMajor` — there is no patch/minor release in the v2 line. The only paths were (a) leave the criticals unfixed, or (b) take the major bump on the test runner. Because `vitest` is a dev tool that is never bundled into the shipped app, and because the upgrade was fully validated against the existing test suite (47/47 tests pass, coverage report intact), this introduces **no functional/breaking change to the project**. Upgrading the test runner also transitively removed the 4 moderate advisories in `esbuild`, `vite`, `vite-node`, and `@vitest/mocker`.

---

## 4. Upgrades Deliberately NOT Applied (would be breaking)

Per the "no breaking changes" requirement, the following major-version bumps were **skipped**:

| Package | Current | Latest | Reason for skipping |
|---------|---------|--------|---------------------|
| `next` | 15.5.19 | 16.2.7 | Major (15 → 16); App Router/runtime breaking changes. |
| `eslint` | 9.39.4 | 10.4.1 | Major (9 → 10); flat-config/rule changes. |
| `eslint-config-next` | 15.5.19 | 16.2.7 | Tied to Next 16 major. |
| `typescript` | 5.9.3 | 6.0.3 | Major (5 → 6). |
| `zod` | 3.25.76 | 4.4.3 | Major (3 → 4); API changes. |
| `lucide-react` | 0.511.0 | 1.17.0 | Major (0.x → 1.x). |
| `@types/node` | 22.19.19 | 25.9.1 | Major; pinned to Node 22 runtime line. |

---

## 5. Remaining Vulnerabilities (2 moderate)

| Package | Advisory | CVSS | Why not fixed |
|---------|----------|:----:|---------------|
| `postcss` (`<8.5.10`) | [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) | 6.1 | Bundled transitively inside `next`. |
| `next` (via bundled `postcss`) | same chain | 6.1 | npm's only offered fix is `npm audit fix --force` → **downgrade to `next@9.3.3`**, a severe breaking change. |

**Decision:** Left as-is. The advisory is a moderate XSS in PostCSS's CSS stringify output; the only audit-offered remediation is a destructive downgrade of Next.js from 15 to 9, which violates the no-breaking-changes constraint and would break the application. This should be revisited when a future Next.js 15.x patch bundles `postcss >= 8.5.10`.

---

## 6. Validation

All checks were re-run after the upgrades and **pass**:

| Check | Command | Result |
|-------|---------|--------|
| Type check | `npx tsc --noEmit` | Pass (exit 0) |
| Production build | `npm run build` | Pass (exit 0) — compiled successfully, all 15 routes generated |
| Unit tests + coverage | `npm run test:coverage` | Pass — 7 files, **47/47 tests**, ~91.5% statement coverage (vitest v4) |

Notes:
- The `MISSING_MESSAGE: market.assets.cn-*` lines during the build are pre-existing i18n notices for missing Chinese asset-name translation keys. They are unrelated to dependencies and do not fail the build.
- The `next` metadata `themeColor`/`colorScheme` warnings are also pre-existing and non-fatal.

---

## 7. Recommended Follow-ups
1. Track Next.js 15.x releases for one that bundles `postcss >= 8.5.10` to clear the last 2 moderate advisories without a downgrade.
2. Plan separate, dedicated migrations for the deferred majors (Next 16, ESLint 10, TypeScript 6, Zod 4), each with its own testing pass.
3. Add missing `market.assets.cn-*` i18n keys for `en` and `zh` to silence the build-time message warnings.

# Lufthansa Crew Tax Calculator — 3‑Step Wizard Redesign + Fahrzeit Feature

## TL;DR

> **Quick Summary**: Rework the existing 6‑tab single‑page app into a **3‑step wizard** (Upload → Configure → Results) with a modern “old iTunes” clean aesthetic, while **preserving all existing business logic** except a targeted enhancement: **Fahrzeit zum Flughafen** (minutes) applied to **both departure and return days** for the **>8h absence threshold** used by Verpflegungsmehraufwand.
>
> **Deliverables**:
> - Redesigned wizard UI in `tax/index.html` + updated `tax/styles.css`
> - Wizard step controller + minimal refactor hooks in `tax/script.js`
> - New **Fahrzeit** input + wiring into allowance threshold logic
> - Automated verification procedure (Playwright) + console-based smoke checks
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 4 waves (plus a small Wave 0 discovery gate)
> **Critical Path**: Discovery → Wizard shell → Results wiring → Fahrzeit logic → Final verification

---

## Context

### Original Request
- Redesign an existing German tax calculator website for Lufthansa flight crew located at `/home/leah/coding/ohmy/tax/`.
- Transform from **6-tab navigation** to **3-step wizard** per `tax/DESIGN_APPROACH.md`.
- Keep **system font stack only** (no external font downloads).
- Keep **PDF.js via CDN**.
- Add feature: **Fahrzeit zum Flughafen** (single minute input) added to **both departure and return days** for deciding if **>8h absence** is met for Verpflegungsmehraufwand calculations.

### Key Existing Implementation References (verified)
- PDF.js pinned in `tax/index.html:8` and worker pinned in `tax/script.js:1-10`.
- Global data/state: `appData` in `tax/script.js:12-35`.
- Current 6-tab UI: `tax/index.html:30-76` with tab panels starting at `tax/index.html:110+`.
- Tab switching + keyboard support: `tax/index.html:546-678` (`setActiveSection(targetSection)` etc.).
- Per-day allowance logic: `calculateDailyAllowances(sortedFlights)` in `tax/script.js:2205-2512`.
- Summary aggregation (Endabrechnung): `updateEndabrechnung()` in `tax/script.js:3480-3654`.
- Allowance lookup helpers: `tax/allowances.js:539-579`.

---

## Work Objectives

### Core Objective
Deliver a premium-feeling 3-step wizard UX that matches `tax/DESIGN_APPROACH.md` while keeping the calculator correct and privacy-first (client-side).

### Concrete Deliverables
- A new wizard layout:
  - Step 1 (Upload): full-screen drop zone + uploaded file cards
  - Step 2 (Configure): cards for distance, cleaning costs, tips settings, and new Fahrzeit input
  - Step 3 (Results): bold totals + collapsible detail tables (reuse existing rendering)
- A new “Fahrzeit zum Flughafen (Minuten)” single input that affects Verpflegungsmehraufwand threshold logic.

### Definition of Done
- Wizard steps render and navigate correctly (forward/back), with correct enabled/disabled gates.
- Upload → parse → compute → results works end-to-end using PDF.js (CDN).
- With Fahrzeit=0, results match baseline (regression).
- With Fahrzeit>0, only the intended Verpflegungsmehraufwand outcomes change (as specified).

### Must Have
- System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
- Keep PDF.js CDN and worker pinning.
- 3-step wizard flow (Upload → Configure → Results).
- Fahrzeit input + correct impact on >8h threshold.

### Must NOT Have (Guardrails)
- Do NOT introduce build tooling (Vite/Webpack/npm required to run).
- Do NOT add external font downloads.
- Do NOT swap out PDF.js (keep CDN integration).
- Do NOT refactor business logic “for cleanliness” beyond what is strictly required to integrate Fahrzeit and support wizard navigation.
- Do NOT implement unrelated `todo.txt` items unless explicitly added.

---

## Verification Strategy (Agent-Executable)

### Test Decision
- **Infrastructure exists**: No formal test runner detected (plain HTML/CSS/JS).
- **User wants tests**: Not specified → default to **Automated E2E verification via Playwright** + console assertions.

### Automated Verification (Playwright)
Use Playwright to:
1) start a local static server, 2) upload PDFs, 3) verify step navigation, 4) verify results change when Fahrzeit changes.

> Note: this plan assumes the executor can use the `playwright` skill. If Playwright is not desired, replace with console-based verification steps.

---

## Execution Strategy

### Parallel Execution Waves

#### Wave 0 (Blocking discovery + baseline)
Purpose: avoid regressions and remove ambiguity around where “>8h absence” is computed.

#### Wave 1 (Wizard shell + design tokens)
Can proceed in parallel across HTML skeleton, CSS token system, and navigation controller scaffolding.

#### Wave 2 (Wire existing functionality into steps)
Move/rehang existing DOM sections into step containers; ensure existing computations still run.

#### Wave 3 (Fahrzeit feature + allowance/threshold integration)
Add UI input, store in state, integrate into the specific >8h absence computation, and verify with baseline.

#### Wave 4 (Polish + accessibility + performance)
Keyboard/focus management, micro-interactions, responsive tuning, and final E2E verification evidence capture.

### Dependency Matrix (High Level)

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 0.x Discovery/Baseline | None | All waves | None |
| 1.x Wizard shell | 0.x | 2.x | 1.x tasks parallel |
| 2.x Wiring | 1.x | 3.x, 4.x | 2.x tasks parallel |
| 3.x Fahrzeit | 2.x + 0.x | 4.x | Some sub-tasks parallel |
| 4.x Final polish/verify | 2.x + 3.x | None | Some sub-tasks parallel |

---

## TODOs

> Each task includes: what to do, recommended agent profile, parallelization, references, and agent-executable acceptance criteria.

### Wave 0 — Discovery & Baseline (BLOCKING)

- [ ] 0.1 Document current “Verpflegung / >8h absence” decision points

  **What to do**:
  - Locate the code path that decides **Germany (>8h) vs (24h) vs abroad** and where an “absence duration” is computed (if any).
  - Confirm whether current logic uses:
    - per-day categorization only (An/Ab vs 24h) OR
    - a computed hours-away-from-home that gates the partial allowance.
  - Write down the exact function(s) and variables that will need Fahrzeit.

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: focused code reading + pinpoint integration points.
  - **Skills**: `dev-browser`
    - `dev-browser`: can run the site and inspect runtime state/console.
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: not needed for logic discovery.

  **Parallelization**:
  - **Can Run In Parallel**: NO (baseline is needed before redesign to avoid regressions)
  - **Parallel Group**: Wave 0
  - **Blocks**: Wave 1+
  - **Blocked By**: None

  **References**:
  - `tax/script.js:2205-2512` — `calculateDailyAllowances(sortedFlights)` (daily allowance model).
  - `tax/script.js:3480-3654` — `updateEndabrechnung()` aggregates allowances.
  - `tax/allowances.js:539-579` — `getDailyAllowance`, `getApplicableRate`.

  **Acceptance Criteria (agent-executable)**:
  - [ ] A short note (in the PR description or a scratchpad) identifying:
    - the exact function where “>8h” is decided
    - the inputs used (times, block time, dates)
    - proposed hook point for Fahrzeit
  - [ ] Console check: `typeof calculateDailyAllowances === 'function'` → `true` (in devtools).

- [ ] 0.2 Create a baseline snapshot for regression comparison

  **What to do**:
  - Run the current UI end-to-end with at least one known PDF set.
  - Record baseline outputs:
    - total Verpflegung sum
    - endVerpflegungDE8h / endVerpflegungDE24h / endVerpflegungAusland
    - endSummeGesamt
  - Capture screenshots and/or console logs.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: `dev-browser`

  **Parallelization**:
  - **Can Run In Parallel**: NO (blocks later regression checks)
  - **Blocks**: 1.x+ tasks that must preserve behavior
  - **Blocked By**: None

  **References**:
  - `tax/index.html:110+` — current upload section.
  - `tax/script.js:177-243` — `handleFiles(files)`.
  - `tax/script.js:3480-3654` — end totals DOM ids.

  **Acceptance Criteria (agent-executable)**:
  - [ ] Evidence captured:
    - `.sisyphus/evidence/baseline-results.png`
    - `.sisyphus/evidence/baseline-console.txt` (or equivalent)

---

### Wave 1 — Wizard Shell + Design System (parallel)

- [ ] 1.1 Create wizard step structure in `index.html` (Upload/Configure/Results)

  **What to do**:
  - Replace the 6-tab nav with:
    - top bar brand
    - step indicator (3 steps)
    - Back/Continue controls
  - Create 3 step containers (e.g., `<section data-step="upload">`, etc.).
  - Preserve the existing file input (`#fileInput`) and upload handler hookups.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-ui-ux`
    - `frontend-ui-ux`: layout/spacing hierarchy per DESIGN_APPROACH.
  - **Skills Evaluated but Omitted**:
    - `playwright`: not required for HTML restructuring.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with 1.2, 1.3)
  - **Blocks**: 2.x wiring tasks
  - **Blocked By**: 0.x

  **References**:
  - `tax/index.html:30-76` — current tab nav to remove/replace.
  - `tax/DESIGN_APPROACH.md:109-131` — wizard concept & indicator.

  **Acceptance Criteria**:
  - [ ] DOM assertions:
    - `document.querySelectorAll('[data-wizard-step]').length === 3` → `true`
  - [ ] Only step 1 visible by default.

- [ ] 1.2 Implement design tokens + system font stack in `styles.css`

  **What to do**:
  - Add CSS variables for palette, spacing, radii, shadows.
  - Enforce system font stack.
  - Establish card component, buttons, and table container styling per “old iTunes” crispness.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-ui-ux`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 4.x polish (reuses tokens)
  - **Blocked By**: 0.x

  **References**:
  - `tax/DESIGN_APPROACH.md:47-106` — palette + spacing.
  - System font requirement (user): `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.

  **Acceptance Criteria**:
  - [ ] Computed style checks:
    - `getComputedStyle(document.body).fontFamily` contains `-apple-system` (or `system-ui` fallback)
  - [ ] Primary button uses `#1e3a5f` / accent `#3b82f6`.

- [ ] 1.3 Create wizard navigation controller in `script.js`

  **What to do**:
  - Implement a minimal step state machine (currentStep = 1..3).
  - Replace reliance on `setActiveSection` (currently in `index.html:546-678`).
  - Add gating:
    - cannot proceed to Configure until at least one PDF parsed successfully.
    - cannot proceed to Results until required config inputs validated (if any).
  - Add focus management: when step changes, focus step heading (`tabindex="-1"`).

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `frontend-ui-ux`, `dev-browser`
    - `frontend-ui-ux`: ensures the wizard controls match UI.
    - `dev-browser`: verify runtime behavior and avoid DOM-id breakage.

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 1.1/1.2)
  - **Parallel Group**: Wave 1
  - **Blocks**: 2.x
  - **Blocked By**: 0.x

  **References**:
  - `tax/script.js:45-120` — current DOMContentLoaded handlers and update triggers.
  - `tax/script.js:177-243` — `handleFiles(files)`; used to set “Upload complete” state.
  - `tax/index.html:546-678` — existing keyboard/nav behavior to port conceptually.

  **Acceptance Criteria**:
  - [ ] Console assertions:
    - `window.__wizardStep` (or chosen state) changes when clicking Continue/Back.
  - [ ] Focus moves to step heading after navigation.

---

### Wave 2 — Rehang Existing UI into Wizard Steps (parallel)

- [ ] 2.1 Step 1 (Upload): full-screen drop zone + upload cards

  **What to do**:
  - Convert current upload section into landing hero + drop zone.
  - Keep `#fileInput` behavior, call `handleFiles` unchanged.
  - Render uploaded file cards showing success/failure, remove file.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-ui-ux`, `dev-browser`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 2.2, 2.3)
  - **Parallel Group**: Wave 2
  - **Blocks**: 3.x, 4.x
  - **Blocked By**: Wave 1

  **References**:
  - `tax/index.html:110-200` — existing upload area.
  - `tax/script.js:177-243` — file handling.

  **Acceptance Criteria (Playwright preferred)**:
  - [ ] Playwright can load page and see step 1 heading.
  - [ ] Drop zone exists and is focusable.

- [ ] 2.2 Step 2 (Configure): convert current “Info + Expenses settings” into card layout

  **What to do**:
  - Consolidate relevant config inputs:
    - distance (`#distanceInput`, `#oneWayCheckbox`)
    - cleaning (`#reinigungInput`)
    - tips settings (trinkgeld inputs)
    - medical/ground duty toggles
  - Group them into cards with help text.
  - Ensure existing change handlers still trigger `updateMonthlyTable()` / `updateEndabrechnung()`.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-ui-ux`, `dev-browser`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 3.x
  - **Blocked By**: Wave 1

  **References**:
  - `tax/script.js:78-116` — distance/checkbox change handlers.
  - `tax/index.html` sections for existing inputs (varies; locate by ids).

  **Acceptance Criteria**:
  - [ ] Console: changing `#distanceInput` triggers updated totals (DOM value changes).

- [ ] 2.3 Step 3 (Results): present totals + collapsible details

  **What to do**:
  - Create a results hero panel (big totals).
  - Embed existing tables (monthly, flights, expenses, endabrechnung) into collapsible sections.
  - Preserve IDs so existing `update*()` functions continue to find their targets.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-ui-ux`, `dev-browser`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 4.x verification
  - **Blocked By**: Wave 1

  **References**:
  - `tax/index.html:239+` — summary and tables.
  - `tax/script.js:3480-3654` — endabrechnung updates.

  **Acceptance Criteria**:
  - [ ] Console: `document.getElementById('endSummeGesamt')` exists and is populated after upload + compute.

---

### Wave 3 — Fahrzeit Feature (parallel where possible)

- [ ] 3.1 Add Fahrzeit input to Configure step and persist in state

  **What to do**:
  - Add a single numeric input (minutes) with label “Fahrzeit zum Flughafen (Minuten)”.
  - Validate: integer ≥ 0 (cap TBD; suggest 0–240).
  - Store in app state (either `appData` or separate wizard state).
  - Trigger recalculation when changed.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `frontend-ui-ux`, `dev-browser`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with 3.2 discovery confirmation)
  - **Parallel Group**: Wave 3
  - **Blocks**: 3.3
  - **Blocked By**: 2.2

  **References**:
  - `tax/script.js:45-120` — existing input handlers pattern.

  **Acceptance Criteria**:
  - [ ] Console: `Number(document.getElementById('fahrzeitInput').value)` returns expected.
  - [ ] Changing Fahrzeit triggers re-render of Verpflegung totals.

- [ ] 3.2 Integrate Fahrzeit into the >8h absence threshold logic (core requirement)

  **What to do**:
  - Using results from Task 0.1, implement Fahrzeit minutes being added to both:
    - departure day “away time”
    - return day “away time”
  - Ensure it only affects the logic that decides whether a day qualifies for “>8h” based allowance (Verpflegungsmehraufwand).
  - Ensure Fahrzeit=0 preserves baseline outputs.

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: time/duration logic is high risk; must avoid regressions.
  - **Skills**: `dev-browser`

  **Parallelization**:
  - **Can Run In Parallel**: PARTIAL (can start after 0.1 even if UI work ongoing)
  - **Parallel Group**: Wave 3
  - **Blocks**: 4.2 final E2E
  - **Blocked By**: 0.1 + 2.3

  **References**:
  - `tax/script.js:2205-2512` — daily allowance model and marking departure/return days.
  - `tax/script.js:3480-3654` — end totals.
  - `tax/allowances.js:539-579` — rate helpers.

  **Acceptance Criteria (agent-executable)**:
  - [ ] With Fahrzeit = 0, the baseline recorded in 0.2 matches within €0.01.
  - [ ] With Fahrzeit = 60, at least one known boundary case changes as expected (document which dates).
  - [ ] Console prints the computed “absence duration” for a sample departure and return day before/after Fahrzeit.

- [ ] 3.3 Update UI copy and tooltips explaining Fahrzeit

  **What to do**:
  - Add a concise explanation (tooltip) that Fahrzeit is applied to both departure and return days.
  - Ensure German wording is clear and professional.

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: `frontend-ui-ux`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: none
  - **Blocked By**: 3.1

  **Acceptance Criteria**:
  - [ ] Tooltip appears and does not overflow viewport (reuse `positionTooltip` logic in `tax/script.js:3411-3478`).

---

### Wave 4 — Accessibility, Polish, and Final Verification

- [ ] 4.1 Accessibility pass: step indicator semantics + focus management

  **What to do**:
  - Implement step indicator `<ol>` with `aria-current="step"`.
  - Ensure each wizard step is `role="region"` labeled by its heading.
  - Ensure keyboard navigation for Back/Continue, and drop-zone keyboard support.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-ui-ux`, `dev-browser`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: 4.2 (E2E evidence should include accessibility basics)
  - **Blocked By**: Wave 2

  **Acceptance Criteria**:
  - [ ] Console: exactly one element has `[aria-current="step"]`.
  - [ ] After clicking Continue, focus lands on step heading.

- [ ] 4.2 Playwright end-to-end run + evidence capture

  **What to do**:
  - Start local server from `tax/`.
  - Run E2E checks:
    1) Step 1 visible, drop zone present
    2) Upload sample PDF(s)
    3) Continue to Configure, set Fahrzeit
    4) Continue to Results, verify totals render
    5) Change Fahrzeit, verify totals update
  - Save screenshots to `.sisyphus/evidence/`.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `playwright`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (final)
  - **Blocks**: done
  - **Blocked By**: 3.2 + 4.1

  **Acceptance Criteria (Playwright)**:
  - [ ] Screenshots:
    - `.sisyphus/evidence/wizard-step1-upload.png`
    - `.sisyphus/evidence/wizard-step2-configure.png`
    - `.sisyphus/evidence/wizard-step3-results.png`
  - [ ] Assertions:
    - results totals are non-empty
    - totals change when Fahrzeit changes (for at least one known boundary case)

---

## Success Criteria

### Final Checklist
- [ ] UI matches the DESIGN_APPROACH vision (whitespace, cards, modern polish).
- [ ] System font stack only; no external font requests.
- [ ] PDF upload and parsing works with pinned PDF.js + worker.
- [ ] Wizard flow works (Upload → Configure → Results) with back navigation.
- [ ] Fahrzeit field present and impacts Verpflegungsmehraufwand threshold as specified.
- [ ] Regression: Fahrzeit=0 matches baseline totals.
- [ ] E2E Playwright evidence captured.

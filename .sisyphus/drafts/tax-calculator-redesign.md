# Draft: Lufthansa Flight Crew Tax Calculator Redesign

## Requirements (confirmed)
- Project location: `/home/leah/coding/ohmy/tax/`
- Redesign existing German tax calculator website (HTML/CSS/JS) for Lufthansa flight crew.
- Transform IA from **6-tab navigation** to **3-step wizard**:
  1. Upload
  2. Configure
  3. Results
- Design direction: light, clean, professional “old iTunes” feel; generous whitespace; premium SaaS polish.
- Visual system:
  - Primary: `#1e3a5f`
  - Accent: `#3b82f6`
  - Light backgrounds
  - Rounded corners (12–16px), soft shadows, smooth animations
- Typography: **system font stack only** (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`), no external font downloads.
- PDF.js: keep CDN (status quo).

## Feature to Add (confirmed)
### Fahrzeit zum Flughafen (Travel time to airport)
- A **single minute input** (e.g., `45`) used as a **pauschal** value.
- This value is **added to BOTH departure and return days** when deciding whether the **>8h absence threshold** is met for **Verpflegungsmehraufwand** (meal allowance) calculations.

## Existing Files (given by user)
- `index.html` (683 lines, tab-based navigation)
- `styles.css`
- `script.js` (core calculation logic)
- `airports.js` (airport data)
- `allowances.js` (tax allowance rates)
- `DESIGN_APPROACH.md` (design vision)
- `todo.txt` (pending features)

## Scope Boundaries (initial)
- INCLUDE: full UX/UI redesign + wizard flow + Fahrzeit feature + preserve calculation correctness.
- EXCLUDE (tentative): implementing all items from `todo.txt` unless explicitly requested.

## Research Findings (from codebase + best practices)

### Codebase Exploration Findings (2026-01-30)
- **PDF.js CDN is pinned** in `tax/index.html:8` to `pdf.js/3.11.174` and the worker is pinned in `tax/script.js:1-10`.
- **Global state object**: `appData` in `tax/script.js:12-35` stores parsed data and derived aggregates.
- **Current UI** is a 6-tab tablist/tabpanel setup in `tax/index.html:30-76` + content sections beginning around `tax/index.html:110+`.
- **Tab switching & keyboard support** are inline-scripted in `tax/index.html:546-678` via `setActiveSection(targetSection)`.
- **Daily allowance logic (Verpflegung)** is driven by `calculateDailyAllowances(sortedFlights)` in `tax/script.js:2205-2512`.
  - Abroad period model includes `departureFlightDate` and `returnFlightDate` (`tax/script.js:2233-2317`).
  - Rate type uses `'An/Ab'` for departure/return and `'24h'` for other days (`tax/script.js:2465-2491`).
- End summary aggregates daily allowances inside `updateEndabrechnung()` in `tax/script.js:3480-3654`.
- Allowance helpers are in `tax/allowances.js` (notably `getDailyAllowance(...)` in `tax/allowances.js:539-544`, and `getApplicableRate(...)` in `tax/allowances.js:569-579`).

### Wizard / Accessibility / Aesthetic Research Findings
- Recommended wizard pattern: 3 `<section>` steps, state-driven `currentStep`, validate before advancing.
- Accessibility: progress indicator `<ol>` using `aria-current="step"`, focus management to step heading with `tabindex="-1"`.
- PDF.js CDN best practice: keep worker version matched & explicitly set `GlobalWorkerOptions.workerSrc` (already satisfied by current code).

## Decisions Needed (blocking for implementation plan correctness)
- **[DECISION NEEDED] Fahrzeit semantics**: In code, “departure/return day” is modeled as `isDepartureFromGermanyDay` / `isReturnToGermanyDay` in `calculateDailyAllowances()`. Confirm Fahrzeit should apply to those days only (matches your Option A), and clarify how "absence duration" is computed for the >8h test.
- **[DECISION NEEDED] Verification strategy**: include Playwright-based automated UI verification (recommended for agent-executable success criteria) vs console-based checks only.
- **[DECISION NEEDED] todo.txt scope**: include none (default) vs cherry-pick specific must-haves.

## Open Questions
1. Fahrzeit scope: Is the pauschal Fahrzeit value applied to **all duty days**, or only to **pairing boundary days** (first/last day of a trip/rotation)?
2. Where to surface Fahrzeit in the new wizard: Upload step, Configure step, or both (summary + edit)?
3. Hosting/run mode: Is this site used as a **static file** (open `index.html`) or served (e.g., `http.server`)?
4. Verification preference: Is it acceptable to use **Playwright automation** for UI verification, or should verification be purely manual steps?
5. Out of scope confirmation: Should we ignore `todo.txt` items for this redesign (except Fahrzeit), or include any must-haves?

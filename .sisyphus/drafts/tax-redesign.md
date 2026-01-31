# Draft: Lufthansa Crew Tax Calculator — Modern Redesign + Wizard Flow

## Requirements (confirmed)
- Redesign UI to be **light, clean, professional** with a modern web-app feel ("old iTunes aesthetic" reference).
- Convert IA from **6 cramped tabs → 3-step wizard**: **UPLOAD → CONFIGURE → RESULTS** (per `tax/DESIGN_APPROACH.md`).
- Preserve **ALL existing functionality** (PDF parsing, calculations, exports, warnings, etc.).
- **Pure client-side** (no frameworks, no build tools); vanilla HTML/CSS/JS.
- **German language** interface.
- Implement pending todo feature: **input travel time to airport** for calculating "tatsächliche Abwesenheit".

## Existing Codebase Notes (initial)
- `tax/index.html` contains tab-style navigation (`.nav-item[data-section]`) and `section-*` tabpanels.
- Tab switching logic is embedded at bottom of `index.html` (DOMContentLoaded handler; `setActiveSection()`).
- `tax/script.js` contains calculation and DOM update logic. Verpflegungspauschale uses day classification (>8h vs 24h) inside `calculateDailyAllowances()` and related render/update functions.

## Research Findings
- (Pending) Wizard UX best practices and typography guidance from librarian agent.
- Explore agent summary indicates likely integration points for the new feature are:
  - `getCommuteTripCount()` and `updateDistanceCalculation()` (need verification by direct code reference during plan generation).

## Scope Boundaries
- INCLUDE: CSS redesign, HTML restructure to wizard, JS wizard navigation/animations, travel-time feature.
- EXCLUDE (tentative): server-side features, frameworks/build tooling, changing the underlying tax calculation rules beyond the travel-time adjustment.

## Open Questions
- Exact business rule for **travel time to airport**: how it affects absence time thresholds (>8h / 24h) and which days (departure/return only? also domestic?)
- Typography sourcing: system font stack vs self-host Inter vs external (privacy tradeoff).
- Whether to keep/replace current external `pdf.js` CDN dependency.

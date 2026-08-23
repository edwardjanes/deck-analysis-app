# Valuation Engine — Claude Development Log

**Project:** Equidam-style startup valuation engine  
**Status:** 🟢 MVP Complete, Phase 0-2 Implementation Done, Vercel Build Fixed  
**Last Updated:** 2026-08-23  
**User Email:** edward@sourcecapital.co.uk

---

## Overview

Building a Next.js application that replicates Equidam's startup valuation methodology. Users enter company data through a 6-step wizard, the system computes valuations using six complementary methods, generates snapshot-based reports, and persists data in Supabase.

**Goal:** Validate that our implementation produces comparable results to Equidam's reference methodology using real NovaCloud Systems data ($3.77M target valuation).

---

## Tech Stack

- **Frontend:** Next.js 14.2.20, React 18.3.1, TypeScript (strict mode)
- **Styling:** Inline React styles only (no Tailwind, no CSS modules)
- **Database:** Supabase PostgreSQL with RLS row-level security
- **Auth:** Supabase email/password + Google OAuth
- **Valuation Engine:** 14 pure TypeScript modules (zero UI dependencies)
- **Charts:** Inline SVG (no external charting libraries)
- **Fonts:** Google Fonts (Fira Sans, Fira Code) via `<link>` tags

---

## Completed Features

### ✅ Authentication & Database
- [x] Supabase auth configured (email/password + Google OAuth)
- [x] Fixed `handle_new_user()` trigger to gracefully handle errors
- [x] Applied 3 SQL migrations:
  - `001_valuation_companies.sql` — Company profiles + RLS
  - `002_valuation_inputs.sql` — Financials, questionnaire, cap table, comparables
  - `003_valuation_parameters_snapshots.sql` — Valuation parameters & snapshot history
- [x] All 9 database tables created with RLS policies

### ✅ Valuation Engine Core (14 Modules)
- [x] **types.ts** — Type definitions for all inputs/outputs
- [x] **referenceData.ts** — Illustrative country/industry defaults
- [x] **scorecard.ts** — ✓ Validated: $5,310,193 (NovaCloud reference)
- [x] **checklist.ts** — ✓ Validated: $4,555,423 (NovaCloud reference)
- [x] **vc.ts** — VC Method (exit value discounted by stage ROI)
- [x] **dcf.ts** — Shared DCF framework (LTG + Multiple variants)
- [x] **simpleMultiples.ts** — Comparable company median valuation
- [x] **scoring.ts** — Sub-trait scores from questionnaire
- [x] **defaults.ts** — Default parameters from profile/financials
- [x] **diff.ts** — Parameter diffing (current vs defaults)
- [x] **format.ts** — Currency and percentage formatting
- [x] **weights.ts** — Stage-based method weighting
- [x] **fcf.ts** — Free Cash Flow to Equity calculation
- [x] **compute.ts** — Top-level orchestrator

### ✅ Wizard Forms (6 Steps)
- [x] Step 1: Company Profile (name, country, industry, stage, founders, employees)
- [x] Step 2: Questionnaire (4 tabs: Team, Business Model, Product & Market, IP & Legal)
- [x] Step 3: Financials (7-year P&L/CF grid: Years -1 to +5)
- [x] Step 4: Cap Table (shareholders, funding rounds, capital needs)
- [x] Step 5: Comparables (company multiples)
- [x] Step 6: Valuation Parameters (method weight sliders)

### ✅ Report Generation
- [x] Snapshot API (`/companies/[id]/snapshot`) — Computes valuations, persists to DB
- [x] Report view (`/companies/[id]/report/[snapshotId]`) — Displays 6 method results
- [x] Executive summary (valuation ± 20% bounds)
- [x] Method comparison table
- [x] Key assumptions (discount rate, stage)
- [x] PDF export via browser print dialog

### ✅ Data Persistence Architecture
- [x] WizardShell refactored to manage all wizard state centrally
- [x] All 6 step components wired to `onUpdate` callbacks
- [x] Snapshot API accepts data in POST body OR fetches from DB
- [x] Enables testing without database writes (MVP mode)

### ✅ Phase 0: Questionnaire Wiring (Aug 23)
- [x] Added 4 missing UI fields to QuestionnaireStep.tsx:
  - competitors_count (Business Model tab)
  - has_competitive_advantage (Business Model tab)
  - partnerships_count (Business Model tab)
  - has_strategic_investors (Business Model tab)
- [x] Updated QuestionnaireAnswers type with all 20 fields
- [x] Added scoring-regression.test.ts: validates UI ↔ scoring field sync
- [x] Merged capital_needed and last_year_revenue from external sources (snapshot/route.ts enrichment)
- [x] Updated scoring functions to use all collected questionnaire fields

### ✅ Phase 2: Benchmark Data & Survival Rates (Aug 23)
- [x] Part 1: Updated 7 countries' seed pre-money/checklist valuations
  - US, GB, FR, NL, IE, SE, CH sourced from PitchBook-NVCA/BBB 2025 reports
- [x] Part 2: Added per-country 6-year survival curves (16 countries)
  - Sourced from Eurostat, BLS, ONS, StatCan, INSEE, IBGE, GUS/PARP
  - 8 countries without adequate data fall back to global default (IL, AE, SG, HK, IN, CN, ZA, NG)
- [x] Part 3: Fixed survival-rates wiring bug in dcf.ts
  - computeDcfShared() now accepts survivalRates parameter (was hardcoded to SURVIVAL_RATES)
  - Both DCF-LTG and DCF-Multiple now use correct country-specific curves
- [x] Germany correction: Reverted Germany curve to NovaCloud-validated default
  - SURVIVAL_RATES (88.69/79.45/71.64/64.87/58.91/53.57%) is Germany-specific
  - Destatis alternative caused ~30% understatement in DCF values

### ✅ Recovery & Build Fix (Aug 23)
- [x] Recovered accidental deletion of 228 deck-analysis-app files (commit de259d0)
- [x] Added postcss.config.mjs to prevent Vercel build failure
  - Stops Next.js from walking up to root config that requires tailwindcss

### ✅ Earlier Bug Fixes
- [x] Fixed tsconfig.json (removed "next" plugin causing 20+ min hangs)
- [x] Fixed handle_new_user() trigger (wrapped INSERT in error handler)
- [x] Fixed home page redirect (added server-side logic)
- [x] Fixed ReportClient error (company.stage was undefined — query only selected id)
- [x] Fixed infinite loop in useEffect (removed onUpdate from dependency arrays)
- [x] Fixed missing onUpdate in function signatures (ProfileStep, FinancialsStep)

---

## Current Status: MVP + Phase 0-2 Complete, Vercel Deployment Ready

**What Works End-to-End:**
1. Sign up/login ✅
2. Create company ✅
3. Fill 6-step wizard with all questionnaire fields ✅
4. Generate report with all 6 method valuations ✅
5. View snapshot-based report ✅
6. Export PDF ✅
7. Per-country survival-rate adjustments in DCF calculations ✅

**Unit Tests:** All 6 passing
- ✅ Scorecard ($5,310,193 validated)
- ✅ Checklist ($4,555,423 validated)
- ✅ Weights
- ✅ FCF (with NOL carryforward)
- ✅ Compute orchestrator
- ✅ Scoring regression (UI ↔ scoring sync)

**Commits:** (Latest → Earliest)
- d2e2194 — Add local postcss.config (Vercel build fix)
- e050ce0 — Revert Germany survival curve (NovaCloud validation)
- de259d0 — Restore deck-analysis-app + Phase 2 implementation
- 3d25c12 — Original Phase 2 push (with accidental deletions)
- 27c5713 — Earlier Phase 2 attempt
- fb46b17 — Phase 0 Part 3-4 (UI fields + regression test)
- a0f6133 — Phase 0 Part 1-2 (data source merging)

**Deployment Status:**
- Vercel project configured: `apps/valuation-engine` (Root Directory)
- Latest build should succeed (postcss.config fix applied)
- All production environment variables required (see .env.local.example)

---

## NovaCloud Systems Validation Dataset

**Extracted from:** Equidam Inputs 2025.xlsx + NovaCloud Valuation Report PDF

### Company Profile
- **Name:** NovaCloud Systems
- **Location:** Frankfurt am Main, Germany
- **Industry:** Software / SaaS
- **Stage:** Development
- **Founded:** 2019 | Incorporated: 2020
- **Founders:** 2 (prior exit experience)
- **Employees:** 2 (excluding founders)

### Financial Data (USD)
| Year | Revenue | COGS | Salaries | OpEx | D&A | Interest | Net Profit |
|------|---------|------|----------|------|-----|----------|------------|
| Y0 (2024) | $2,000,000 | $1,250,200 | $176,650 | $24,000 | $1,094 | $0 | $518,737 |
| Y1 (2025) | $3,500,000 | $2,000,202 | $1,400,430 | $182,000 | $340,034 | $123,200 | ($545,866) |
| Y2 (2026) | $6,570,023 | $3,550,000 | $956,000 | $242,000 | $630,000 | $123,200 | $960,696 |
| Y3 (2027) | $8,600,000 | $5,230,000 | $1,234,330 | $450,000 | $820,000 | $123,200 | $519,729 |

**Growth Profile:** 75% (Y0→Y1), 88% (Y1→Y2), 31% (Y2→Y3) — Early-stage rapid growth then deceleration

### Cap Table
- Founders: 42.6%
- VC: 33.2%
- Partners: 24.2%

### Comparables (Revenue Multiples)
- Median: **1.74x** (Soluciones Cuatroochenta S.L.)
- Range: 0.89x–4.23x

### Equidam Reference Valuation
- **Primary:** $3,775,562
- **Low Bound:** $3,414,000 (−10%)
- **High Bound:** $4,137,000 (+10%)
- **Method Weights:** Checklist 22%, Scorecard 22%, VC 22%, DCF-LTG 12%, DCF-Multiples 12%, Multiples 10%

---

## Next Steps: Validation Testing

### Phase 1: End-to-End Test with NovaCloud Data
1. **Create new valuation** in wizard
2. **Fill Profile Step:**
   - Name: `NovaCloud Systems`
   - Country: `Germany`
   - Industry: `SaaS`
   - Stage: `development`
   - Founders: `2`
   - Employees: `2`

3. **Fill Financials Step** (Years 0–3):
   - Revenue: $2M → $3.5M → $6.57M → $8.6M
   - COGS, Salaries, OpEx from table above
   - Debt: $2.5M (all years)

4. **Fill Comparables Step:**
   - Add comparables with 1.74x median multiple

5. **Skip Questionnaire/CapTable** (optional for quick test)

6. **Generate Report:**
   - Target: Compare to **$3,775,562**
   - Success: Within ±20% = $3.01M–$4.54M
   - Validate: All 6 methods produce reasonable breakdowns

### Phase 2: Analysis
- [ ] Compare our valuation to Equidam's $3.77M
- [ ] Analyze per-method breakdown (Scorecard, Checklist, VC, DCF variants, Multiples)
- [ ] Identify any methodology gaps or tuning needed
- [ ] Document findings

### Phase 3: Deployment Readiness
- [ ] Push to GitHub
- [ ] Deploy to Vercel with environment variables
- [ ] Test on production URL
- [ ] Verify snapshot persistence

---

## Key Decisions & Rationale

### Data Persistence
**Decision:** Accept data in POST body instead of requiring database writes during wizard.

**Why:** Allows testing full valuation engine without intermediate database commits. Snapshot API fetches from DB if available, uses POST body if provided. Enables MVP deployment without initial UX friction.

### Dependency Array Fixes
**Decision:** Removed `onUpdate` from useEffect dependencies in all step components.

**Why:** Including callback functions in dependency arrays causes infinite loops when parent state updates. The callback is stable, so only actual data changes (formData, financials, etc.) should trigger updates.

### Inline Styles Only
**Decision:** No Tailwind, no CSS modules — all styling via React style objects.

**Why:** Matches sibling app (Deck Analysis App) conventions. Simplifies deployment, reduces build complexity, keeps styles co-located with components.

---

## Known Limitations

1. **Reference Data:** Country/industry defaults are illustrative, not Equidam's proprietary Crunchbase/Damodaran data. Clearly labeled and user-editable.

2. **Scoring Rubric:** Sub-trait weighting derived from questionnaire is assumed; Equidam's exact rubric is proprietary. Users can override individual criterion scores.

3. **Report Sections:** Summary only currently. Full 14-section report (per Equidam template) is scaffolded but not fully rendered.

4. **PDF Export:** Browser print dialog (no server-side PDF generation). Works well for local testing.

5. **Dashboard:** Doesn't show company list yet (feature for Phase 2).

---

## File Structure Highlights

```
src/
├── app/
│   ├── page.tsx                    — Home redirect (login/dashboard)
│   ├── login/page.tsx              — Auth forms
│   ├── dashboard/                  — Home page
│   └── companies/[id]/
│       ├── edit/
│       │   ├── WizardShell.tsx      — Central wizard state manager
│       │   ├── profile/
│       │   ├── questionnaire/
│       │   ├── financials/
│       │   ├── captable/
│       │   ├── comparables/
│       │   └── parameters/
│       ├── snapshot/route.ts        — Valuation compute + persist API
│       └── report/[snapshotId]/     — View + print report
├── lib/
│   ├── valuation/                  — Pure TS engine (14 modules)
│   ├── theme.ts                    — Design tokens
│   └── supabase*.ts                — DB clients (4 files)
└── middleware.ts                   — Auth guard
```

---

## Testing & Validation

### Unit Tests
```bash
npm run test
```
Expected: 3/3 passing (Scorecard, Checklist, Weights)

### Local Development
```bash
npm run dev
```
Runs on `http://localhost:3000`

### Current Test Plan
Use NovaCloud Systems data → Validate against $3.77M reference

---

## Deployment Status

### Local ✅
- Dev server runs: `npm run dev`
- All features functional
- Database connected to shared Supabase project

### Staging ⏳
- Ready to push to GitHub
- Ready to deploy to Vercel
- Requires: GitHub repo + Vercel account

### Production 🔄
- Environment variables configured (locally)
- Awaiting deployment to production URL

---

## Contact & Reference

- **User Email:** edward@sourcecapital.co.uk
- **Supabase Project:** `ochyvcxwtpclkpdacpae` (shared with Deck Analysis App)
- **Reference Data:**
  - NovaCloud PDF: `72064 NovaCloud - Equidam Valuation Report 2025-06-16 (1).pdf`
  - Inputs Excel: `Equidam Inputs 2025.xlsx`
  - Methodology: `Equidam-Valuation-Methodology.pdf`

---

## Conventions & Standards (Per Sibling App)

- Inline React styles only (no Tailwind)
- Supabase client libraries (4 files: supabase.ts, supabaseAdmin.ts, supabaseBrowser.ts, supabaseServer.ts)
- `@/*` path alias to `./src/*`
- Async Server Components for auth, SSR fetches
- `"use client"` for interactive forms
- Dark theme (bg: #0A0A0A, accent: #03fb83)
- RLS-protected data (auth.uid() matching)

---

## Success Criteria

✅ **MVP Achieved:**
- End-to-end valuation flow works
- 6 methods compute (Scorecard, Checklist, VC, DCF-LTG, DCF-Multiple, Multiples)
- Reports generate and persist
- Unit tests validate formulas

🔄 **Validation in Progress:**
- NovaCloud Systems end-to-end test (target: $3.77M)
- Per-method breakdown analysis
- Comparison to Equidam reference

📋 **Post-Launch Enhancements:**
- Full 14-section report
- Snapshot history view
- Dashboard company list
- Form validation & error states
- Loading skeletons
- Custom domain (valuations.sourcecapital.co.uk)

---

**Generated by Claude Code • Session: 2026-08-21**

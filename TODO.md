# TODO - Features to Implement from backup_old

This document lists all features that exist in `backup_old` but are missing in the current React implementation.

## 🔴 HIGH PRIORITY - Core Calculations

### 1. Distance/Travel Cost Calculations (Entfernungspauschale)
**Location:** Settings tab + Summary tab
- [x] Input field for distance (km) to workplace (already exists)
- [x] Checkbox: "Nur Fahrten zur Arbeit zählen (A-Markierung)" (already exists)
- [x] Checkbox: "Medical als Fahrt zählen (ME-Markierung)" (already exists)
- [x] Checkbox: "Bodendienst als Fahrt zählen (RE, EM, DP, DT, SI, TK, SB)" (already exists)
- [x] Checkbox: "Auslandstage als Arbeitstag zählen (FL-Markierung)" (already exists)
- [ ] Calculate commute trip count based on:
  - A flags (to work)
  - E flags (from work) 
  - ME days (medical = round trip)
  - Ground duty days (EM, RE, DP, DT, SI, TK, SB = round trip)
  - Training days (domestic flights without A/E flags = round trip)
- [ ] Apply German tax law formula:
  - €0.30/km for first 20km
  - €0.38/km for km 21+
- [ ] Display calculation result with breakdown
- [ ] Show tooltip with calculation steps

### 2. Reinigungskosten (Cleaning Costs) Calculation
**Location:** Settings tab + Summary tab
- [x] Input field for cost per work day (already exists)
- [ ] Calculate total work days (all flight days + FL days + ME days + ground duty days)
- [ ] Calculate total: workDays × ratePerDay
- [ ] Display breakdown showing:
  - Number of work days
  - Rate per day
  - Total cost
- [ ] Show in Endabrechnung section

### 3. Trinkgeld (Tips) Calculation
**Location:** Settings tab + Summary tab
- [x] Input field for tip per hotel night (already exists)
- [ ] Implement hotel night calculation logic:
  - Detect layovers (nights abroad)
  - Count nights between outbound and return flights
  - Handle multi-day trips
- [ ] Calculate total: hotelNights × tipRate
- [ ] Display breakdown showing:
  - Number of hotel nights
  - Rate per night
  - Total tips
- [ ] Show in Endabrechnung section

### 4. Verpflegungsmehraufwand (Meal Allowances) Calculation
**Location:** Summary tab
- [ ] Implement daily allowance calculation logic from backup_old/script.js:
  - Parse flight times and calculate away-from-home duration
  - Apply German tax rates:
    - > 8 hours: €14 (domestic) / country-specific rate (abroad)
    - 24 hours: €28 (domestic) / country-specific rate (abroad)
  - Handle overnight stays
  - Handle multi-day trips
- [ ] Aggregate allowances by:
  - Domestic > 8h
  - Domestic 24h
  - Foreign (by country)
- [ ] Display in monthly breakdown table
- [ ] Show detailed calculation in Endabrechnung

### 5. Monthly Breakdown Table
**Location:** Summary tab - "Details pro Monat" section
- [ ] Create comprehensive monthly table with columns:
  - Monat (Month)
  - Flugstunden (Flight Hours)
  - Arbeitstage (Work Days)
  - Fahrten (Trips)
  - Entfernungspauschale (Distance Deduction)
  - Verpflegungsmehraufwand (Meal Allowances)
  - Trinkgeld (Tips)
  - Reinigungskosten (Cleaning Costs)
- [ ] Add totals row at bottom
- [ ] Make values update when settings change

### 6. Endabrechnung (Final Tax Calculation) Section
**Location:** Summary tab - "Endabrechnung" section
- [ ] Create subsection: Reinigungskosten (Zeile 57)
  - Show work days count
  - Show rate per day
  - Show total
- [ ] Create subsection: Reisenebenkosten (Zeile 71)
  - Show hotel nights count
  - Show tip rate
  - Show total
- [ ] Create subsection: Fahrtkosten
  - Show total km driven
  - Show calculation formula
  - Show total cost
- [ ] Create subsection: Verpflegungsmehraufwendungen
  - Show domestic >8h allowances
  - Show domestic 24h allowances
  - Show foreign allowances by country
  - Show sum of all allowances
  - Show employer tax-free reimbursement (from Streckeneinsatzabrechnung)
  - Show deductible difference
- [ ] Create subsection: Endabrechnung Summe
  - Show Reinigungskosten
  - Show Trinkgeld
  - Show Fahrtkosten
  - Show Verpflegungsdifferenz
  - Show Gesamtsumme (grand total)

## 🟡 MEDIUM PRIORITY - Enhanced UI/UX

### 7. Arbeitstage Details Tab Enhancement
**Location:** Flights tab (rename to "Arbeitstage")
- [ ] Add country filter dropdown
  - Populate with all destination countries from flights
  - Filter flights by selected country
- [ ] Implement collapsible month sections:
  - Group flights by month
  - Show month header with stats (flight count, total hours)
  - Click to expand/collapse
  - Add "Expand All" / "Collapse All" button
- [ ] Add abroad days (FL status) rows to table:
  - Show FL days without flights
  - Display location/country
  - Show allowance rate
- [ ] Add medical days (ME status) rows:
  - Show ME days
  - Mark as medical examination
- [ ] Add ground duty days rows:
  - Show EM, RE, DP, DT, SI, TK, SB days
  - Display duty type
- [ ] Show allowance rate (Tagessatz) per day
- [ ] Show tip amount per night
- [ ] Color code different row types (flights, layovers, medical, ground duty)

### 8. Warning Banners
**Location:** Top of Upload/Dashboard tab
- [ ] Orphaned Continuation Flights Warning:
  - Detect continuation flights (/XX suffix) without matching departure
  - Show warning banner with list of orphaned flights
  - Suggest uploading previous month's PDF
  - Make dismissible
- [ ] Missing Documents Warning:
  - Detect gaps in uploaded month sequence
  - Warn about missing Flugstundenübersicht months
  - Warn about missing Streckeneinsatzabrechnung months
  - Warn about incomplete trips (return without outbound)
  - Show as warning cards in upload section

### 9. Enhanced Personal Info Display
**Location:** Info tab
- [ ] Already mostly complete, but add:
  - Display all calculated metrics
  - Show statistics summary

## 🟢 LOWER PRIORITY - Polish & Features

### 10. Export Functionality
**Location:** Export tab
- [ ] Implement CSV Export:
  - Export all flights with details
  - Include calculated allowances
  - Include monthly summaries
  - Format for Excel/Sheets
  - Trigger download
- [ ] Implement TXT Summary Export:
  - Generate formatted text summary
  - Include personal info
  - Include monthly breakdown
  - Include Endabrechnung
  - Trigger download
- [ ] Implement Print Function:
  - Create print-friendly CSS
  - Hide navigation/interactive elements
  - Show comprehensive report
  - Trigger browser print dialog

### 11. Country Grid/Statistics
**Location:** Dashboard or new tab
- [ ] Aggregate flights by destination country
- [ ] Show country cards with:
  - Country name
  - Country flag (using flagcdn.com)
  - Number of days
  - Total expenses
- [ ] Sort by most visited

### 12. Tooltip System
**Location:** Throughout app (Summary tab especially)
- [ ] Implement calculation tooltips:
  - Show on hover over calculated values
  - Display step-by-step calculation
  - Position intelligently (above/below/left/right based on space)
  - Style with dark background
- [ ] Helper function to wrap values with tooltip

### 13. Data Validation & Quality
- [ ] Check for duplicate file uploads
- [ ] Validate PDF document types
- [ ] Validate data completeness
- [ ] Show data quality indicators

## 📋 IMPLEMENTATION NOTES

### Files to Update/Create

1. **src/App.tsx**
   - Enhance Summary tab with monthly table and Endabrechnung
   - Update Flights tab with filtering and collapsible sections
   - Add warning banners

2. **src/context/AppContext.tsx**
   - Add calculation helper functions
   - Implement hotel night calculation
   - Implement daily allowance calculation
   - Implement work day counting
   - Implement trip counting

3. **src/utils/calculations.ts** (NEW FILE)
   - Consolidate all calculation logic
   - Distance/travel cost calculator
   - Reinigung cost calculator
   - Trinkgeld calculator
   - Verpflegungsmehraufwand calculator
   - Monthly aggregation functions
   - Endabrechnung calculator

4. **src/components/** (NEW FILES)
   - MonthlyBreakdownTable.tsx
   - EndabrechnungSection.tsx
   - WarningBanner.tsx
   - FlightTableEnhanced.tsx
   - CalculationTooltip.tsx
   - CountryFilter.tsx
   - ExportButtons.tsx

5. **src/types/index.ts**
   - Add types for hotel nights
   - Add types for daily allowances
   - Add types for calculations

6. **src/utils/pdfParser.ts**
   - Ensure all data from backup_old parsing is captured:
     - ME days
     - Ground duty days (EM, RE, DP, DT, SI, TK, SB)
     - FL days (abroad/layover days)
     - Continuation flight detection

7. **src/utils/export.ts** (NEW FILE)
   - csvExport function
   - txtSummaryExport function
   - printPrep function

### Design Considerations

- Use existing Tailwind styling for consistency
- Keep mobile-responsive
- Maintain current color scheme (blue/green/slate)
- Add loading states for calculations
- Add error boundaries for calculation errors
- Keep calculations reactive to settings changes

### Testing Checklist

- [ ] Upload Flugstundenübersicht and verify parsing
- [ ] Upload Streckeneinsatzabrechnung and verify parsing
- [ ] Test all calculation formulas against known values
- [ ] Test with multiple months of data
- [ ] Test with orphaned continuation flights
- [ ] Test with missing months
- [ ] Test settings changes update calculations
- [ ] Test export functions produce valid files
- [ ] Test on mobile devices
- [ ] Test print layout

## 🎯 RECOMMENDED IMPLEMENTATION ORDER

1. **Phase 1 - Core Calculations** (Days 1-3)
   - Create calculations.ts utility file
   - Implement distance/travel cost calculation
   - Implement reinigung calculation
   - Implement trinkgeld/hotel night calculation
   - Implement daily allowance calculation
   - Wire up settings to calculations

2. **Phase 2 - Summary Tab Enhancement** (Days 4-5)
   - Create MonthlyBreakdownTable component
   - Create EndabrechnungSection component
   - Integrate calculations into Summary tab
   - Add calculation tooltips

3. **Phase 3 - Flights Tab Enhancement** (Days 6-7)
   - Add country filter
   - Implement collapsible months
   - Add FL/ME/Ground duty day rows
   - Add allowance/tip columns

4. **Phase 4 - Warnings & Validation** (Day 8)
   - Implement orphaned flight detection
   - Create WarningBanner component
   - Add missing document warnings
   - Add data validation

5. **Phase 5 - Export & Polish** (Days 9-10)
   - Implement CSV export
   - Implement TXT export
   - Implement print function
   - Final testing and bug fixes
   - Add country grid if time permits

## 📝 REFERENCE

All implementation details can be found in:
- `backup_old/script.js` - Main calculation logic
- `backup_old/index.html` - UI structure and sections
- `backup_old/styles.css` - Styling reference
- `backup_old/allowances.js` - Country-specific meal allowances
- `backup_old/airports.js` - Airport country mapping

## ✅ COMPLETION CRITERIA

The new React app should:
1. Perform all calculations that backup_old performs
2. Display all sections that backup_old displays
3. Provide same or better UX than backup_old
4. Be mobile responsive (improvement over backup_old)
5. Have clean, maintainable React/TypeScript code
6. Have no console errors or warnings
7. Pass all manual testing scenarios

# Flugstunden Steuerrechner

A browser-based tax calculator for Lufthansa flight crew members. Parses flight hour documents and expense reports to calculate tax-free allowances according to German tax law.

> **Note**: This tool was vibe coded with AI assistance. Use at your own risk and always verify calculations with official tax documents.

## Features

### Core Calculations
- **PDF Parsing**: Automatically extracts data from Flugstundenübersicht and Streckeneinsatzabrechnung PDFs
- **Tax-Free Expense Calculation**: Extracts and calculates steuerfreie Spesen from Streckeneinsatzabrechnungen (Spesenanspruch - Steuer - Werbko = Steuerfrei)
- **Daily Allowance Calculation**: Calculates Verpflegungspauschale based on German tax regulations (2025 rates)
- **Distance Deduction**: Computes Entfernungspauschale for commuting expenses with configurable options
- **Work Day Detection**: Parses flight days, medical days (ME), ground duty days (RE, EM, DP, SI, TK), and training days
- **Cleaning Costs**: Calculates Reinigungskosten based on work days
- **Tips Calculation**: Calculates Trinkgeld based on hotel nights abroad
- **Final Tax Summary**: Consolidated Endabrechnung with all deductible expenses

### User Experience
- **Collapsible Month Sections**: Organize flight data by month with expand/collapse functionality
- **Interactive Calculation Tooltips**: Hover over any calculation to see the detailed breakdown
- **Smart Tooltip Positioning**: Tooltips automatically stay within viewport bounds
- **Accessible Navigation**: Full keyboard navigation and ARIA support
- **Empty State Messages**: Clear indicators when no data is available
- **Privacy-First**: All processing happens locally in the browser - no data is sent to any server
- **Export Options**: CSV export and TXT summary for tax filing

## Usage

1. Open `index.html` in a web browser
2. Upload your Flugstundenübersicht and/or Streckeneinsatzabrechnung PDFs in the **Dokumente** tab
3. Configure your personal settings in the **Info** tab:
   - Distance from home to work
   - One-way commute checkbox (if applicable)
   - Cleaning costs per day
   - Hotel tip amount per night
   - Additional work days (FL abroad, ground duty, etc.)
4. Review your data:
   - **Übersicht**: Monthly breakdown and final tax summary (Endabrechnung)
   - **Flugdetails**: All flights organized by month (click to expand/collapse)
   - **Spesen**: Tax-free expense summaries from Streckeneinsatzabrechnungen
5. Hover over any calculation to see detailed breakdowns
6. Export your data for tax filing using the **Export** tab

## Tax Calculations

### Steuerfreie Spesen (Tax-Free Expenses)
- Parsed directly from the Summe line of each Streckeneinsatzabrechnung
- Formula: **Steuerfrei = Spesenanspruch - Steuer - Werbungskosten**
- Results displayed per document with totals for Anlage N, Zeile 57

### Verpflegungspauschale (Daily Allowances)
- **Anreisetag/Abreisetag**: Partial daily rate for departure/return days
- **Full day abroad (24h)**: Full daily rate for complete days spent abroad
- Rates vary by country and are updated annually

### Entfernungspauschale (Distance Deduction)
- 0.30 EUR per km for the first 20 km
- 0.38 EUR per km beyond 20 km (since 2022)
- Configurable: count only A-flagged trips (one-way) or round trips
- Automatically calculates total trips based on flight days + optional ME/ground duty days

### Reinigungskosten (Cleaning Costs)
- Configurable rate per work day
- Calculated based on total work days (flight days + optional FL abroad + ME + ground duty)

### Trinkgeld (Hotel Tips)
- Configurable tip amount per night
- Automatically counts hotel nights based on multi-day tours and FL abroad days
- Displayed in Endabrechnung summary

## User Interface Features

### Navigation
- Tab-based interface with sections: Dokumente, Info, Übersicht, Flugdetails, Spesen, Export
- Full keyboard navigation support (Arrow keys, Enter, Space)
- ARIA labels for screen reader accessibility

### Flight Details (Flugdetails)
- Flights organized by collapsible month sections
- Click month headers to expand/collapse individual months
- "Alle ausklappen/einklappen" button to toggle all months
- Each month header shows: flight count and total hours
- Country filter applies across all months
- All months collapsed by default for clean, tidy view

### Interactive Tooltips
- Hover over any calculation to see step-by-step breakdown
- Shows formulas and intermediate values
- Smart positioning keeps tooltips within viewport
- Appears on: Entfernungspauschale, Reinigungskosten, Trinkgeld, Verpflegungsmehraufwand, Fahrtkosten, and totals

### Endabrechnung (Final Summary)
- Consolidated view of all tax-deductible expenses:
  - Reinigungskosten (Zeile 57)
  - Trinkgeld (Hotel)
  - Fahrtkosten (Entfernungspauschale)
  - Verpflegungsmehraufwand
  - Gesamtsumme (Total)
- All values include detailed hover tooltips with calculations

## Technical Details

- Pure client-side JavaScript
- Uses PDF.js (via CDN) for PDF text extraction
- No backend required
- Works offline after initial load
- All data processing happens in browser (privacy-first)

## Files

- `index.html` - Main application interface
- `script.js` - Core application logic and PDF parsing
- `styles.css` - Application styling with modern UI components
- `airports.js` - Airport codes to country mapping
- `allowances.js` - Daily allowance rates by country and year (2025)

## License

Private use only.

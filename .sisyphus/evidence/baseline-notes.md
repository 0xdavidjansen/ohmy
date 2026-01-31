# Baseline Documentation - Tax Calculator Pre-Redesign

## Date: 2026-01-30

## Key Output Fields to Verify Post-Redesign

From `tax/script.js` and `tax/index.html`, the following DOM IDs contain calculation results:

### Endabrechnung Section (Summary)
- `endReinigungTage` - Work days count for cleaning costs
- `endReinigungPauschale` - Daily cleaning rate
- `endReinigungGesamt` - Total cleaning costs

### Reisenebenkosten (Travel side costs)
- `endTrinkgeldLabel` - Hotel nights × rate description
- `endTrinkgeldGesamt` - Total tip amount

### Fahrtkosten (Travel costs)
- `endFahrtKilometer` - Total km driven
- `endFahrtBerechnung` - Calculation formula
- `endFahrtGesamt` - Total travel costs

### Verpflegungsmehraufwendungen (Meal allowances)
- `endVerpflegungDE8h` - Germany >8h partial rate total
- `endVerpflegungDE24h` - Germany 24h full rate total
- `endVerpflegungAusland` - Abroad allowances total
- `endVerpflegungSumme` - Sum of all meal allowances
- `endVerpflegungErstattet` - Tax-free reimbursed amount
- `endVerpflegungDifferenz` - Deductible difference

### Final Summary
- `endSummeReinigung` - Cleaning costs sum
- `endSummeTrinkgeld` - Tips sum
- `endSummeFahrtkosten` - Travel costs sum
- `endSummeVerpflegung` - Meal allowance difference
- `endSummeGesamt` - **GRAND TOTAL** (most important)

## Current Verpflegung Logic (from Task 0.1)

The current implementation in `calculateDailyAllowances()` (script.js:2205-2512) does NOT compute actual hours for the >8h threshold. Instead:

1. **Departure day (Anreisetag)**: Always gets partial rate `An/Ab`
2. **Return day (Abreisetag)**: Always gets partial rate `An/Ab`  
3. **Other abroad days**: Always gets full 24h rate

### Fahrzeit Integration Point
- **File**: `tax/script.js`
- **Function**: `calculateDailyAllowances()`
- **Lines**: 2479-2491 (rate decision logic)
- **Required**: Add actual hours calculation using flight departure/arrival times + Fahrzeit minutes

## Regression Test Criteria

When Fahrzeit = 0:
- All values should match pre-redesign exactly

When Fahrzeit > 0:
- Only Verpflegung-related values may change
- Other values (Fahrtkosten, Reinigung, etc.) should remain unchanged

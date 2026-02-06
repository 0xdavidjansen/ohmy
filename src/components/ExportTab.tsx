import { useApp } from '../hooks';
import { Download, FileText, Printer, Table } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

export function ExportTab() {
  const { state, monthlyBreakdown, taxCalculation, totalFlightHours, totalWorkDays } = useApp();
  const { personalInfo, flights, settings } = state;

  // Generate CSV content
  const generateCSV = () => {
    const rows: string[][] = [];
    
    // Header
    rows.push([
      'Monat',
      'Jahr',
      'Flugstunden',
      'Arbeitstage',
      'Fahrten',
      'Entfernungspauschale (EUR)',
      'Verpflegung (EUR)',
      'Trinkgeld (EUR)',
      'Reinigung (EUR)',
    ]);
    
    // Data rows
    for (const month of monthlyBreakdown) {
      rows.push([
        month.monthName,
        month.year.toString(),
        month.flightHours.toFixed(2),
        month.workDays.toString(),
        month.trips.toString(),
        month.distanceDeduction.toFixed(2),
        month.mealAllowance.toFixed(2),
        month.tips.toFixed(2),
        month.cleaningCosts.toFixed(2),
      ]);
    }
    
    // Totals
    rows.push([
      'GESAMT',
      '',
      totalFlightHours.toFixed(2),
      totalWorkDays.toString(),
      taxCalculation.travelCosts.trips.toString(),
      taxCalculation.travelCosts.total.toFixed(2),
      taxCalculation.mealAllowances.totalAllowances.toFixed(2),
      taxCalculation.travelExpenses.total.toFixed(2),
      taxCalculation.cleaningCosts.total.toFixed(2),
    ]);
    
    // Convert to CSV string
    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(';')).join('\n');
    
    // Add BOM for Excel UTF-8 compatibility
    return '\ufeff' + csv;
  };

  // Generate TXT summary
  const generateTXT = () => {
    const lines: string[] = [];
    const sep = '='.repeat(60);
    const sep2 = '-'.repeat(60);
    
    lines.push(sep);
    lines.push('FLUGPERSONAL STEUERRECHNER - ZUSAMMENFASSUNG');
    lines.push(sep);
    lines.push('');
    
    // Personal Info
    if (personalInfo) {
      lines.push('PERSÖNLICHE DATEN');
      lines.push(sep2);
      if (personalInfo.name) lines.push(`Name: ${personalInfo.name}`);
      if (personalInfo.personnelNumber) lines.push(`Personalnummer: ${personalInfo.personnelNumber}`);
      if (personalInfo.costCenter) lines.push(`Kostenstelle: ${personalInfo.costCenter}`);
      lines.push('');
    }
    
    // Settings
    lines.push('EINSTELLUNGEN');
    lines.push(sep2);
    lines.push(`Entfernung zum Arbeitsplatz: ${settings.distanceToWork} km`);
    lines.push(`Reinigungskosten pro Tag: ${formatCurrency(settings.cleaningCostPerDay)}`);
    lines.push(`Trinkgeld pro Nacht: ${formatCurrency(settings.tipPerNight)}`);
    lines.push('');
    
    // Monthly breakdown
    lines.push('MONATLICHE AUFSTELLUNG');
    lines.push(sep2);
    lines.push(
      'Monat'.padEnd(15) +
      'Stunden'.padStart(10) +
      'Tage'.padStart(8) +
      'Fahrten'.padStart(10) +
      'Entfernung'.padStart(12) +
      'Verpflegung'.padStart(12)
    );
    lines.push('-'.repeat(67));
    
    for (const month of monthlyBreakdown) {
      lines.push(
        `${month.monthName} ${month.year}`.padEnd(15) +
        `${month.flightHours.toFixed(1)}h`.padStart(10) +
        month.workDays.toString().padStart(8) +
        month.trips.toString().padStart(10) +
        formatCurrency(month.distanceDeduction).padStart(12) +
        formatCurrency(month.mealAllowance).padStart(12)
      );
    }
    lines.push('-'.repeat(67));
    lines.push(
      'GESAMT'.padEnd(15) +
      `${totalFlightHours.toFixed(1)}h`.padStart(10) +
      totalWorkDays.toString().padStart(8) +
      taxCalculation.travelCosts.trips.toString().padStart(10) +
      formatCurrency(taxCalculation.travelCosts.total).padStart(12) +
      formatCurrency(taxCalculation.mealAllowances.totalAllowances).padStart(12)
    );
    lines.push('');
    
    // Endabrechnung
    lines.push('ENDABRECHNUNG');
    lines.push(sep2);
    lines.push('');
    
    lines.push('Reinigungskosten (Zeile 57):');
    lines.push(`  ${taxCalculation.cleaningCosts.workDays} Arbeitstage × ${formatCurrency(settings.cleaningCostPerDay)} = ${formatCurrency(taxCalculation.cleaningCosts.total)}`);
    lines.push('');
    
    lines.push('Reisenebenkosten / Trinkgeld (Zeile 71):');
    lines.push(`  ${taxCalculation.travelExpenses.hotelNights} Hotelnächte × ${formatCurrency(settings.tipPerNight)} = ${formatCurrency(taxCalculation.travelExpenses.total)}`);
    lines.push('');
    
    lines.push('Fahrtkosten / Entfernungspauschale:');
    lines.push(`  ${taxCalculation.travelCosts.trips} Fahrten × ${settings.distanceToWork} km = ${taxCalculation.travelCosts.totalKm} km`);
    lines.push(`  Erste 20 km × ${formatCurrency(taxCalculation.travelCosts.rateFirst20km)} = ${formatCurrency(taxCalculation.travelCosts.deductionFirst20km)}`);
    if (taxCalculation.travelCosts.deductionAbove20km > 0) {
      lines.push(`  Ab km 21 × ${formatCurrency(taxCalculation.travelCosts.rateAbove20km)} = ${formatCurrency(taxCalculation.travelCosts.deductionAbove20km)}`);
    }
    lines.push(`  Summe: ${formatCurrency(taxCalculation.travelCosts.total)}`);
    lines.push('');
    
    lines.push('Verpflegungsmehraufwendungen:');
    if (taxCalculation.mealAllowances.domestic8h.days > 0) {
      lines.push(`  Inland > 8h: ${taxCalculation.mealAllowances.domestic8h.days} Tage = ${formatCurrency(taxCalculation.mealAllowances.domestic8h.total)}`);
    }
    if (taxCalculation.mealAllowances.domestic24h.days > 0) {
      lines.push(`  Inland 24h: ${taxCalculation.mealAllowances.domestic24h.days} Tage = ${formatCurrency(taxCalculation.mealAllowances.domestic24h.total)}`);
    }
    for (const f of taxCalculation.mealAllowances.foreign) {
      lines.push(`  ${f.country}: ${f.days} Tage = ${formatCurrency(f.total)}`);
    }
    lines.push(`  Summe Verpflegung: ${formatCurrency(taxCalculation.mealAllowances.totalAllowances)}`);
    lines.push(`  - Arbeitgeber-Erstattung: ${formatCurrency(taxCalculation.mealAllowances.employerReimbursement)}`);
    lines.push(`  = Abzugsfähige Differenz: ${formatCurrency(taxCalculation.mealAllowances.deductibleDifference)}`);
    lines.push('');
    
    lines.push(sep);
    lines.push('GESAMTSUMME WERBUNGSKOSTEN');
    lines.push(sep);
    lines.push(`  Reinigungskosten:      ${formatCurrency(taxCalculation.cleaningCosts.total).padStart(12)}`);
    lines.push(`  Trinkgeld:             ${formatCurrency(taxCalculation.travelExpenses.total).padStart(12)}`);
    lines.push(`  Fahrtkosten:           ${formatCurrency(taxCalculation.travelCosts.total).padStart(12)}`);
    lines.push(`  Verpflegung:           ${formatCurrency(taxCalculation.mealAllowances.deductibleDifference).padStart(12)}`);
    lines.push(`  ${'─'.repeat(28)}`);
    lines.push(`  GESAMT:                ${formatCurrency(taxCalculation.grandTotal).padStart(12)}`);
    lines.push('');
    lines.push(sep);
    lines.push('Erstellt mit Flugpersonal Steuerrechner');
    lines.push(`Datum: ${new Date().toLocaleDateString('de-DE')}`);
    
    return lines.join('\n');
  };

  // Download file
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle exports
  const handleCSVExport = () => {
    const csv = generateCSV();
    const year = monthlyBreakdown[0]?.year || new Date().getFullYear();
    downloadFile(csv, `flugpersonal-steuer-${year}.csv`, 'text/csv;charset=utf-8');
  };

  const handleTXTExport = () => {
    const txt = generateTXT();
    const year = monthlyBreakdown[0]?.year || new Date().getFullYear();
    downloadFile(txt, `flugpersonal-steuer-${year}.txt`, 'text/plain;charset=utf-8');
  };

  const handlePrint = () => {
    window.print();
  };

  const hasData = flights.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Export
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          Exportieren Sie Ihre Daten für die Steuererklärung oder zur Archivierung.
        </p>
      </div>

      {!hasData ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <Download className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">
            Keine Daten zum Exportieren
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Laden Sie zuerst Ihre Flugdokumente hoch.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* CSV Export */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Table className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">
                  CSV Export
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Für Excel / Google Sheets
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 flex-1">
              Exportiert alle Monatsdaten als CSV-Datei, die Sie in
              Tabellenkalkulationsprogrammen öffnen können.
            </p>
            <button
              onClick={handleCSVExport}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV herunterladen
            </button>
          </div>

          {/* TXT Export */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">
                  Text-Zusammenfassung
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Formatierter Bericht
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 flex-1">
              Generiert eine formatierte Textdatei mit allen Berechnungen
              und der Endabrechnung.
            </p>
            <button
              onClick={handleTXTExport}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              TXT herunterladen
            </button>
          </div>

          {/* Print */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Printer className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">
                  Drucken
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Aktuelle Ansicht drucken
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 flex-1">
              Öffnet den Druckdialog für die aktuelle Ansicht. Wechseln Sie
              zur Übersicht für einen vollständigen Bericht.
            </p>
            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              Drucken
            </button>
          </div>
        </div>
      )}

      {/* Quick Summary for Export */}
      {hasData && (
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 print:bg-white">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">
            Exportvorschau - Gesamtsummen
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Flugstunden</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">
                {totalFlightHours.toFixed(1)}h
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Arbeitstage</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">
                {totalWorkDays}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Fahrten</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">
                {taxCalculation.travelCosts.trips}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Hotelnächte</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">
                {taxCalculation.travelExpenses.hotelNights}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Gesamtsumme</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(taxCalculation.grandTotal)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

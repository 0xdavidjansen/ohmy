import { useCallback } from 'react';
import { useApp } from '../hooks';
import { Car, Sparkles, Coffee, Info } from 'lucide-react';

export function SettingsTab() {
  const { state, updateSettings } = useApp();
  const { settings } = state;

  // Memoized handlers to prevent unnecessary re-renders
  const handleDistanceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateSettings({ distanceToWork: parseFloat(e.target.value) || 0 });
    },
    [updateSettings]
  );

  const handleCountOnlyAFlagChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateSettings({ countOnlyAFlag: e.target.checked });
    },
    [updateSettings]
  );

  const handleCountMedicalAsTripChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateSettings({ countMedicalAsTrip: e.target.checked });
    },
    [updateSettings]
  );

  const handleCountGroundDutyAsTripChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateSettings({ countGroundDutyAsTrip: e.target.checked });
    },
    [updateSettings]
  );

  const handleCountForeignAsWorkDayChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateSettings({ countForeignAsWorkDay: e.target.checked });
    },
    [updateSettings]
  );

  const handleCleaningCostChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateSettings({ cleaningCostPerDay: parseFloat(e.target.value) || 0 });
    },
    [updateSettings]
  );

  const handleTipChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateSettings({ tipPerNight: parseFloat(e.target.value) || 0 });
    },
    [updateSettings]
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Einstellungen
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          Passen Sie die Berechnungsparameter an Ihre persönliche Situation an.
        </p>
      </div>

      {/* Distance Settings */}
      <section className="border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Car className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white">
              Entfernungspauschale
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Fahrten zwischen Wohnung und erster Tätigkeitsstätte
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Distance Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Einfache Entfernung zum Arbeitsplatz (km)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="1"
                value={settings.distanceToWork}
                onChange={handleDistanceChange}
                className="w-32 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              />
              <span className="text-slate-500 dark:text-slate-400">km</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              €0,30/km für die ersten 20 km, €0,38/km ab km 21
            </p>
          </div>

          {/* Trip Counting Options */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Welche Tage als Fahrten zählen:
            </p>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.countOnlyAFlag}
                onChange={handleCountOnlyAFlagChange}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-slate-700 dark:text-slate-200">
                  Nur A-Markierung zählen
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nur Tage mit "zur Arbeit" Kennzeichnung als Fahrten zählen
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.countMedicalAsTrip}
                onChange={handleCountMedicalAsTripChange}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-slate-700 dark:text-slate-200">
                  Medical als Fahrt zählen (ME)
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Medizinische Untersuchungen = Hin- und Rückfahrt
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.countGroundDutyAsTrip}
                onChange={handleCountGroundDutyAsTripChange}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-slate-700 dark:text-slate-200">
                  Bodendienst als Fahrt zählen
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  EM, RE, DP, DT, SI, TK, SB = Hin- und Rückfahrt
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.countForeignAsWorkDay}
                onChange={handleCountForeignAsWorkDayChange}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-slate-700 dark:text-slate-200">
                  Auslandstage als Arbeitstag zählen (FL)
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Layover-Tage im Ausland als Arbeitstage werten
                </p>
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* Cleaning Costs */}
      <section className="border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Sparkles className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white">
              Reinigungskosten
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Kosten für Reinigung der Berufskleidung
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Kosten pro Arbeitstag
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.10"
              value={settings.cleaningCostPerDay}
              onChange={handleCleaningCostChange}
              className="w-32 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            />
            <span className="text-slate-500 dark:text-slate-400">€ / Tag</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Übliche Pauschale: €1,00 - €2,00 pro Arbeitstag
          </p>
        </div>
      </section>

      {/* Tips */}
      <section className="border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <Coffee className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white">
              Trinkgeld (Reisenebenkosten)
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Trinkgeld für Hotelpersonal bei Übernachtungen
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Trinkgeld pro Übernachtung
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.50"
              value={settings.tipPerNight}
              onChange={handleTipChange}
              className="w-32 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            />
            <span className="text-slate-500 dark:text-slate-400">€ / Nacht</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Übliche Pauschale: €1,00 - €2,00 pro Übernachtung
          </p>
        </div>
      </section>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
              Hinweis zur Steuererklärung
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Die berechneten Werte dienen als Orientierung. Die endgültigen
              Beträge sollten Sie mit Ihrem Steuerberater abstimmen. Die
              Pauschalen können je nach Finanzamt variieren.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { useApp } from '../hooks';
import { User, Calendar, Hash, Building, Plane } from 'lucide-react';
import { formatHours } from '../utils/calculations';

export function InfoTab() {
  const { state, taxCalculation, totalFlightHours, totalWorkDays } = useApp();
  const { personalInfo, flights } = state;

  // Calculate some statistics - memoized to avoid recalculation on every render
  const totalTrips = taxCalculation.travelCosts.trips;
  const totalHotelNights = taxCalculation.travelExpenses.hotelNights;
  
  const uniqueCountries = useMemo(
    () => new Set(flights.map((f) => f.country).filter((c) => c && c !== 'XX')).size,
    [flights]
  );

  // Get year range - memoized
  const yearRange = useMemo(() => {
    const years = [...new Set(flights.map((f) => f.year))].sort();
    if (years.length === 0) return 'N/A';
    if (years.length === 1) return years[0].toString();
    return `${years[0]} - ${years[years.length - 1]}`;
  }, [flights]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Persönliche Informationen
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          Übersicht Ihrer Daten und Statistiken
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Personal Info Card */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Persönliche Daten
            </h3>
            
            {personalInfo ? (
              <div className="space-y-4">
                {personalInfo.name && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Name</p>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {personalInfo.name}
                      </p>
                    </div>
                  </div>
                )}
                {personalInfo.personnelNumber && (
                  <div className="flex items-center gap-3">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Personalnummer</p>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {personalInfo.personnelNumber}
                      </p>
                    </div>
                  </div>
                )}
                {personalInfo.pkNumber && (
                  <div className="flex items-center gap-3">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">PK-Nummer</p>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {personalInfo.pkNumber}
                      </p>
                    </div>
                  </div>
                )}
                {personalInfo.company && (
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Gesellschaft</p>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {personalInfo.company}
                      </p>
                    </div>
                  </div>
                )}
                {personalInfo.dutyStation && (
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Dienststelle</p>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {personalInfo.dutyStation}
                      </p>
                    </div>
                  </div>
                )}
                {personalInfo.role && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Funktion</p>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {personalInfo.role}
                      </p>
                    </div>
                  </div>
                )}
                {personalInfo.aircraftType && (
                  <div className="flex items-center gap-3">
                    <Plane className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Muster</p>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {personalInfo.aircraftType}
                      </p>
                    </div>
                  </div>
                )}
                {personalInfo.costCenter && (
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Kostenstelle</p>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {personalInfo.costCenter}
                      </p>
                    </div>
                  </div>
                )}
                {personalInfo.documentDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Erstellt am</p>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {personalInfo.documentDate}
                      </p>
                    </div>
                  </div>
                )}
                {personalInfo.sheetNumber && (
                  <div className="flex items-center gap-3">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Blatt</p>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {personalInfo.sheetNumber}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Zeitraum</p>
                    <p className="font-medium text-slate-800 dark:text-white">{yearRange}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 italic">
                Keine persönlichen Daten verfügbar. Laden Sie eine Flugstundenübersicht hoch.
              </p>
            )}
          </div>

        {/* Statistics Card */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Plane className="w-5 h-5 text-green-600" />
            Statistiken
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-xs text-blue-600 dark:text-blue-400">Flüge</p>
              <p className="text-xl font-bold text-blue-800 dark:text-blue-200">
                {flights.length}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <p className="text-xs text-green-600 dark:text-green-400">Flugstunden</p>
              <p className="text-xl font-bold text-green-800 dark:text-green-200">
                {formatHours(totalFlightHours)}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <p className="text-xs text-purple-600 dark:text-purple-400">Arbeitstage</p>
              <p className="text-xl font-bold text-purple-800 dark:text-purple-200">
                {totalWorkDays}
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
              <p className="text-xs text-amber-600 dark:text-amber-400">Fahrten</p>
              <p className="text-xl font-bold text-amber-800 dark:text-amber-200">
                {totalTrips}
              </p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-3">
              <p className="text-xs text-rose-600 dark:text-rose-400">Hotelnächte</p>
              <p className="text-xl font-bold text-rose-800 dark:text-rose-200">
                {totalHotelNights}
              </p>
            </div>
            <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-3">
              <p className="text-xs text-cyan-600 dark:text-cyan-400">Länder</p>
              <p className="text-xl font-bold text-cyan-800 dark:text-cyan-200">
                {uniqueCountries}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

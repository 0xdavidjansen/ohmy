import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../hooks';
import { ChevronDown, ChevronRight, Filter, Plane, Calendar, Clock } from 'lucide-react';
import { MONTH_NAMES } from '../constants';
import { getCountryName } from '../utils/airports';
import { VirtualFlightTable } from './VirtualFlightTable';

interface MonthGroup {
  key: string;
  month: number;
  year: number;
  monthName: string;
  flightCount: number;
  totalHours: number;
}

export function FlightsTab() {
  const { state, monthlyBreakdown } = useApp();
  const { flights, nonFlightDays } = state;
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [countryFilter, setCountryFilter] = useState<string>('all');

  // Get unique countries
  const countries = useMemo(() => {
    const countrySet = new Set<string>();
    flights.forEach((f) => {
      if (f.country && f.country !== 'XX') {
        countrySet.add(f.country);
      }
    });
    return Array.from(countrySet).sort();
  }, [flights]);

  // Group flights by month
  const monthGroups = useMemo(() => {
    const groups: MonthGroup[] = [];
    const groupMap: Record<string, MonthGroup> = {};

    for (const flight of flights) {
      const key = `${flight.year}-${String(flight.month).padStart(2, '0')}`;
      if (!groupMap[key]) {
        groupMap[key] = {
          key,
          month: flight.month,
          year: flight.year,
          monthName: MONTH_NAMES[flight.month - 1],
          flightCount: 0,
          totalHours: 0,
        };
        groups.push(groupMap[key]);
      }
      groupMap[key].flightCount++;
      const [h, m] = (flight.blockTime || '0:00').split(':').map(Number);
      groupMap[key].totalHours += h + m / 60;
    }

    return groups.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }, [flights]);

  // Filter flights
  const filteredFlights = useMemo(() => {
    if (countryFilter === 'all') return flights;
    return flights.filter((f) => f.country === countryFilter);
  }, [flights, countryFilter]);

  // Toggle month expansion
  const toggleMonth = useCallback((key: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Expand/collapse all
  const expandAll = useCallback(() => {
    setExpandedMonths(new Set(monthGroups.map((g) => g.key)));
  }, [monthGroups]);

  const collapseAll = useCallback(() => {
    setExpandedMonths(new Set());
  }, []);

  const allExpanded = monthGroups.length > 0 && expandedMonths.size === monthGroups.length;

  // Memoized summary statistics to avoid recalculating on every render
  const summaryStats = useMemo(() => ({
    totalFlightHours: monthlyBreakdown.reduce((sum, m) => sum + m.flightHours, 0),
    totalWorkDays: monthlyBreakdown.reduce((sum, m) => sum + m.workDays, 0),
    totalTrips: monthlyBreakdown.reduce((sum, m) => sum + m.trips, 0),
  }), [monthlyBreakdown]);

  if (flights.length === 0 && nonFlightDays.length === 0) {
    return (
      <div className="text-center py-12">
        <Plane className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">
          Keine Flugdaten vorhanden
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Laden Sie zuerst eine Flugstundenübersicht hoch.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Arbeitstage
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            {flights.length} Flüge in {monthGroups.length} Monaten
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Country Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
            >
              <option value="all">Alle Länder</option>
              {countries.map((code) => (
                <option key={code} value={code}>
                  {getCountryName(code)}
                </option>
              ))}
            </select>
          </div>

          {/* Expand/Collapse */}
          <button
            onClick={allExpanded ? collapseAll : expandAll}
            className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
          >
            {allExpanded ? 'Alle schließen' : 'Alle öffnen'}
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400">Gesamtflüge</p>
          <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
            {filteredFlights.length}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
          <p className="text-sm text-green-600 dark:text-green-400">Flugstunden</p>
          <p className="text-2xl font-bold text-green-800 dark:text-green-200">
            {summaryStats.totalFlightHours.toFixed(1)}h
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
          <p className="text-sm text-purple-600 dark:text-purple-400">Arbeitstage</p>
          <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
            {summaryStats.totalWorkDays}
          </p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
          <p className="text-sm text-amber-600 dark:text-amber-400">Fahrten</p>
          <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">
            {summaryStats.totalTrips}
          </p>
        </div>
      </div>

      {/* Monthly Accordion */}
      <div className="space-y-2">
        {monthGroups.map((group) => {
          const isExpanded = expandedMonths.has(group.key);
          const monthFlights = filteredFlights.filter(
            (f) => f.month === group.month && f.year === group.year
          );
          const monthNonFlightDays = nonFlightDays.filter(
            (d) => d.month === group.month && d.year === group.year
          );

          if (countryFilter !== 'all' && monthFlights.length === 0) {
            return null;
          }

          return (
            <div
              key={group.key}
              className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
            >
              {/* Month Header */}
              <button
                onClick={() => toggleMonth(group.key)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  )}
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-slate-800 dark:text-white">
                    {group.monthName} {group.year}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <Plane className="w-4 h-4" />
                    {monthFlights.length}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {group.totalHours.toFixed(1)}h
                  </span>
                </div>
              </button>

              {/* Month Content */}
              {isExpanded && (
                <div className="p-4">
                  <VirtualFlightTable
                    flights={monthFlights}
                    nonFlightDays={monthNonFlightDays}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

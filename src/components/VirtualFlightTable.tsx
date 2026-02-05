import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Flight, NonFlightDay } from '../types';
import { DUTY_CODES } from '../constants';
import { getCountryName } from '../utils/airports';
import { formatCurrency } from '../utils/calculations';
import { getCountryAllowance, DOMESTIC_RATES } from '../utils/allowances';

interface VirtualFlightTableProps {
  flights: Flight[];
  nonFlightDays: NonFlightDay[];
}

// Combined row type for virtualization
type TableRow =
  | { type: 'flight'; data: Flight }
  | { type: 'nonFlightDay'; data: NonFlightDay };

export function VirtualFlightTable({ flights, nonFlightDays }: VirtualFlightTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Combine flights and non-flight days into rows, memoized to prevent recreation
  const rows = useMemo(() => {
    const combined: TableRow[] = [
      ...flights.map((f) => ({ type: 'flight' as const, data: f })),
      ...nonFlightDays.map((d) => ({ type: 'nonFlightDay' as const, data: d })),
    ];
    // Sort by date
    combined.sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
    return combined;
  }, [flights, nonFlightDays]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44, // Estimated row height in pixels
    overscan: 10, // Number of items to render outside viewport
  });

  // Don't virtualize if few rows (overhead not worth it)
  if (rows.length < 50) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <TableHeader />
          <tbody>
            {rows.map((row) =>
              row.type === 'flight' ? (
                <FlightRow key={row.data.id} flight={row.data} />
              ) : (
                <NonFlightDayRow key={row.data.id} day={row.data} />
              )
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <TableHeader />
      </table>
      <div
        ref={parentRef}
        className="max-h-[600px] overflow-auto"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          <table className="w-full text-sm">
            <tbody>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <tr
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {row.type === 'flight' ? (
                      <FlightRowContent flight={row.data} />
                    ) : (
                      <NonFlightDayRowContent day={row.data} />
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TableHeader() {
  return (
    <thead>
      <tr className="border-b border-slate-200 dark:border-slate-700">
        <th className="text-left py-2 px-2 font-medium text-slate-600 dark:text-slate-300">
          Datum
        </th>
        <th className="text-left py-2 px-2 font-medium text-slate-600 dark:text-slate-300">
          Flug/Status
        </th>
        <th className="text-left py-2 px-2 font-medium text-slate-600 dark:text-slate-300">
          Route
        </th>
        <th className="text-left py-2 px-2 font-medium text-slate-600 dark:text-slate-300">
          Zeit
        </th>
        <th className="text-left py-2 px-2 font-medium text-slate-600 dark:text-slate-300">
          Block
        </th>
        <th className="text-left py-2 px-2 font-medium text-slate-600 dark:text-slate-300">
          Land
        </th>
        <th className="text-right py-2 px-2 font-medium text-slate-600 dark:text-slate-300">
          Tagessatz
        </th>
      </tr>
    </thead>
  );
}

function FlightRow({ flight }: { flight: Flight }) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
      <FlightRowContent flight={flight} />
    </tr>
  );
}

function FlightRowContent({ flight }: { flight: Flight }) {
  const countryCode = flight.country;
  const allowance =
    countryCode === 'DE'
      ? { rate8h: DOMESTIC_RATES.RATE_8H, rate24h: DOMESTIC_RATES.RATE_24H }
      : getCountryAllowance(countryCode);

  return (
    <>
      <td className="py-2 px-2">
        {flight.date.toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
        })}
      </td>
      <td className="py-2 px-2">
        <div className="flex items-center gap-2">
          <span className="font-mono">{flight.flightNumber}</span>
          {flight.dutyCode && (
            <span
              className={`px-1.5 py-0.5 text-xs rounded ${
                flight.dutyCode === 'A'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : flight.dutyCode === 'E'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300'
              }`}
              title={
                DUTY_CODES[flight.dutyCode as keyof typeof DUTY_CODES] ||
                flight.dutyCode
              }
            >
              {flight.dutyCode}
            </span>
          )}
        </div>
      </td>
      <td className="py-2 px-2 font-mono">
        {flight.departure} → {flight.arrival}
      </td>
      <td className="py-2 px-2">
        {flight.departureTime} - {flight.arrivalTime}
      </td>
      <td className="py-2 px-2 font-mono">{flight.blockTime}</td>
      <td className="py-2 px-2">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
            countryCode === 'DE'
              ? 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          }`}
        >
          {getCountryName(countryCode)}
        </span>
      </td>
      <td className="py-2 px-2 text-right text-slate-600 dark:text-slate-400">
        {formatCurrency(allowance.rate24h)}
      </td>
    </>
  );
}

function NonFlightDayRow({ day }: { day: NonFlightDay }) {
  return (
    <tr
      className={`border-b border-slate-100 dark:border-slate-700/50 ${
        day.type === 'ME'
          ? 'bg-purple-50/50 dark:bg-purple-900/10'
          : day.type === 'FL'
          ? 'bg-amber-50/50 dark:bg-amber-900/10'
          : 'bg-green-50/50 dark:bg-green-900/10'
      }`}
    >
      <NonFlightDayRowContent day={day} />
    </tr>
  );
}

function NonFlightDayRowContent({ day }: { day: NonFlightDay }) {
  return (
    <>
      <td className="py-2 px-2">
        {day.date.toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
        })}
      </td>
      <td className="py-2 px-2">
        <span
          className={`px-1.5 py-0.5 text-xs rounded font-medium ${
            day.type === 'ME'
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
              : day.type === 'FL'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          }`}
        >
          {day.type}
        </span>
      </td>
      <td
        className="py-2 px-2 text-slate-600 dark:text-slate-400"
        colSpan={3}
      >
        {day.description}
      </td>
      <td className="py-2 px-2">
        {day.country && (
          <span className="text-xs text-slate-500">{getCountryName(day.country)}</span>
        )}
      </td>
      <td className="py-2 px-2 text-right text-slate-600 dark:text-slate-400">
        {day.country
          ? formatCurrency(getCountryAllowance(day.country).rate24h)
          : formatCurrency(DOMESTIC_RATES.RATE_24H)}
      </td>
    </>
  );
}

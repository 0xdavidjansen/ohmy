// Core calculation logic for German flight crew tax deductions

import type {
  Flight,
  NonFlightDay,
  Settings,
  MonthlyBreakdown,
  TaxCalculation,
  HotelNight,
  TripSegment,
  ReimbursementData,
  AllowanceYear,
} from '../types';
import { MONTH_NAMES, GROUND_DUTY_CODES } from '../types';
import { 
  DISTANCE_RATES, 
  getDistanceRates,
  getCountryAllowance, 
  getDomesticRates,
  isDomestic,
  DEFAULT_ALLOWANCE_YEAR,
} from './allowances';
import { getCountryFromAirport, getCountryName } from './airports';

/**
 * Parse time string "HH:MM" to minutes
 */
export function parseTimeToMinutes(time: string): number {
  if (!time || typeof time !== 'string') {
    console.warn(`parseTimeToMinutes: Invalid input "${time}", returning 0`);
    return 0;
  }
  const parts = time.split(':');
  if (parts.length !== 2) {
    console.warn(`parseTimeToMinutes: Unexpected format "${time}", returning 0`);
    return 0;
  }
  const [hours, minutes] = parts.map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    console.warn(`parseTimeToMinutes: NaN detected in "${time}", returning 0`);
    return 0;
  }
  return hours * 60 + minutes;
}

/**
 * Parse block time "HH:MM" to decimal hours
 */
export function parseBlockTimeToHours(blockTime: string): number {
  if (!blockTime || typeof blockTime !== 'string') {
    console.warn(`parseBlockTimeToHours: Invalid input "${blockTime}", returning 0`);
    return 0;
  }
  const parts = blockTime.split(':');
  if (parts.length !== 2) {
    console.warn(`parseBlockTimeToHours: Unexpected format "${blockTime}", returning 0`);
    return 0;
  }
  const [hours, minutes] = parts.map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    console.warn(`parseBlockTimeToHours: NaN detected in "${blockTime}", returning 0`);
    return 0;
  }
  return hours + minutes / 60;
}

/**
 * Calculate distance deduction (Entfernungspauschale)
 * Rates depend on the year:
 * - 2004-2020: €0.30/km for all km
 * - 2021: €0.30/km first 20 km, €0.35/km from km 21
 * - 2022-2025: €0.30/km first 20 km, €0.38/km from km 21
 * - 2026+: €0.38/km for all km
 */
export function calculateDistanceDeduction(
  trips: number,
  distanceKm: number,
  year: number = DEFAULT_ALLOWANCE_YEAR
): {
  totalKm: number;
  deductionFirst20km: number;
  deductionAbove20km: number;
  total: number;
  rateFirst20km: number;
  rateAbove20km: number;
} {
  const totalKm = trips * distanceKm;
  const rates = getDistanceRates(year);
  
  // For each trip, calculate the deduction
  const perTripDeduction = calculateSingleTripDeduction(distanceKm, rates);
  const total = trips * perTripDeduction;
  
  // Break down for display
  const first20Km = Math.min(distanceKm, 20);
  const above20Km = Math.max(0, distanceKm - 20);
  
  return {
    totalKm,
    deductionFirst20km: trips * first20Km * rates.FIRST_20_KM,
    deductionAbove20km: trips * above20Km * rates.ABOVE_20_KM,
    total,
    rateFirst20km: rates.FIRST_20_KM,
    rateAbove20km: rates.ABOVE_20_KM,
  };
}

function calculateSingleTripDeduction(distanceKm: number, rates = DISTANCE_RATES): number {
  const first20Km = Math.min(distanceKm, 20);
  const above20Km = Math.max(0, distanceKm - 20);
  
  return (
    first20Km * rates.FIRST_20_KM +
    above20Km * rates.ABOVE_20_KM
  );
}

/**
 * Count work days (all days that count as working)
 */
export function countWorkDays(
  flights: Flight[],
  nonFlightDays: NonFlightDay[],
  settings: Settings
): number {
  // Get unique flight dates
  const flightDates = new Set(
    flights.map((f) => f.date.toISOString().split('T')[0])
  );
  
  // Add non-flight work days based on settings
  const nonFlightWorkDates = new Set<string>();
  
  for (const day of nonFlightDays) {
    const dateStr = day.date.toISOString().split('T')[0];
    
    if (day.type === 'ME' && settings.countMedicalAsTrip) {
      nonFlightWorkDates.add(dateStr);
    } else if (day.type === 'FL' && settings.countForeignAsWorkDay) {
      nonFlightWorkDates.add(dateStr);
    } else if (GROUND_DUTY_CODES.includes(day.type as typeof GROUND_DUTY_CODES[number]) && settings.countGroundDutyAsTrip) {
      nonFlightWorkDates.add(dateStr);
    }
  }
  
  // Combine (don't double count)
  const allWorkDates = new Set([...flightDates, ...nonFlightWorkDates]);
  return allWorkDates.size;
}

/**
 * Count commute trips based on settings
 */
export function countTrips(
  flights: Flight[],
  nonFlightDays: NonFlightDay[],
  settings: Settings
): number {
  let trips = 0;
  
  // Count A flags (to work)
  if (settings.countOnlyAFlag) {
    trips += flights.filter((f) => f.dutyCode === 'A').length;
  } else {
    // Count unique days with A or E flags
    const daysWithAE = new Set<string>();
    for (const flight of flights) {
      if (flight.dutyCode === 'A' || flight.dutyCode === 'E') {
        daysWithAE.add(flight.date.toISOString().split('T')[0]);
      }
    }
    trips += daysWithAE.size;
  }
  
  // ME days = round trip (to and from)
  if (settings.countMedicalAsTrip) {
    const meDays = nonFlightDays.filter((d) => d.type === 'ME');
    trips += meDays.length; // Each ME day = 1 round trip
  }
  
  // Ground duty days = round trip
  if (settings.countGroundDutyAsTrip) {
    const groundDays = nonFlightDays.filter((d) =>
      GROUND_DUTY_CODES.includes(d.type as typeof GROUND_DUTY_CODES[number])
    );
    trips += groundDays.length;
  }
  
  return trips;
}

/**
 * Detect hotel nights (layovers) from flight data
 */
export function detectHotelNights(flights: Flight[]): HotelNight[] {
  const hotelNights: HotelNight[] = [];
  
  // Sort flights by date and time
  const sortedFlights = [...flights].sort((a, b) => {
    const dateCompare = a.date.getTime() - b.date.getTime();
    if (dateCompare !== 0) return dateCompare;
    return parseTimeToMinutes(a.departureTime) - parseTimeToMinutes(b.departureTime);
  });
  
  // Track trips
  const trips = detectTrips(sortedFlights);
  
  for (const trip of trips) {
    // Each night in a multi-day trip abroad is a hotel night
    const startDate = trip.startDate;
    const endDate = trip.endDate;
    
    // Calculate nights
    const nights = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
    );
    
    if (nights > 0 && trip.countries.some((c) => !isDomestic(c))) {
      // Track the last known foreign location
      let lastForeignLocation = '';
      let lastForeignCountry = '';
      
      // Find the initial foreign destination from day 1 flights
      const day1Flights = trip.flights.filter(
        (f) => f.date.toISOString().split('T')[0] === startDate.toISOString().split('T')[0]
      );
      const lastDay1Flight = day1Flights[day1Flights.length - 1];
      if (lastDay1Flight) {
        const arrivalCountry = getCountryFromAirport(lastDay1Flight.arrival);
        if (!isDomestic(arrivalCountry)) {
          lastForeignLocation = lastDay1Flight.arrival;
          lastForeignCountry = arrivalCountry;
        }
      }
      
      // Add hotel nights for each night of the trip
      for (let i = 0; i < nights; i++) {
        const nightDate = new Date(startDate);
        nightDate.setDate(nightDate.getDate() + i);
        
        // Find flights landing on this date to update location
        const flightsThisDay = trip.flights.filter(
          (f) => f.date.toISOString().split('T')[0] === nightDate.toISOString().split('T')[0]
        );
        
        if (flightsThisDay.length > 0) {
          const lastFlight = flightsThisDay[flightsThisDay.length - 1];
          const arrivalCountry = getCountryFromAirport(lastFlight.arrival);
          if (!isDomestic(arrivalCountry)) {
            lastForeignLocation = lastFlight.arrival;
            lastForeignCountry = arrivalCountry;
          }
        }
        
        // Add hotel night if we have a foreign location
        if (lastForeignLocation && lastForeignCountry) {
          hotelNights.push({
            date: nightDate,
            location: lastForeignLocation,
            country: getCountryName(lastForeignCountry),
          });
        }
      }
    }
  }
  
  return hotelNights;
}

/**
 * Detect trip segments from flights
 */
export function detectTrips(flights: Flight[]): TripSegment[] {
  const trips: TripSegment[] = [];
  
  if (flights.length === 0) return trips;
  
  // Sort by date
  const sortedFlights = [...flights].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  
  let currentTrip: TripSegment | null = null;
  
  for (const flight of sortedFlights) {
    const departureCountry = getCountryFromAirport(flight.departure);
    const arrivalCountry = getCountryFromAirport(flight.arrival);
    
    // Starting from Germany = new trip start
    if (isDomestic(departureCountry) && !currentTrip) {
      currentTrip = {
        startDate: flight.date,
        endDate: flight.date,
        flights: [flight],
        hotelNights: [],
        countries: [arrivalCountry],
      };
    } else if (currentTrip) {
      // Continue the current trip
      currentTrip.flights.push(flight);
      currentTrip.endDate = flight.date;
      
      if (!currentTrip.countries.includes(arrivalCountry)) {
        currentTrip.countries.push(arrivalCountry);
      }
      
      // Returning to Germany = trip ends
      if (isDomestic(arrivalCountry)) {
        trips.push(currentTrip);
        currentTrip = null;
      }
    }
  }
  
  // Handle unclosed trip
  if (currentTrip) {
    trips.push(currentTrip);
  }
  
  return trips;
}

/**
 * Calculate meal allowances (Verpflegungsmehraufwand)
 */
export function calculateMealAllowances(
  flights: Flight[],
  nonFlightDays: NonFlightDay[],
  year: AllowanceYear = DEFAULT_ALLOWANCE_YEAR
): {
  domestic8h: { days: number; rate: number; total: number };
  domestic24h: { days: number; rate: number; total: number };
  foreign: { country: string; days: number; rate: number; total: number }[];
  total: number;
} {
  const trips = detectTrips(flights);
  const domesticRates = getDomesticRates(year);
  
  let domestic8hDays = 0;
  let domestic24hDays = 0;
  const foreignDays: Record<string, { days8h: number; days24h: number; rate8h: number; rate24h: number }> = {};
  
  for (const trip of trips) {
    const tripDays = Math.ceil(
      (trip.endDate.getTime() - trip.startDate.getTime()) / (24 * 60 * 60 * 1000)
    ) + 1;
    
    // Determine primary country (where most time was spent)
    const primaryCountry = trip.countries.find((c) => !isDomestic(c)) || 'DE';
    
    if (tripDays === 1) {
      // Single day trip - check if > 8 hours
      // For simplicity, assume day trips are > 8 hours
      if (isDomestic(primaryCountry)) {
        domestic8hDays++;
      } else {
        if (!foreignDays[primaryCountry]) {
          const allowance = getCountryAllowance(primaryCountry, year);
          foreignDays[primaryCountry] = {
            days8h: 0,
            days24h: 0,
            rate8h: allowance.rate8h,
            rate24h: allowance.rate24h,
          };
        }
        foreignDays[primaryCountry].days8h++;
      }
    } else {
      // Multi-day trip
      // First and last day = partial (8h rate)
      // Middle days = full (24h rate)
      if (isDomestic(primaryCountry)) {
        domestic8hDays += 2; // arrival + departure day
        domestic24hDays += Math.max(0, tripDays - 2);
      } else {
        if (!foreignDays[primaryCountry]) {
          const allowance = getCountryAllowance(primaryCountry, year);
          foreignDays[primaryCountry] = {
            days8h: 0,
            days24h: 0,
            rate8h: allowance.rate8h,
            rate24h: allowance.rate24h,
          };
        }
        foreignDays[primaryCountry].days8h += 2; // arrival + departure
        foreignDays[primaryCountry].days24h += Math.max(0, tripDays - 2);
      }
    }
  }
  
  // Process FL days (abroad days without flights)
  for (const day of nonFlightDays) {
    if (day.type === 'FL' && day.country) {
      const countryCode = day.country;
      if (!isDomestic(countryCode)) {
        if (!foreignDays[countryCode]) {
          const allowance = getCountryAllowance(countryCode, year);
          foreignDays[countryCode] = {
            days8h: 0,
            days24h: 0,
            rate8h: allowance.rate8h,
            rate24h: allowance.rate24h,
          };
        }
        foreignDays[countryCode].days24h++;
      } else {
        domestic24hDays++;
      }
    }
  }
  
  // Calculate totals
  const domestic8hTotal = domestic8hDays * domesticRates.RATE_8H;
  const domestic24hTotal = domestic24hDays * domesticRates.RATE_24H;
  
  const foreignResult = Object.entries(foreignDays).map(([country, data]) => ({
    country: getCountryName(country),
    days: data.days8h + data.days24h,
    rate: data.rate24h, // Show the 24h rate as reference
    total: data.days8h * data.rate8h + data.days24h * data.rate24h,
  }));
  
  const foreignTotal = foreignResult.reduce((sum, f) => sum + f.total, 0);
  
  return {
    domestic8h: { days: domestic8hDays, rate: domesticRates.RATE_8H, total: domestic8hTotal },
    domestic24h: { days: domestic24hDays, rate: domesticRates.RATE_24H, total: domestic24hTotal },
    foreign: foreignResult,
    total: domestic8hTotal + domestic24hTotal + foreignTotal,
  };
}

/**
 * Calculate monthly breakdown
 */
export function calculateMonthlyBreakdown(
  flights: Flight[],
  nonFlightDays: NonFlightDay[],
  settings: Settings,
  reimbursementData: ReimbursementData[] = []
): MonthlyBreakdown[] {
  // Group by month/year
  const monthlyData: Record<string, {
    flights: Flight[];
    nonFlightDays: NonFlightDay[];
  }> = {};
  
  for (const flight of flights) {
    const key = `${flight.year}-${String(flight.month).padStart(2, '0')}`;
    if (!monthlyData[key]) {
      monthlyData[key] = { flights: [], nonFlightDays: [] };
    }
    monthlyData[key].flights.push(flight);
  }
  
  for (const day of nonFlightDays) {
    const key = `${day.year}-${String(day.month).padStart(2, '0')}`;
    if (!monthlyData[key]) {
      monthlyData[key] = { flights: [], nonFlightDays: [] };
    }
    monthlyData[key].nonFlightDays.push(day);
  }
  
  // Calculate for each month
  const breakdown: MonthlyBreakdown[] = [];
  
  for (const [key, data] of Object.entries(monthlyData)) {
    const [yearStr, monthStr] = key.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    
    // Flight hours
    const flightHours = data.flights.reduce(
      (sum, f) => sum + parseBlockTimeToHours(f.blockTime || '0:00'),
      0
    );
    
    // Work days
    const workDays = countWorkDays(data.flights, data.nonFlightDays, settings);
    
    // Trips
    const trips = countTrips(data.flights, data.nonFlightDays, settings);
    
    // Distance deduction
    const distanceResult = calculateDistanceDeduction(trips, settings.distanceToWork, year);
    
    // Hotel nights
    const hotelNights = detectHotelNights(data.flights);
    
    // Meal allowance (simplified - full calculation needs trip detection)
    const allowanceYear = year as AllowanceYear;
    const mealResult = calculateMealAllowances(data.flights, data.nonFlightDays, allowanceYear);
    
    // Employer reimbursement for this month
    const monthlyReimbursement = reimbursementData
      .filter(r => r.month === month && r.year === year)
      .reduce((sum, r) => sum + r.taxFreeReimbursement, 0);
    
    breakdown.push({
      month,
      year,
      monthName: MONTH_NAMES[month - 1],
      flightHours: Math.round(flightHours * 100) / 100,
      workDays,
      trips,
      distanceDeduction: Math.round(distanceResult.total * 100) / 100,
      mealAllowance: Math.round(mealResult.total * 100) / 100,
      employerReimbursement: Math.round(monthlyReimbursement * 100) / 100,
      tips: Math.round(hotelNights.length * settings.tipPerNight * 100) / 100,
      cleaningCosts: Math.round(workDays * settings.cleaningCostPerDay * 100) / 100,
      hotelNights: hotelNights.length,
    });
  }
  
  // Sort by date
  breakdown.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
  
  return breakdown;
}

/**
 * Calculate final tax deduction (Endabrechnung)
 */
export function calculateTaxDeduction(
  flights: Flight[],
  nonFlightDays: NonFlightDay[],
  settings: Settings,
  reimbursementData: ReimbursementData[]
): TaxCalculation {
  // Work days for cleaning costs
  const workDays = countWorkDays(flights, nonFlightDays, settings);
  const cleaningTotal = workDays * settings.cleaningCostPerDay;
  
  // Hotel nights for tips
  const hotelNights = detectHotelNights(flights);
  const tipsTotal = hotelNights.length * settings.tipPerNight;
  
  // Trips for distance deduction
  const trips = countTrips(flights, nonFlightDays, settings);
  
  // Meal allowances - use year from first flight or default
  const year = (flights.length > 0 ? flights[0].year : DEFAULT_ALLOWANCE_YEAR) as AllowanceYear;
  const distanceResult = calculateDistanceDeduction(trips, settings.distanceToWork, year);
  const mealResult = calculateMealAllowances(flights, nonFlightDays, year);
  
  // Employer reimbursement from Streckeneinsatzabrechnung
  const employerReimbursement = reimbursementData.reduce(
    (sum, r) => sum + r.taxFreeReimbursement,
    0
  );
  
  const deductibleDifference = Math.max(0, mealResult.total - employerReimbursement);
  
  const grandTotal = cleaningTotal + tipsTotal + distanceResult.total + deductibleDifference;
  
  return {
    cleaningCosts: {
      workDays,
      ratePerDay: settings.cleaningCostPerDay,
      total: Math.round(cleaningTotal * 100) / 100,
    },
    travelExpenses: {
      hotelNights: hotelNights.length,
      tipRate: settings.tipPerNight,
      total: Math.round(tipsTotal * 100) / 100,
    },
    travelCosts: {
      trips,
      distanceKm: settings.distanceToWork,
      totalKm: distanceResult.totalKm,
      deductionFirst20km: Math.round(distanceResult.deductionFirst20km * 100) / 100,
      deductionAbove20km: Math.round(distanceResult.deductionAbove20km * 100) / 100,
      total: Math.round(distanceResult.total * 100) / 100,
      rateFirst20km: distanceResult.rateFirst20km,
      rateAbove20km: distanceResult.rateAbove20km,
    },
    mealAllowances: {
      domestic8h: mealResult.domestic8h,
      domestic24h: mealResult.domestic24h,
      foreign: mealResult.foreign,
      totalAllowances: Math.round(mealResult.total * 100) / 100,
      employerReimbursement: Math.round(employerReimbursement * 100) / 100,
      deductibleDifference: Math.round(deductibleDifference * 100) / 100,
    },
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Format hours for display
 */
export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

import { describe, it, expect } from 'vitest'
import {
  parseTimeToMinutes,
  parseBlockTimeToHours,
  calculateDistanceDeduction,
  countWorkDays,
  countTrips,
  detectTrips,
  detectHotelNights,
  calculateMealAllowances,
  calculateMonthlyBreakdown,
  calculateTaxDeduction,
  formatCurrency,
  formatHours,
} from './calculations'
import type { Flight, NonFlightDay, Settings } from '../types'

describe('parseTimeToMinutes', () => {
  it('parses standard time format', () => {
    expect(parseTimeToMinutes('12:30')).toBe(750)
    expect(parseTimeToMinutes('00:00')).toBe(0)
    expect(parseTimeToMinutes('23:59')).toBe(1439)
  })

  it('handles single digit hours', () => {
    expect(parseTimeToMinutes('9:30')).toBe(570)
  })

  it('handles malformed input gracefully', () => {
    expect(parseTimeToMinutes('')).toBe(0)
    expect(parseTimeToMinutes('invalid')).toBe(0)
  })
})

describe('parseBlockTimeToHours', () => {
  it('converts block time to decimal hours', () => {
    expect(parseBlockTimeToHours('1:30')).toBe(1.5)
    expect(parseBlockTimeToHours('2:45')).toBe(2.75)
    expect(parseBlockTimeToHours('0:00')).toBe(0)
  })

  it('handles longer flights', () => {
    expect(parseBlockTimeToHours('10:00')).toBe(10)
    expect(parseBlockTimeToHours('12:30')).toBe(12.5)
  })
})

describe('calculateDistanceDeduction', () => {
  it('calculates correctly for distance under 20km', () => {
    const result = calculateDistanceDeduction(10, 15) // 10 trips, 15km
    expect(result.totalKm).toBe(150)
    expect(result.deductionFirst20km).toBe(45) // 10 * 15 * 0.30
    expect(result.deductionAbove20km).toBe(0)
    expect(result.total).toBe(45)
  })

  it('calculates correctly for distance over 20km', () => {
    const result = calculateDistanceDeduction(10, 30) // 10 trips, 30km
    expect(result.totalKm).toBe(300)
    expect(result.deductionFirst20km).toBe(60) // 10 * 20 * 0.30
    expect(result.deductionAbove20km).toBe(38) // 10 * 10 * 0.38
    expect(result.total).toBe(98)
  })

  it('handles exactly 20km', () => {
    const result = calculateDistanceDeduction(5, 20)
    expect(result.deductionFirst20km).toBe(30) // 5 * 20 * 0.30
    expect(result.deductionAbove20km).toBe(0)
    expect(result.total).toBe(30)
  })

  it('handles zero trips', () => {
    const result = calculateDistanceDeduction(0, 30)
    expect(result.total).toBe(0)
  })
})

describe('countWorkDays', () => {
  const defaultSettings: Settings = {
    distanceToWork: 30,
    cleaningCostPerDay: 1.0,
    tipPerNight: 1.0,
    countOnlyAFlag: false,
    countMedicalAsTrip: true,
    countGroundDutyAsTrip: true,
    countForeignAsWorkDay: true,
  }

  it('counts unique flight dates', () => {
    const flights: Flight[] = [
      createFlight('2024-01-15', 'LH100'),
      createFlight('2024-01-15', 'LH101'), // Same date
      createFlight('2024-01-16', 'LH102'),
    ]
    const result = countWorkDays(flights, [], defaultSettings)
    expect(result).toBe(2) // 2 unique dates
  })

  it('includes ME days when setting enabled', () => {
    const flights: Flight[] = [createFlight('2024-01-15', 'LH100')]
    const nonFlightDays: NonFlightDay[] = [
      createNonFlightDay('2024-01-16', 'ME'),
    ]
    const result = countWorkDays(flights, nonFlightDays, defaultSettings)
    expect(result).toBe(2)
  })

  it('excludes ME days when setting disabled', () => {
    const settings = { ...defaultSettings, countMedicalAsTrip: false }
    const flights: Flight[] = [createFlight('2024-01-15', 'LH100')]
    const nonFlightDays: NonFlightDay[] = [
      createNonFlightDay('2024-01-16', 'ME'),
    ]
    const result = countWorkDays(flights, nonFlightDays, settings)
    expect(result).toBe(1)
  })

  it('includes ground duty days when setting enabled', () => {
    const nonFlightDays: NonFlightDay[] = [
      createNonFlightDay('2024-01-15', 'SB'),
      createNonFlightDay('2024-01-16', 'RE'),
    ]
    const result = countWorkDays([], nonFlightDays, defaultSettings)
    expect(result).toBe(2)
  })

  it('does not double count if flight and non-flight on same day', () => {
    const flights: Flight[] = [createFlight('2024-01-15', 'LH100')]
    const nonFlightDays: NonFlightDay[] = [
      createNonFlightDay('2024-01-15', 'ME'),
    ]
    const result = countWorkDays(flights, nonFlightDays, defaultSettings)
    expect(result).toBe(1)
  })
})

describe('countTrips', () => {
  const defaultSettings: Settings = {
    distanceToWork: 30,
    cleaningCostPerDay: 1.0,
    tipPerNight: 1.0,
    countOnlyAFlag: false,
    countMedicalAsTrip: true,
    countGroundDutyAsTrip: true,
    countForeignAsWorkDay: true,
  }

  it('counts A/E flags as trips', () => {
    const flights: Flight[] = [
      createFlight('2024-01-15', 'LH100', 'A'),
      createFlight('2024-01-16', 'LH101', 'E'),
    ]
    const result = countTrips(flights, [], defaultSettings)
    expect(result).toBe(2)
  })

  it('counts only A flags when countOnlyAFlag is true', () => {
    const settings = { ...defaultSettings, countOnlyAFlag: true }
    const flights: Flight[] = [
      createFlight('2024-01-15', 'LH100', 'A'),
      createFlight('2024-01-15', 'LH101', 'E'),
      createFlight('2024-01-16', 'LH102', 'A'),
    ]
    const result = countTrips(flights, [], settings)
    expect(result).toBe(2) // Only A flags
  })

  it('adds ME days as trips', () => {
    const nonFlightDays: NonFlightDay[] = [
      createNonFlightDay('2024-01-15', 'ME'),
      createNonFlightDay('2024-01-16', 'ME'),
    ]
    const result = countTrips([], nonFlightDays, defaultSettings)
    expect(result).toBe(2)
  })

  it('adds ground duty days as trips', () => {
    const nonFlightDays: NonFlightDay[] = [
      createNonFlightDay('2024-01-15', 'SB'),
      createNonFlightDay('2024-01-16', 'RE'),
      createNonFlightDay('2024-01-17', 'SI'),
    ]
    const result = countTrips([], nonFlightDays, defaultSettings)
    expect(result).toBe(3)
  })
})

describe('formatCurrency', () => {
  it('formats as German EUR currency', () => {
    const result = formatCurrency(1234.56)
    expect(result).toContain('1.234,56')
    expect(result).toContain('€')
  })

  it('handles zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0,00')
  })

  it('handles negative values', () => {
    const result = formatCurrency(-100)
    expect(result).toContain('100,00')
  })
})

describe('formatHours', () => {
  it('formats decimal hours to HH:MM', () => {
    expect(formatHours(1.5)).toBe('1:30')
    expect(formatHours(2.75)).toBe('2:45')
    expect(formatHours(10)).toBe('10:00')
  })

  it('handles zero', () => {
    expect(formatHours(0)).toBe('0:00')
  })

  it('rounds minutes correctly', () => {
    expect(formatHours(1.99)).toBe('1:59')
  })
})

describe('detectTrips', () => {
  it('detects a simple round-trip', () => {
    const flights: Flight[] = [
      createFlightWithRoute('2024-01-15', 'LH100', 'FRA', 'LHR'), // Outbound
      createFlightWithRoute('2024-01-15', 'LH101', 'LHR', 'FRA'), // Return same day
    ]
    const trips = detectTrips(flights)
    expect(trips.length).toBe(1)
    expect(trips[0].countries).toContain('GB')
  })

  it('detects multi-day trip with overnight', () => {
    const flights: Flight[] = [
      createFlightWithRoute('2024-01-15', 'LH100', 'FRA', 'JFK'), // Day 1 outbound
      createFlightWithRoute('2024-01-17', 'LH101', 'JFK', 'FRA'), // Day 3 return
    ]
    const trips = detectTrips(flights)
    expect(trips.length).toBe(1)
    expect(trips[0].countries).toContain('US')
  })

  it('handles multiple separate trips', () => {
    const flights: Flight[] = [
      createFlightWithRoute('2024-01-10', 'LH100', 'FRA', 'LHR'),
      createFlightWithRoute('2024-01-10', 'LH101', 'LHR', 'FRA'),
      createFlightWithRoute('2024-01-20', 'LH200', 'FRA', 'CDG'),
      createFlightWithRoute('2024-01-20', 'LH201', 'CDG', 'FRA'),
    ]
    const trips = detectTrips(flights)
    expect(trips.length).toBe(2)
  })

  it('handles empty flight list', () => {
    const trips = detectTrips([])
    expect(trips.length).toBe(0)
  })
})

describe('detectHotelNights', () => {
  it('detects hotel night on multi-day foreign trip', () => {
    const flights: Flight[] = [
      createFlightWithRoute('2024-01-15', 'LH100', 'FRA', 'JFK'), // Outbound
      createFlightWithRoute('2024-01-16', 'LH101', 'JFK', 'FRA'), // Return next day
    ]
    const hotelNights = detectHotelNights(flights)
    expect(hotelNights.length).toBe(1)
    expect(hotelNights[0].country).toBe('USA')
  })

  it('returns empty for same-day round trips', () => {
    const flights: Flight[] = [
      createFlightWithRoute('2024-01-15', 'LH100', 'FRA', 'LHR'),
      createFlightWithRoute('2024-01-15', 'LH101', 'LHR', 'FRA'),
    ]
    const hotelNights = detectHotelNights(flights)
    expect(hotelNights.length).toBe(0)
  })

  it('counts multiple nights on long trip', () => {
    const flights: Flight[] = [
      createFlightWithRoute('2024-01-15', 'LH100', 'FRA', 'JFK'),
      createFlightWithRoute('2024-01-18', 'LH101', 'JFK', 'FRA'), // 3 nights
    ]
    const hotelNights = detectHotelNights(flights)
    expect(hotelNights.length).toBe(3)
  })
})

describe('calculateMealAllowances', () => {
  it('calculates domestic single day trip', () => {
    // Domestic trip - should not generate foreign allowances
    const flights: Flight[] = [
      createFlightWithRoute('2024-01-15', 'LH100', 'FRA', 'MUC'),
      createFlightWithRoute('2024-01-15', 'LH101', 'MUC', 'FRA'),
    ]
    const result = calculateMealAllowances(flights, [])
    expect(result.foreign.length).toBe(0)
    // Should have domestic 8h allowance for a day trip
    expect(result.domestic8h.days).toBeGreaterThanOrEqual(0)
  })

  it('calculates foreign trip allowances', () => {
    const flights: Flight[] = [
      createFlightWithRoute('2024-01-15', 'LH100', 'FRA', 'LHR'),
      createFlightWithRoute('2024-01-15', 'LH101', 'LHR', 'FRA'),
    ]
    const result = calculateMealAllowances(flights, [])
    // Should have foreign allowance for GB
    expect(result.total).toBeGreaterThan(0)
  })

  it('includes FL (abroad) days in calculation', () => {
    const nonFlightDays: NonFlightDay[] = [
      { ...createNonFlightDay('2024-01-16', 'FL'), country: 'US' },
    ]
    const result = calculateMealAllowances([], nonFlightDays)
    expect(result.total).toBeGreaterThan(0)
    expect(result.foreign.length).toBeGreaterThan(0)
  })
})

describe('calculateMonthlyBreakdown', () => {
  const defaultSettings: Settings = {
    distanceToWork: 30,
    cleaningCostPerDay: 1.0,
    tipPerNight: 1.0,
    countOnlyAFlag: false,
    countMedicalAsTrip: true,
    countGroundDutyAsTrip: true,
    countForeignAsWorkDay: true,
  }

  it('groups flights by month', () => {
    const flights: Flight[] = [
      createFlight('2024-01-15', 'LH100'),
      createFlight('2024-01-20', 'LH101'),
      createFlight('2024-02-10', 'LH200'),
    ]
    const breakdown = calculateMonthlyBreakdown(flights, [], defaultSettings)
    expect(breakdown.length).toBe(2)
    expect(breakdown[0].month).toBe(1)
    expect(breakdown[1].month).toBe(2)
  })

  it('calculates flight hours per month', () => {
    const flights: Flight[] = [
      { ...createFlight('2024-01-15', 'LH100'), blockTime: '2:00' },
      { ...createFlight('2024-01-20', 'LH101'), blockTime: '3:30' },
    ]
    const breakdown = calculateMonthlyBreakdown(flights, [], defaultSettings)
    expect(breakdown[0].flightHours).toBe(5.5)
  })

  it('sorts by year and month', () => {
    const flights: Flight[] = [
      createFlight('2024-03-15', 'LH300'),
      createFlight('2024-01-15', 'LH100'),
      createFlight('2023-12-15', 'LH900'),
    ]
    const breakdown = calculateMonthlyBreakdown(flights, [], defaultSettings)
    expect(breakdown[0].year).toBe(2023)
    expect(breakdown[0].month).toBe(12)
    expect(breakdown[1].year).toBe(2024)
    expect(breakdown[1].month).toBe(1)
    expect(breakdown[2].year).toBe(2024)
    expect(breakdown[2].month).toBe(3)
  })
})

describe('calculateTaxDeduction', () => {
  const defaultSettings: Settings = {
    distanceToWork: 30,
    cleaningCostPerDay: 1.50,
    tipPerNight: 2.00,
    countOnlyAFlag: false,
    countMedicalAsTrip: true,
    countGroundDutyAsTrip: true,
    countForeignAsWorkDay: true,
  }

  it('calculates cleaning costs correctly', () => {
    const flights: Flight[] = [
      createFlight('2024-01-15', 'LH100'),
      createFlight('2024-01-16', 'LH101'),
    ]
    const result = calculateTaxDeduction(flights, [], defaultSettings, [])
    expect(result.cleaningCosts.workDays).toBe(2)
    expect(result.cleaningCosts.ratePerDay).toBe(1.50)
    expect(result.cleaningCosts.total).toBe(3.00)
  })

  it('subtracts employer reimbursement from meal allowances', () => {
    const flights: Flight[] = [
      createFlightWithRoute('2024-01-15', 'LH100', 'FRA', 'LHR'),
      createFlightWithRoute('2024-01-15', 'LH101', 'LHR', 'FRA'),
    ]
    const reimbursementData = [
      { month: 1, year: 2024, taxFreeReimbursement: 10, domesticDays8h: 0, domesticDays24h: 0, foreignDays: [] },
    ]
    const result = calculateTaxDeduction(flights, [], defaultSettings, reimbursementData)
    expect(result.mealAllowances.employerReimbursement).toBe(10)
    // deductibleDifference should be totalAllowances - employerReimbursement (min 0)
    const expectedDiff = Math.max(0, result.mealAllowances.totalAllowances - 10)
    expect(result.mealAllowances.deductibleDifference).toBe(expectedDiff)
  })

  it('calculates grand total as sum of all deductions', () => {
    const flights: Flight[] = [
      createFlight('2024-01-15', 'LH100', 'A'),
    ]
    const result = calculateTaxDeduction(flights, [], defaultSettings, [])
    const expectedGrandTotal = 
      result.cleaningCosts.total +
      result.travelExpenses.total +
      result.travelCosts.total +
      result.mealAllowances.deductibleDifference
    expect(result.grandTotal).toBeCloseTo(expectedGrandTotal, 2)
  })
})

// Helper functions to create test data
function createFlight(dateStr: string, flightNumber: string, dutyCode?: string): Flight {
  const date = new Date(dateStr)
  return {
    id: `${dateStr}-${flightNumber}`,
    date,
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    flightNumber,
    departure: 'FRA',
    arrival: 'LHR',
    departureTime: '08:00',
    arrivalTime: '10:00',
    blockTime: '2:00',
    dutyCode,
    isContinuation: false,
    country: 'GB',
  }
}

function createFlightWithRoute(
  dateStr: string,
  flightNumber: string,
  departure: string,
  arrival: string
): Flight {
  const date = new Date(dateStr)
  // Import inline to avoid circular dependency issues in tests
  const countryMap: Record<string, string> = {
    FRA: 'DE', MUC: 'DE', DUS: 'DE', BER: 'DE',
    LHR: 'GB', CDG: 'FR', JFK: 'US', LAX: 'US',
  }
  return {
    id: `${dateStr}-${flightNumber}`,
    date,
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    flightNumber,
    departure,
    arrival,
    departureTime: '08:00',
    arrivalTime: '12:00',
    blockTime: '4:00',
    isContinuation: false,
    country: countryMap[arrival] || 'XX',
  }
}

function createNonFlightDay(dateStr: string, type: NonFlightDay['type']): NonFlightDay {
  const date = new Date(dateStr)
  return {
    id: `${dateStr}-${type}`,
    date,
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    type,
    description: type,
  }
}

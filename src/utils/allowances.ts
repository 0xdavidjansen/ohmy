// German tax law meal allowance rates (Verpflegungsmehraufwand)
// Based on Bundesfinanzministerium guidelines

import type { CountryAllowance } from '../types';

// Domestic German rates (2024)
export const DOMESTIC_RATES = {
  RATE_8H: 14, // More than 8 hours away from home
  RATE_24H: 28, // Full 24-hour day
  ARRIVAL_DEPARTURE: 14, // Arrival/departure day of multi-day trip
};

// Distance deduction rates (Entfernungspauschale)
export const DISTANCE_RATES = {
  FIRST_20_KM: 0.30, // €0.30 per km for first 20km
  ABOVE_20_KM: 0.38, // €0.38 per km for km 21+
};

// Country-specific foreign travel allowance rates (Auslandsreisekosten)
// Source: BMF-Schreiben zu Reisekostenpauschalen
export const COUNTRY_ALLOWANCES: CountryAllowance[] = [
  // Europe
  { country: 'Albanien', countryCode: 'AL', rate8h: 19, rate24h: 29 },
  { country: 'Andorra', countryCode: 'AD', rate8h: 26, rate24h: 32 },
  { country: 'Belgien', countryCode: 'BE', rate8h: 33, rate24h: 50 },
  { country: 'Bosnien und Herzegowina', countryCode: 'BA', rate8h: 15, rate24h: 23 },
  { country: 'Bulgarien', countryCode: 'BG', rate8h: 18, rate24h: 27 },
  { country: 'Dänemark', countryCode: 'DK', rate8h: 42, rate24h: 63 },
  { country: 'Estland', countryCode: 'EE', rate8h: 20, rate24h: 30 },
  { country: 'Finnland', countryCode: 'FI', rate8h: 34, rate24h: 51 },
  { country: 'Frankreich', countryCode: 'FR', rate8h: 39, rate24h: 58 },
  { country: 'Griechenland', countryCode: 'GR', rate8h: 29, rate24h: 44 },
  { country: 'Großbritannien', countryCode: 'GB', rate8h: 39, rate24h: 58 },
  { country: 'Irland', countryCode: 'IE', rate8h: 35, rate24h: 52 },
  { country: 'Island', countryCode: 'IS', rate8h: 40, rate24h: 60 },
  { country: 'Italien', countryCode: 'IT', rate8h: 34, rate24h: 51 },
  { country: 'Kroatien', countryCode: 'HR', rate8h: 23, rate24h: 35 },
  { country: 'Lettland', countryCode: 'LV', rate8h: 19, rate24h: 29 },
  { country: 'Liechtenstein', countryCode: 'LI', rate8h: 41, rate24h: 62 },
  { country: 'Litauen', countryCode: 'LT', rate8h: 18, rate24h: 27 },
  { country: 'Luxemburg', countryCode: 'LU', rate8h: 33, rate24h: 50 },
  { country: 'Malta', countryCode: 'MT', rate8h: 28, rate24h: 42 },
  { country: 'Moldau', countryCode: 'MD', rate8h: 18, rate24h: 27 },
  { country: 'Monaco', countryCode: 'MC', rate8h: 39, rate24h: 58 },
  { country: 'Montenegro', countryCode: 'ME', rate8h: 18, rate24h: 27 },
  { country: 'Niederlande', countryCode: 'NL', rate8h: 33, rate24h: 50 },
  { country: 'Nordmazedonien', countryCode: 'MK', rate8h: 18, rate24h: 27 },
  { country: 'Norwegen', countryCode: 'NO', rate8h: 50, rate24h: 75 },
  { country: 'Österreich', countryCode: 'AT', rate8h: 30, rate24h: 45 },
  { country: 'Polen', countryCode: 'PL', rate8h: 20, rate24h: 30 },
  { country: 'Portugal', countryCode: 'PT', rate8h: 27, rate24h: 41 },
  { country: 'Rumänien', countryCode: 'RO', rate8h: 18, rate24h: 27 },
  { country: 'Russland', countryCode: 'RU', rate8h: 24, rate24h: 36 },
  { country: 'San Marino', countryCode: 'SM', rate8h: 34, rate24h: 51 },
  { country: 'Schweden', countryCode: 'SE', rate8h: 40, rate24h: 60 },
  { country: 'Schweiz', countryCode: 'CH', rate8h: 41, rate24h: 62 },
  { country: 'Serbien', countryCode: 'RS', rate8h: 18, rate24h: 27 },
  { country: 'Slowakei', countryCode: 'SK', rate8h: 19, rate24h: 29 },
  { country: 'Slowenien', countryCode: 'SI', rate8h: 22, rate24h: 33 },
  { country: 'Spanien', countryCode: 'ES', rate8h: 27, rate24h: 41 },
  { country: 'Tschechien', countryCode: 'CZ', rate8h: 24, rate24h: 36 },
  { country: 'Türkei', countryCode: 'TR', rate8h: 23, rate24h: 35 },
  { country: 'Ukraine', countryCode: 'UA', rate8h: 18, rate24h: 27 },
  { country: 'Ungarn', countryCode: 'HU', rate8h: 18, rate24h: 27 },
  { country: 'Vatikanstadt', countryCode: 'VA', rate8h: 34, rate24h: 51 },
  { country: 'Weißrussland', countryCode: 'BY', rate8h: 18, rate24h: 27 },
  { country: 'Zypern', countryCode: 'CY', rate8h: 28, rate24h: 42 },

  // Middle East & Africa
  { country: 'Ägypten', countryCode: 'EG', rate8h: 27, rate24h: 41 },
  { country: 'Algerien', countryCode: 'DZ', rate8h: 31, rate24h: 47 },
  { country: 'Äthiopien', countryCode: 'ET', rate8h: 28, rate24h: 42 },
  { country: 'Bahrain', countryCode: 'BH', rate8h: 32, rate24h: 48 },
  { country: 'Israel', countryCode: 'IL', rate8h: 39, rate24h: 58 },
  { country: 'Jordanien', countryCode: 'JO', rate8h: 28, rate24h: 42 },
  { country: 'Katar', countryCode: 'QA', rate8h: 37, rate24h: 56 },
  { country: 'Kenia', countryCode: 'KE', rate8h: 30, rate24h: 45 },
  { country: 'Kuwait', countryCode: 'KW', rate8h: 32, rate24h: 48 },
  { country: 'Libanon', countryCode: 'LB', rate8h: 30, rate24h: 45 },
  { country: 'Libyen', countryCode: 'LY', rate8h: 32, rate24h: 48 },
  { country: 'Marokko', countryCode: 'MA', rate8h: 28, rate24h: 42 },
  { country: 'Nigeria', countryCode: 'NG', rate8h: 35, rate24h: 52 },
  { country: 'Oman', countryCode: 'OM', rate8h: 32, rate24h: 48 },
  { country: 'Saudi-Arabien', countryCode: 'SA', rate8h: 28, rate24h: 42 },
  { country: 'Südafrika', countryCode: 'ZA', rate8h: 22, rate24h: 33 },
  { country: 'Tunesien', countryCode: 'TN', rate8h: 26, rate24h: 39 },
  { country: 'Vereinigte Arabische Emirate', countryCode: 'AE', rate8h: 37, rate24h: 56 },

  // Asia
  { country: 'Armenien', countryCode: 'AM', rate8h: 18, rate24h: 27 },
  { country: 'Aserbaidschan', countryCode: 'AZ', rate8h: 18, rate24h: 27 },
  { country: 'Bangladesch', countryCode: 'BD', rate8h: 24, rate24h: 36 },
  { country: 'China', countryCode: 'CN', rate8h: 33, rate24h: 50 },
  { country: 'Georgien', countryCode: 'GE', rate8h: 18, rate24h: 27 },
  { country: 'Hongkong', countryCode: 'HK', rate8h: 44, rate24h: 66 },
  { country: 'Indien', countryCode: 'IN', rate8h: 27, rate24h: 41 },
  { country: 'Indonesien', countryCode: 'ID', rate8h: 27, rate24h: 41 },
  { country: 'Japan', countryCode: 'JP', rate8h: 40, rate24h: 60 },
  { country: 'Kasachstan', countryCode: 'KZ', rate8h: 22, rate24h: 33 },
  { country: 'Malaysia', countryCode: 'MY', rate8h: 24, rate24h: 36 },
  { country: 'Malediven', countryCode: 'MV', rate8h: 39, rate24h: 58 },
  { country: 'Pakistan', countryCode: 'PK', rate8h: 21, rate24h: 32 },
  { country: 'Philippinen', countryCode: 'PH', rate8h: 24, rate24h: 36 },
  { country: 'Singapur', countryCode: 'SG', rate8h: 39, rate24h: 58 },
  { country: 'Sri Lanka', countryCode: 'LK', rate8h: 24, rate24h: 36 },
  { country: 'Südkorea', countryCode: 'KR', rate8h: 36, rate24h: 54 },
  { country: 'Taiwan', countryCode: 'TW', rate8h: 28, rate24h: 42 },
  { country: 'Thailand', countryCode: 'TH', rate8h: 26, rate24h: 39 },
  { country: 'Vietnam', countryCode: 'VN', rate8h: 24, rate24h: 36 },

  // Americas
  { country: 'Argentinien', countryCode: 'AR', rate8h: 24, rate24h: 36 },
  { country: 'Brasilien', countryCode: 'BR', rate8h: 31, rate24h: 47 },
  { country: 'Chile', countryCode: 'CL', rate8h: 28, rate24h: 42 },
  { country: 'Costa Rica', countryCode: 'CR', rate8h: 28, rate24h: 42 },
  { country: 'Dominikanische Republik', countryCode: 'DO', rate8h: 28, rate24h: 42 },
  { country: 'Ecuador', countryCode: 'EC', rate8h: 26, rate24h: 39 },
  { country: 'Jamaika', countryCode: 'JM', rate8h: 36, rate24h: 54 },
  { country: 'Kanada', countryCode: 'CA', rate8h: 36, rate24h: 54 },
  { country: 'Kolumbien', countryCode: 'CO', rate8h: 28, rate24h: 42 },
  { country: 'Kuba', countryCode: 'CU', rate8h: 33, rate24h: 50 },
  { country: 'Mexiko', countryCode: 'MX', rate8h: 33, rate24h: 50 },
  { country: 'Panama', countryCode: 'PA', rate8h: 26, rate24h: 39 },
  { country: 'Peru', countryCode: 'PE', rate8h: 24, rate24h: 36 },
  { country: 'USA', countryCode: 'US', rate8h: 39, rate24h: 58 },
  { country: 'Venezuela', countryCode: 'VE', rate8h: 33, rate24h: 50 },

  // Oceania
  { country: 'Australien', countryCode: 'AU', rate8h: 37, rate24h: 56 },
  { country: 'Neuseeland', countryCode: 'NZ', rate8h: 33, rate24h: 50 },
];

// Default rate for countries not in the list
export const DEFAULT_FOREIGN_RATE = {
  rate8h: 24,
  rate24h: 36,
};

/**
 * Get allowance rate for a specific country
 */
export function getCountryAllowance(countryCode: string): CountryAllowance {
  const found = COUNTRY_ALLOWANCES.find(
    (c) => c.countryCode.toUpperCase() === countryCode.toUpperCase()
  );
  
  if (found) {
    return found;
  }
  
  // Return default rates with the country code
  return {
    country: countryCode,
    countryCode: countryCode.toUpperCase(),
    rate8h: DEFAULT_FOREIGN_RATE.rate8h,
    rate24h: DEFAULT_FOREIGN_RATE.rate24h,
  };
}

/**
 * Get allowance rate by country name (German)
 */
export function getCountryAllowanceByName(countryName: string): CountryAllowance {
  const found = COUNTRY_ALLOWANCES.find(
    (c) => c.country.toLowerCase() === countryName.toLowerCase()
  );
  
  if (found) {
    return found;
  }
  
  return {
    country: countryName,
    countryCode: 'XX',
    rate8h: DEFAULT_FOREIGN_RATE.rate8h,
    rate24h: DEFAULT_FOREIGN_RATE.rate24h,
  };
}

/**
 * Check if a country code represents Germany (domestic)
 */
export function isDomestic(countryCode: string): boolean {
  return countryCode.toUpperCase() === 'DE';
}

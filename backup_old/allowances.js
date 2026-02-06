// German tax allowance rates (Verpflegungspauschalen) by year
// Sources:
// - 2025: BMF Schreiben vom 02.12.2024 - steuerliche Behandlung von Reisekosten
// - 2024: BMF Schreiben vom 21.11.2023
// - 2023: BMF Schreiben vom 23.11.2022
// 
// Format: [fullDay, partialDay]
// fullDay: bei einer Abwesenheitsdauer von mindestens 24 Stunden je Kalendertag
// partialDay: fuer den An- und Abreisetag sowie bei einer Abwesenheitsdauer von mehr als 8 Stunden je Kalendertag

// 2025 rates (current)
const ALLOWANCES_2025 = {
    "Deutschland": [28, 14],
    "Afghanistan": [30, 20],
    "Aegypten": [50, 33],
    "Aethiopien": [44, 29],
    "Aequatorialguinea": [42, 28],
    "Albanien": [27, 18],
    "Algerien": [47, 32],
    "Andorra": [41, 28],
    "Angola": [40, 27],
    "Argentinien": [35, 24],
    "Armenien": [29, 20],
    "Aserbaidschan": [44, 29],
    "Australien": [57, 38],
    "Australien - Canberra": [74, 49],
    "Australien - Sydney": [57, 38],
    "Bahrain": [48, 32],
    "Bangladesch": [46, 31],
    "Barbados": [54, 36],
    "Belgien": [59, 40],
    "Benin": [40, 27],
    "Bhutan": [27, 18],
    "Bolivien": [46, 31],
    "Bosnien und Herzegowina": [23, 16],
    "Botsuana": [46, 31],
    "Brasilien": [46, 31],
    "Brasilien - Brasilia": [51, 34],
    "Brasilien - Rio de Janeiro": [69, 46],
    "Brasilien - Sao Paulo": [46, 31],
    "Brunei": [45, 30],
    "Bulgarien": [22, 15],
    "Burkina Faso": [38, 25],
    "Burundi": [36, 24],
    "Chile": [44, 29],
    "China": [48, 32],
    "China - Chengdu": [41, 28],
    "China - Hongkong": [71, 48],
    "China - Kanton": [36, 24],
    "China - Peking": [30, 20],
    "China - Shanghai": [58, 39],
    "Hongkong": [71, 48],
    "Costa Rica": [60, 40],
    "Elfenbeinkueste": [59, 40],
    "Daenemark": [75, 50],
    "Dominikanische Republik": [50, 33],
    "Dschibuti": [77, 52],
    "Ecuador": [27, 18],
    "El Salvador": [65, 44],
    "Eritrea": [46, 31],
    "Estland": [29, 20],
    "Fidschi": [32, 21],
    "Finnland": [54, 36],
    "Frankreich": [53, 36],
    "Frankreich - Paris": [58, 39],
    "Gabun": [64, 43],
    "Gambia": [40, 27],
    "Georgien": [45, 30],
    "Ghana": [46, 31],
    "Griechenland": [36, 24],
    "Griechenland - Athen": [40, 27],
    "Grossbritannien": [52, 35],
    "Grossbritannien - London": [66, 44],
    "Guatemala": [46, 31],
    "Guinea": [59, 40],
    "Guinea-Bissau": [32, 21],
    "Haiti": [58, 39],
    "Honduras": [57, 38],
    "Indien": [22, 15],
    "Indien - Bangalore": [42, 28],
    "Indien - Chennai": [22, 15],
    "Indien - Kalkutta": [32, 21],
    "Indien - Mumbai": [53, 36],
    "Indien - Neu Delhi": [46, 31],
    "Indonesien": [45, 30],
    "Iran": [33, 22],
    "Irland": [58, 39],
    "Island": [62, 41],
    "Israel": [66, 44],
    "Italien": [42, 28],
    "Italien - Mailand": [42, 28],
    "Italien - Rom": [48, 32],
    "Jamaika": [39, 26],
    "Japan": [33, 22],
    "Japan - Tokio": [50, 33],
    "Japan - Osaka": [33, 22],
    "Jemen": [24, 16],
    "Jordanien": [57, 38],
    "Kambodscha": [42, 28],
    "Kamerun": [56, 37],
    "Kanada": [54, 36],
    "Kanada - Ottawa": [62, 41],
    "Kanada - Toronto": [54, 36],
    "Kanada - Vancouver": [63, 42],
    "Kap Verde": [38, 25],
    "Kasachstan": [33, 22],
    "Katar": [56, 37],
    "Kenia": [51, 34],
    "Kirgisistan": [27, 18],
    "Kolumbien": [34, 23],
    "Kongo": [62, 41],
    "Kongo, Demokratische Republik": [65, 44],
    "Korea, Demokratische Volksrepublik": [28, 19],
    "Korea, Republik": [48, 32],
    "Kosovo": [24, 16],
    "Kroatien": [46, 31],
    "Kuba": [51, 34],
    "Kuwait": [56, 37],
    "Laos": [35, 24],
    "Lesotho": [28, 19],
    "Lettland": [35, 24],
    "Libyen": [63, 42],
    "Libanon": [69, 46],
    "Liberia": [65, 44],
    "Liechtenstein": [56, 37],
    "Litauen": [26, 17],
    "Luxemburg": [63, 42],
    "Madagaskar": [33, 22],
    "Malawi": [41, 28],
    "Malaysia": [36, 24],
    "Malediven": [70, 47],
    "Mali": [38, 25],
    "Malta": [46, 31],
    "Marokko": [41, 28],
    "Marshall Inseln": [63, 42],
    "Mauretanien": [35, 24],
    "Mauritius": [44, 29],
    "Mexiko": [48, 32],
    "Moldau": [26, 17],
    "Monaco": [52, 35],
    "Mongolei": [23, 16],
    "Montenegro": [32, 21],
    "Mosambik": [51, 34],
    "Myanmar": [23, 16],
    "Namibia": [30, 20],
    "Nepal": [36, 24],
    "Neuseeland": [58, 39],
    "Nicaragua": [46, 31],
    "Niederlande": [47, 32],
    "Niger": [42, 28],
    "Nigeria": [46, 31],
    "Nordmazedonien": [27, 18],
    "Norwegen": [75, 50],
    "Oesterreich": [50, 33],
    "Oman": [64, 43],
    "Pakistan": [34, 23],
    "Pakistan - Islamabad": [23, 16],
    "Palau": [51, 34],
    "Panama": [41, 28],
    "Papua-Neuguinea": [59, 40],
    "Paraguay": [39, 26],
    "Peru": [34, 23],
    "Philippinen": [41, 28],
    "Polen": [34, 23],
    "Polen - Breslau": [34, 23],
    "Polen - Warschau": [40, 27],
    "Portugal": [32, 21],
    "Ruanda": [44, 29],
    "Rumaenien": [27, 18],
    "Rumaenien - Bukarest": [32, 21],
    "Russland": [28, 19],
    "Russland - Moskau": [30, 20],
    "Russland - St. Petersburg": [28, 19],
    "Sambia": [38, 25],
    "Samoa": [39, 26],
    "San Marino": [34, 23],
    "Sao Tome und Principe": [36, 24],
    "Saudi-Arabien": [56, 37],
    "Saudi-Arabien - Djidda": [57, 38],
    "Saudi-Arabien - Riad": [56, 37],
    "Schweden": [66, 44],
    "Schweiz": [64, 43],
    "Schweiz - Genf": [66, 44],
    "Senegal": [42, 28],
    "Serbien": [27, 18],
    "Seychellen": [63, 42],
    "Sierra Leone": [57, 38],
    "Simbabwe": [63, 42],
    "Singapur": [71, 48],
    "Slowakei": [33, 22],
    "Slowenien": [38, 25],
    "Spanien": [34, 23],
    "Spanien - Barcelona": [34, 23],
    "Spanien - Kanarische Inseln": [36, 24],
    "Spanien - Madrid": [42, 28],
    "Spanien - Palma de Mallorca": [44, 29],
    "Sri Lanka": [36, 24],
    "Sudan": [33, 22],
    "Suedafrika": [29, 20],
    "Suedafrika - Kapstadt": [33, 22],
    "Suedafrika - Johannesburg": [36, 24],
    "Suedsudan": [51, 34],
    "Syrien": [38, 25],
    "Tadschikistan": [27, 18],
    "Taiwan": [51, 34],
    "Tansania": [44, 29],
    "Thailand": [36, 24],
    "Togo": [39, 26],
    "Tonga": [29, 20],
    "Trinidad und Tobago": [66, 44],
    "Tschad": [42, 28],
    "Tschechien": [32, 21],
    "Tunesien": [40, 27],
    "Tuerkei": [24, 16],
    "Tuerkei - Ankara": [32, 21],
    "Tuerkei - Izmir": [44, 29],
    "Turkmenistan": [28, 19],
    "Uganda": [41, 28],
    "Ukraine": [26, 17],
    "Ungarn": [32, 21],
    "Uruguay": [40, 27],
    "USA": [59, 40],
    "USA - Atlanta": [77, 52],
    "USA - Boston": [63, 42],
    "USA - Chicago": [65, 44],
    "USA - Houston": [62, 41],
    "USA - Los Angeles": [64, 43],
    "USA - Miami": [65, 44],
    "USA - New York": [66, 44],
    "USA - San Francisco": [59, 40],
    "USA - Washington": [66, 44],
    "Usbekistan": [34, 23],
    "Vatikanstadt": [48, 32],
    "Venezuela": [45, 30],
    "Vereinigte Arabische Emirate": [65, 44],
    "Vietnam": [36, 24],
    "Weissrussland": [20, 13],
    "Zentralafrikanische Republik": [53, 36],
    "Zypern": [42, 28]
};

// 2024 rates (same as 2025 for most countries, with some exceptions)
const ALLOWANCES_2024 = {
    ...ALLOWANCES_2025,
    // Override any 2024-specific rates here if they differ from 2025
    // Most rates are the same between 2024 and 2025
};

// 2023 rates (BMF-Schreiben vom 23.11.2022)
// Official rates from "Übersicht über die ab 1. Januar 2023 geltenden Pauschbeträge"
const ALLOWANCES_2023 = {
    "Deutschland": [28, 14],
    "Aegypten": [50, 33],
    "Aethiopien": [39, 26],
    "Aequatorialguinea": [36, 24],
    "Afghanistan": [30, 20],
    "Albanien": [27, 18],
    "Algerien": [47, 32],
    "Andorra": [41, 28],
    "Angola": [52, 35],
    "Argentinien": [35, 24],
    "Armenien": [24, 16],
    "Aserbaidschan": [44, 29],
    "Australien": [51, 34],
    "Australien - Canberra": [51, 34],
    "Australien - Sydney": [68, 45],
    "Bahrain": [48, 32],
    "Bangladesch": [50, 33],
    "Barbados": [52, 35],
    "Belgien": [59, 40],
    "Benin": [52, 35],
    "Bolivien": [46, 31],
    "Bosnien und Herzegowina": [23, 16],
    "Botsuana": [46, 31],
    "Brasilien": [51, 34],
    "Brasilien - Brasilia": [57, 38],
    "Brasilien - Rio de Janeiro": [57, 38],
    "Brasilien - Sao Paulo": [53, 36],
    "Brunei": [52, 35],
    "Bulgarien": [22, 15],
    "Burkina Faso": [38, 25],
    "Burundi": [36, 24],
    "Chile": [44, 29],
    "China": [48, 32],
    "China - Chengdu": [41, 28],
    "China - Hongkong": [74, 49],
    "China - Kanton": [36, 24],
    "China - Peking": [30, 20],
    "China - Shanghai": [58, 39],
    "Hongkong": [74, 49],
    "Costa Rica": [47, 32],
    "Elfenbeinkueste": [59, 40],
    "Daenemark": [75, 50],
    "Dominikanische Republik": [45, 30],
    "Dschibuti": [65, 44],
    "Ecuador": [27, 18],
    "El Salvador": [65, 44],
    "Eritrea": [50, 33],
    "Estland": [29, 20],
    "Fidschi": [34, 23],
    "Finnland": [50, 33],
    "Frankreich": [53, 36],
    "Frankreich - Paris": [58, 39],
    "Gabun": [52, 35],
    "Gambia": [40, 27],
    "Georgien": [35, 24],
    "Ghana": [46, 31],
    "Griechenland": [36, 24],
    "Griechenland - Athen": [40, 27],
    "Grossbritannien": [52, 35],
    "Grossbritannien - London": [66, 44],
    "Guatemala": [34, 23],
    "Guinea": [46, 31],
    "Guinea-Bissau": [32, 21],
    "Haiti": [58, 39],
    "Honduras": [57, 38],
    "Indien": [32, 21],
    "Indien - Bangalore": [42, 28],
    "Indien - Chennai": [32, 21],
    "Indien - Kalkutta": [35, 24],
    "Indien - Mumbai": [50, 33],
    "Indien - Neu Delhi": [38, 25],
    "Indonesien": [36, 24],
    "Iran": [33, 22],
    "Irland": [58, 39],
    "Island": [62, 41],
    "Israel": [66, 44],
    "Italien": [40, 27],
    "Italien - Mailand": [45, 30],
    "Italien - Rom": [40, 27],
    "Jamaika": [57, 38],
    "Japan": [52, 35],
    "Japan - Tokio": [66, 44],
    "Jemen": [24, 16],
    "Jordanien": [57, 38],
    "Kambodscha": [38, 25],
    "Kamerun": [50, 33],
    "Kanada": [47, 32],
    "Kanada - Ottawa": [47, 32],
    "Kanada - Toronto": [51, 34],
    "Kanada - Vancouver": [50, 33],
    "Kap Verde": [30, 20],
    "Kasachstan": [45, 30],
    "Katar": [56, 37],
    "Kenia": [51, 34],
    "Kirgisistan": [27, 18],
    "Kolumbien": [46, 31],
    "Kongo": [62, 41],
    "Kongo, Demokratische Republik": [70, 47],
    "Korea, Demokratische Volksrepublik": [28, 19],
    "Korea, Republik": [48, 32],
    "Kosovo": [24, 16],
    "Kroatien": [35, 24],
    "Kuba": [46, 31],
    "Kuwait": [56, 37],
    "Laos": [33, 22],
    "Lesotho": [28, 19],
    "Lettland": [35, 24],
    "Libanon": [59, 40],
    "Libyen": [63, 42],
    "Liechtenstein": [56, 37],
    "Litauen": [26, 17],
    "Luxemburg": [63, 42],
    "Madagaskar": [34, 23],
    "Malawi": [41, 28],
    "Malaysia": [36, 24],
    "Malediven": [52, 35],
    "Mali": [38, 25],
    "Malta": [46, 31],
    "Marokko": [42, 28],
    "Marshall Inseln": [63, 42],
    "Mauretanien": [35, 24],
    "Mauritius": [54, 36],
    "Mexiko": [48, 32],
    "Moldau": [26, 17],
    "Monaco": [52, 35],
    "Mongolei": [27, 18],
    "Montenegro": [32, 21],
    "Mosambik": [38, 25],
    "Myanmar": [35, 24],
    "Namibia": [30, 20],
    "Nepal": [36, 24],
    "Neuseeland": [56, 37],
    "Nicaragua": [46, 31],
    "Niederlande": [47, 32],
    "Niger": [42, 28],
    "Nigeria": [46, 31],
    "Nordmazedonien": [27, 18],
    "Norwegen": [80, 53],
    "Oesterreich": [40, 27],
    "Oman": [64, 43],
    "Pakistan": [34, 23],
    "Pakistan - Islamabad": [23, 16],
    "Palau": [51, 34],
    "Panama": [41, 28],
    "Papua-Neuguinea": [59, 40],
    "Paraguay": [38, 25],
    "Peru": [34, 23],
    "Philippinen": [33, 22],
    "Polen": [29, 20],
    "Polen - Breslau": [33, 22],
    "Polen - Danzig": [30, 20],
    "Polen - Krakau": [27, 18],
    "Polen - Warschau": [29, 20],
    "Portugal": [32, 21],
    "Ruanda": [44, 29],
    "Rumaenien": [27, 18],
    "Rumaenien - Bukarest": [32, 21],
    "Russland": [24, 16],
    "Russland - Jekaterinburg": [28, 19],
    "Russland - Moskau": [30, 20],
    "Russland - St. Petersburg": [26, 17],
    "Sambia": [38, 25],
    "Samoa": [39, 26],
    "San Marino": [34, 23],
    "Sao Tome und Principe": [47, 32],
    "Saudi-Arabien": [56, 37],
    "Saudi-Arabien - Djidda": [57, 38],
    "Saudi-Arabien - Riad": [56, 37],
    "Schweden": [66, 44],
    "Schweiz": [64, 43],
    "Schweiz - Genf": [66, 44],
    "Senegal": [42, 28],
    "Serbien": [27, 18],
    "Sierra Leone": [48, 32],
    "Simbabwe": [45, 30],
    "Singapur": [54, 36],
    "Slowakei": [33, 22],
    "Slowenien": [38, 25],
    "Spanien": [34, 23],
    "Spanien - Barcelona": [34, 23],
    "Spanien - Kanarische Inseln": [40, 27],
    "Spanien - Madrid": [40, 27],
    "Spanien - Palma de Mallorca": [35, 24],
    "Sri Lanka": [42, 28],
    "Sudan": [33, 22],
    "Suedafrika": [29, 20],
    "Suedafrika - Kapstadt": [33, 22],
    "Suedafrika - Johannesburg": [36, 24],
    "Suedsudan": [34, 23],
    "Syrien": [38, 25],
    "Tadschikistan": [27, 18],
    "Taiwan": [46, 31],
    "Tansania": [44, 29],
    "Thailand": [38, 25],
    "Togo": [39, 26],
    "Tonga": [39, 26],
    "Trinidad und Tobago": [45, 30],
    "Tschad": [64, 43],
    "Tschechien": [32, 21],
    "Tuerkei": [17, 12],
    "Tuerkei - Istanbul": [26, 17],
    "Tuerkei - Izmir": [29, 20],
    "Tunesien": [40, 27],
    "Turkmenistan": [33, 22],
    "Uganda": [41, 28],
    "Ukraine": [26, 17],
    "Ungarn": [32, 21],
    "Uruguay": [48, 32],
    "USA": [59, 40],
    "USA - Atlanta": [77, 52],
    "USA - Boston": [63, 42],
    "USA - Chicago": [65, 44],
    "USA - Houston": [62, 41],
    "USA - Los Angeles": [64, 43],
    "USA - Miami": [65, 44],
    "USA - New York": [66, 44],
    "USA - San Francisco": [59, 40],
    "USA - Washington": [66, 44],
    "Usbekistan": [34, 23],
    "Vatikanstadt": [52, 35],
    "Venezuela": [45, 30],
    "Vereinigte Arabische Emirate": [65, 44],
    "Vietnam": [41, 28],
    "Weissrussland": [20, 13],
    "Zentralafrikanische Republik": [46, 31],
    "Zypern": [42, 28]
};

// Map of years to their allowance tables
const ALLOWANCES_BY_YEAR = {
    2025: ALLOWANCES_2025,
    2024: ALLOWANCES_2024,
    2023: ALLOWANCES_2023
};

// Default year if none specified (use latest)
const DEFAULT_YEAR = 2025;

// For backwards compatibility - use 2025 rates as default
const ALLOWANCES = ALLOWANCES_2025;

// Get allowance rates for a country
// Returns { fullDay, partialDay } or Luxemburg rates as fallback (per BMF regulation)
function getAllowance(country, year = DEFAULT_YEAR) {
    const allowanceTable = ALLOWANCES_BY_YEAR[year] || ALLOWANCES_BY_YEAR[DEFAULT_YEAR];
    const rates = allowanceTable[country] || allowanceTable["Luxemburg"] || [63, 42];
    return { fullDay: rates[0], partialDay: rates[1] };
}

// Country name mapping (from airports.js names to allowances.js names)
const COUNTRY_NAME_MAP = {
    "Ägypten": "Aegypten",
    "Äthiopien": "Aethiopien",
    "Österreich": "Oesterreich",
    "Großbritannien": "Grossbritannien",
    "Türkei": "Tuerkei",
    "Südafrika": "Suedafrika",
    "Südkorea": "Korea, Republik",
    "VAE": "Vereinigte Arabische Emirate",
    "Dom. Republik": "Dominikanische Republik",
    "Curaçao": "Niederlande",
    "Sint Maarten": "Niederlande",
    "Aruba": "Niederlande",
    "Trinidad": "Trinidad und Tobago",
    "Moldawien": "Moldau",
    "Rumänien": "Rumaenien",
    "Dänemark": "Daenemark",
    "Äquatorialguinea": "Aequatorialguinea",
    "Aequatorialguinea": "Aequatorialguinea",
    // City-specific mappings (airports.js uses hyphens, allowances.js uses " - ")
    "USA-New York Staat": "USA - New York",
    "USA-Chicago": "USA - Chicago",
    "Indien-Mumbai": "Indien - Mumbai",
    "Indien-Chennai": "Indien - Chennai",
    "Saudi-Arabien-Riad": "Saudi-Arabien - Riad",
    "Südafrika-Kapstadt": "Suedafrika - Kapstadt"
};

// Normalize country name for allowance lookup
function normalizeCountryName(country) {
    if (!country) return "Deutschland";
    return COUNTRY_NAME_MAP[country] || country;
}

// Get daily allowance rates for a country
// Returns [fullDay, partialDay] array
// Now accepts an optional year parameter
function getDailyAllowance(country, year = DEFAULT_YEAR) {
    const normalizedCountry = normalizeCountryName(country);
    const allowanceTable = ALLOWANCES_BY_YEAR[year] || ALLOWANCES_BY_YEAR[DEFAULT_YEAR];
    // Per BMF: For countries not in the list, use Luxemburg rates
    return allowanceTable[normalizedCountry] || allowanceTable["Luxemburg"] || [63, 42];
}

// Convert twelfths to hours (12 twelfths = 24 hours)
function twelfthsToHours(twelfths) {
    return (twelfths / 12) * 24;
}

// Format hours for display (e.g., "8h" or "12h 30m")
function formatHours(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) {
        return `${h}h`;
    }
    return `${h}h ${m}m`;
}

// Calculate applicable rate based on whether it's a flight day
// German tax law (Verpflegungspauschale):
// - Flight day (arrival/departure): ALWAYS partial rate (An-/Abreisetag)
// - Non-flight day abroad: ALWAYS full rate (24h abroad)
//
// Key insight: Any day with a flight cannot have 24h abroad,
// so flight days always get the partial rate.
// Now accepts an optional year parameter
function getApplicableRate(country, hours, isFlightDay = false, year = DEFAULT_YEAR) {
    const rates = getDailyAllowance(country, year);
    
    // Flight days (arrival/departure) always get partial rate
    if (isFlightDay) {
        return rates[1]; // partialDay rate
    }
    
    // Non-flight days abroad get full rate (24h)
    return rates[0]; // fullDay rate
}

// Get the list of supported years
function getSupportedYears() {
    return Object.keys(ALLOWANCES_BY_YEAR).map(Number).sort((a, b) => b - a);
}

// Check if a year is supported
function isYearSupported(year) {
    return ALLOWANCES_BY_YEAR.hasOwnProperty(year);
}

// Trinkgeld (Tip) Pauschale per hotel night
// These are the recognized tax-deductible amounts for tips in hotels per day of stay
// Source: German tax guidelines for business travel expenses (Werbungskosten)
// Standard pauschale for flight crew: 3.60 € per overnight stay abroad
const TRINKGELD_PAUSCHALE = {
    2025: 3.60,  // EUR per night
    2024: 3.60,
    2023: 3.60
};

// Get Trinkgeld pauschale for a specific year
function getTrinkgeldPauschale(year = DEFAULT_YEAR) {
    return TRINKGELD_PAUSCHALE[year] || TRINKGELD_PAUSCHALE[DEFAULT_YEAR] || 1.00;
}

// Get all supported years for Trinkgeld
function getTrinkgeldSupportedYears() {
    return Object.keys(TRINKGELD_PAUSCHALE).map(Number).sort((a, b) => b - a);
}

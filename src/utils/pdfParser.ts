// PDF parsing utilities for Flugstundenübersicht and Streckeneinsatzabrechnung

import type {
  Flight,
  NonFlightDay,
  PersonalInfo,
  ReimbursementData,
  UploadedFile,
  DataWarning,
} from '../types';
import { getCountryFromAirport } from './airports';

/**
 * Safely parse a date and validate it's not Invalid Date
 */
function parseAndValidateDate(year: number, month: number, day: number): Date | null {
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  // Check if the date rolled over (e.g., Feb 30 -> Mar 2)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

// Lazy load PDF.js for code splitting
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfjs() {
  if (!pdfjsLib) {
    try {
      pdfjsLib = await import('pdfjs-dist');
      // Configure PDF.js worker - use bundled worker via CDN for reliability
      // In production, this could be replaced with a locally bundled worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    } catch (error) {
      throw new Error(`PDF library initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  return pdfjsLib;
}

/**
 * Extract text content from a PDF file
 */
async function extractTextFromPDF(file: File): Promise<string[]> {
  try {
    const pdfjs = await getPdfjs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    const textContent: string[] = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // Join with empty string to preserve original spacing from PDF (matches backup_old behavior)
      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join('');
      textContent.push(pageText);
    }
    
    return textContent;
  } catch (error) {
    throw new Error(`PDF text extraction failed for "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse Flugstundenübersicht PDF
 * This document contains flight times and duty information
 */
export async function parseFlugstundenPDF(file: File): Promise<{
  personalInfo: PersonalInfo | null;
  flights: Flight[];
  nonFlightDays: NonFlightDay[];
  fileInfo: UploadedFile;
  warnings: DataWarning[];
}> {
  // Capture filename immediately to ensure it's preserved throughout async operations
  const fileName = file.name;
  const textPages = await extractTextFromPDF(file);
  const fullText = textPages.join('\n');
  
  const flights: Flight[] = [];
  const nonFlightDays: NonFlightDay[] = [];
  const warnings: DataWarning[] = [];
  
  // Extract personal info
  const personalInfo = extractPersonalInfo(fullText);
  
  // Extract year and month from document header
  // PDF format: "Monat 01 / 2025" or "Monat 1 / 2025"
  let year = new Date().getFullYear();
  let month = 1;
  
  // Try to find month/year in document header/title area (first 500 chars)
  const headerText = fullText.slice(0, 500);
  
  // First try to find "Monat XX / YYYY" pattern (numeric month/year format)
  const monatPattern = /Monat\s*(\d{1,2})\s*\/\s*(\d{4})/i;
  const monatMatch = headerText.match(monatPattern);
  if (monatMatch) {
    const extractedMonth = parseInt(monatMatch[1], 10);
    const extractedYear = parseInt(monatMatch[2], 10);
    if (extractedMonth >= 1 && extractedMonth <= 12) {
      month = extractedMonth;
    }
    if (extractedYear >= 2020 && extractedYear <= 2030) {
      year = extractedYear;
    }
  } else {
    // Fall back to German month names
    const monthNames = ['januar', 'februar', 'märz', 'april', 'mai', 'juni', 
      'juli', 'august', 'september', 'oktober', 'november', 'dezember'];
    
    for (let i = 0; i < monthNames.length; i++) {
      const pattern = new RegExp(`\\b${monthNames[i]}\\b`, 'i');
      if (pattern.test(headerText)) {
        month = i + 1;
        break;
      }
    }
    
    // Try to find a reasonable year (2020-2030) in the header
    const yearPattern = /\b(20[2-3]\d)\b/;
    const yearMatch = headerText.match(yearPattern);
    if (yearMatch) {
      year = parseInt(yearMatch[1], 10);
    }
  }
  
  // If still not found, try to extract from first flight date (DD.MM. format)
  if (month === 1) {
    // Look for flight dates in format "DD.MM." at the start of lines
    const datePattern = /(?:^|\n)(\d{2})\.(\d{2})\./;
    const dateMatch = fullText.match(datePattern);
    if (dateMatch) {
      const extractedMonth = parseInt(dateMatch[2], 10);
      if (extractedMonth >= 1 && extractedMonth <= 12) {
        month = extractedMonth;
      }
    }
  }
  
  // Parse flight entries
  // Actual PDF format from Lufthansa Flugstundenübersicht:
  // "01.12. LH9141 FRA 09:55-13:55 FRA 00 4,00"
  // "07.12. LH0590 A FRA 10:59-19:21 NBO 00 8,37"
  // Continuation format: "01.04. LH0576/31 FRA 00:00-08:20 CPT 00 8,33" (flight continues from day 31 of previous month)
  // Pattern: DD.MM. LH#### [A|E]? FROM HH:MM-HH:MM TO 00 BLOCKTIME
  // Note: After PDF.js extraction with join(''), text has no spaces between items
  const flightPattern = /(\d{2})\.(\d{2})\.\s*(LH\d+[A-Z]?(?:\/(?:28|29|30|31))?)\s+([AE]\s+)?([A-Z]{3})\s*(\d{2}:\d{2})-(\d{2}:\d{2})\s*([A-Z]{3})\s+\d+\s+([\d,]+)/g;
  
  let match;
  while ((match = flightPattern.exec(fullText)) !== null) {
    const [, day, monthNum, flightNumber, aeFlag, departure, depTime, arrTime, arrival, blockTimeStr] = match;
    
    const parsedDay = parseInt(day, 10);
    const parsedMonth = parseInt(monthNum, 10);
    const flightDate = parseAndValidateDate(year, parsedMonth, parsedDay);
    
    if (!flightDate) {
      warnings.push({
        id: `invalid-date-flight-${day}-${monthNum}-${year}`,
        type: 'data_quality',
        severity: 'warning',
        message: `Ungültiges Datum übersprungen: ${day}.${monthNum}.${year}`,
        details: `Flug ${flightNumber} konnte nicht verarbeitet werden, da das Datum ungültig ist.`,
        dismissible: true,
      });
      continue;
    }
    
    const flightMonth = flightDate.getMonth() + 1;
    
    // Check for continuation flight (e.g., LH123/31)
    const isContinuation = flightNumber.includes('/');
    const continuationOf = isContinuation 
      ? flightNumber.split('/')[0] 
      : undefined;
    
    // Parse block time from document format (e.g., "4,00" -> "4:00")
    const blockTime = blockTimeStr 
      ? blockTimeStr.replace(',', ':').replace('.', ':')
      : '0:00';
    
    // Parse A/E flag (duty code indicating commute)
    const dutyCode = aeFlag ? aeFlag.trim() : undefined;
    
    const flight: Flight = {
      id: `${flightDate.toISOString()}-${flightNumber}`,
      date: flightDate,
      month: flightMonth,
      year: flightDate.getFullYear(),
      flightNumber: isContinuation ? flightNumber.split('/')[0] : flightNumber,
      departure,
      arrival,
      departureTime: depTime,
      arrivalTime: arrTime,
      blockTime,
      dutyCode,
      isContinuation,
      continuationOf,
      country: getCountryFromAirport(arrival),
    };
    
    flights.push(flight);
    
    // Warn about orphaned continuation flights
    if (isContinuation) {
      const hasParent = flights.some(
        (f) => f.flightNumber === continuationOf && 
               f.date.toISOString().split('T')[0] === flightDate.toISOString().split('T')[0]
      );
      if (!hasParent) {
        warnings.push({
          id: `orphan-${flight.id}`,
          type: 'orphaned_continuation',
          severity: 'warning',
          message: `Fortsetzungsflug ${flightNumber} ohne Ausgangsflug gefunden`,
          details: `Der Flug ${flightNumber} am ${day}.${monthNum}. scheint eine Fortsetzung zu sein, aber der Ausgangsflug wurde nicht gefunden. Möglicherweise fehlt die Flugstundenübersicht des Vormonats.`,
          dismissible: true,
        });
      }
    }
  }
  
  // Parse ME (Medical) days
  // PDF format: "27.01.ME MEDICAL" (items joined without separator after PDF.js extraction)
  const meStatusPattern = /(\d{2})\.(\d{2})\.[\s\n]*ME[\s\n]+MEDICAL/g;
  
  while ((match = meStatusPattern.exec(fullText)) !== null) {
    const [, day, monthNum] = match;
    const parsedDay = parseInt(day, 10);
    const parsedMonth = parseInt(monthNum, 10);
    const dayDate = parseAndValidateDate(year, parsedMonth, parsedDay);
    
    if (!dayDate) continue;
    
    const dateStr = dayDate.toISOString().split('T')[0];
    const hasFlights = flights.some((f) => f.date.toISOString().split('T')[0] === dateStr);
    if (hasFlights) continue;
    
    const alreadyExists = nonFlightDays.some((d) => d.id === `${dateStr}-ME`);
    if (!alreadyExists) {
      nonFlightDays.push({
        id: `${dateStr}-ME`,
        date: dayDate,
        month: dayDate.getMonth() + 1,
        year: dayDate.getFullYear(),
        type: 'ME',
        description: getDutyDescription('ME'),
      });
    }
  }
  
  // Parse ground duty days (EM, RE, DP, DT, SI, TK, SB)
  const groundDutyPatterns = [
    { pattern: /(\d{2})\.(\d{2})\.[\s\n]*EM[\s\n]+EMERGENCY-TRAINING/g, type: 'EM' as const },
    { pattern: /(\d{2})\.(\d{2})\.[\s\n]*RE[\s\n]+BEREITSCHAFT \(RESERVE\)/g, type: 'RE' as const },
    { pattern: /(\d{2})\.(\d{2})\.[\s\n]*DP[\s\n]+BUERODIENST/g, type: 'DP' as const },
    { pattern: /(\d{2})\.(\d{2})\.[\s\n]*DT[\s\n]+BUERODIENST/g, type: 'DT' as const },
    { pattern: /(\d{2})\.(\d{2})\.[\s\n]*SI[\s\n]+SIMULATOR/g, type: 'SI' as const },
    { pattern: /(\d{2})\.(\d{2})\.[\s\n]*TK[\s\n]+KURZSCHULUNG/g, type: 'TK' as const },
    { pattern: /(\d{2})\.(\d{2})\.[\s\n]*SB[\s\n]+BEREITSCHAFT \(STANDBY\)/g, type: 'SB' as const },
  ];
  
  for (const { pattern, type } of groundDutyPatterns) {
    let groundMatch;
    while ((groundMatch = pattern.exec(fullText)) !== null) {
      const [, day, monthNum] = groundMatch;
      const parsedDay = parseInt(day, 10);
      const parsedMonth = parseInt(monthNum, 10);
      const dayDate = parseAndValidateDate(year, parsedMonth, parsedDay);
      
      if (!dayDate) continue;
      
      const dateStr = dayDate.toISOString().split('T')[0];
      const alreadyExists = nonFlightDays.some((d) => d.id === `${dateStr}-${type}`);
      if (!alreadyExists) {
        nonFlightDays.push({
          id: `${dateStr}-${type}`,
          date: dayDate,
          month: dayDate.getMonth() + 1,
          year: dayDate.getFullYear(),
          type,
          description: getDutyDescription(type),
        });
      }
    }
  }
  
  // Parse FL (abroad/layover) days
  // PDF format: "02.01.FL STRECKENEINSATZTAG"
  const flStatusPattern = /(\d{2})\.(\d{2})\.[\s\n]*FL[\s\n]+STRECKENEINSATZTAG/g;
  
  while ((match = flStatusPattern.exec(fullText)) !== null) {
    const [, day, monthNum] = match;
    const parsedDay = parseInt(day, 10);
    const parsedMonth = parseInt(monthNum, 10);
    const dayDate = parseAndValidateDate(year, parsedMonth, parsedDay);
    
    if (!dayDate) continue;
    
    const dateStr = dayDate.toISOString().split('T')[0];
    const hasFlights = flights.some((f) => f.date.toISOString().split('T')[0] === dateStr);
    if (hasFlights) continue;
    
    const alreadyExists = nonFlightDays.some((d) => d.id === `${dateStr}-FL`);
    if (!alreadyExists) {
      // Try to determine the location from surrounding flights
      const flDate = dayDate.getTime();
      const nextFlight = flights
        .filter((f) => f.date.getTime() > flDate)
        .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
      
      let country: string | undefined;
      if (nextFlight && nextFlight.country !== 'DE') {
        country = nextFlight.country;
      }
      
      nonFlightDays.push({
        id: `${dateStr}-FL`,
        date: dayDate,
        month: dayDate.getMonth() + 1,
        year: dayDate.getFullYear(),
        type: 'FL',
        description: getDutyDescription('FL'),
        country,
      });
    }
  }
  
  const fileInfo: UploadedFile = {
    id: `flugstunden-${year}-${month}-${Date.now()}`,
    name: fileName,
    type: 'flugstunden',
    month,
    year,
    uploadedAt: new Date(),
  };
  
  return { personalInfo, flights, nonFlightDays, fileInfo, warnings };
}

/**
 * Parse Streckeneinsatzabrechnung PDF
 * This document contains reimbursement/allowance data
 */
export async function parseStreckeneinsatzPDF(file: File): Promise<{
  reimbursementData: ReimbursementData;
  fileInfo: UploadedFile;
}> {
  // Capture filename immediately to ensure it's preserved throughout async operations
  const fileName = file.name;
  const textPages = await extractTextFromPDF(file);
  const fullText = textPages.join('\n');
  
  // Extract year and month
  // For Streckeneinsatzabrechnung, the month/year is typically in the filename (e.g., "2025-01.pdf")
  let year = new Date().getFullYear();
  let month = 1;
  
  // First try to extract from filename (format: "YYYY-MM" or "YYYY-M")
  const filenamePattern = /(\d{4})-(\d{1,2})/;
  const filenameMatch = fileName.match(filenamePattern);
  if (filenameMatch) {
    const extractedYear = parseInt(filenameMatch[1], 10);
    const extractedMonth = parseInt(filenameMatch[2], 10);
    if (extractedYear >= 2020 && extractedYear <= 2030) {
      year = extractedYear;
    }
    if (extractedMonth >= 1 && extractedMonth <= 12) {
      month = extractedMonth;
    }
  } else {
    // Fall back to searching in document text
    const headerText = fullText.slice(0, 500);
    
    // Try to find "Monat XX / YYYY" pattern
    const monatPattern = /Monat\s*(\d{1,2})\s*\/\s*(\d{4})/i;
    const monatMatch = headerText.match(monatPattern);
    if (monatMatch) {
      const extractedMonth = parseInt(monatMatch[1], 10);
      const extractedYear = parseInt(monatMatch[2], 10);
      if (extractedMonth >= 1 && extractedMonth <= 12) {
        month = extractedMonth;
      }
      if (extractedYear >= 2020 && extractedYear <= 2030) {
        year = extractedYear;
      }
    } else {
      // Fall back to German month names
      const monthNames = ['januar', 'februar', 'märz', 'april', 'mai', 'juni', 
        'juli', 'august', 'september', 'oktober', 'november', 'dezember'];
      
      for (let i = 0; i < monthNames.length; i++) {
        if (fullText.toLowerCase().includes(monthNames[i])) {
          month = i + 1;
          break;
        }
      }
      
      // Try to find a reasonable year (2020-2030) in the header
      const yearPattern = /\b(20[2-3]\d)\b/;
      const yearMatch = headerText.match(yearPattern);
      if (yearMatch) {
        year = parseInt(yearMatch[1], 10);
      }
    }
  }
  
  // Extract tax-free reimbursement amount
  // Look for patterns like "steuerfreie Erstattung: 123,45 €" or "Steuerfrei: 123.45"
  const reimbursementPatterns = [
    /steuerfrei[e\s]*(?:Erstattung)?[:\s]*(\d+[.,]\d{2})/i,
    /Erstattung[:\s]*(\d+[.,]\d{2})/i,
    /Verpflegung[:\s]*(\d+[.,]\d{2})/i,
  ];
  
  let taxFreeReimbursement = 0;
  for (const pattern of reimbursementPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      taxFreeReimbursement = parseFloat(match[1].replace(',', '.'));
      break;
    }
  }
  
  // Extract day counts if available
  let domesticDays8h = 0;
  let domesticDays24h = 0;
  const foreignDays: { country: string; days: number; rate: number }[] = [];
  
  // Try to parse specific day counts
  const days8hMatch = fullText.match(/>?\s*8\s*(?:Std|h)[:\s]*(\d+)/i);
  if (days8hMatch) {
    domesticDays8h = parseInt(days8hMatch[1], 10);
  }
  
  const days24hMatch = fullText.match(/24\s*(?:Std|h)[:\s]*(\d+)/i);
  if (days24hMatch) {
    domesticDays24h = parseInt(days24hMatch[1], 10);
  }
  
  const reimbursementData: ReimbursementData = {
    month,
    year,
    taxFreeReimbursement,
    domesticDays8h,
    domesticDays24h,
    foreignDays,
  };
  
  const fileInfo: UploadedFile = {
    id: `streckeneinsatz-${year}-${month}-${Date.now()}`,
    name: fileName,
    type: 'streckeneinsatz',
    month,
    year,
    uploadedAt: new Date(),
  };
  
  return { reimbursementData, fileInfo };
}

/**
 * Extract personal info from document text
 */
function extractPersonalInfo(text: string): PersonalInfo | null {
  // Try to extract name
  const namePatterns = [
    /Name[:\s]+([A-ZÄÖÜa-zäöüß\s]+?)(?:\s+\d|$)/,
    /([A-Z][a-zäöüß]+,\s+[A-Z][a-zäöüß]+)/,
  ];
  
  let name = '';
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) {
      name = match[1].trim();
      break;
    }
  }
  
  // Extract personnel number
  const personnelMatch = text.match(/(?:Personal|PNr|Mitarbeiter)[:\s#]*(\d{5,8})/i);
  const personnelNumber = personnelMatch ? personnelMatch[1] : '';
  
  // Extract cost center
  const costCenterMatch = text.match(/(?:Kostenstelle|KST)[:\s]*([A-Z0-9]+)/i);
  const costCenter = costCenterMatch ? costCenterMatch[1] : '';

  // Extract company
  const companyPatterns = [
    /Gesellschaft[:\s]*([A-ZÄÖÜa-zäöüß0-9.\s&/-]+?)(?=Name|Personal|Dienststelle|Funktion|Muster|Hinweise|$)/i,
    /Firma[:\s]*([A-ZÄÖÜa-zäöüß0-9.\s&/-]+?)(?=Name|Personal|Dienststelle|Funktion|Muster|Hinweise|$)/i,
  ];
  let company = '';
  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match) {
      company = match[1].trim();
      break;
    }
  }

  // Extract duty station
  const dutyStationMatch = text.match(
    /Dienststelle[:\s]*([A-Z0-9]+?)(?=Funktion|Muster|Hinweise|Name|Personal|$)/i
  );
  const dutyStation = dutyStationMatch ? dutyStationMatch[1].trim() : '';

  // Extract role/function
  const roleMatch = text.match(
    /Funktion[:\s]*([A-ZÄÖÜa-zäöüß0-9\s/.-]+?)(?=Muster|Hinweise|Dienststelle|Name|Personal|$)/i
  );
  const role = roleMatch ? roleMatch[1].trim() : '';

  // Extract aircraft type
  const aircraftMatch = text.match(/Muster[:\s]*([A-Z0-9-]+)(?=Hinweise|Dienststelle|Name|Personal|Funktion|$)/i);
  const aircraftType = aircraftMatch ? aircraftMatch[1].trim() : '';

  // Extract PK number
  const pkPatterns = [
    /PK\s*(?:Nr|Nummer|No\.?|#)?[:\s-]*([A-Z0-9]+)/i,
    /PK-Nummer[:\s-]*([A-Z0-9]+)/i,
  ];
  let pkNumber = '';
  for (const pattern of pkPatterns) {
    const match = text.match(pattern);
    if (match) {
      pkNumber = match[1].trim();
      break;
    }
  }

  // Extract document date (Erstellt am)
  const documentDateMatch = text.match(/Erstellt\s+am[:\s]*(\d{2}\.\d{2}\.\d{4})/i);
  const documentDate = documentDateMatch ? documentDateMatch[1] : '';

  // Extract sheet/page number (Blatt)
  const sheetMatch = text.match(/Blatt[:\s]*(\d+)/i);
  const sheetNumber = sheetMatch ? sheetMatch[1] : '';
  
  // Extract year
  const yearMatch = text.match(/\b(20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
  
  if (!name && !personnelNumber && !costCenter && !company && !dutyStation && !role && !aircraftType && !pkNumber && !documentDate && !sheetNumber) {
    return null;
  }
  
  return {
    name,
    personnelNumber,
    costCenter,
    year,
    company: company || undefined,
    dutyStation: dutyStation || undefined,
    role: role || undefined,
    aircraftType: aircraftType || undefined,
    pkNumber: pkNumber || undefined,
    documentDate: documentDate || undefined,
    sheetNumber: sheetNumber || undefined,
  };
}

/**
 * Get human-readable description for duty codes
 */
function getDutyDescription(code: string): string {
  const descriptions: Record<string, string> = {
    ME: 'Medizinische Untersuchung',
    FL: 'Auslandstag (Layover)',
    EM: 'Einsatzmeeting',
    RE: 'Reserve',
    DP: 'Dispatch',
    DT: 'Duty Time',
    SI: 'Simulator Training',
    TK: 'Technikkurs',
    SB: 'Standby',
    A: 'Fahrt zur Arbeit',
    E: 'Fahrt von Arbeit',
  };
  return descriptions[code] || code;
}

/**
 * Detect document type from filename and content
 */
export async function detectDocumentType(file: File): Promise<'flugstunden' | 'streckeneinsatz' | 'unknown'> {
  const filename = file.name.toLowerCase();
  
  // Check filename first
  if (filename.includes('flugstunden') || filename.includes('block')) {
    return 'flugstunden';
  }
  if (filename.includes('strecken') || filename.includes('einsatz') || filename.includes('abrechnung')) {
    return 'streckeneinsatz';
  }
  
  // Check content
  try {
    const textPages = await extractTextFromPDF(file);
    const fullText = textPages.join(' ').toLowerCase();
    
    if (fullText.includes('flugstunden') || fullText.includes('blockzeit')) {
      return 'flugstunden';
    }
    if (fullText.includes('streckeneinsatz') || fullText.includes('verpflegung')) {
      return 'streckeneinsatz';
    }
  } catch (error) {
    console.warn(`Document type detection failed for "${file.name}":`, error);
    // If PDF parsing fails, return unknown
  }
  
  return 'unknown';
}

/**
 * Check for duplicate file upload
 */
export function checkDuplicateFile(
  newFile: UploadedFile,
  existingFiles: UploadedFile[]
): DataWarning | null {
  const duplicate = existingFiles.find(
    (f) =>
      f.type === newFile.type &&
      f.month === newFile.month &&
      f.year === newFile.year
  );
  
  if (duplicate) {
    return {
      id: `duplicate-${newFile.id}`,
      type: 'duplicate_file',
      severity: 'warning',
      message: `Dokument für ${newFile.type === 'flugstunden' ? 'Flugstunden' : 'Streckeneinsatz'} ${newFile.month}/${newFile.year} bereits vorhanden`,
      details: `Die Datei "${newFile.name}" überschreibt die bestehende Datei "${duplicate.name}".`,
      dismissible: true,
    };
  }
  
  return null;
}

/**
 * Check for missing months in uploaded data
 */
export function checkMissingMonths(
  uploadedFiles: UploadedFile[]
): DataWarning[] {
  const warnings: DataWarning[] = [];
  
  const flugstundenFiles = uploadedFiles.filter((f) => f.type === 'flugstunden');
  const streckeneinsatzFiles = uploadedFiles.filter((f) => f.type === 'streckeneinsatz');
  
  if (flugstundenFiles.length === 0 || streckeneinsatzFiles.length === 0) {
    return warnings;
  }
  
  // Get all months covered
  const flugMonths = new Set(flugstundenFiles.map((f) => `${f.year}-${f.month}`));
  const streckMonths = new Set(streckeneinsatzFiles.map((f) => `${f.year}-${f.month}`));
  
  // Find min/max months
  const allMonths = [...flugMonths, ...streckMonths].sort();
  if (allMonths.length < 2) return warnings;
  
  const [minYear, minMonth] = allMonths[0].split('-').map(Number);
  const [maxYear, maxMonth] = allMonths[allMonths.length - 1].split('-').map(Number);
  
  // Check for gaps
  for (let y = minYear; y <= maxYear; y++) {
    const startM = y === minYear ? minMonth : 1;
    const endM = y === maxYear ? maxMonth : 12;
    
    for (let m = startM; m <= endM; m++) {
      const key = `${y}-${m}`;
      
      if (!flugMonths.has(key)) {
        warnings.push({
          id: `missing-flugstunden-${key}`,
          type: 'missing_month',
          severity: 'warning',
          message: `Flugstundenübersicht für ${m}/${y} fehlt`,
          dismissible: true,
        });
      }
      
      if (!streckMonths.has(key)) {
        warnings.push({
          id: `missing-streckeneinsatz-${key}`,
          type: 'missing_month',
          severity: 'warning',
          message: `Streckeneinsatzabrechnung für ${m}/${y} fehlt`,
          dismissible: true,
        });
      }
    }
  }
  
  return warnings;
}

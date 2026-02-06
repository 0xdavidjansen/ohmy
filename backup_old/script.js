// Initialize PDF.js worker (with error handling)
try {
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    } else {
        console.error('PDF.js library not loaded. Make sure you have internet connection.');
    }
} catch (e) {
    console.error('Error initializing PDF.js:', e);
}

function calculateAbsenceDuration(flight, isDepDay, fahrzeitMinutes) {
    const fahrzeit = fahrzeitMinutes / 60;
    if (isDepDay) {
        const depHour = parseTimeToHours(flight.departureTime);
        return (24 - depHour) + fahrzeit;
    } else {
        const arrHour = parseTimeToHours(flight.arrivalTime);
        return arrHour + fahrzeit;
    }
}

function parseTimeToHours(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h + m / 60;
}


// Wizard state
let currentWizardStep = 1;
const WIZARD_STEPS = 3;

// Global data store
const appData = {
    personalInfo: null,
    flights: [],
    expenses: [],
    monthlyData: {},
    countryData: {},
    yearlyTotals: {},
    // Days marked as "FL" (abroad/flight status) in Flugstundenübersicht
    // These indicate days when the crew member was abroad, even without flight data
    abroadDays: [], // Array of { date, day, month, year, status, location }
    // Days marked as "ME" (Medical) in Flugstundenübersicht
    // These indicate days when the crew member went to the airport for a medical examination
    // ME counts as a round trip (A + E) for Fahrten calculation
    medicalDays: [], // Array of { date, day, month, year }
    // Days marked as ground duty (EM, RE, DP, SI) in Flugstundenübersicht
    // EM = Emergency Training, RE = Reserve/Bereitschaft, DP = Bürodienst, SI = Simulator
    // These count as work days with A + E for Fahrten calculation
    groundDutyDays: [], // Array of { date, day, month, year, type }
    // Expense totals from Streckeneinsatzabrechnung Summe lines
    expenseTotals: { total: 0, werbko: 0, steuer: 0, taxFree: 0 },
    // Individual document summaries
    expenseSummaries: [],
    // Driving time to airport in minutes (for calculating absence duration)
    fahrzeitMinuten: 0
};

// DOM Elements (initialized after DOM is ready)
let fileInput, loadingOverlay;

// File handling
let processedFiles = [];
let fileUrls = {}; // Store blob URLs for opening files

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    fileInput = document.getElementById('fileInput');
    loadingOverlay = document.getElementById('loadingOverlay');
    
    // File input change handler
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });
    }
    
    // Filter change handlers
    const countryFilter = document.getElementById('countryFilter');
    if (countryFilter) countryFilter.addEventListener('change', updateFlightTable);
    
    // Expand/collapse all months button
    const expandAllBtn = document.getElementById('expandAllFlights');
    if (expandAllBtn) {
        expandAllBtn.addEventListener('click', toggleAllMonths);
    }
    
    // Month header click handlers (event delegation)
    const flightTable = document.getElementById('flightTable');
    if (flightTable) {
        flightTable.addEventListener('click', (e) => {
            const monthHeader = e.target.closest('.month-header');
            if (monthHeader) {
                toggleMonth(monthHeader.dataset.month);
            }
        });
    }
    
    // Distance input handler
    const distanceInput = document.getElementById('distanceInput');
    const oneWayCheckbox = document.getElementById('oneWayCheckbox');
    if (distanceInput) {
        distanceInput.addEventListener('input', () => {
            updateDistanceCalculation();
            updateMonthlyTable();
            updateEndabrechnung();
        });
    }
    if (oneWayCheckbox) {
        oneWayCheckbox.addEventListener('change', () => {
            updateDistanceCalculation();
            updateMonthlyTable();
            updateEndabrechnung();
        });
    }
    
    // Medical checkbox handler
    const medicalCheckbox = document.getElementById('medicalCheckbox');
    if (medicalCheckbox) {
        medicalCheckbox.addEventListener('change', () => {
            updateDistanceCalculation();
            updateReinigungCalculation();
            updateMonthlyTable();
            updateEndabrechnung();
        });
    }
    
    // Ground duty checkbox handler
    const groundDutyCheckbox = document.getElementById('groundDutyCheckbox');
    if (groundDutyCheckbox) {
        groundDutyCheckbox.addEventListener('change', () => {
            updateDistanceCalculation();
            updateReinigungCalculation();
            updateMonthlyTable();
            updateEndabrechnung();
        });
    }
    
    // Abroad days (FL) checkbox handler
    const abroadDaysCheckbox = document.getElementById('abroadDaysCheckbox');
    if (abroadDaysCheckbox) {
        abroadDaysCheckbox.addEventListener('change', () => {
            updateReinigungCalculation();
            updateMonthlyTable();
            updateEndabrechnung();
        });
    }
    
    // Reinigungskosten input handler
    const reinigungInput = document.getElementById('reinigungInput');
    if (reinigungInput) {
        reinigungInput.addEventListener('input', () => {
            updateReinigungCalculation();
            updateMonthlyTable();
            updateEndabrechnung();
        });
    }
    
    // Trinkgeld input handler
    const trinkgeldInput = document.getElementById('trinkgeldInput');
    if (trinkgeldInput) {
        trinkgeldInput.addEventListener('input', () => {
            updateTrinkgeldCalculation();
            updateMonthlyTable();
            updateEndabrechnung();
        });
    }

    // Fahrzeit input handler
    const fahrzeitInput = document.getElementById('fahrzeitInput');
    if (fahrzeitInput) {
        fahrzeitInput.addEventListener('change', function() {
            appData.fahrzeitMinuten = parseInt(this.value) || 0;
            updateMonthlyTable();
            updateEndabrechnung();
        });
    }

    // Warning banner close button handler
    const closeWarningBtn = document.getElementById('closeWarningBtn');
    if (closeWarningBtn) {
        closeWarningBtn.addEventListener('click', () => {
            const banner = document.getElementById('continuationWarningBanner');
            if (banner) {
                banner.style.display = 'none';
            }
        });
    }
    
    // Check if PDF.js loaded
    if (typeof pdfjsLib === 'undefined') {
        console.error('PDF.js konnte nicht geladen werden. Bitte starten Sie einen lokalen Server.');
    } else {
        console.log('Flugstunden Steuerrechner initialized');
    }
    
    // Show initial empty state for documents
    showEmptyState();

    // Ensure endabrechnung fields have safe defaults on load
    updateEndabrechnung();
    
    // Setup dynamic tooltip positioning
    setupTooltipPositioning();
    
    // Wizard navigation - wire up all continue/back buttons by their data attributes
    document.querySelectorAll('.wizard-continue[data-next-step]').forEach(btn => {
        btn.addEventListener('click', () => {
            const nextStep = parseInt(btn.dataset.nextStep);
            goToWizardStep(nextStep);
        });
    });
    document.querySelectorAll('.wizard-back[data-prev-step]').forEach(btn => {
        btn.addEventListener('click', () => {
            const prevStep = parseInt(btn.dataset.prevStep);
            goToWizardStep(prevStep);
        });
    });
    
    // Initialize wizard UI
    updateWizardUI();
    
    // Also set up upload dropzone click handler
    const uploadDropzone = document.getElementById('uploadDropzone');
    if (uploadDropzone && fileInput) {
        uploadDropzone.addEventListener('click', () => fileInput.click());
        uploadDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadDropzone.classList.add('drag-over');
        });
        uploadDropzone.addEventListener('dragleave', () => {
            uploadDropzone.classList.remove('drag-over');
        });
        uploadDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadDropzone.classList.remove('drag-over');
            handleFiles(e.dataTransfer.files);
        });
    }
});

// Handle uploaded files
async function handleFiles(files) {
    console.log('handleFiles called with', files.length, 'files');
    showLoading(true);
    
    let skippedFiles = [];
    
    for (const file of files) {
        console.log('Processing file:', file.name, 'Type:', file.type);
        
        // Check for duplicate file
        const alreadyImported = processedFiles.some(f => f.name === file.name);
        if (alreadyImported) {
            console.log('Skipping duplicate file:', file.name);
            skippedFiles.push(file.name);
            continue;
        }
        
        if (file.type === 'application/pdf') {
            try {
                const text = await extractPDFText(file);
                console.log('Extracted text length:', text.length);
                console.log('First 500 chars:', text.substring(0, 500));
                
                const docType = detectDocumentType(text);
                console.log('Detected document type:', docType);
                
                if (docType === 'flugstunden') {
                    parseFlugstunden(text);
                    console.log('Parsed flugstunden, flights:', appData.flights.length);
                } else if (docType === 'streckeneinsatz') {
                    parseStreckeneinsatz(text, file.name);
                    console.log('Parsed streckeneinsatz, expenseTotals:', appData.expenseTotals);
                } else {
                    console.warn('Unknown document type for:', file.name);
                    alert(`Dokumenttyp nicht erkannt: ${file.name}\n\nBitte laden Sie eine Flugstundenübersicht oder Streckeneinsatzabrechnung hoch.`);
                }
                
                // Store blob URL for opening the file later
                fileUrls[file.name] = URL.createObjectURL(file);
                
                addFileTag(file.name, docType);
                processedFiles.push({ name: file.name, type: docType });
            } catch (error) {
                console.error('Error processing PDF:', error);
                alert(`Fehler beim Verarbeiten: ${file.name}\n\n${error.message}`);
            }
        } else {
            console.warn('Not a PDF file:', file.name, file.type);
            alert(`Keine PDF-Datei: ${file.name}`);
        }
    }
    
    console.log('Monthly data:', appData.monthlyData);
    console.log('Flights:', appData.flights.length, 'Expenses:', appData.expenses.length);
    
    // Check for orphaned continuation flights (continuations without matching departure)
    checkOrphanedContinuations();
    
    // Show notification for skipped duplicate files
    if (skippedFiles.length > 0) {
        const fileList = skippedFiles.join('\\n• ');
        alert(`Folgende Dateien wurden bereits importiert und übersprungen:\\n\\n• ${fileList}`);
    }
    
    updateDisplay();
    showLoading(false);
}

// Extract text from PDF
async function extractPDFText(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // Join with empty string to preserve original spacing from PDF
        const pageText = textContent.items.map(item => item.str).join('');
        fullText += pageText + '\n';
    }
    
    console.log('Extracted PDF text:', fullText.substring(0, 1000));
    return fullText;
}

// Detect document type
function detectDocumentType(text) {
    if (text.includes('Flugstunden') && text.includes('Übersicht')) {
        return 'flugstunden';
    } else if (text.includes('Streckeneinsatz') && text.includes('Abrechnung')) {
        return 'streckeneinsatz';
    }
    return 'unknown';
}

// Parse Flugstundenübersicht
function parseFlugstunden(text) {
    // Extract personal info
    // Name pattern: capture "Lastname, Firstname" but stop before "Personalnummer" (no space in PDF)
    const nameMatch = text.match(/Name\s*([A-Za-zäöüÄÖÜß\-]+,\s*[A-Za-zäöüÄÖÜß\-]+?)(?=Personalnummer)/);
    const personnelMatch = text.match(/Personalnummer\s*(\d+)/);
    const functionMatch = text.match(/Funktion\s*([A-Z\/\s]+?)(?=\s*Muster|\s*$)/);
    const patternMatch = text.match(/Muster\s*([A-Z0-9]+)/);
    const monthYearMatch = text.match(/für Monat\s*(\d+)\s*\/\s*(\d+)/);
    
    console.log('Personal info matches:', { nameMatch, personnelMatch, functionMatch, patternMatch, monthYearMatch });
    
    if (nameMatch) {
        appData.personalInfo = {
            name: nameMatch[1],
            personnelNumber: personnelMatch ? personnelMatch[1] : '',
            function: functionMatch ? functionMatch[1].trim() : '',
            aircraft: patternMatch ? patternMatch[1] : ''
        };
        console.log('Personal info set:', appData.personalInfo);
    }
    
    const month = monthYearMatch ? parseInt(monthYearMatch[1]) : null;
    const year = monthYearMatch ? parseInt(monthYearMatch[2]) : null;
    console.log('Month/Year:', month, year);
    
    // Parse flight entries - updated pattern for actual PDF format
    // Actual format: "01.12. LH9141 FRA 09:55-13:55 FRA 00 4,00" or "07.12. LH0590 A FRA 10:59-19:21 NBO 00 8,37"
    // Continuation format: "01.04. LH0576/31 FRA 00:00-08:20 CPT 00 8,33" (flight continues from day 31 of previous month)
    // Pattern: DD.MM. LH#### [A|E]? [/28|/29|/30|/31]? FROM HH:MM-HH:MM TO 00 BLOCKTIME
    const flightPattern = /(\d{2})\.(\d{2})\.\s*(LH\d+[A-Z]?(?:\/(?:28|29|30|31))?)\s+([AE]\s+)?([A-Z]{3})\s*(\d{2}:\d{2})-(\d{2}:\d{2})\s*([A-Z]{3})\s+\d+\s+([\d,]+)/g;
    let match;
    
    console.log('Searching for flights with pattern...');
    
    while ((match = flightPattern.exec(text)) !== null) {
        const [fullMatch, day, monthNum, flightNum, aeFlag, from, depTime, arrTime, to, blockTimeStr] = match;
        console.log('Flight match found:', fullMatch);
        
        // Parse block time from document (more accurate than calculating)
        const blockTime = parseFloat(blockTimeStr.replace(',', '.'));
        
        // Calculate flight time as backup
        const [depH, depM] = depTime.split(':').map(Number);
        const [arrH, arrM] = arrTime.split(':').map(Number);
        let flightMinutes = (arrH * 60 + arrM) - (depH * 60 + depM);
        if (flightMinutes < 0) flightMinutes += 24 * 60; // Overnight flight
        
        // Parse A/E flag: A = Ankunft (arrived at airport = commute TO work)
        //                 E = Ende (left airport = commute FROM work)
        const commuteType = aeFlag ? aeFlag.trim() : null;
        
        // Parse continuation suffix (e.g., "LH0576/31" means continues from day 31)
        const continuationMatch = flightNum.match(/^(LH\d+[A-Z]?)\/(\d{2})$/);
        const isContinuation = !!continuationMatch;
        const baseFlightNumber = isContinuation ? continuationMatch[1] : flightNum;
        const continuesFromDay = isContinuation ? parseInt(continuationMatch[2]) : null;
        
        const flight = {
            date: `${day}.${monthNum}.${year}`,
            day: parseInt(day),
            month: parseInt(monthNum),
            year: year,
            flightNumber: baseFlightNumber,  // Store without /XX suffix
            originalFlightNumber: flightNum,  // Keep original with /XX
            isContinuation: isContinuation,
            continuesFromDay: continuesFromDay,
            from: from,
            to: to,
            departureTime: depTime,
            arrivalTime: arrTime,
            blockTime: blockTime,
            fromCountry: getCountry(from),
            toCountry: getCountry(to),
            fromCountryCode: getCountryCode(from),
            toCountryCode: getCountryCode(to),
            fromFlag: getFlag(from),
            toFlag: getFlag(to),
            commuteType: commuteType  // 'A' = to work, 'E' = from work, null = no commute marker
        };
        
        appData.flights.push(flight);
        console.log('Added flight:', flight);
    }
    
    // Update monthly data with total block time
    if (month && year) {
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        if (!appData.monthlyData[monthKey]) {
            appData.monthlyData[monthKey] = { flightHours: 0, missions: 0, taxFree: 0, taxable: 0 };
        }
        
        // Extract month total from MONAT - TOTAL (most accurate)
        const monthTotalMatch = text.match(/MONAT\s*-\s*TOTAL\s+([\d,]+)/);
        if (monthTotalMatch) {
            const hours = parseFloat(monthTotalMatch[1].replace(',', '.'));
            appData.monthlyData[monthKey].flightHours = hours;
        } else {
            // Fallback: Sum flight hours from parsed flights for this month
            const monthFlights = appData.flights.filter(f => f.month === month && f.year === year);
            appData.monthlyData[monthKey].flightHours = monthFlights.reduce((sum, f) => sum + f.blockTime, 0);
        }
        console.log('Monthly data updated:', monthKey, appData.monthlyData[monthKey]);
    }
    
    // Extract yearly cumulative (for reference only)
    const cumulativeMatch = text.match(/KUMULATIV\s*JAHR\s*([\d,\.]+)/);
    if (cumulativeMatch && year) {
        appData.yearlyTotals[year] = {
            flightHours: parseFloat(cumulativeMatch[1].replace(',', '.'))
        };
    }
    
    // Parse ME (Medical) status days from the Strecke column
    // ME indicates the crew member went for a medical examination (counts as A+E for commute)
    // PDF format: "27.01.ME MEDICAL" or "27.01.\nME\n MEDICAL"
    // After PDF.js extraction it becomes: "27.01.ME MEDICAL" (items joined without separator)
    const meStatusPattern = /(\d{2})\.(\d{2})\.[\s\n]*ME[\s\n]+MEDICAL/g;
    let meMatch;
    
    console.log('Searching for ME (Medical) days...');
    
    while ((meMatch = meStatusPattern.exec(text)) !== null) {
        const [fullMatch, day, monthNum] = meMatch;
        console.log('ME match found:', fullMatch);
        const dayNum = parseInt(day);
        const monthNumInt = parseInt(monthNum);
        const dateStr = `${day}.${monthNum}.${year}`;
        
        // Check if we already have this medical day
        const alreadyExists = appData.medicalDays.some(d => d.date === dateStr);
        if (!alreadyExists) {
            appData.medicalDays.push({
                date: dateStr,
                day: dayNum,
                month: monthNumInt,
                year: year
            });
            console.log('Added medical day (ME status):', dateStr);
        }
    }
    
    console.log('Total medical days found:', appData.medicalDays.length);
    
    // Parse ground duty days (EM, RE, DP, DT, SI, TK, SB) from the Strecke column
    // EM = Emergency Training, RE = Reserve/Bereitschaft, DP/DT = Bürodienst, SI = Simulator, TK = Kurzschulung, SB = Standby
    // These count as work days where the crew member went to the airport
    const groundDutyPatterns = [
        { pattern: /(\d{2})\.(\d{2})\.[\s\n]*EM[\s\n]+EMERGENCY-TRAINING/g, type: 'EM', name: 'Emergency Training' },
        { pattern: /(\d{2})\.(\d{2})\.[\s\n]*RE[\s\n]+BEREITSCHAFT \(RESERVE\)/g, type: 'RE', name: 'Reserve' },
        { pattern: /(\d{2})\.(\d{2})\.[\s\n]*DP[\s\n]+BUERODIENST/g, type: 'DP', name: 'Bürodienst' },
        { pattern: /(\d{2})\.(\d{2})\.[\s\n]*DT[\s\n]+BUERODIENST/g, type: 'DT', name: 'Bürodienst' },
        { pattern: /(\d{2})\.(\d{2})\.[\s\n]*SI[\s\n]+SIMULATOR/g, type: 'SI', name: 'Simulator' },
        { pattern: /(\d{2})\.(\d{2})\.[\s\n]*TK[\s\n]+KURZSCHULUNG/g, type: 'TK', name: 'Kurzschulung' },
        { pattern: /(\d{2})\.(\d{2})\.[\s\n]*SB[\s\n]+BEREITSCHAFT \(STANDBY\)/g, type: 'SB', name: 'Standby' }
    ];
    
    console.log('Searching for ground duty days (EM, RE, DP, DT, SI, TK, SB)...');
    
    for (const { pattern, type, name } of groundDutyPatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const [fullMatch, day, monthNum] = match;
            const dayNum = parseInt(day);
            const monthNumInt = parseInt(monthNum);
            const dateStr = `${day}.${monthNum}.${year}`;
            
            // Check if we already have this ground duty day
            const alreadyExists = appData.groundDutyDays.some(d => d.date === dateStr);
            if (!alreadyExists) {
                appData.groundDutyDays.push({
                    date: dateStr,
                    day: dayNum,
                    month: monthNumInt,
                    year: year,
                    type: type
                });
                console.log(`Added ground duty day (${type} - ${name}):`, dateStr);
            }
        }
    }
    
    console.log('Total ground duty days found:', appData.groundDutyDays.length);
    
    // Parse FL (Flight/abroad) status days from the Strecke column
    // FL indicates the crew member was abroad on that day (layover)
    // We need to determine which country they were in based on the next flight that returns to Germany
    // PDF format: "02.01.FL STRECKENEINSATZTAG"
    const flStatusPattern = /(\d{2})\.(\d{2})\.[\s\n]*FL[\s\n]+STRECKENEINSATZTAG/g;
    let flMatch;
    
    // First collect all FL days
    const flDays = [];
    while ((flMatch = flStatusPattern.exec(text)) !== null) {
        const [, day, monthNum] = flMatch;
        const dayNum = parseInt(day);
        const monthNumInt = parseInt(monthNum);
        const dateStr = `${day}.${monthNum}.${year}`;
        
        // Only add if this date doesn't already have a flight entry
        const hasFlightOnDate = appData.flights.some(f => f.date === dateStr);
        
        if (!hasFlightOnDate) {
            flDays.push({
                date: dateStr,
                day: dayNum,
                month: monthNumInt,
                year: year,
                status: 'FL'
            });
        }
    }
    
    // Now determine the abroad location for each FL day
    // Look at the flights to find where the person was
    // The FL day's location is determined by the first flight AFTER the FL day that departs from abroad
    // (i.e., the return flight or continuing flight from that location)
    for (const flDay of flDays) {
        const flDate = new Date(flDay.year, flDay.month - 1, flDay.day);
        
        // Find the first flight after this FL day
        const nextFlight = appData.flights
            .filter(f => {
                const fDate = new Date(f.year, f.month - 1, f.day);
                return fDate > flDate;
            })
            .sort((a, b) => {
                const dateA = new Date(a.year, a.month - 1, a.day);
                const dateB = new Date(b.year, b.month - 1, b.day);
                return dateA - dateB;
            })[0];
        
        let location = null;
        let country = null;
        let flag = null;
        let countryCode = null;
        
        if (nextFlight && nextFlight.fromCountry !== 'Deutschland') {
            // The next flight departs from abroad - that's where we were during FL
            location = nextFlight.from;
            country = nextFlight.fromCountry;
            flag = nextFlight.fromFlag;
            countryCode = nextFlight.fromCountryCode;
        } else {
            // Try to find previous flight that went abroad
            const prevFlight = appData.flights
                .filter(f => {
                    const fDate = new Date(f.year, f.month - 1, f.day);
                    return fDate < flDate;
                })
                .sort((a, b) => {
                    const dateA = new Date(a.year, a.month - 1, a.day);
                    const dateB = new Date(b.year, b.month - 1, b.day);
                    return dateB - dateA; // Descending - most recent first
                })[0];
            
            if (prevFlight && prevFlight.toCountry !== 'Deutschland') {
                location = prevFlight.to;
                country = prevFlight.toCountry;
                flag = prevFlight.toFlag;
                countryCode = prevFlight.toCountryCode;
            }
        }
        
        if (location && country) {
            const abroadDay = {
                date: flDay.date,
                day: flDay.day,
                month: flDay.month,
                year: flDay.year,
                status: 'FL',
                location: location,
                country: country,
                countryCode: countryCode,
                flag: flag
            };
            
            // Check if we already have this abroad day
            const alreadyExists = appData.abroadDays.some(d => d.date === flDay.date);
            if (!alreadyExists) {
                appData.abroadDays.push(abroadDay);
                console.log('Added abroad day (FL status):', abroadDay);
            }
        }
    }
}

// Parse Streckeneinsatzabrechnung
function parseStreckeneinsatz(text, filename) {
    // Extract data directly from the Summe line at the bottom of the document
    // Format: Summe:    475,20     91,20  (Total, Steuer)
    // Or:     Summe:    475,20    50,00    41,20  (Total, Werbko, Steuer)
    // Tax-free = Total - Werbko - Steuer
    
    // Try to match the Summe line - can have 2 or 3 number columns
    // Format with 2 columns: Summe: [Total] [Steuer]
    // Format with 3 columns: Summe: [Total] [Werbko] [Steuer]
    const summeMatch = text.match(/Summe:\s*([\d.,]+)\s+([\d.,]+)(?:\s+([\d.,]+))?/);
    
    if (summeMatch) {
        const value1 = parseFloat(summeMatch[1].replace('.', '').replace(',', '.'));
        const value2 = parseFloat(summeMatch[2].replace('.', '').replace(',', '.'));
        const value3 = summeMatch[3] ? parseFloat(summeMatch[3].replace('.', '').replace(',', '.')) : null;
        
        let docTotal, docWerbko, docSteuer, docTaxFree;
        
        if (value3 !== null) {
            // 3 columns: Total, Werbko, Steuer
            docTotal = value1;
            docWerbko = value2;
            docSteuer = value3;
        } else {
            // 2 columns: Total, Steuer
            docTotal = value1;
            docWerbko = 0;
            docSteuer = value2;
        }
        
        // Tax-free = Total - Werbko - Steuer
        docTaxFree = docTotal - docWerbko - docSteuer;
        
        console.log(`Streckeneinsatzabrechnung Summe: Total=${docTotal}, Werbko=${docWerbko}, Steuer=${docSteuer}, TaxFree=${docTaxFree}`);
        
        // Extract month from filename (e.g., "Streckeneinsatzabrechnung 2025-10.pdf" -> "2025-10")
        const monthMatch = filename ? filename.match(/(\d{4})-(\d{2})/) : null;
        const docName = monthMatch ? `${monthMatch[2]}/${monthMatch[1]}` : (filename || 'Dokument');
        
        // Store the document summary data
        if (!appData.expenseSummaries) {
            appData.expenseSummaries = [];
        }
        
        appData.expenseSummaries.push({
            name: docName,
            total: docTotal,
            werbko: docWerbko,
            steuer: docSteuer,
            taxFree: docTaxFree
        });
        
        // Update the global totals
        if (!appData.expenseTotals) {
            appData.expenseTotals = { total: 0, werbko: 0, steuer: 0, taxFree: 0 };
        }
        appData.expenseTotals.total += docTotal;
        appData.expenseTotals.werbko += docWerbko;
        appData.expenseTotals.steuer += docSteuer;
        appData.expenseTotals.taxFree += docTaxFree;
    }
}

// Check for orphaned continuation flights (continuations without matching departure records)
// Continuation flights have a /XX suffix (e.g., LH0576/31) indicating they continue from day XX of previous month
function checkOrphanedContinuations() {
    if (!appData.flights || appData.flights.length === 0) {
        appData.orphanedContinuations = [];
        return;
    }
    
    const orphanedContinuations = [];
    
    console.log('Checking for orphaned continuation flights...');
    
    // Find all continuation flights
    const continuations = appData.flights.filter(f => f.isContinuation);
    console.log(`Found ${continuations.length} continuation flights`);
    
    for (const continuation of continuations) {
        // Calculate the expected departure date (last day of previous month)
        const departureDate = new Date(continuation.year, continuation.month - 1, 1);
        departureDate.setDate(0); // Sets to last day of previous month
        
        const departureDateStr = `${String(departureDate.getDate()).padStart(2, '0')}.${String(departureDate.getMonth() + 1).padStart(2, '0')}.${departureDate.getFullYear()}`;
        
        // Find the matching departure flight
        const hasDeparture = appData.flights.some(f => 
            f.flightNumber === continuation.flightNumber &&
            f.date === departureDateStr &&
            !f.isContinuation
        );
        
        if (!hasDeparture) {
            console.warn(`⚠️ Orphaned continuation: ${continuation.originalFlightNumber} on ${continuation.date}. Expected departure on ${departureDateStr}`);
            orphanedContinuations.push({
                flight: continuation,
                expectedDepartureDate: departureDateStr
            });
        }
    }
    
    console.log(`Found ${orphanedContinuations.length} orphaned continuation flights`);
    
    // Store orphaned continuations for warning display
    appData.orphanedContinuations = orphanedContinuations;
}

// OLD MERGE FUNCTION - KEPT FOR REFERENCE, NOT USED
// Merge continuation flights that span across month boundaries
// Continuation flights have a /XX suffix (e.g., LH0576/31) indicating they continue from day XX of previous month
// These need to be merged with their departure record to create a complete overnight flight
function mergeContinuationFlights_DISABLED() {
    if (!appData.flights || appData.flights.length === 0) return;
    
    const orphanedContinuations = [];
    const flightsToRemove = [];
    
    console.log('Starting continuation flight merge...');
    
    // Find all continuation flights
    const continuations = appData.flights.filter(f => f.isContinuation);
    console.log(`Found ${continuations.length} continuation flights`);
    
    for (const continuation of continuations) {
        console.log(`Processing continuation: ${continuation.originalFlightNumber} on ${continuation.date}`);
        
        // Calculate the departure date (previous month, day indicated by continuesFromDay)
        // The /XX suffix always indicates the last day of the previous month
        // Start with the first day of the current month, then go back one day
        const departureDate = new Date(continuation.year, continuation.month - 1, 1);
        departureDate.setDate(0); // Sets to last day of previous month
        
        const departureDateStr = `${String(departureDate.getDate()).padStart(2, '0')}.${String(departureDate.getMonth() + 1).padStart(2, '0')}.${departureDate.getFullYear()}`;
        
        console.log(`Looking for departure flight ${continuation.flightNumber} on ${departureDateStr}`);
        
        // Find the matching departure flight
        const departureIndex = appData.flights.findIndex(f => 
            f.flightNumber === continuation.flightNumber &&
            f.date === departureDateStr &&
            !f.isContinuation
        );
        
        if (departureIndex !== -1) {
            const departure = appData.flights[departureIndex];
            console.log(`Found matching departure: ${departure.flightNumber} on ${departure.date}`);
            
            // Merge the flights
            const mergedFlight = {
                ...departure,
                // Keep departure date and details
                date: departure.date,
                day: departure.day,
                month: departure.month,
                year: departure.year,
                departureTime: departure.departureTime,
                // Use arrival details from continuation
                arrivalTime: continuation.arrivalTime,
                // Sum block times
                blockTime: departure.blockTime + continuation.blockTime,
                blockTimeDeparture: departure.blockTime,  // Store individual parts
                blockTimeArrival: continuation.blockTime,
                // Mark as merged overnight flight
                isMergedFlight: true,
                isOvernightFlight: true,
                arrivalDate: continuation.date,
                arrivalDay: continuation.day,
                arrivalMonth: continuation.month,
                arrivalYear: continuation.year
            };
            
            console.log(`Merged flight: ${mergedFlight.flightNumber} ${mergedFlight.date} ${mergedFlight.departureTime}-${mergedFlight.arrivalTime} (${mergedFlight.blockTimeDeparture} + ${mergedFlight.blockTimeArrival} = ${mergedFlight.blockTime}h)`);
            
            // Replace the departure flight with merged flight
            appData.flights[departureIndex] = mergedFlight;
            
            // Mark continuation for removal
            flightsToRemove.push(continuation);
        } else {
            console.warn(`⚠️ No departure found for continuation ${continuation.originalFlightNumber} on ${continuation.date}. Expected departure on ${departureDateStr}`);
            orphanedContinuations.push({
                flight: continuation,
                expectedDepartureDate: departureDateStr
            });
        }
    }
    
    // Remove continuation flights that were merged
    for (const flight of flightsToRemove) {
        const index = appData.flights.indexOf(flight);
        if (index !== -1) {
            appData.flights.splice(index, 1);
        }
    }
    
    console.log(`Merge complete: Merged ${flightsToRemove.length} continuation flights, ${orphanedContinuations.length} orphaned`);
    
    // Store orphaned continuations for warning display
    appData.orphanedContinuations = orphanedContinuations;
}

// Add file tag to UI
function addFileTag(filename, type) {
    const isFlugstunden = type === 'flugstunden';
    const container = document.getElementById(isFlugstunden ? 'flugstundenFiles' : 'expenseFiles');
    
    if (!container) return;
    
    // Remove empty state if present
    const emptyState = container.querySelector('.documents-empty');
    if (emptyState) {
        emptyState.remove();
    }
    
    const item = document.createElement('div');
    item.className = 'document-item';
    item.dataset.filename = filename;
    item.dataset.type = type;
    
    const iconClass = isFlugstunden ? '' : 'expenses';
    
    // Extract just the month/year from filename for cleaner display
    const shortName = filename.replace(/\.(pdf|PDF)$/, '').replace(/^(Flugstunden.*?|Streckeneinsatz.*?)\s*/, '');
    
    item.innerHTML = `
        <div class="document-icon ${iconClass}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
            </svg>
        </div>
        <div class="document-info">
            <div class="document-name" title="${filename}">${shortName || filename}</div>
        </div>
        <button class="document-remove" onclick="event.stopPropagation(); removeFile('${filename}', '${type}')" title="Entfernen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    `;
    
    // Add click handler to open the PDF
    item.addEventListener('click', () => openFile(filename));
    
    container.appendChild(item);
}

// Open file in new tab
function openFile(filename) {
    const url = fileUrls[filename];
    if (url) {
        window.open(url, '_blank');
    }
}

// Remove file and recalculate
function removeFile(filename, type) {
    processedFiles = processedFiles.filter(f => f.name !== filename);
    
    // Revoke the blob URL to free memory
    if (fileUrls[filename]) {
        URL.revokeObjectURL(fileUrls[filename]);
        delete fileUrls[filename];
    }
    
    // Remove the document item from the correct container
    const container = document.getElementById(type === 'flugstunden' ? 'flugstundenFiles' : 'expenseFiles');
    if (container) {
        const item = container.querySelector(`[data-filename="${filename}"]`);
        if (item) {
            item.remove();
        }
        // Show empty state if this column is now empty
        if (container.children.length === 0) {
            showEmptyState(type);
        }
    }
}

// Show empty state for a specific column
function showEmptyState(type) {
    if (type) {
        const container = document.getElementById(type === 'flugstunden' ? 'flugstundenFiles' : 'expenseFiles');
        if (container && container.children.length === 0) {
            container.innerHTML = `<div class="documents-empty">Keine Dateien</div>`;
        }
    } else {
        // Show empty state for both columns
        const flugstundenContainer = document.getElementById('flugstundenFiles');
        const expenseContainer = document.getElementById('expenseFiles');
        
        if (flugstundenContainer && flugstundenContainer.children.length === 0) {
            flugstundenContainer.innerHTML = `<div class="documents-empty">Keine Dateien</div>`;
        }
        if (expenseContainer && expenseContainer.children.length === 0) {
            expenseContainer.innerHTML = `<div class="documents-empty">Keine Dateien</div>`;
        }
    }
}

// Update all display elements
function updateDisplay() {
    const hasExpenseData = appData.expenseTotals && appData.expenseTotals.total > 0;
    if (appData.flights.length === 0 && !hasExpenseData) {
        return;
    }
    
    updatePersonalInfo();
    updateSummaryCards();
    updateMonthlyHoursSheet();
    updateMonthlyTable();
    updateFlightTable();
    updateExpenseTable();
    updateCountryGrid();
    updateFilters();
    updateDistanceCalculation();
    updateReinigungCalculation();
    updateTrinkgeldCalculation();
    updateEndabrechnung();
    checkMissingDocuments();
    updateContinuationWarningBanner();
}


// Check for missing months and display warnings
function checkMissingDocuments() {
    const warningsContainer = document.getElementById('documentsWarnings');
    if (!warningsContainer) return;
    
    warningsContainer.innerHTML = '';
    
    const warnings = [];
    
    // Get all months from processed files
    const flugstundenMonths = new Set();
    const expenseMonths = new Set();
    
    processedFiles.forEach(f => {
        // Extract month from filename (e.g., "2025-01" from "Flugstundenübersicht 2025-01.pdf")
        const monthMatch = f.name.match(/(\d{4})-(\d{2})/);
        if (monthMatch) {
            const monthKey = `${monthMatch[1]}-${monthMatch[2]}`;
            if (f.type === 'flugstunden') {
                flugstundenMonths.add(monthKey);
            } else if (f.type === 'streckeneinsatz') {
                expenseMonths.add(monthKey);
            }
        }
    });
    
    // Check for gaps in Flugstunden
    if (flugstundenMonths.size >= 2) {
        const missingFlugstunden = findMissingMonths(flugstundenMonths);
        if (missingFlugstunden.length > 0) {
            warnings.push({
                title: 'Fehlende Flugstundenuebersicht',
                text: `Monat(e) ${missingFlugstunden.join(', ')} fehlt moeglicherweise`
            });
        }
    }
    
    // Check for gaps in Expenses
    if (expenseMonths.size >= 2) {
        const missingExpenses = findMissingMonths(expenseMonths);
        if (missingExpenses.length > 0) {
            warnings.push({
                title: 'Fehlende Streckeneinsatzabrechnung',
                text: `Monat(e) ${missingExpenses.join(', ')} fehlt moeglicherweise`
            });
        }
    }
    
    // Check if one type has months that the other doesn't
    if (flugstundenMonths.size > 0 && expenseMonths.size > 0) {
        const flugstundenOnly = [...flugstundenMonths].filter(m => !expenseMonths.has(m));
        const expenseOnly = [...expenseMonths].filter(m => !flugstundenMonths.has(m));
        
        if (flugstundenOnly.length > 0 && expenseMonths.size >= 2) {
            warnings.push({
                title: 'Streckeneinsatzabrechnung fehlt',
                text: `Fuer ${flugstundenOnly.join(', ')} gibt es Flugstunden aber keine Spesenabrechnung`
            });
        }
        
        if (expenseOnly.length > 0 && flugstundenMonths.size >= 2) {
            warnings.push({
                title: 'Flugstundenuebersicht fehlt',
                text: `Fuer ${expenseOnly.join(', ')} gibt es Spesen aber keine Flugstundenuebersicht`
            });
        }
    }
    
    // Check for incomplete trips (return flights without outbound flights)
    const incompleteTrips = checkIncompleteTrips();
    incompleteTrips.forEach(trip => {
        warnings.push({
            title: 'Unvollstaendige Reise erkannt',
            text: `Rueckflug ${trip.from} → ${trip.to} am ${trip.date} ohne vorherigen Hinflug. Vorheriger Monat fehlt moeglicherweise.`
        });
    });
    
    // Display warnings
    warnings.forEach(warning => {
        const warningEl = document.createElement('div');
        warningEl.className = 'warning-item';
        warningEl.innerHTML = `
            <svg class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div class="warning-content">
                <div class="warning-title">${warning.title}</div>
                <div class="warning-text">${warning.text}</div>
            </div>
        `;
        warningsContainer.appendChild(warningEl);
    });
}

// Check for incomplete trips (return flights from abroad without corresponding outbound flights)
// Returns array of { from, to, date, flightNumber } for each incomplete trip detected
function checkIncompleteTrips() {
    const incompleteTrips = [];
    
    // Sort flights chronologically
    const sortedFlights = [...appData.flights].sort((a, b) => {
        const dateA = new Date(a.year, a.month - 1, a.day);
        const dateB = new Date(b.year, b.month - 1, b.day);
        if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
        }
        return a.departureTime.localeCompare(b.departureTime);
    });
    
    // Track state: are we currently abroad?
    let isAbroad = false;
    let abroadLocation = null;
    
    for (const flight of sortedFlights) {
        // Departing from Germany to abroad
        if (flight.fromCountry === 'Deutschland' && flight.toCountry !== 'Deutschland') {
            isAbroad = true;
            abroadLocation = flight.to;
        }
        // Flying abroad to abroad (continuing journey)
        else if (flight.fromCountry !== 'Deutschland' && flight.toCountry !== 'Deutschland') {
            if (isAbroad) {
                abroadLocation = flight.to;
            } else {
                // We're seeing a flight from abroad without having left Germany first
                // This indicates missing outbound flight data
                isAbroad = true;
                abroadLocation = flight.to;
            }
        }
        // Returning to Germany from abroad
        else if (flight.fromCountry !== 'Deutschland' && flight.toCountry === 'Deutschland') {
            if (!isAbroad) {
                // We're returning from abroad but never saw the outbound flight
                // This is an incomplete trip!
                incompleteTrips.push({
                    from: flight.from,
                    to: flight.to,
                    date: flight.date,
                    flightNumber: flight.flightNumber,
                    fromCountry: flight.fromCountry
                });
            }
            isAbroad = false;
            abroadLocation = null;
        }
    }
    
    return incompleteTrips;
}

// Update the continuation flight warning banner
function updateContinuationWarningBanner() {
    const banner = document.getElementById('continuationWarningBanner');
    const detailsDiv = document.getElementById('continuationWarningDetails');
    
    if (!banner || !detailsDiv) return;
    
    // Check if we have orphaned continuations
    if (!appData.orphanedContinuations || appData.orphanedContinuations.length === 0) {
        banner.style.display = 'none';
        return;
    }
    
    // Build warning message
    const orphanCount = appData.orphanedContinuations.length;
    const flightsList = appData.orphanedContinuations.map(orphan => {
        const flight = orphan.flight;
        return `<li>${flight.date} ${flight.originalFlightNumber} ${flight.from} → ${flight.to} (erwartet Abflug am ${orphan.expectedDepartureDate})</li>`;
    }).join('');
    
    detailsDiv.innerHTML = `
        <p>Es wurden ${orphanCount} Fortsetzungsflug${orphanCount > 1 ? 'e' : ''} ohne zugehörigen Abflugdatensatz gefunden:</p>
        <ul>${flightsList}</ul>
        <p style="margin-top: 8px; font-size: 13px;">Diese Flüge sind möglicherweise unvollständig. Bitte laden Sie die PDF-Datei des vorherigen Monats hoch.</p>
    `;
    
    banner.style.display = 'block';
}

// Find missing months in a sequence
function findMissingMonths(monthSet) {
    if (monthSet.size < 2) return [];
    
    const months = [...monthSet].sort();
    const missing = [];
    
    // Parse first and last month
    const [firstYear, firstMonth] = months[0].split('-').map(Number);
    const [lastYear, lastMonth] = months[months.length - 1].split('-').map(Number);
    
    // Generate all months in range
    let currentYear = firstYear;
    let currentMonth = firstMonth;
    
    while (currentYear < lastYear || (currentYear === lastYear && currentMonth <= lastMonth)) {
        const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        
        if (!monthSet.has(monthKey)) {
            // Format nicely for display
            const monthNames = ['', 'Jan', 'Feb', 'Maer', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
            missing.push(`${monthNames[currentMonth]} ${currentYear}`);
        }
        
        currentMonth++;
        if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
        }
    }
    
    return missing;
}

// Update personal info display
function updatePersonalInfo() {
    const container = document.getElementById('personalInfo');
    if (!appData.personalInfo) {
        container.innerHTML = '<p>Lade Flugstundenübersicht für Mitarbeiterinformationen</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="info-item">
            <div class="label">Name</div>
            <div class="value">${appData.personalInfo.name}</div>
        </div>
        <div class="info-item">
            <div class="label">Personalnummer</div>
            <div class="value">${appData.personalInfo.personnelNumber}</div>
        </div>
        <div class="info-item">
            <div class="label">Funktion</div>
            <div class="value">${appData.personalInfo.function}</div>
        </div>
        <div class="info-item">
            <div class="label">Muster</div>
            <div class="value">${appData.personalInfo.aircraft}</div>
        </div>
    `;
}

// Update summary cards
function updateSummaryCards() {
    // Calculate Hotelaufenthalte (hotel nights) - needed for Trinkgeld calculation
    const hotelNightsData = calculateHotelaufenthalte(appData.flights);
    appData.hotelNights = hotelNightsData;
    
    // Update distance calculation if value exists
    updateDistanceCalculation();
}

// Calculate total number of commute trips based on A/E flags
// Returns the total count of trips (not unique days)
function getCommuteTripCount() {
    const oneWayCheckbox = document.getElementById('oneWayCheckbox');
    const medicalCheckbox = document.getElementById('medicalCheckbox');
    const groundDutyCheckbox = document.getElementById('groundDutyCheckbox');
    const isOneWay = oneWayCheckbox ? oneWayCheckbox.checked : true;
    const includeMedical = medicalCheckbox ? medicalCheckbox.checked : false;
    const includeGroundDuty = groundDutyCheckbox ? groundDutyCheckbox.checked : false;
    
    let aCount = 0;
    let eCount = 0;
    const datesWithA = new Set();
    const datesWithE = new Set();
    const allFlightDates = new Set();
    
    // Count A and E flags from flights
    appData.flights.forEach(flight => {
        allFlightDates.add(flight.date);
        if (flight.commuteType === 'A') {
            aCount++;
            datesWithA.add(flight.date);
        } else if (flight.commuteType === 'E') {
            eCount++;
            datesWithE.add(flight.date);
        }
    });
    
    // Count training days: dates with ONLY domestic flights (both from and to Germany) and no A/E flags
    // Group flights by date first
    const flightsByDate = {};
    appData.flights.forEach(flight => {
        if (!flightsByDate[flight.date]) {
            flightsByDate[flight.date] = [];
        }
        flightsByDate[flight.date].push(flight);
    });
    
    let trainingDayCount = 0;
    for (const [date, flights] of Object.entries(flightsByDate)) {
        // Skip if this date has A or E flags
        if (datesWithA.has(date) || datesWithE.has(date)) {
            continue;
        }
        
        // Check if ALL flights on this date are domestic (both from and to Germany)
        const allDomestic = flights.every(f => 
            f.fromCountry === 'Deutschland' && f.toCountry === 'Deutschland'
        );
        
        if (allDomestic) {
            trainingDayCount++;
        }
    }
    
    // Add medical days if checkbox is enabled
    // ME counts as one round trip (A + E)
    let meCount = 0;
    if (includeMedical) {
        meCount = appData.medicalDays.length;
    }
    
    // Add ground duty days if checkbox is enabled
    // Ground duty (RE, EM, DP, SI, TK) counts as one round trip (A + E)
    let groundDutyCount = 0;
    if (includeGroundDuty) {
        groundDutyCount = appData.groundDutyDays.length;
    }
    
    // If one-way: count only trips TO work (A + ME + groundDuty + trainingDays)
    // If both ways: count all trips (A + E + (ME + groundDuty + trainingDays) * 2)
    if (isOneWay) {
        return aCount + meCount + groundDutyCount + trainingDayCount;
    } else {
        return aCount + eCount + ((meCount + groundDutyCount + trainingDayCount) * 2);
    }
}

// Update distance calculation for tax deduction
function updateDistanceCalculation() {
    const distanceInput = document.getElementById('distanceInput');
    const oneWayCheckbox = document.getElementById('oneWayCheckbox');
    const resultDiv = document.getElementById('distanceResult');
    
    if (!distanceInput || !resultDiv) return;
    
    // Distance is always the one-way distance from home to work
    const distance = parseInt(distanceInput.value) || 0;
    const isOneWay = oneWayCheckbox ? oneWayCheckbox.checked : true;
    
    if (distance <= 0 || appData.flights.length === 0) {
        resultDiv.classList.remove('visible');
        return;
    }
    
    // Get total number of commute trips (respects one-way and medical checkboxes)
    const tripCount = getCommuteTripCount();
    
    // German tax law: Entfernungspauschale
    // 0,30 € per km for first 20 km, 0,38 € per km beyond 20 km (since 2022)
    let deductionPerTrip;
    if (distance <= 20) {
        deductionPerTrip = distance * 0.30;
    } else {
        deductionPerTrip = (20 * 0.30) + ((distance - 20) * 0.38);
    }
    
    const totalDeduction = deductionPerTrip * tripCount;
    
    const tripLabel = isOneWay ? 'Fahrten zur Arbeit (A)' : 'Fahrten (A + E)';
    
    const tooltipLines = [];
    if (distance <= 20) {
        tooltipLines.push(`Pauschale: ${distance} km × 0,30 € = ${deductionPerTrip.toFixed(2)} €`);
    } else {
        tooltipLines.push(`Erste 20 km: 20 × 0,30 € = 6,00 €`);
        tooltipLines.push(`Ab 21 km: ${distance - 20} × 0,38 € = ${((distance - 20) * 0.38).toFixed(2)} €`);
        tooltipLines.push(`Pauschale pro Fahrt: ${deductionPerTrip.toFixed(2)} €`);
    }
    tooltipLines.push(`${tripCount} Fahrten × ${deductionPerTrip.toFixed(2)} € = ${totalDeduction.toFixed(2)} €`);

    resultDiv.innerHTML = `
        <div class="result-row">
            <span>${tripLabel}</span>
            <span class="result-value">${tripCount} Fahrten</span>
        </div>
        <div class="result-row">
            <span>Pauschale pro Fahrt</span>
            <span class="result-value">${deductionPerTrip.toFixed(2)} €</span>
        </div>
        <div class="result-row total">
            <span>Entfernungspauschale (gesamt)</span>
            <span class="result-value money">${wrapWithTooltip(totalDeduction.toFixed(2) + ' €', tooltipLines)}</span>
        </div>
        <div class="result-info" style="font-size: 0.8rem; color: #666; margin-top: 8px;">
            Berechnung: ${distance <= 20 ? distance + ' km × 0,30 €' : '20 km × 0,30 € + ' + (distance - 20) + ' km × 0,38 €'} × ${tripCount} Fahrten
        </div>
    `;
    resultDiv.classList.add('visible');
}

// Get count of work days (all flight days + abroad days + medical + ground duty)
function getWorkDaysCount() {
    const medicalCheckbox = document.getElementById('medicalCheckbox');
    const groundDutyCheckbox = document.getElementById('groundDutyCheckbox');
    const abroadDaysCheckbox = document.getElementById('abroadDaysCheckbox');
    const includeMedical = medicalCheckbox ? medicalCheckbox.checked : false;
    const includeGroundDuty = groundDutyCheckbox ? groundDutyCheckbox.checked : false;
    const includeAbroadDays = abroadDaysCheckbox ? abroadDaysCheckbox.checked : false;
    
    const workDays = new Set();
    
    // Add ALL flight days (any flight activity counts as a work day)
    appData.flights.forEach(flight => {
        workDays.add(flight.date);
    });
    
    // Add abroad/layover days (FL status) if checkbox is enabled
    if (includeAbroadDays) {
        appData.abroadDays.forEach(day => {
            workDays.add(day.date);
        });
    }
    
    // Add medical days if checkbox is enabled
    if (includeMedical) {
        appData.medicalDays.forEach(day => {
            workDays.add(day.date);
        });
    }
    
    // Add ground duty days if checkbox is enabled
    if (includeGroundDuty) {
        appData.groundDutyDays.forEach(day => {
            workDays.add(day.date);
        });
    }
    
    return workDays.size;
}

// Get work days per month
function getWorkDaysPerMonth() {
    const medicalCheckbox = document.getElementById('medicalCheckbox');
    const groundDutyCheckbox = document.getElementById('groundDutyCheckbox');
    const abroadDaysCheckbox = document.getElementById('abroadDaysCheckbox');
    const includeMedical = medicalCheckbox ? medicalCheckbox.checked : false;
    const includeGroundDuty = groundDutyCheckbox ? groundDutyCheckbox.checked : false;
    const includeAbroadDays = abroadDaysCheckbox ? abroadDaysCheckbox.checked : false;
    
    const monthlyWorkDays = {};
    
    // Add ALL flight days (any flight activity counts as a work day)
    appData.flights.forEach(flight => {
        const monthKey = `${flight.year}-${String(flight.month).padStart(2, '0')}`;
        if (!monthlyWorkDays[monthKey]) {
            monthlyWorkDays[monthKey] = new Set();
        }
        monthlyWorkDays[monthKey].add(flight.date);
    });
    
    // Add abroad/layover days (FL status) if checkbox is enabled
    if (includeAbroadDays) {
        appData.abroadDays.forEach(day => {
            const monthKey = `${day.year}-${String(day.month).padStart(2, '0')}`;
            if (!monthlyWorkDays[monthKey]) {
                monthlyWorkDays[monthKey] = new Set();
            }
            monthlyWorkDays[monthKey].add(day.date);
        });
    }
    
    // Add medical days if checkbox is enabled
    if (includeMedical) {
        appData.medicalDays.forEach(day => {
            const monthKey = `${day.year}-${String(day.month).padStart(2, '0')}`;
            if (!monthlyWorkDays[monthKey]) {
                monthlyWorkDays[monthKey] = new Set();
            }
            monthlyWorkDays[monthKey].add(day.date);
        });
    }
    
    // Add ground duty days if checkbox is enabled
    if (includeGroundDuty) {
        appData.groundDutyDays.forEach(day => {
            const monthKey = `${day.year}-${String(day.month).padStart(2, '0')}`;
            if (!monthlyWorkDays[monthKey]) {
                monthlyWorkDays[monthKey] = new Set();
            }
            monthlyWorkDays[monthKey].add(day.date);
        });
    }
    
    // Convert Sets to counts
    const result = {};
    for (const [monthKey, dates] of Object.entries(monthlyWorkDays)) {
        result[monthKey] = dates.size;
    }
    return result;
}

// Update Reinigungskosten calculation
function updateReinigungCalculation() {
    const reinigungInput = document.getElementById('reinigungInput');
    const resultDiv = document.getElementById('reinigungResult');
    
    if (!reinigungInput || !resultDiv) return;
    
    const ratePerDay = parseFloat(reinigungInput.value) || 0;
    
    if (ratePerDay <= 0 || appData.flights.length === 0) {
        resultDiv.classList.remove('visible');
        updateReinigungOverviewCard(0, 0);
        return;
    }
    
    const workDays = getWorkDaysCount();
    const totalReinigung = ratePerDay * workDays;
    
    const tooltipLines = [
        `${workDays} Arbeitstage × ${ratePerDay.toFixed(2)} € pro Tag`,
        `= ${totalReinigung.toFixed(2)} €`
    ];

    resultDiv.innerHTML = `
        <div class="result-row">
            <span>Arbeitstage</span>
            <span class="result-value">${workDays} Tage</span>
        </div>
        <div class="result-row">
            <span>Pauschale pro Tag</span>
            <span class="result-value">${ratePerDay.toFixed(2)} €</span>
        </div>
        <div class="result-row total">
            <span>Reinigungskosten (gesamt)</span>
            <span class="result-value money">${wrapWithTooltip(totalReinigung.toFixed(2) + ' €', tooltipLines)}</span>
        </div>
    `;
    resultDiv.classList.add('visible');
    
    updateReinigungOverviewCard(totalReinigung, workDays);
}

// Update Reinigungskosten overview card
function updateReinigungOverviewCard(total, workDays) {
    const overviewCard = document.getElementById('reinigungOverviewCard');
    const overviewValue = document.getElementById('totalReinigung');
    
    if (overviewCard && overviewValue) {
        if (total > 0) {
            overviewCard.style.display = 'flex';
            overviewValue.textContent = total.toFixed(2).replace('.', ',') + ' €';
        } else {
            overviewCard.style.display = 'none';
        }
    }
}

// Update monthly flight hours sheet (horizontal table with months as columns)
function updateMonthlyHoursSheet() {
    const headerRow = document.getElementById('monthlyHoursHeader');
    const dataRow = document.getElementById('monthlyHoursRow');
    
    if (!headerRow || !dataRow) return;
    
    headerRow.innerHTML = '';
    dataRow.innerHTML = '';
    
    const monthNames = ['', 'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    
    // Sort months chronologically
    const sortedMonths = Object.keys(appData.monthlyData).sort();
    
    const emptyState = document.getElementById('monthlyHoursEmpty');
    if (sortedMonths.length === 0) {
        headerRow.innerHTML = '<th>Keine Daten</th>';
        dataRow.innerHTML = '<td>-</td>';
        if (emptyState) emptyState.hidden = false;
        return;
    }

    if (emptyState) emptyState.hidden = true;
    
    let totalHours = 0;
    
    // Add a column for each month
    sortedMonths.forEach(monthKey => {
        const [year, month] = monthKey.split('-');
        const data = appData.monthlyData[monthKey];
        const hours = data.flightHours || 0;
        totalHours += hours;
        
        // Header: Month abbreviation + year
        const th = document.createElement('th');
        th.textContent = `${monthNames[parseInt(month)]} ${year}`;
        headerRow.appendChild(th);
        
        // Data: Flight hours
        const td = document.createElement('td');
        td.textContent = hours.toFixed(1) + ' h';
        td.className = hours > 0 ? 'hours-value' : 'hours-zero';
        dataRow.appendChild(td);
    });
    
    // Add total column
    const thTotal = document.createElement('th');
    thTotal.textContent = 'Gesamt';
    thTotal.className = 'total-column';
    headerRow.appendChild(thTotal);
    
    const tdTotal = document.createElement('td');
    tdTotal.textContent = totalHours.toFixed(1) + ' h';
    tdTotal.className = 'total-column hours-total';
    dataRow.appendChild(tdTotal);
}

// Update monthly table
function updateMonthlyTable() {
    const tbody = document.querySelector('#monthlyTable tbody');
    const emptyState = document.getElementById('monthlyTableEmpty');
    tbody.innerHTML = '';
    
    const monthNames = ['', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
                        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    
    // Sort months
    const sortedMonths = Object.keys(appData.monthlyData).sort();
    
    // Calculate daily allowances from all flights
    const allFlightsSorted = [...appData.flights].sort((a, b) => {
        const dateA = new Date(a.year, a.month - 1, a.day);
        const dateB = new Date(b.year, b.month - 1, b.day);
        if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
        }
        return a.departureTime.localeCompare(b.departureTime);
    });
    
    const dailyAllowances = calculateDailyAllowances(allFlightsSorted);
    
    // Aggregate allowances by month
    const monthlyAllowances = {};
    dailyAllowances.forEach((allowance, dateStr) => {
        // Parse date string DD.MM.YYYY
        const parts = dateStr.split('.');
        if (parts.length === 3) {
            const month = parseInt(parts[1]);
            const year = parseInt(parts[2]);
            const monthKey = `${year}-${String(month).padStart(2, '0')}`;
            
            if (!monthlyAllowances[monthKey]) {
                monthlyAllowances[monthKey] = 0;
            }
            monthlyAllowances[monthKey] += allowance.rate || 0;
        }
    });
    
    // Calculate Einsaetze (tours/trips) per month from flights
    // A tour starts when leaving Germany and ends when returning
    const monthlyTours = {};
    let inTour = false;
    let currentTourMonths = new Set();
    
    for (const flight of allFlightsSorted) {
        const monthKey = `${flight.year}-${String(flight.month).padStart(2, '0')}`;
        
        // Starting a new tour (leaving Germany)
        if (flight.fromCountry === 'Deutschland' && flight.toCountry !== 'Deutschland') {
            inTour = true;
            currentTourMonths = new Set([monthKey]);
        }
        // Continuing abroad
        else if (inTour && flight.fromCountry !== 'Deutschland' && flight.toCountry !== 'Deutschland') {
            currentTourMonths.add(monthKey);
        }
        // Returning to Germany (end of tour)
        else if (flight.fromCountry !== 'Deutschland' && flight.toCountry === 'Deutschland') {
            currentTourMonths.add(monthKey);
            // Count this tour for all months it spans
            currentTourMonths.forEach(mk => {
                if (!monthlyTours[mk]) monthlyTours[mk] = 0;
                monthlyTours[mk]++;
            });
            inTour = false;
            currentTourMonths = new Set();
        }
    }
    
    // Calculate Fahrten (commute rides) per month using A/E flags
    // A = Ankunft (arrived at airport = commute TO work)
    // E = Ende (left airport = commute FROM work)
    // Check if user selected one-way (Einfache Strecke)
    const oneWayCheckbox = document.getElementById('oneWayCheckbox');
    const isOneWay = oneWayCheckbox ? oneWayCheckbox.checked : true;
    
    // Check if medical days should count as commute
    const medicalCheckbox = document.getElementById('medicalCheckbox');
    const includeMedical = medicalCheckbox ? medicalCheckbox.checked : false;
    
    // Check if ground duty days should count as commute
    const groundDutyCheckbox = document.getElementById('groundDutyCheckbox');
    const includeGroundDuty = groundDutyCheckbox ? groundDutyCheckbox.checked : false;
    
    const monthlyFahrten = {};
    
    // Track dates with A/E flags to identify training days without flags
    const datesWithA = new Set();
    const datesWithE = new Set();
    const datesWithFlights = new Set();
    
    for (const flight of allFlightsSorted) {
        const monthKey = `${flight.year}-${String(flight.month).padStart(2, '0')}`;
        
        if (!monthlyFahrten[monthKey]) {
            monthlyFahrten[monthKey] = { aCount: 0, eCount: 0, meCount: 0, groundDutyCount: 0, trainingDayCount: 0 };
        }
        
        // Track all flight dates
        datesWithFlights.add(flight.date);
        
        // Count based on A/E flags from Flugstundenübersicht
        if (flight.commuteType === 'A') {
            // A = arrived at airport = commute TO work
            monthlyFahrten[monthKey].aCount++;
            datesWithA.add(flight.date);
        } else if (flight.commuteType === 'E') {
            // E = left airport = commute FROM work
            monthlyFahrten[monthKey].eCount++;
            datesWithE.add(flight.date);
        }
    }
    
    // Find training days: dates with ONLY domestic flights (both from and to Germany) and no A/E flags
    // These are typically simulator/training flights (FRA-FRA) where pilot still commuted
    // First, group flights by date and check if ALL flights on that date are domestic
    const flightsByDate = {};
    for (const flight of allFlightsSorted) {
        if (!flightsByDate[flight.date]) {
            flightsByDate[flight.date] = [];
        }
        flightsByDate[flight.date].push(flight);
    }
    
    for (const [dateStr, flights] of Object.entries(flightsByDate)) {
        // Skip if this date has A or E flags
        if (datesWithA.has(dateStr) || datesWithE.has(dateStr)) {
            continue;
        }
        
        // Check if ALL flights on this date are domestic (both from and to Germany)
        const allDomestic = flights.every(f => 
            f.fromCountry === 'Deutschland' && f.toCountry === 'Deutschland'
        );
        
        if (allDomestic) {
            const flight = flights[0]; // Use first flight for month info
            const monthKey = `${flight.year}-${String(flight.month).padStart(2, '0')}`;
            
            if (!monthlyFahrten[monthKey]) {
                monthlyFahrten[monthKey] = { aCount: 0, eCount: 0, meCount: 0, groundDutyCount: 0, trainingDayCount: 0 };
            }
            
            monthlyFahrten[monthKey].trainingDayCount++;
        }
    }
    
    // Add ME (Medical) days to Fahrten count if checkbox is enabled
    // ME counts as a round trip (A + E) - going to airport and returning
    if (includeMedical && appData.medicalDays.length > 0) {
        for (const medicalDay of appData.medicalDays) {
            const monthKey = `${medicalDay.year}-${String(medicalDay.month).padStart(2, '0')}`;
            
            if (!monthlyFahrten[monthKey]) {
                monthlyFahrten[monthKey] = { aCount: 0, eCount: 0, meCount: 0, groundDutyCount: 0, trainingDayCount: 0 };
            }
            
            // ME counts as one round trip (A + E)
            monthlyFahrten[monthKey].meCount++;
        }
    }
    
    // Add ground duty days to Fahrten count if checkbox is enabled
    // Ground duty (RE, EM, DP, SI) counts as a round trip (A + E)
    if (includeGroundDuty && appData.groundDutyDays.length > 0) {
        for (const groundDutyDay of appData.groundDutyDays) {
            const monthKey = `${groundDutyDay.year}-${String(groundDutyDay.month).padStart(2, '0')}`;
            
            if (!monthlyFahrten[monthKey]) {
                monthlyFahrten[monthKey] = { aCount: 0, eCount: 0, meCount: 0, groundDutyCount: 0, trainingDayCount: 0 };
            }
            
            // Ground duty counts as one round trip (A + E)
            monthlyFahrten[monthKey].groundDutyCount++;
        }
    }
    
    // Calculate hotel nights per month
    const hotelNightsData = appData.hotelNights || calculateHotelaufenthalte(appData.flights);
    const monthlyHotelNights = {};
    
    if (hotelNightsData && hotelNightsData.nights) {
        hotelNightsData.nights.forEach(night => {
            // Parse date DD.MM.YYYY
            const parts = night.date.split('.');
            if (parts.length === 3) {
                const monthNum = parseInt(parts[1]);
                const yearNum = parseInt(parts[2]);
                const monthKey = `${yearNum}-${String(monthNum).padStart(2, '0')}`;
                if (!monthlyHotelNights[monthKey]) {
                    monthlyHotelNights[monthKey] = 0;
                }
                monthlyHotelNights[monthKey]++;
            }
        });
    }
    
    // Get Trinkgeld rate
    const trinkgeldInput = document.getElementById('trinkgeldInput');
    const tipPerNight = trinkgeldInput ? (parseFloat(trinkgeldInput.value) || 0) : 0;
    
    // Get distance input for Entfernungspauschale calculation
    // Distance is always the one-way distance from home to work
    const distanceInput = document.getElementById('distanceInput');
    const distance = distanceInput ? (parseInt(distanceInput.value) || 0) : 0;
    
    // Calculate deduction per trip based on distance
    let deductionPerTrip = 0;
    if (distance > 0) {
        if (distance <= 20) {
            deductionPerTrip = distance * 0.30;
        } else {
            deductionPerTrip = (20 * 0.30) + ((distance - 20) * 0.38);
        }
    }
    
    // Get Reinigungskosten rate
    const reinigungInput = document.getElementById('reinigungInput');
    const reinigungRate = reinigungInput ? (parseFloat(reinigungInput.value) || 0) : 0;
    
    // Get work days per month for Reinigungskosten
    const monthlyWorkDays = getWorkDaysPerMonth();
    
    let totals = { hours: 0, workDays: 0, fahrten: 0, entfernungspauschale: 0, allowances: 0, trinkgeld: 0, reinigung: 0 };
    
    sortedMonths.forEach(monthKey => {
        const data = appData.monthlyData[monthKey];
        const [year, month] = monthKey.split('-');
        
        const allowance = monthlyAllowances[monthKey] || 0;
        const tours = monthlyTours[monthKey] || 0;
        // Fahrten = count of A/E flags from Flugstundenübersicht
        // If "Einfache Strecke" (one-way) is checked: count only rides TO work (A flags)
        // If unchecked: count all rides (A + E flags = round trips)
        // ME (Medical), ground duty, and training days count as round trips
        const aCount = monthlyFahrten[monthKey] ? monthlyFahrten[monthKey].aCount : 0;
        const eCount = monthlyFahrten[monthKey] ? monthlyFahrten[monthKey].eCount : 0;
        const meCount = monthlyFahrten[monthKey] ? monthlyFahrten[monthKey].meCount : 0;
        const groundDutyCount = monthlyFahrten[monthKey] ? monthlyFahrten[monthKey].groundDutyCount : 0;
        const trainingDayCount = monthlyFahrten[monthKey] ? monthlyFahrten[monthKey].trainingDayCount : 0;
        // ME, ground duty, and training days count as commute TO work (one trip each), or round trip if both ways
        const fahrten = isOneWay ? (aCount + meCount + groundDutyCount + trainingDayCount) : (aCount + eCount + (meCount + groundDutyCount + trainingDayCount) * 2);
        
        // Calculate Entfernungspauschale for this month
        const entfernungspauschale = fahrten * deductionPerTrip;
        
        // Calculate Trinkgeld for this month
        const hotelNights = monthlyHotelNights[monthKey] || 0;
        const trinkgeld = hotelNights * tipPerNight;
        
        // Calculate Reinigungskosten for this month
        const workDaysInMonth = monthlyWorkDays[monthKey] || 0;
        const reinigung = workDaysInMonth * reinigungRate;
        
        totals.hours += data.flightHours || 0;
        totals.workDays += workDaysInMonth;
        totals.fahrten += fahrten;
        totals.entfernungspauschale += entfernungspauschale;
        totals.allowances += allowance;
        totals.trinkgeld += trinkgeld;
        totals.reinigung += reinigung;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${monthNames[parseInt(month)]} ${year}</td>
            <td>${(data.flightHours || 0).toFixed(1)} h</td>
            <td>${workDaysInMonth}</td>
            <td>${fahrten}</td>
            <td class="money-positive">${entfernungspauschale > 0 ? entfernungspauschale.toFixed(2) + ' €' : '-'}</td>
            <td class="money-positive">${allowance.toFixed(2)} €</td>
            <td class="money-positive">${trinkgeld > 0 ? trinkgeld.toFixed(2) + ' €' : '-'}</td>
            <td class="money-positive">${reinigung > 0 ? reinigung.toFixed(2) + ' €' : '-'}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Add totals row
    if (sortedMonths.length > 0) {
        const totalRow = document.createElement('tr');
        totalRow.style.fontWeight = 'bold';
        totalRow.style.backgroundColor = '#f0f0f0';
        totalRow.innerHTML = `
            <td>Gesamt</td>
            <td>${totals.hours.toFixed(1)} h</td>
            <td>${totals.workDays}</td>
            <td>${totals.fahrten}</td>
            <td class="money-positive">${totals.entfernungspauschale > 0 ? totals.entfernungspauschale.toFixed(2) + ' €' : '-'}</td>
            <td class="money-positive">${totals.allowances.toFixed(2)} €</td>
            <td class="money-positive">${totals.trinkgeld > 0 ? totals.trinkgeld.toFixed(2) + ' €' : '-'}</td>
            <td class="money-positive">${totals.reinigung > 0 ? totals.reinigung.toFixed(2) + ' €' : '-'}</td>
        `;
        tbody.appendChild(totalRow);
        if (emptyState) emptyState.hidden = true;
    } else if (emptyState) {
        emptyState.hidden = false;
    }
}


// Update country grid
function updateCountryGrid() {
    const container = document.getElementById('countryGrid');
    if (!container) return;
    container.innerHTML = '';
    
    // Aggregate by country
    const countryStats = {};
    
    appData.expenses.forEach(e => {
        if (!countryStats[e.country]) {
            countryStats[e.country] = { flag: e.flag, code: e.countryCode, days: 0, expenses: 0 };
        }
        countryStats[e.country].days++;
        countryStats[e.country].expenses += e.taxFree;
    });
    
    // Also count from flights
    appData.flights.forEach(f => {
        if (f.toCountry && f.toCountry !== 'Deutschland') {
            if (!countryStats[f.toCountry]) {
                countryStats[f.toCountry] = { flag: f.toFlag, code: f.toCountryCode, days: 0, expenses: 0 };
            }
        }
    });
    
    // Sort by days (most visited first)
    const sorted = Object.entries(countryStats).sort((a, b) => b[1].days - a[1].days);
    
    sorted.forEach(([country, stats]) => {
        const card = document.createElement('div');
        card.className = 'country-card';
        // Use flagcdn.com for real flag images
        const flagUrl = stats.code ? `https://flagcdn.com/${stats.code.toLowerCase()}.svg` : '';
        card.innerHTML = `
            ${flagUrl ? `<div class="country-flag-bg" style="background-image: url('${flagUrl}')"></div>` : ''}
            <div class="country-content">
                <div class="country-name">${country}</div>
                <div class="country-stats">
                    <span>${stats.days} Tage</span>
                    <span>${stats.expenses.toFixed(2)} EUR (stfrei)</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    
    if (sorted.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">Keine Auslandseinsaetze gefunden</p>';
    }
}

// Calculate tour numbers based on flights (tour starts leaving FRA, ends returning to FRA)
function calculateTourNumbers() {
    // Sort all flights by date and time
    const sortedFlights = [...appData.flights].sort((a, b) => {
        const dateA = new Date(a.year, a.month - 1, a.day);
        const dateB = new Date(b.year, b.month - 1, b.day);
        if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
        }
        // Same date, sort by departure time
        return a.departureTime.localeCompare(b.departureTime);
    });
    
    const tourMap = {}; // Maps date+flightNumber to tour number
    let tourNumber = 0;
    let inTour = false;
    
    sortedFlights.forEach(flight => {
        const key = `${flight.date}-${flight.flightNumber}`;
        
        // FRA to FRA is a complete standalone tour (day trip - out and back same day)
        if (flight.from === 'FRA' && flight.to === 'FRA') {
            tourNumber++;
            tourMap[key] = tourNumber;
            // Tour is complete, not in a tour anymore
            inTour = false;
            return;
        }
        
        if (flight.from === 'FRA' && flight.to !== 'FRA') {
            // Starting a new tour (leaving FRA to go somewhere else)
            // Always start a new tour when departing FRA
            tourNumber++;
            inTour = true;
        }
        
        // Assign current tour number to this flight
        tourMap[key] = inTour ? tourNumber : 0;
        
        if (flight.to === 'FRA' && flight.from !== 'FRA') {
            // Ending tour (returning to FRA from somewhere else)
            inTour = false;
        }
    });
    
    return tourMap;
}

// Get tour number for an expense based on its date (find which tour it falls into)
function getExpenseTourNumber(expense, sortedFlights) {
    const expenseDate = new Date(expense.year, expense.month - 1, expense.day);
    let tourNumber = 0;
    let inTour = false;
    let tourStartDate = null;
    let tourEndDate = null;
    
    // First, build a list of all tours with their date ranges
    const tours = [];
    
    for (const flight of sortedFlights) {
        const flightDate = new Date(flight.year, flight.month - 1, flight.day);
        
        // FRA to FRA is a standalone day tour (day trip - out and back same day)
        if (flight.from === 'FRA' && flight.to === 'FRA') {
            tourNumber++;
            tours.push({
                number: tourNumber,
                start: flightDate,
                end: flightDate
            });
            continue;
        }
        
        if (flight.from === 'FRA' && flight.to !== 'FRA') {
            // Starting a new tour - always start fresh
            tourNumber++;
            inTour = true;
            tourStartDate = flightDate;
            tourEndDate = flightDate; // Same day initially
        }
        
        if (inTour) {
            // Update the end date as we see more flights in this tour
            tourEndDate = flightDate;
        }
        
        if (flight.to === 'FRA' && flight.from !== 'FRA') {
            // Ending tour (returning to FRA from somewhere else)
            if (inTour) {
                tours.push({
                    number: tourNumber,
                    start: tourStartDate,
                    end: tourEndDate
                });
            }
            inTour = false;
            tourStartDate = null;
            tourEndDate = null;
        }
    }
    
    // If still in an open tour (no return flight yet), add it
    if (inTour && tourStartDate) {
        tours.push({
            number: tourNumber,
            start: tourStartDate,
            end: tourEndDate || tourStartDate
        });
    }
    
    // Now find which tour the expense belongs to
    for (const tour of tours) {
        if (expenseDate >= tour.start && expenseDate <= tour.end) {
            return tour.number;
        }
    }
    
    return 0;
}

// Update flight table with collapsible month sections
function updateFlightTable() {
    const tbody = document.querySelector('#flightTable tbody');
    tbody.innerHTML = '';
    
    const countryFilterSelect = document.getElementById('countryFilter');
    const countryFilter = countryFilterSelect ? countryFilterSelect.value : 'all';
    
    // Sort ALL flights first (needed for correct allowance calculation)
    const allFlightsSorted = [...appData.flights].sort((a, b) => {
        const dateA = new Date(a.year, a.month - 1, a.day);
        const dateB = new Date(b.year, b.month - 1, b.day);
        if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
        }
        return a.departureTime.localeCompare(b.departureTime);
    });
    
    // Calculate daily allowances using ALL flights (not filtered)
    const dailyAllowances = calculateDailyAllowances(allFlightsSorted);
    
    // Apply country filter if needed
    let filteredFlights = appData.flights;
    if (countryFilter !== 'all') {
        filteredFlights = filteredFlights.filter(f => f.toCountry === countryFilter);
    }
    
    // Sort filtered flights by date and time
    const sorted = [...filteredFlights].sort((a, b) => {
        const dateA = new Date(a.year, a.month - 1, a.day);
        const dateB = new Date(b.year, b.month - 1, b.day);
        if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
        }
        return a.departureTime.localeCompare(b.departureTime);
    });
    
    // Group flights by month
    const flightsByMonth = {};
    sorted.forEach(flight => {
        const monthKey = `${flight.year}-${String(flight.month).padStart(2, '0')}`;
        if (!flightsByMonth[monthKey]) {
            flightsByMonth[monthKey] = [];
        }
        flightsByMonth[monthKey].push(flight);
    });
    
    // Calculate tour numbers
    const tourMap = calculateTourNumbers();
    
    // Get sorted month keys
    const sortedMonths = Object.keys(flightsByMonth).sort();
    
    const monthNames = ['', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    
    // Build table with month sections
    sortedMonths.forEach(monthKey => {
        const monthFlights = flightsByMonth[monthKey];
        const [year, month] = monthKey.split('-');
        const monthName = monthNames[parseInt(month)];
        
        // Calculate month statistics
        const totalFlights = monthFlights.length;
        const totalHours = monthFlights.reduce((sum, f) => sum + f.blockTime, 0);
        
        // Count medical days in this month
        const medicalCount = appData.medicalDays.filter(d => {
            const key = `${d.year}-${String(d.month).padStart(2, '0')}`;
            return key === monthKey;
        }).length;
        
        // Count ground duty days by type
        const groundDutyCounts = {};
        appData.groundDutyDays.filter(d => {
            const key = `${d.year}-${String(d.month).padStart(2, '0')}`;
            return key === monthKey;
        }).forEach(d => {
            groundDutyCounts[d.type] = (groundDutyCounts[d.type] || 0) + 1;
        });
        
        // Build stats text (work day types only, no hours or flight count)
        let statsText = '';
        const statsParts = [];
        if (medicalCount > 0) statsParts.push(`${medicalCount} ME`);
        Object.entries(groundDutyCounts).forEach(([type, count]) => {
            if (count > 0) statsParts.push(`${count} ${type}`);
        });
        statsText = statsParts.join(' • ');
        
        // Create month header row
        const headerRow = document.createElement('tr');
        headerRow.className = 'month-header';
        headerRow.dataset.month = monthKey;
        headerRow.innerHTML = `
            <td colspan=\"9\">
                <div class="month-header-content">
                    <svg class="month-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                    <span class="month-title">${monthName} ${year}</span>
                    <span class="month-stats">${statsText}</span>
                </div>
            </td>
        `;
        tbody.appendChild(headerRow);
        
        // Build display rows for this month (including medical and ground duty)
        const displayRows = buildCompleteWorkDayRows(monthFlights, tourMap, dailyAllowances, monthKey);
        
        displayRows.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = 'month-content';
            tr.dataset.month = monthKey;
            
            // Alternate background color based on tour number
            if (row.tourNum > 0 && row.tourNum % 2 === 1) {
                tr.classList.add('tour-shaded');
            }
            if (row.isLayover) {
                tr.classList.add('layover-row');
            }
            if (row.isArrivalDay) {
                tr.classList.add('arrival-day-row');
            }
            if (row.dutyCode === 'ME') {
                tr.classList.add('medical-row');
            }
            
            tr.innerHTML = `
                <td>${row.date}</td>
                <td class=\"duty-code\">${row.dutyCode || ''}</td>
                <td>${row.flightNumber}</td>
                <td>${row.route}</td>
                <td>${row.country}</td>
                <td>${row.blockTime}</td>
                <td>${row.times}</td>
                <td>${row.rate}</td>
                <td>${row.trinkgeld || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    });
    
    const emptyState = document.getElementById('flightTableEmpty');
    if (sortedMonths.length === 0) {
        tbody.innerHTML = '<tr><td colspan=\"9\" style=\"text-align: center; color: #888;\">Keine Arbeitstage gefunden</td></tr>';
        if (emptyState) emptyState.hidden = false;
    } else if (emptyState) {
        emptyState.hidden = true;
    }
    
    // Collapse all months by default
    collapseAllMonths();
}

// Toggle a specific month's visibility
function toggleMonth(monthKey) {
    const monthHeader = document.querySelector(`.month-header[data-month="${monthKey}"]`);
    const monthRows = document.querySelectorAll(`.month-content[data-month="${monthKey}"]`);
    
    if (!monthHeader || monthRows.length === 0) return;
    
    const isCollapsed = monthHeader.classList.contains('collapsed');
    
    if (isCollapsed) {
        // Expand
        monthHeader.classList.remove('collapsed');
        monthRows.forEach(row => row.classList.remove('collapsed'));
    } else {
        // Collapse
        monthHeader.classList.add('collapsed');
        monthRows.forEach(row => row.classList.add('collapsed'));
    }
}

// Collapse all months
function collapseAllMonths() {
    const monthHeaders = document.querySelectorAll('.month-header');
    const monthRows = document.querySelectorAll('.month-content');
    
    monthHeaders.forEach(header => header.classList.add('collapsed'));
    monthRows.forEach(row => row.classList.add('collapsed'));
    
    const expandBtn = document.getElementById('expandAllFlights');
    if (expandBtn) expandBtn.textContent = 'Alle ausklappen';
}

// Expand all months
function expandAllMonths() {
    const monthHeaders = document.querySelectorAll('.month-header');
    const monthRows = document.querySelectorAll('.month-content');
    
    monthHeaders.forEach(header => header.classList.remove('collapsed'));
    monthRows.forEach(row => row.classList.remove('collapsed'));
    
    const expandBtn = document.getElementById('expandAllFlights');
    if (expandBtn) expandBtn.textContent = 'Alle einklappen';
}

// Toggle between expand all and collapse all
function toggleAllMonths() {
    const anyCollapsed = document.querySelector('.month-header.collapsed');
    
    if (anyCollapsed) {
        expandAllMonths();
    } else {
        collapseAllMonths();
    }
}

// Check if a flight is an overnight flight (arrives the next calendar day)
// Uses block time + departure time to reliably detect crossing midnight
function checkOvernightFlight(flight) {
    const [depH, depM] = flight.departureTime.split(':').map(Number);
    const departureHour = depH + (depM / 60);  // e.g., 23:00 = 23.0
    const arrivalHour = departureHour + flight.blockTime;  // e.g., 23.0 + 9.82 = 32.82
    return arrivalHour >= 24;
}

// Calculate the arrival date for a flight (accounts for overnight flights)
function getFlightArrivalDate(flight) {
    const flightDate = new Date(flight.year, flight.month - 1, flight.day);
    if (checkOvernightFlight(flight)) {
        flightDate.setDate(flightDate.getDate() + 1);
    }
    return flightDate;
}

// Format a date as DD.MM.YYYY string
function formatDateStr(date) {
    return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
}

// Calculate daily allowances from flights
// Returns a Map of dateString -> { country, rate, rateType, flag, location, year }
// Key principle: ONE allowance per calendar day
// German tax law (Verpflegungspauschale):
// - Anreisetag (departure day from Germany): partial rate
// - Abreisetag (return day to Germany): partial rate  
// - Full day abroad (24h, no departure/arrival from/to Germany): full rate
// - Layover days count as full days abroad
function calculateDailyAllowances(sortedFlights) {
    const dailyAllowances = new Map(); // dateStr -> allowance info
    
    // Build a set of ALL flight days (departure and arrival dates)
    const allFlightDays = new Set();
    for (const flight of sortedFlights) {
        allFlightDays.add(flight.date);
        if (checkOvernightFlight(flight)) {
            allFlightDays.add(formatDateStr(getFlightArrivalDate(flight)));
        }
    }
    
    // First pass: identify all abroad periods with their flights
    const abroadPeriods = []; // Array of { startDate, endDate, country, flag, location, flights }
    let currentPeriod = null;
    
    for (const flight of sortedFlights) {
        const flightDate = new Date(flight.year, flight.month - 1, flight.day);
        const arrivalDate = getFlightArrivalDate(flight);
        
        // Leaving Germany
        if (flight.fromCountry === 'Deutschland' && flight.toCountry !== 'Deutschland') {
            currentPeriod = {
                startDate: flightDate,
                endDate: arrivalDate,
                country: flight.toCountry,
                flag: flight.toFlag,
                location: flight.to,
                year: flight.year,
                departureFlightDate: flightDate,
                returnFlightDate: null,
                flights: [flight],
                isIncomplete: false
            };
        }
        // Continuing abroad (update location and extend period)
        else if (flight.fromCountry !== 'Deutschland' && flight.toCountry !== 'Deutschland' && currentPeriod) {
            currentPeriod.endDate = arrivalDate;
            currentPeriod.country = flight.toCountry;
            currentPeriod.flag = flight.toFlag;
            currentPeriod.location = flight.to;
            currentPeriod.flights.push(flight);
        }
        // Returning to Germany - but NO current period (trip started in previous data set)
        // This handles year-boundary cases where departure was in December but return is in January
        else if (flight.fromCountry !== 'Deutschland' && flight.toCountry === 'Deutschland' && !currentPeriod) {
            // Create an incomplete period - we don't know when it started
            // Look for FL-marked abroad days that precede this return flight
            const returnFlightDate = flightDate;
            const returnArrivalDate = arrivalDate;
            
            // Find FL abroad days that could belong to this trip
            // They should be before the return flight date and have the same location
            const relatedAbroadDays = appData.abroadDays.filter(d => {
                const abroadDate = new Date(d.year, d.month - 1, d.day);
                return abroadDate < returnFlightDate && d.location === flight.from;
            }).sort((a, b) => {
                const dateA = new Date(a.year, a.month - 1, a.day);
                const dateB = new Date(b.year, b.month - 1, b.day);
                return dateA - dateB;
            });
            
            // Determine the start date: earliest FL day, or the day before return flight
            let startDate;
            if (relatedAbroadDays.length > 0) {
                const firstAbroadDay = relatedAbroadDays[0];
                startDate = new Date(firstAbroadDay.year, firstAbroadDay.month - 1, firstAbroadDay.day);
            } else {
                // No FL days found - assume at least the day before return was abroad
                startDate = new Date(returnFlightDate);
                startDate.setDate(startDate.getDate() - 1);
            }
            
            currentPeriod = {
                startDate: startDate,
                endDate: returnArrivalDate,
                country: flight.fromCountry,
                flag: flight.fromFlag,
                location: flight.from,
                year: flight.year,
                departureFlightDate: null, // Unknown - trip started in previous period
                returnFlightDate: returnFlightDate,
                returnCountry: flight.fromCountry,
                returnFlag: flight.fromFlag,
                returnLocation: flight.from,
                flights: [flight],
                isIncomplete: true // Mark as incomplete for special handling
            };
            
            abroadPeriods.push(currentPeriod);
            currentPeriod = null;
            console.log('Created incomplete abroad period for return flight without departure:', flight);
        }
        // Returning to Germany - with current period
        else if (flight.fromCountry !== 'Deutschland' && flight.toCountry === 'Deutschland') {
            if (currentPeriod) {
                currentPeriod.endDate = arrivalDate;
                currentPeriod.returnFlightDate = flightDate;
                currentPeriod.returnCountry = flight.fromCountry;
                currentPeriod.returnFlag = flight.fromFlag;
                currentPeriod.returnLocation = flight.from;
                currentPeriod.flights.push(flight);
                abroadPeriods.push(currentPeriod);
                currentPeriod = null;
            }
        }
    }
    
    // If still abroad (no return flight), close the period
    if (currentPeriod) {
        abroadPeriods.push(currentPeriod);
    }
    
    // Second pass: Add any FL abroad days that weren't captured by flight-based periods
    // This handles layover days that are explicitly marked in the document but not covered
    // by any detected abroad period (e.g., isolated FL days without associated flights)
    for (const abroadDay of appData.abroadDays) {
        const dateStr = abroadDay.date;
        
        // Check if this day is already covered by a flight-based period
        let isCovered = false;
        for (const period of abroadPeriods) {
            const dayDate = new Date(abroadDay.year, abroadDay.month - 1, abroadDay.day);
            if (dayDate >= period.startDate && dayDate <= period.endDate) {
                isCovered = true;
                break;
            }
        }
        
        // If not covered, create a standalone abroad day entry
        if (!isCovered) {
            const rates = getDailyAllowance(abroadDay.country, abroadDay.year);
            // Standalone FL days without associated flights get full rate (24h abroad)
            dailyAllowances.set(dateStr, {
                country: abroadDay.country,
                flag: abroadDay.flag,
                location: abroadDay.location,
                rate: rates[0], // Full day rate
                rateType: '24h',
                year: abroadDay.year,
                isFirstDay: false,
                isLastDay: false,
                hasFlights: false,
                isDepartureFromGermanyDay: false,
                isReturnToGermanyDay: false,
                isFromFLStatus: true // Mark as coming from FL status
            });
            console.log('Added allowance for FL abroad day not covered by periods:', dateStr, abroadDay);
        }
    }
    
    // Third pass: for each abroad period, calculate daily allowances
    for (const period of abroadPeriods) {
        let currentDate = new Date(period.startDate);
        const endDate = new Date(period.endDate);
        
        // Determine which days in this period have flights that START or END on that day
        // This is different from just checking if any flight touches the date
        const periodFlightDepartDays = new Set();
        const periodFlightArriveDays = new Set();
        
        for (const flight of period.flights) {
            periodFlightDepartDays.add(flight.date);
            if (checkOvernightFlight(flight)) {
                periodFlightArriveDays.add(formatDateStr(getFlightArrivalDate(flight)));
            } else {
                // Same-day arrival
                periodFlightArriveDays.add(flight.date);
            }
        }
        
        // Track country for each day based on where you end up sleeping
        // Build a map of date -> country based on flights
        const dayCountryMap = new Map();
        let lastCountry = period.country;
        let lastFlag = period.flag;
        let lastLocation = period.location;
        
        for (const flight of period.flights) {
            const arrivalDate = getFlightArrivalDate(flight);
            const arrivalDateStr = formatDateStr(arrivalDate);
            
            // After this flight arrives, you're in the destination country
            if (flight.toCountry !== 'Deutschland') {
                lastCountry = flight.toCountry;
                lastFlag = flight.toFlag;
                lastLocation = flight.to;
            }
            dayCountryMap.set(arrivalDateStr, { country: lastCountry, flag: lastFlag, location: lastLocation });
        }
        
        // Process each day in the abroad period
        let rollingCountry = null;
        let rollingFlag = null;
        let rollingLocation = null;
        
        while (currentDate <= endDate) {
            const dateStr = formatDateStr(currentDate);
            const year = currentDate.getFullYear();
            
            // Skip if already processed (shouldn't happen, but safety check)
            if (dailyAllowances.has(dateStr)) {
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }
            
            // Update rolling country from map if available
            if (dayCountryMap.has(dateStr)) {
                const info = dayCountryMap.get(dateStr);
                rollingCountry = info.country;
                rollingFlag = info.flag;
                rollingLocation = info.location;
            }
            
            // Determine what kind of day this is
            const isFirstDay = currentDate.getTime() === period.startDate.getTime();
            const isLastDay = currentDate.getTime() === endDate.getTime();
            
            // Check if this is the day we DEPART from Germany (Anreisetag)
            // Note: For incomplete periods (trip started in previous data), departureFlightDate is null
            const isDepartureFromGermanyDay = period.departureFlightDate && 
                currentDate.getTime() === period.departureFlightDate.getTime();
            
            // Check if this is the day we ARRIVE back in Germany (Abreisetag)  
            const returnFlight = period.flights.find(f => f.toCountry === 'Deutschland');
            const isReturnToGermanyDay = returnFlight && 
                currentDate.getTime() === getFlightArrivalDate(returnFlight).getTime();
            
            // Determine country for this day
            // Special case: On return day to Germany, use the departure country (where you were before returning)
            // This is the country you get the allowance for on Abreisetag
            let country, flag, location;
            if (isReturnToGermanyDay && period.returnCountry) {
                country = period.returnCountry;
                flag = period.returnFlag;
                location = period.returnLocation;
            } else {
                // Use rolling country, or fall back to period defaults
                country = rollingCountry || period.country;
                flag = rollingFlag || period.flag;
                location = rollingLocation || period.location;
            }
            
            // Check if there are any flights on this day WITHIN the abroad period
            // Layover days have NO flights
            const hasDeparture = periodFlightDepartDays.has(dateStr);
            const hasArrival = periodFlightArriveDays.has(dateStr);
            const hasAnyFlightActivity = hasDeparture || hasArrival;
            
            // Get rates for this country and year
            const rates = getDailyAllowance(country, year);
            
            // Determine rate type according to German tax law:
            // - Anreisetag (day you leave Germany): PARTIAL rate (you weren't abroad the whole day)
            // - Abreisetag (day you return to Germany): PARTIAL rate (you weren't abroad the whole day)
            // - Full day abroad (24h between midnight and midnight, not An/Abreisetag): FULL rate
            //
            // Key insight: Layover days and days with ONLY transit flights (abroad -> abroad)
            // get the FULL rate because you're abroad for 24h that calendar day.
            // Only the first and last days of the trip get partial rates.
            //
            // Special case for incomplete periods (trip started in previous data):
            // Days before the return flight are treated as full days abroad (24h)
            // since we know they were abroad but don't have the departure info.
            let rate, rateType;
            
            if (isDepartureFromGermanyDay) {
                const absenceHours = calculateAbsenceDuration(period.flights[0], true, appData.fahrzeitMinuten);
                console.log(`Departure day absence: ${absenceHours} hours`);
                if (absenceHours >= 8) {
                    rate = rates[1];
                    rateType = 'An/Ab';
                } else {
                    rate = 0;
                    rateType = 'none';
                }
            } else if (isReturnToGermanyDay) {
                const absenceHours = calculateAbsenceDuration(returnFlight, false, appData.fahrzeitMinuten);
                console.log(`Return day absence: ${absenceHours} hours`);
                if (absenceHours >= 8) {
                    rate = rates[1];
                    rateType = 'An/Ab';
                } else {
                    rate = 0;
                    rateType = 'none';
                }
            } else {
                rate = rates[0];
                rateType = '24h';
            }
            
            dailyAllowances.set(dateStr, {
                country,
                flag,
                location,
                rate,
                rateType,
                year,
                isFirstDay,
                isLastDay,
                hasFlights: hasAnyFlightActivity,
                isDepartureFromGermanyDay,
                isReturnToGermanyDay
            });
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }
    
    return dailyAllowances;
}

// Build display rows for flight table, including layover days
// Now uses per-day allowance calculation to ensure only ONE allowance per day
// dailyAllowances parameter is optional - if not provided, will be calculated from sortedFlights
// monthKey parameter is optional - if provided, filters FL abroad days to only that month
function buildFlightDisplayRows(sortedFlights, tourMap, dailyAllowances = null, monthKey = null) {
    const rows = [];
    
    // Use provided daily allowances or calculate from flights
    if (!dailyAllowances) {
        dailyAllowances = calculateDailyAllowances(sortedFlights);
    }
    
    // Get Trinkgeld settings from the trinkgeldInput field
    const trinkgeldInput = document.getElementById('trinkgeldInput');
    const tipPerNight = trinkgeldInput ? (parseFloat(trinkgeldInput.value) || 0) : 0;
    
    // Get hotel nights dates for Trinkgeld display
    const hotelNightsData = appData.hotelNights || calculateHotelaufenthalte(appData.flights);
    const hotelNightDates = new Set();
    if (hotelNightsData && hotelNightsData.nights) {
        hotelNightsData.nights.forEach(n => hotelNightDates.add(n.date));
    }
    
    // Track which dates we've already shown the allowance for
    const allowanceShownForDate = new Set();
    const trinkgeldShownForDate = new Set();
    
    // First: Add any FL abroad days that are BEFORE the first flight
    // This handles trips that started in a previous period (e.g., December 2022 trip continuing into January 2023)
    if (sortedFlights.length > 0 && appData.abroadDays.length > 0) {
        const firstFlight = sortedFlights[0];
        const firstFlightDate = new Date(firstFlight.year, firstFlight.month - 1, firstFlight.day);
        
        // Get FL abroad days that are before the first flight
        // If monthKey is provided, only include FL days from that month
        const earlyAbroadDays = appData.abroadDays.filter(d => {
            const abroadDate = new Date(d.year, d.month - 1, d.day);
            const dateCheck = abroadDate < firstFlightDate;
            
            // If monthKey is specified, also check that the FL day is in the correct month
            if (monthKey && dateCheck) {
                const abroadMonthKey = `${d.year}-${String(d.month).padStart(2, '0')}`;
                return abroadMonthKey === monthKey;
            }
            
            return dateCheck;
        }).sort((a, b) => {
            const dateA = new Date(a.year, a.month - 1, a.day);
            const dateB = new Date(b.year, b.month - 1, b.day);
            return dateA - dateB;
        });
        
        // Add rows for these early abroad days
        for (const abroadDay of earlyAbroadDays) {
            const allowance = dailyAllowances.get(abroadDay.date);
            let rateDisplay = '-';
            if (allowance && !allowanceShownForDate.has(abroadDay.date)) {
                rateDisplay = `${allowance.rate.toFixed(2)} € (${allowance.rateType})`;
                allowanceShownForDate.add(abroadDay.date);
            }
            
            // Use allowance country for display
            const flDisplayCountry = allowance ? allowance.country : abroadDay.country;
            
            // Check if this date is a hotel night - show checkmark for eligibility
            let trinkgeldDisplay = '-';
            if (hotelNightDates.has(abroadDay.date) && !trinkgeldShownForDate.has(abroadDay.date)) {
                trinkgeldDisplay = '<span style="color: #38a169; font-size: 16px;">✓</span>';
                trinkgeldShownForDate.add(abroadDay.date);
            }
            
            rows.push({
                date: abroadDay.date,
                flightNumber: '-',
                route: `${abroadDay.flag} ${abroadDay.location} (FL)`,
                country: flDisplayCountry,
                blockTime: '-',
                times: '-',
                hoursAbroad: '24h',
                rate: rateDisplay,
                trinkgeld: trinkgeldDisplay,
                tourNum: 0,
                isLayover: true,
                isFromFLStatus: true
            });
        }
    }
    
    // Track abroad state for inserting layover rows
    let currentlyAbroad = false;
    let abroadCountry = null;
    let abroadLocation = null;
    let abroadFlag = null;
    let lastAbroadDate = null;
    let currentTourNum = 0;
    
    // Check if the first flight is a return from abroad (incomplete trip from previous period)
    // In this case, we should be marked as "currently abroad" for layover insertion
    if (sortedFlights.length > 0) {
        const firstFlight = sortedFlights[0];
        if (firstFlight.fromCountry !== 'Deutschland' && firstFlight.toCountry === 'Deutschland') {
            // First flight is returning from abroad - we were abroad before this
            currentlyAbroad = true;
            abroadCountry = firstFlight.fromCountry;
            abroadLocation = firstFlight.from;
            abroadFlag = firstFlight.fromFlag;
            // Try to get the last FL abroad day as the reference point
            const flAbroadDays = appData.abroadDays.filter(d => d.location === firstFlight.from);
            if (flAbroadDays.length > 0) {
                const lastFLDay = flAbroadDays[flAbroadDays.length - 1];
                lastAbroadDate = new Date(lastFLDay.year, lastFLDay.month - 1, lastFLDay.day);
            }
        }
    }
    
    for (let i = 0; i < sortedFlights.length; i++) {
        const flight = sortedFlights[i];
        const flightDate = new Date(flight.year, flight.month - 1, flight.day);
        const key = `${flight.date}-${flight.flightNumber}`;
        const tourNum = tourMap[key] || 0;
        
        // Check if we need to insert layover days before this flight
        if (currentlyAbroad && lastAbroadDate) {
            const daysDiff = Math.floor((flightDate - lastAbroadDate) / (1000 * 60 * 60 * 24));
            
            // Insert layover days (full days abroad without flights)
            for (let d = 1; d < daysDiff; d++) {
                const layoverDate = new Date(lastAbroadDate);
                layoverDate.setDate(layoverDate.getDate() + d);
                const layoverDateStr = formatDateStr(layoverDate);
                
                // Get allowance for this layover day
                const allowance = dailyAllowances.get(layoverDateStr);
                let rateDisplay = '-';
                if (allowance && !allowanceShownForDate.has(layoverDateStr)) {
                    rateDisplay = `${allowance.rate.toFixed(2)} € (${allowance.rateType})`;
                    allowanceShownForDate.add(layoverDateStr);
                }
                
                // Use allowance country for display
                const layoverDisplayCountry = allowance ? allowance.country : abroadCountry;
                
                // Check if this layover date is a hotel night - show checkmark for eligibility
                let layoverTrinkgeldDisplay = '-';
                if (hotelNightDates.has(layoverDateStr) && !trinkgeldShownForDate.has(layoverDateStr)) {
                    layoverTrinkgeldDisplay = '<span style="color: #38a169; font-size: 16px;">✓</span>';
                    trinkgeldShownForDate.add(layoverDateStr);
                }
                
                rows.push({
                    date: layoverDateStr,
                    flightNumber: '-',
                    route: `${abroadFlag} ${abroadLocation} (Layover)`,
                    country: layoverDisplayCountry,
                    blockTime: '-',
                    times: '-',
                    hoursAbroad: '24h',
                    rate: rateDisplay,
                    trinkgeld: layoverTrinkgeldDisplay,
                    tourNum: currentTourNum,
                    isLayover: true
                });
            }
        }
        
        // Check if this is an overnight flight
        const isOvernightFlight = checkOvernightFlight(flight);
        const arrivalDate = getFlightArrivalDate(flight);
        const arrivalDateStr = formatDateStr(arrivalDate);
        
        // Determine rate display for this flight's departure day
        let rateDisplay = '-';
        let hoursDisplay = '-';
        
        // Only show allowance if this date hasn't been shown yet
        const departureAllowance = dailyAllowances.get(flight.date);
        
        // Domestic flight (Germany to Germany) - no allowance
        if (flight.fromCountry === 'Deutschland' && flight.toCountry === 'Deutschland') {
            // No rate for domestic flights
        }
        // International flight - show allowance if not already shown for this date
        else if (departureAllowance && !allowanceShownForDate.has(flight.date)) {
            rateDisplay = `${departureAllowance.rate.toFixed(2)} € (${departureAllowance.rateType})`;
            hoursDisplay = departureAllowance.rateType === '24h' ? '24h' : '>8h';
            allowanceShownForDate.add(flight.date);
        } else if (departureAllowance) {
            // Already shown for this date, just show dash or indicator
            hoursDisplay = '>8h';
            rateDisplay = '(s.o.)'; // "siehe oben" - see above
        }
        
        // Update abroad tracking state
        if (flight.fromCountry === 'Deutschland' && flight.toCountry !== 'Deutschland') {
            currentlyAbroad = true;
            abroadCountry = flight.toCountry;
            abroadLocation = flight.to;
            abroadFlag = flight.toFlag;
            lastAbroadDate = arrivalDate;
            currentTourNum = tourNum;
        } else if (flight.fromCountry !== 'Deutschland' && flight.toCountry === 'Deutschland') {
            currentlyAbroad = false;
            abroadCountry = null;
            abroadLocation = null;
            abroadFlag = null;
            lastAbroadDate = null;
            currentTourNum = 0;
        } else if (flight.fromCountry !== 'Deutschland' && flight.toCountry !== 'Deutschland') {
            abroadCountry = flight.toCountry;
            abroadLocation = flight.to;
            abroadFlag = flight.toFlag;
            lastAbroadDate = arrivalDate;
        }
        
        // Add the flight row
        // Country column shows the country used for allowance calculation, not flight destination
        // - For domestic flights: empty (no allowance)
        // - For international flights: use the allowance country (from dailyAllowances)
        let displayCountry = '';
        if (departureAllowance && departureAllowance.country) {
            displayCountry = departureAllowance.country;
        } else if (flight.fromCountry !== 'Deutschland' || flight.toCountry !== 'Deutschland') {
            // Fallback for international flights without allowance entry
            displayCountry = flight.toCountry !== 'Deutschland' ? flight.toCountry : flight.fromCountry;
        }
        
        // Check if this flight date is a hotel night - show checkmark for eligibility
        let flightTrinkgeldDisplay = '-';
        if (hotelNightDates.has(flight.date) && !trinkgeldShownForDate.has(flight.date)) {
            flightTrinkgeldDisplay = '<span style="color: #38a169; font-size: 16px;">✓</span>';
            trinkgeldShownForDate.add(flight.date);
        }
        
        rows.push({
            date: flight.date,
            flightNumber: flight.isContinuation ? `${flight.originalFlightNumber} ➜` : flight.flightNumber,
            route: `${flight.fromFlag} ${flight.from} → ${flight.toFlag} ${flight.to}`,
            country: displayCountry,
            blockTime: `${flight.blockTime.toFixed(2)} h`,
            times: `${flight.departureTime} - ${flight.arrivalTime}`,
            hoursAbroad: hoursDisplay,
            rate: rateDisplay,
            trinkgeld: flightTrinkgeldDisplay,
            tourNum: tourNum,
            isLayover: false
        });
        
        // For overnight flights, add arrival day row
        if (isOvernightFlight) {
            let arrivalRateDisplay = '-';
            let arrivalHoursDisplay = '-';
            
            const arrivalAllowance = dailyAllowances.get(arrivalDateStr);
            
            if (flight.toCountry !== 'Deutschland' || flight.fromCountry !== 'Deutschland') {
                if (arrivalAllowance && !allowanceShownForDate.has(arrivalDateStr)) {
                    arrivalRateDisplay = `${arrivalAllowance.rate.toFixed(2)} € (${arrivalAllowance.rateType})`;
                    arrivalHoursDisplay = arrivalAllowance.rateType === '24h' ? '24h' : '>8h';
                    allowanceShownForDate.add(arrivalDateStr);
                } else if (arrivalAllowance) {
                    arrivalHoursDisplay = '>8h';
                    arrivalRateDisplay = '(s.o.)';
                }
            }
            
            const arrivalFlag = flight.toCountry !== 'Deutschland' ? flight.toFlag : flight.fromFlag;
            const arrivalLocation = flight.toCountry !== 'Deutschland' ? flight.to : flight.from;
            
            // Use the allowance country for display, not the flight destination
            let arrivalDisplayCountry = '';
            if (arrivalAllowance && arrivalAllowance.country) {
                arrivalDisplayCountry = arrivalAllowance.country;
            } else if (flight.toCountry !== 'Deutschland') {
                arrivalDisplayCountry = flight.toCountry;
            } else if (flight.fromCountry !== 'Deutschland') {
                arrivalDisplayCountry = flight.fromCountry;
            }
            
            if (arrivalDisplayCountry && arrivalDisplayCountry !== 'Deutschland') {
                // Check if this arrival date is a hotel night - show checkmark for eligibility
                let arrivalTrinkgeldDisplay = '-';
                if (hotelNightDates.has(arrivalDateStr) && !trinkgeldShownForDate.has(arrivalDateStr)) {
                    arrivalTrinkgeldDisplay = '<span style="color: #38a169; font-size: 16px;">✓</span>';
                    trinkgeldShownForDate.add(arrivalDateStr);
                }
                
                rows.push({
                    date: arrivalDateStr,
                    flightNumber: flight.flightNumber,
                    route: `${arrivalFlag} ${arrivalLocation} (Ankunft)`,
                    country: arrivalDisplayCountry,
                    blockTime: '-',
                    times: `00:00 - ${flight.arrivalTime}`,
                    hoursAbroad: arrivalHoursDisplay,
                    rate: arrivalRateDisplay,
                    trinkgeld: arrivalTrinkgeldDisplay,
                    tourNum: tourNum,
                    isLayover: false,
                    isArrivalDay: true
                });
            }
        }
    }
    
    return rows;
}

// Helper function to parse German date format (DD.MM.YYYY)
function parseGermanDate(dateStr) {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        return new Date(year, month, day);
    }
    return new Date();
}

// Build complete work day rows including flights, medical days, and ground duty
function buildCompleteWorkDayRows(sortedFlights, tourMap, dailyAllowances = null, monthKey = null) {
    // Get flight display rows (existing logic)
    const flightRows = buildFlightDisplayRows(sortedFlights, tourMap, dailyAllowances, monthKey);
    
    // Get medical day rows for this month only
    let medicalRowsSource = appData.medicalDays;
    if (monthKey) {
        medicalRowsSource = appData.medicalDays.filter(d => {
            const key = `${d.year}-${String(d.month).padStart(2, '0')}`;
            return key === monthKey;
        });
    }
    const medicalRows = medicalRowsSource.map(medDay => {
        // Medical examinations count as >8h domestic trip, get partial allowance
        const allowanceRates = getDailyAllowance('Deutschland', medDay.year);
        const partialRate = allowanceRates[1]; // partialDay rate
        
        return {
            date: medDay.date,
            dutyCode: 'ME',
            flightNumber: '-',
            route: 'MEDICAL',
            country: 'Deutschland',
            blockTime: '-',
            times: '-',
            hoursAbroad: '>8h',
            rate: `${partialRate.toFixed(2)} € (>8h)`,
            trinkgeld: '-',
            tourNum: 0,
            isWorkDay: true,
            sortDate: new Date(medDay.year, medDay.month - 1, medDay.day)
        };
    });
    
    // Get ground duty rows for this month only
    let groundDutySource = appData.groundDutyDays;
    if (monthKey) {
        groundDutySource = appData.groundDutyDays.filter(d => {
            const key = `${d.year}-${String(d.month).padStart(2, '0')}`;
            return key === monthKey;
        });
    }
    const groundDutyRows = groundDutySource.map(gdDay => {
        const descriptions = {
            'EM': 'EMERGENCY-TRAINING',
            'RE': 'BEREITSCHAFT (RESERVE)',
            'DP': 'BUERODIENST',
            'DT': 'BUERODIENST',
            'SI': 'SIMULATOR',
            'TK': 'KURZSCHULUNG',
            'SB': 'BEREITSCHAFT (STANDBY)'
        };
        
        // SB (Standby) and EM (Emergency Training) days get partial allowance (>8h domestic work)
        let hoursAbroad = '-';
        let rate = '-';
        let country = '-';
        
        if (gdDay.type === 'SB' || gdDay.type === 'EM') {
            const allowanceRates = getDailyAllowance('Deutschland', gdDay.year);
            const partialRate = allowanceRates[1]; // partialDay rate
            hoursAbroad = '>8h';
            rate = `${partialRate.toFixed(2)} € (>8h)`;
            country = 'Deutschland';
        }
        
        return {
            date: gdDay.date,
            dutyCode: gdDay.type,
            flightNumber: '-',
            route: descriptions[gdDay.type] || gdDay.type,
            country: country,
            blockTime: '-',
            times: '-',
            hoursAbroad: hoursAbroad,
            rate: rate,
            trinkgeld: '-',
            tourNum: 0,
            isWorkDay: true,
            sortDate: new Date(gdDay.year, gdDay.month - 1, gdDay.day)
        };
    });
    
    // Add dutyCode field to flight rows
    const flightRowsWithCode = flightRows.map(row => ({
        ...row,
        dutyCode: row.isFromFLStatus ? 'FL' : '',
        sortDate: parseGermanDate(row.date)
    }));
    
    // Merge all rows and sort by date
    const allRows = [...flightRowsWithCode, ...medicalRows, ...groundDutyRows];
    allRows.sort((a, b) => a.sortDate - b.sortDate);
    
    return allRows;
}

// Calculate time spent abroad for each flight
// Returns array with { hoursAbroad, rate, rateType } for each flight
function calculateTimeAbroadPerFlight(sortedFlights) {
    const results = [];
    
    let currentlyAbroad = false;
    let abroadStartTime = null;
    let abroadCountry = null;
    let abroadStartDate = null;
    
    for (let i = 0; i < sortedFlights.length; i++) {
        const flight = sortedFlights[i];
        const flightDate = new Date(flight.year, flight.month - 1, flight.day);
        
        // Parse times
        const [depH, depM] = flight.departureTime.split(':').map(Number);
        const [arrH, arrM] = flight.arrivalTime.split(':').map(Number);
        const departureMinutes = depH * 60 + depM;
        const arrivalMinutes = arrH * 60 + arrM;
        
        // Domestic flight (Germany to Germany) - no time abroad
        if (flight.fromCountry === 'Deutschland' && flight.toCountry === 'Deutschland') {
            results.push({ hoursAbroad: 0, rate: 0, rateType: '' });
            continue;
        }
        
        // Leaving Germany to go abroad
        if (flight.fromCountry === 'Deutschland' && flight.toCountry !== 'Deutschland') {
            currentlyAbroad = true;
            abroadStartTime = arrivalMinutes; // Time we arrive abroad
            abroadStartDate = flightDate;
            abroadCountry = flight.toCountry;
            
            // For the outbound flight, we'll calculate time when we return
            results.push({ hoursAbroad: 0, rate: 0, rateType: 'Anreise', country: abroadCountry });
            continue;
        }
        
        // Returning to Germany from abroad
        if (flight.fromCountry !== 'Deutschland' && flight.toCountry === 'Deutschland') {
            if (currentlyAbroad && abroadStartDate) {
                // Calculate total time abroad
                const returnDate = flightDate;
                const daysDiff = Math.floor((returnDate - abroadStartDate) / (1000 * 60 * 60 * 24));
                
                let totalMinutesAbroad;
                if (daysDiff === 0) {
                    // Same day return
                    totalMinutesAbroad = departureMinutes - abroadStartTime;
                } else {
                    // Multi-day trip
                    // First day: from arrival to midnight
                    const firstDayMinutes = 24 * 60 - abroadStartTime;
                    // Middle days: full 24h each
                    const middleDaysMinutes = Math.max(0, daysDiff - 1) * 24 * 60;
                    // Last day: from midnight to departure
                    const lastDayMinutes = departureMinutes;
                    totalMinutesAbroad = firstDayMinutes + middleDaysMinutes + lastDayMinutes;
                }
                
const hoursAbroad = totalMinutesAbroad / 60;
                const country = flight.fromCountry;
                const rate = getApplicableRate(country, hoursAbroad, true, flight.year);
                
                results.push({ 
                    hoursAbroad: hoursAbroad, 
                    rate: rate, 
                    rateType: 'Abreise',
                    country: country
                });
                
                // Update the outbound flight with the total time info
                // Find the matching outbound flight and update it
                for (let j = results.length - 2; j >= 0; j--) {
                    if (results[j].rateType === 'Anreise' && results[j].hoursAbroad === 0) {
                        results[j].hoursAbroad = hoursAbroad;
                        results[j].rate = rate;
                        break;
                    }
                }
            } else {
                results.push({ hoursAbroad: 0, rate: 0, rateType: '' });
            }
            
            currentlyAbroad = false;
            abroadStartTime = null;
            abroadStartDate = null;
            abroadCountry = null;
            continue;
        }
        
        // Flight between two foreign countries
        if (flight.fromCountry !== 'Deutschland' && flight.toCountry !== 'Deutschland') {
            // Still abroad, update the country
            abroadCountry = flight.toCountry;
            results.push({ hoursAbroad: 0, rate: 0, rateType: 'Transit', country: abroadCountry });
            continue;
        }
        
        // Default case
        results.push({ hoursAbroad: 0, rate: 0, rateType: '' });
    }
    
    return results;
}

// Update expense summary table
function updateExpenseTable() {
    updateExpenseMonthlySummary();
}

// Update expense monthly summary table
function updateExpenseMonthlySummary() {
    const table = document.getElementById('expenseMonthlySummaryTable');
    const card = document.getElementById('expenseMonthlySummaryCard');
    
    if (!table || !card) return;
    
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Use the expenseTotals from parsed Summe lines
    if (!appData.expenseTotals || appData.expenseTotals.total === 0) {
        card.style.display = 'none';
        const emptyState = document.getElementById('expenseSummaryEmpty');
        if (emptyState) emptyState.hidden = false;
        return;
    }

    const emptyState = document.getElementById('expenseSummaryEmpty');
    if (emptyState) emptyState.hidden = true;
    
    card.style.display = 'block';
    
    const totals = appData.expenseTotals;
    
    // Show document summaries if available
    // Column order: Spesenanspruch - Steuer - Werbko = Steuerfrei
    if (appData.expenseSummaries && appData.expenseSummaries.length > 0) {
        appData.expenseSummaries.forEach((summary) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${summary.name}</td>
                <td>${summary.total.toFixed(2)} €</td>
                <td>- ${summary.steuer.toFixed(2)} €</td>
                <td>${summary.werbko > 0 ? '- ' + summary.werbko.toFixed(2) + ' €' : '-'}</td>
                <td class="highlight-cell"><strong>${summary.taxFree.toFixed(2)} €</strong></td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // Add totals row with description
    const tfoot = document.createElement('tfoot');
    tfoot.innerHTML = `
        <tr>
            <td colspan="4"><strong>Vom Arbeitgeber steuerfrei ersetzte Verpflegungsmehraufwendungen</strong></td>
            <td class="highlight-cell"><strong>${totals.taxFree.toFixed(2).replace('.', ',')} €</strong></td>
        </tr>
    `;
    
    // Remove existing tfoot if any
    const existingTfoot = table.querySelector('tfoot');
    if (existingTfoot) {
        existingTfoot.remove();
    }
    table.appendChild(tfoot);
}


// Update filter dropdowns
function updateFilters() {
    const countryFilter = document.getElementById('countryFilter');
    if (!countryFilter) {
        return;
    }
    
    // Keep current selection
    const currentCountry = countryFilter.value;
    
    // Clear and repopulate country filter
    countryFilter.innerHTML = '<option value="all">Alle Länder</option>';
    
    // Countries from flights
    const flightCountries = new Set();
    appData.flights.forEach(f => {
        if (f.toCountry) flightCountries.add(f.toCountry);
    });
    
    Array.from(flightCountries).sort().forEach(c => {
        const option = document.createElement('option');
        option.value = c;
        option.textContent = c;
        countryFilter.appendChild(option);
    });
    
    // Restore selection if valid
    if (countryFilter.querySelector(`option[value="${currentCountry}"]`)) {
        countryFilter.value = currentCountry;
    }
}

// Export to CSV
function exportCSV() {
    let csv = 'Datum;Flug;Von;Nach;Land;Block Zeit;Spesen Gesamt;Steuerfrei;Zu versteuern\n';
    
    // Combine flight and expense data
    const allData = [];
    
    appData.flights.forEach(f => {
        allData.push({
            date: f.date,
            sortDate: new Date(f.year, f.month - 1, f.day),
            flight: f.flightNumber,
            from: f.from,
            to: f.to,
            country: f.toCountry,
            blockTime: f.blockTime.toFixed(2),
            expense: '',
            taxFree: '',
            taxable: ''
        });
    });
    
    appData.expenses.forEach(e => {
        allData.push({
            date: e.date,
            sortDate: new Date(e.year, e.month - 1, e.day),
            flight: '',
            from: '',
            to: e.location,
            country: e.country,
            blockTime: '',
            expense: e.totalExpense.toFixed(2),
            taxFree: e.taxFree.toFixed(2),
            taxable: e.taxable.toFixed(2)
        });
    });
    
    // Sort by date
    allData.sort((a, b) => a.sortDate - b.sortDate);
    
    allData.forEach(row => {
        csv += `${row.date};${row.flight};${row.from};${row.to};${row.country};${row.blockTime};${row.expense};${row.taxFree};${row.taxable}\n`;
    });
    
    // Add summary
    csv += '\n\nZusammenfassung\n';
    csv += `Gesamte Flugstunden;${document.getElementById('totalFlightHours').textContent}\n`;
    csv += `Länder besucht;${document.getElementById('totalCountries').textContent}\n`;
    csv += `Nächte unterwegs;${document.getElementById('totalNightsAway').textContent}\n`;
    csv += `Steuerfreie Spesen;${document.getElementById('totalExpenses').textContent}\n`;
    
    // Download
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Flugstunden_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Export summary (simple text for now)
function exportSummary() {
    let summary = 'FLUGSTUNDEN ZUSAMMENFASSUNG\n';
    summary += '===========================\n\n';
    
    if (appData.personalInfo) {
        summary += `Name: ${appData.personalInfo.name}\n`;
        summary += `Personalnummer: ${appData.personalInfo.personnelNumber}\n`;
        summary += `Funktion: ${appData.personalInfo.function}\n`;
        summary += `Muster: ${appData.personalInfo.aircraft}\n\n`;
    }
    
    summary += `Gesamte Flugstunden: ${document.getElementById('totalFlightHours').textContent} h\n`;
    summary += `Länder besucht: ${document.getElementById('totalCountries').textContent}\n`;
    summary += `Nächte unterwegs: ${document.getElementById('totalNightsAway').textContent}\n`;
    summary += `Steuerfreie Spesen: ${document.getElementById('totalExpenses').textContent}\n\n`;
    
    summary += 'MONATLICHE ÜBERSICHT\n';
    summary += '--------------------\n';
    
    const monthNames = ['', 'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    Object.keys(appData.monthlyData).sort().forEach(key => {
        const [year, month] = key.split('-');
        const data = appData.monthlyData[key];
        summary += `${monthNames[parseInt(month)]} ${year}: ${(data.flightHours || 0).toFixed(1)}h, ${(data.taxFree || 0).toFixed(2)}€ stfrei\n`;
    });
    
    // Download as text file
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Flugstunden_Zusammenfassung_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
}

// Print results
function printResults() {
    window.print();
}

// Show/hide loading overlay
function showLoading(show) {
    if (loadingOverlay) {
        loadingOverlay.classList.toggle('active', show);
        loadingOverlay.setAttribute('aria-hidden', show ? 'false' : 'true');
    }
}

// Calculate Hotelaufenthalte (hotel nights) - nights spent abroad at local midnight
// Returns { total: number, nights: Array<{ date, location, country, flag }> }
function calculateHotelaufenthalte(flights) {
    const nightDates = new Set();
    const hotelNights = [];
    
    // Helper: Convert UTC hour to local and adjust date
    const toLocalTime = (date, utcHour, iataCode) => {
        const offset = getUtcOffset(iataCode);
        let localHour = utcHour + offset;
        const localDate = new Date(date);
        if (localHour >= 24) { localDate.setDate(localDate.getDate() + 1); localHour -= 24; }
        else if (localHour < 0) { localDate.setDate(localDate.getDate() - 1); localHour += 24; }
        return { date: localDate, hour: localHour };
    };
    
    // Helper: Add nights between two dates (counting midnights crossed)
    const addNights = (startDate, endDate, country, location, flag) => {
        const start = new Date(startDate); start.setHours(0, 0, 0, 0);
        const end = new Date(endDate); end.setHours(0, 0, 0, 0);
        const current = new Date(start);
        
        while (current < end) {
            const dateStr = formatDateStr(current);
            if (!nightDates.has(dateStr)) {
                nightDates.add(dateStr);
                hotelNights.push({ date: dateStr, country, location, flag: flag || '🏳️' });
            }
            current.setDate(current.getDate() + 1);
        }
    };
    
    // Sort flights chronologically
    const sorted = [...flights].sort((a, b) => {
        const d = new Date(a.year, a.month - 1, a.day) - new Date(b.year, b.month - 1, b.day);
        return d !== 0 ? d : a.departureTime.localeCompare(b.departureTime);
    });
    
    let abroad = null; // { date, country, location, flag }
    
    for (const f of sorted) {
        const flightDate = new Date(f.year, f.month - 1, f.day);
        const [depH] = f.departureTime.split(':').map(Number);
        const [arrH] = f.arrivalTime.split(':').map(Number);
        const arrivalDate = getFlightArrivalDate(f);
        
        // Leaving Germany
        if (f.fromCountry === 'Deutschland' && f.toCountry !== 'Deutschland') {
            const local = toLocalTime(arrivalDate, arrH, f.to);
            abroad = { date: local.date, country: f.toCountry, location: f.to, flag: f.toFlag };
        }
        // Flying abroad to abroad
        else if (f.fromCountry !== 'Deutschland' && f.toCountry !== 'Deutschland' && abroad) {
            const depLocal = toLocalTime(flightDate, depH, f.from);
            addNights(abroad.date, depLocal.date, abroad.country, abroad.location, abroad.flag);
            const arrLocal = toLocalTime(arrivalDate, arrH, f.to);
            abroad = { date: arrLocal.date, country: f.toCountry, location: f.to, flag: f.toFlag };
        }
        // Returning to Germany
        else if (f.fromCountry !== 'Deutschland' && f.toCountry === 'Deutschland' && abroad) {
            const depLocal = toLocalTime(flightDate, depH, f.from);
            addNights(abroad.date, depLocal.date, abroad.country, abroad.location, abroad.flag);
            abroad = null;
        }
    }
    
    // Add FL status abroad days (if not already counted)
    for (const day of appData.abroadDays) {
        if (!nightDates.has(day.date)) {
            nightDates.add(day.date);
            hotelNights.push({ date: day.date, country: day.country, location: day.location, flag: day.flag || '🏳️' });
        }
    }
    
    // Sort by date
    hotelNights.sort((a, b) => {
        const [dA, mA, yA] = a.date.split('.').map(Number);
        const [dB, mB, yB] = b.date.split('.').map(Number);
        return new Date(yA, mA - 1, dA) - new Date(yB, mB - 1, dB);
    });
    
    return { total: hotelNights.length, nights: hotelNights };
}

// Update Trinkgeld calculation based on hotel nights
function updateTrinkgeldCalculation() {
    const trinkgeldInput = document.getElementById('trinkgeldInput');
    const resultDiv = document.getElementById('trinkgeldResult');
    
    if (!resultDiv) return;
    
    const tipPerNight = trinkgeldInput ? (parseFloat(trinkgeldInput.value) || 0) : 0;
    
    if (tipPerNight <= 0 || appData.flights.length === 0) {
        resultDiv.classList.remove('visible');

        return;
    }
    
    // Get hotel nights count
    const hotelNightsData = appData.hotelNights || calculateHotelaufenthalte(appData.flights);
    const hotelNights = hotelNightsData.total || 0;
    
    const totalTip = tipPerNight * hotelNights;
    
    const tooltipLines = [
        `${hotelNights} Hotelnächte × ${tipPerNight.toFixed(2)} € pro Nacht`,
        `= ${totalTip.toFixed(2)} €`
    ];

    resultDiv.innerHTML = `
        <div class="result-row">
            <span>Hotelnächte im Ausland</span>
            <span class="result-value">${hotelNights} Nächte</span>
        </div>
        <div class="result-row">
            <span>Pauschale pro Nacht</span>
            <span class="result-value">${tipPerNight.toFixed(2)} €</span>
        </div>
        <div class="result-row total">
            <span>Trinkgeld (gesamt)</span>
            <span class="result-value money">${wrapWithTooltip(totalTip.toFixed(2) + ' €', tooltipLines)}</span>
        </div>
    `;
    resultDiv.classList.add('visible');
    

}

// Helper function to create tooltip wrapper
function wrapWithTooltip(value, tooltipLines) {
    if (!tooltipLines || tooltipLines.length === 0) return value;
    
    const tooltipContent = tooltipLines.map((line, index) => {
        const className = index === tooltipLines.length - 1 ? 'calc-step result' : 'calc-step';
        return `<span class="${className}">${line}</span>`;
    }).join('');
    
    return `<span class="calc-tooltip">${value}<span class="tooltip-content">${tooltipContent}</span></span>`;
}

// Setup dynamic tooltip positioning to keep tooltips in viewport
function setupTooltipPositioning() {
    // Use event delegation on document body
    document.body.addEventListener('mouseenter', function(e) {
        const tooltip = e.target.closest('.calc-tooltip');
        if (!tooltip) return;
        
        const tooltipContent = tooltip.querySelector('.tooltip-content');
        if (!tooltipContent) return;
        
        positionTooltip(tooltip, tooltipContent);
    }, true);
}

function positionTooltip(trigger, tooltipContent) {
    // Reset positioning classes
    tooltipContent.classList.remove('above', 'below', 'left', 'right');
    
    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltipContent.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 10; // Padding from viewport edge
    
    let position = 'above'; // Default position
    let top, left;
    
    // Calculate position above the trigger
    top = triggerRect.top - tooltipRect.height - 10;
    left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
    
    // Check if tooltip would overflow viewport
    const wouldOverflowTop = top < padding;
    const wouldOverflowBottom = (triggerRect.bottom + tooltipRect.height + 10) > (viewportHeight - padding);
    const wouldOverflowLeft = left < padding;
    const wouldOverflowRight = (left + tooltipRect.width) > (viewportWidth - padding);
    
    // Adjust vertical position if needed
    if (wouldOverflowTop && !wouldOverflowBottom) {
        // Show below instead
        position = 'below';
        top = triggerRect.bottom + 10;
    }
    
    // Adjust horizontal position if needed
    if (wouldOverflowLeft) {
        left = padding;
    } else if (wouldOverflowRight) {
        left = viewportWidth - tooltipRect.width - padding;
    }
    
    // If still doesn't fit, try showing on the side
    if (wouldOverflowTop && wouldOverflowBottom) {
        const spaceOnRight = viewportWidth - triggerRect.right;
        const spaceOnLeft = triggerRect.left;
        
        if (spaceOnRight > tooltipRect.width + padding) {
            // Show on right
            position = 'right';
            left = triggerRect.right + 10;
            top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        } else if (spaceOnLeft > tooltipRect.width + padding) {
            // Show on left
            position = 'left';
            left = triggerRect.left - tooltipRect.width - 10;
            top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        }
    }
    
    // Ensure top doesn't go below viewport
    if (top + tooltipRect.height > viewportHeight - padding) {
        top = viewportHeight - tooltipRect.height - padding;
    }
    if (top < padding) {
        top = padding;
    }
    
    // Apply position
    tooltipContent.style.top = top + 'px';
    tooltipContent.style.left = left + 'px';
    tooltipContent.classList.add(position);
}

// Update Endabrechnung section with tax summary tables
function updateEndabrechnung() {
    // === Reinigungskosten (Zeile 57) ===
    const reinigungInput = document.getElementById('reinigungInput');
    const reinigungRate = reinigungInput ? (parseFloat(reinigungInput.value) || 0) : 0;
    const workDays = getWorkDaysCount();
    const reinigungGesamt = workDays * reinigungRate;
    
    const endReinigungTage = document.getElementById('endReinigungTage');
    const endReinigungPauschale = document.getElementById('endReinigungPauschale');
    const endReinigungGesamt = document.getElementById('endReinigungGesamt');
    
    if (endReinigungTage) endReinigungTage.textContent = workDays;
    if (endReinigungPauschale) endReinigungPauschale.textContent = reinigungRate.toFixed(2).replace('.', ',') + ' €';
    if (endReinigungGesamt) {
        const tooltipLines = [
            `${workDays} Arbeitstage × ${reinigungRate.toFixed(2).replace('.', ',')} €`,
            `= ${reinigungGesamt.toFixed(2).replace('.', ',')} €`
        ];
        endReinigungGesamt.innerHTML = wrapWithTooltip(reinigungGesamt.toFixed(2).replace('.', ',') + ' €', tooltipLines);
    }
    
    // === Reisenebenkosten (Zeile 71) - Trinkgeld ===
    const trinkgeldInput = document.getElementById('trinkgeldInput');
    const tipPerNight = trinkgeldInput ? (parseFloat(trinkgeldInput.value) || 0) : 0;
    const hotelNightsData = appData.hotelNights || calculateHotelaufenthalte(appData.flights);
    const hotelNights = hotelNightsData.total || 0;
    const trinkgeldGesamt = hotelNights * tipPerNight;
    
    const endTrinkgeldLabel = document.getElementById('endTrinkgeldLabel');
    const endTrinkgeldGesamt = document.getElementById('endTrinkgeldGesamt');
    
    if (endTrinkgeldLabel) endTrinkgeldLabel.textContent = `${hotelNights} Nächte × ${tipPerNight.toFixed(2).replace('.', ',')} €`;
    if (endTrinkgeldGesamt) {
        const tooltipLines = [
            `${hotelNights} Hotelnächte × ${tipPerNight.toFixed(2).replace('.', ',')} € pro Nacht`,
            `= ${trinkgeldGesamt.toFixed(2).replace('.', ',')} €`
        ];
        endTrinkgeldGesamt.innerHTML = wrapWithTooltip(trinkgeldGesamt.toFixed(2).replace('.', ',') + ' €', tooltipLines);
    }
    
    // === Verpflegungsmehraufwendungen bei Auswärtstätigkeiten ===
    // Calculate daily allowances from all flights
    const allFlightsSorted = [...appData.flights].sort((a, b) => {
        const dateA = new Date(a.year, a.month - 1, a.day);
        const dateB = new Date(b.year, b.month - 1, b.day);
        if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
        }
        return a.departureTime.localeCompare(b.departureTime);
    });
    
    const dailyAllowances = calculateDailyAllowances(allFlightsSorted);
    
    // Aggregate allowances by type
    let verpflegungDE8h = 0;   // Germany partial rate (An/Ab)
    let verpflegungDE24h = 0;  // Germany full rate (24h)
    let verpflegungAusland = 0; // Foreign allowances
    
    dailyAllowances.forEach((allowance, dateStr) => {
        if (!allowance.rate || allowance.rate === 0) return;
        
        if (allowance.country === 'Deutschland') {
            if (allowance.rateType === '24h') {
                verpflegungDE24h += allowance.rate;
            } else {
                verpflegungDE8h += allowance.rate;
            }
        } else {
            verpflegungAusland += allowance.rate;
        }
    });
    
    const verpflegungSumme = verpflegungDE8h + verpflegungDE24h + verpflegungAusland;
    
    // Employer reimbursed tax-free amount (from Streckeneinsatzabrechnungen)
    const verpflegungErstattet = appData.expenseTotals ? appData.expenseTotals.taxFree : 0;
    
    // Difference (deductible amount)
    const verpflegungDifferenz = verpflegungSumme - verpflegungErstattet;

    // === Fahrtkosten ===
    const distanceInput = document.getElementById('distanceInput');
    const distance = distanceInput ? parseFloat(distanceInput.value) || 0 : 0;
    const tripCount = getCommuteTripCount();
    const totalKilometers = distance * tripCount;

    let fahrtPauschale = 0;
    let fahrtBerechnung = '-';
    if (distance > 0 && tripCount > 0) {
        if (distance <= 20) {
            fahrtPauschale = distance * 0.30;
            fahrtBerechnung = `${tripCount} Fahrten × ${distance} km × 0,30 €`;
        } else {
            fahrtPauschale = (20 * 0.30) + ((distance - 20) * 0.38);
            fahrtBerechnung = `${tripCount} Fahrten × (20 km × 0,30 € + ${distance - 20} km × 0,38 €)`;
        }
    }
    const fahrtkostenGesamt = fahrtPauschale * tripCount;
    const endSummeGesamt = reinigungGesamt + trinkgeldGesamt + fahrtkostenGesamt + verpflegungDifferenz;
    
    // Update DOM elements
    const endVerpflegungDE8h = document.getElementById('endVerpflegungDE8h');
    const endVerpflegungDE24h = document.getElementById('endVerpflegungDE24h');
    const endVerpflegungAusland = document.getElementById('endVerpflegungAusland');
    const endVerpflegungSumme = document.getElementById('endVerpflegungSumme');
    const endVerpflegungErstattet = document.getElementById('endVerpflegungErstattet');
    const endVerpflegungDifferenz = document.getElementById('endVerpflegungDifferenz');
    const endFahrtKilometer = document.getElementById('endFahrtKilometer');
    const endFahrtBerechnung = document.getElementById('endFahrtBerechnung');
    const endFahrtGesamt = document.getElementById('endFahrtGesamt');
    const endSummeReinigung = document.getElementById('endSummeReinigung');
    const endSummeTrinkgeld = document.getElementById('endSummeTrinkgeld');
    const endSummeFahrtkosten = document.getElementById('endSummeFahrtkosten');
    const endSummeVerpflegung = document.getElementById('endSummeVerpflegung');
    const endSummeGesamtOutput = document.getElementById('endSummeGesamt');
    
    if (endVerpflegungDE8h) endVerpflegungDE8h.textContent = verpflegungDE8h.toFixed(2).replace('.', ',') + ' €';
    if (endVerpflegungDE24h) endVerpflegungDE24h.textContent = verpflegungDE24h.toFixed(2).replace('.', ',') + ' €';
    if (endVerpflegungAusland) endVerpflegungAusland.textContent = verpflegungAusland.toFixed(2).replace('.', ',') + ' €';
    if (endVerpflegungSumme) {
        const tooltipLines = [
            `Deutschland (> 8h): ${verpflegungDE8h.toFixed(2).replace('.', ',')} €`,
            `Deutschland (24h): ${verpflegungDE24h.toFixed(2).replace('.', ',')} €`,
            `Ausland: ${verpflegungAusland.toFixed(2).replace('.', ',')} €`,
            `= ${verpflegungSumme.toFixed(2).replace('.', ',')} €`
        ];
        endVerpflegungSumme.innerHTML = wrapWithTooltip(verpflegungSumme.toFixed(2).replace('.', ',') + ' €', tooltipLines);
    }
    if (endVerpflegungErstattet) endVerpflegungErstattet.textContent = '- ' + verpflegungErstattet.toFixed(2).replace('.', ',') + ' €';
    if (endVerpflegungDifferenz) {
        const tooltipLines = [
            `Pauschalen gesamt: ${verpflegungSumme.toFixed(2).replace('.', ',')} €`,
            `Arbeitgeber erstattet: ${verpflegungErstattet.toFixed(2).replace('.', ',')} €`,
            `= ${verpflegungDifferenz.toFixed(2).replace('.', ',')} € abzugsfähig`
        ];
        endVerpflegungDifferenz.innerHTML = wrapWithTooltip(verpflegungDifferenz.toFixed(2).replace('.', ',') + ' €', tooltipLines);
    }
    if (endFahrtKilometer) {
        const tooltipLines = [
            `${tripCount} Fahrten × ${distance} km (einfach)`,
            `= ${totalKilometers} km gesamt`
        ];
        endFahrtKilometer.innerHTML = wrapWithTooltip(totalKilometers.toFixed(0) + ' km', tooltipLines);
    }
    if (endFahrtBerechnung) endFahrtBerechnung.textContent = fahrtBerechnung;
    if (endFahrtGesamt) {
        const tooltipLines = [];
        if (distance > 0 && tripCount > 0) {
            if (distance <= 20) {
                tooltipLines.push(`Pauschale: ${distance} km × 0,30 € = ${fahrtPauschale.toFixed(2).replace('.', ',')} €`);
            } else {
                tooltipLines.push(`Pauschale erste 20 km: 20 × 0,30 € = 6,00 €`);
                tooltipLines.push(`Pauschale ab 21 km: ${distance - 20} × 0,38 € = ${((distance - 20) * 0.38).toFixed(2).replace('.', ',')} €`);
                tooltipLines.push(`Pauschale gesamt: ${fahrtPauschale.toFixed(2).replace('.', ',')} €`);
            }
            tooltipLines.push(`${tripCount} Fahrten × ${fahrtPauschale.toFixed(2).replace('.', ',')} € = ${fahrtkostenGesamt.toFixed(2).replace('.', ',')} €`);
        }
        endFahrtGesamt.innerHTML = wrapWithTooltip(fahrtkostenGesamt.toFixed(2).replace('.', ',') + ' €', tooltipLines);
    }
    if (endSummeReinigung) endSummeReinigung.textContent = reinigungGesamt.toFixed(2).replace('.', ',') + ' €';
    if (endSummeTrinkgeld) endSummeTrinkgeld.textContent = trinkgeldGesamt.toFixed(2).replace('.', ',') + ' €';
    if (endSummeFahrtkosten) endSummeFahrtkosten.textContent = fahrtkostenGesamt.toFixed(2).replace('.', ',') + ' €';
    if (endSummeVerpflegung) endSummeVerpflegung.textContent = verpflegungDifferenz.toFixed(2).replace('.', ',') + ' €';
    if (endSummeGesamtOutput) {
        const tooltipLines = [
            `Reinigungskosten: ${reinigungGesamt.toFixed(2).replace('.', ',')} €`,
            `Trinkgeld: ${trinkgeldGesamt.toFixed(2).replace('.', ',')} €`,
            `Fahrtkosten: ${fahrtkostenGesamt.toFixed(2).replace('.', ',')} €`,
            `Verpflegungsdifferenz: ${verpflegungDifferenz.toFixed(2).replace('.', ',')} €`,
            `= ${endSummeGesamt.toFixed(2).replace('.', ',')} €`
        ];
        endSummeGesamtOutput.innerHTML = wrapWithTooltip(endSummeGesamt.toFixed(2).replace('.', ',') + ' €', tooltipLines);
    }
}

// ============================================================================
// WIZARD CONTROLLER
// ============================================================================

/**
 * Check if navigation to a target step is allowed.
 * Step 2 requires parsed flight data (successful PDF upload).
 * Step 3 has no additional gating beyond step 2.
 */
function canProceedToStep(targetStep) {
    if (targetStep <= 1) return true;
    
    // Step 2+ requires parsed flights from PDF upload
    if (targetStep >= 2) {
        const hasFlights = appData.flights && appData.flights.length > 0;
        const hasExpenses = appData.expenseTotals && appData.expenseTotals.total > 0;
        return hasFlights || hasExpenses;
    }
    return true;
}

/**
 * Navigate to a specific wizard step.
 * Validates step range and gating before navigation.
 * Updates UI and manages focus.
 */
function goToWizardStep(step) {
    if (step < 1 || step > WIZARD_STEPS) return;
    
    // Only gate forward navigation, allow going back freely
    if (step > currentWizardStep && !canProceedToStep(step)) {
        const feedbackEl = document.getElementById('wizardFeedback');
        if (feedbackEl) {
            feedbackEl.textContent = 'Bitte laden Sie mindestens eine PDF-Datei hoch.';
            feedbackEl.hidden = false;
            setTimeout(() => { feedbackEl.hidden = true; }, 3000);
        }
        return;
    }
    
    currentWizardStep = step;
    updateWizardUI();
}

/**
 * Navigate to the next wizard step.
 */
function nextStep() {
    goToWizardStep(currentWizardStep + 1);
}

/**
 * Navigate to the previous wizard step.
 */
function prevStep() {
    goToWizardStep(currentWizardStep - 1);
}

/**
 * Alias for goToWizardStep for external API consistency.
 */
function goToStep(step) {
    goToWizardStep(step);
}

/**
 * Update wizard UI: step visibility, indicators, and focus management.
 */
function updateWizardUI() {
    // Hide/show step sections
    document.querySelectorAll('[data-wizard-step]').forEach(section => {
        const stepNum = parseInt(section.dataset.wizardStep);
        section.hidden = stepNum !== currentWizardStep;
    });
    
    // Update step indicators
    document.querySelectorAll('.wizard-step-indicator').forEach((indicator, idx) => {
        const stepNum = idx + 1;
        indicator.classList.toggle('active', stepNum === currentWizardStep);
        indicator.classList.toggle('completed', stepNum < currentWizardStep);
        indicator.setAttribute('aria-current', stepNum === currentWizardStep ? 'step' : 'false');
    });
    
    // Focus management: focus the step heading for accessibility
    const activeStep = document.querySelector(`[data-wizard-step="${currentWizardStep}"]`);
    if (activeStep) {
        const heading = activeStep.querySelector('h2');
        if (heading) {
            heading.tabIndex = -1;
            heading.focus();
        }
    }
    
    // Clear any feedback messages
    const feedbackEl = document.getElementById('wizardFeedback');
    if (feedbackEl) feedbackEl.hidden = true;
}

// Expose wizard state for debugging
Object.defineProperty(window, '__wizardStep', {
    get: function() { return currentWizardStep; },
    enumerable: true,
    configurable: false
});

// ============================================================================
// COLLAPSIBLE SECTIONS
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize collapsible sections
    const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
    
    collapsibleHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const section = this.closest('.collapsible-section');
            section.classList.toggle('expanded');
            
            // Update aria-expanded for accessibility
            const isExpanded = section.classList.contains('expanded');
            this.setAttribute('aria-expanded', isExpanded);
        });
        
        // Set initial aria-expanded state
        const section = header.closest('.collapsible-section');
        header.setAttribute('aria-expanded', section.classList.contains('expanded'));
    });
});

// ============================================================================
// UPDATED ENDABRECHNUNG FUNCTION
// ============================================================================

// Store reference to original updateEndabrechnung if it exists
const originalUpdateEndabrechnung = typeof updateEndabrechnung === 'function' ? updateEndabrechnung : null;

// Override updateEndabrechnung to also update the hero total and category cards
function updateEndabrechnung() {
    // Call original function if it exists
    if (originalUpdateEndabrechnung) {
        originalUpdateEndabrechnung();
    }
    
    // Calculate Sonstiges (Reinigung + Trinkgeld)
    const reinigungEl = document.getElementById('endSummeReinigung');
    const trinkgeldEl = document.getElementById('endSummeTrinkgeld');
    const sonstigesEl = document.getElementById('endSummeSonstiges');
    
    if (reinigungEl && trinkgeldEl && sonstigesEl) {
        const reinigung = parseFloat(reinigungEl.textContent.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
        const trinkgeld = parseFloat(trinkgeldEl.textContent.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
        const sonstiges = reinigung + trinkgeld;
        sonstigesEl.textContent = formatCurrency(sonstiges);
    }
    
    // Update the hero total (endSummeGesamt is already updated by original function)
    // Also update the endSummeGesamtTotal in the Endabrechnung table
    const gesamtEl = document.getElementById('endSummeGesamt');
    const gesamtTotalEl = document.getElementById('endSummeGesamtTotal');
    
    if (gesamtEl && gesamtTotalEl) {
        gesamtTotalEl.textContent = gesamtEl.textContent;
    }
}

// Helper function to format currency
function formatCurrency(value) {
    return value.toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' €';
}

// ============================================================================
// UPDATE CATEGORY CARDS
// ============================================================================

// Function to update category cards from the endabrechnung values
function updateCategoryCards() {
    // Update Fahrtkosten card
    const fahrtkostenSource = document.getElementById('endSummeFahrtkosten');
    const fahrtkostenCard = document.getElementById('cardFahrtkosten');
    if (fahrtkostenSource && fahrtkostenCard) {
        fahrtkostenCard.textContent = fahrtkostenSource.textContent;
    }
    
    // Update Verpflegung card
    const verpflegungSource = document.getElementById('endSummeVerpflegung');
    const verpflegungCard = document.getElementById('cardVerpflegung');
    if (verpflegungSource && verpflegungCard) {
        verpflegungCard.textContent = verpflegungSource.textContent;
    }
    
    // Update Sonstiges card (Reinigung + Trinkgeld)
    const reinigungEl = document.getElementById('endSummeReinigung');
    const trinkgeldEl = document.getElementById('endSummeTrinkgeld');
    const sonstigesCard = document.getElementById('cardSonstiges');
    
    if (reinigungEl && trinkgeldEl && sonstigesCard) {
        const reinigung = parseFloat(reinigungEl.textContent.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
        const trinkgeld = parseFloat(trinkgeldEl.textContent.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
        const sonstiges = reinigung + trinkgeld;
        sonstigesCard.textContent = formatCurrency(sonstiges);
    }
}

// Hook into existing updateEndabrechnung function
const originalUpdateEndabrechnungForCards = typeof updateEndabrechnung === 'function' ? updateEndabrechnung : null;

function updateEndabrechnung() {
    // Call original if exists
    if (originalUpdateEndabrechnungForCards && originalUpdateEndabrechnungForCards !== updateEndabrechnung) {
        originalUpdateEndabrechnungForCards();
    }
    
    // Update the hero total
    const gesamtEl = document.getElementById('endSummeGesamt');
    const gesamtTotalEl = document.getElementById('endSummeGesamtTotal');
    
    if (gesamtEl && gesamtTotalEl) {
        gesamtTotalEl.textContent = gesamtEl.textContent;
    }
    
    // Update category cards
    updateCategoryCards();
}

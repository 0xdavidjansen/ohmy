// IATA Airport Codes to Country Mapping
// Includes major airports and those commonly used by Lufthansa
// UTC offsets are standard time (winter), DST adds +1 hour in applicable regions

const AIRPORTS = {
    // Germany (DE) - UTC+1
    "FRA": { country: "Deutschland", code: "DE", city: "Frankfurt", flag: "🇩🇪", utcOffset: 1 },
    "MUC": { country: "Deutschland", code: "DE", city: "München", flag: "🇩🇪", utcOffset: 1 },
    "DUS": { country: "Deutschland", code: "DE", city: "Düsseldorf", flag: "🇩🇪", utcOffset: 1 },
    "TXL": { country: "Deutschland", code: "DE", city: "Berlin Tegel", flag: "🇩🇪", utcOffset: 1 },
    "BER": { country: "Deutschland", code: "DE", city: "Berlin", flag: "🇩🇪", utcOffset: 1 },
    "HAM": { country: "Deutschland", code: "DE", city: "Hamburg", flag: "🇩🇪", utcOffset: 1 },
    "CGN": { country: "Deutschland", code: "DE", city: "Köln/Bonn", flag: "🇩🇪", utcOffset: 1 },
    "STR": { country: "Deutschland", code: "DE", city: "Stuttgart", flag: "🇩🇪", utcOffset: 1 },
    "HAJ": { country: "Deutschland", code: "DE", city: "Hannover", flag: "🇩🇪", utcOffset: 1 },
    "NUE": { country: "Deutschland", code: "DE", city: "Nürnberg", flag: "🇩🇪", utcOffset: 1 },
    "LEJ": { country: "Deutschland", code: "DE", city: "Leipzig", flag: "🇩🇪", utcOffset: 1 },
    "DRS": { country: "Deutschland", code: "DE", city: "Dresden", flag: "🇩🇪", utcOffset: 1 },
    "BRE": { country: "Deutschland", code: "DE", city: "Bremen", flag: "🇩🇪", utcOffset: 1 },
    "DTM": { country: "Deutschland", code: "DE", city: "Dortmund", flag: "🇩🇪", utcOffset: 1 },
    "IGS": { country: "Deutschland", code: "DE", city: "Ingolstadt", flag: "🇩🇪", utcOffset: 1 },
    
    // Africa
    "NBO": { country: "Kenia", code: "KE", city: "Nairobi", flag: "🇰🇪", utcOffset: 3 },
    "JNB": { country: "Südafrika", code: "ZA", city: "Johannesburg", flag: "🇿🇦", utcOffset: 2 },
    "CPT": { country: "Südafrika-Kapstadt", code: "ZA", city: "Kapstadt", flag: "🇿🇦", utcOffset: 2 },
    "CAI": { country: "Ägypten", code: "EG", city: "Kairo", flag: "🇪🇬", utcOffset: 2 },
    "LOS": { country: "Nigeria", code: "NG", city: "Lagos", flag: "🇳🇬", utcOffset: 1 },
    "ABV": { country: "Nigeria", code: "NG", city: "Abuja", flag: "🇳🇬", utcOffset: 1 },
    "ADD": { country: "Äthiopien", code: "ET", city: "Addis Abeba", flag: "🇪🇹", utcOffset: 3 },
    "CMN": { country: "Marokko", code: "MA", city: "Casablanca", flag: "🇲🇦", utcOffset: 1 },
    "RAK": { country: "Marokko", code: "MA", city: "Marrakesch", flag: "🇲🇦", utcOffset: 1 },
    "TUN": { country: "Tunesien", code: "TN", city: "Tunis", flag: "🇹🇳", utcOffset: 1 },
    "ALG": { country: "Algerien", code: "DZ", city: "Algier", flag: "🇩🇿", utcOffset: 1 },
    "DAR": { country: "Tansania", code: "TZ", city: "Daressalam", flag: "🇹🇿", utcOffset: 3 },
    "ACC": { country: "Ghana", code: "GH", city: "Accra", flag: "🇬🇭", utcOffset: 0 },
    "MBA": { country: "Kenia", code: "KE", city: "Mombasa", flag: "🇰🇪", utcOffset: 3 },
    "MRU": { country: "Mauritius", code: "MU", city: "Port Louis", flag: "🇲🇺", utcOffset: 4 },
    "SEZ": { country: "Seychellen", code: "SC", city: "Mahé", flag: "🇸🇨", utcOffset: 4 },
    "WDH": { country: "Namibia", code: "NA", city: "Windhoek", flag: "🇳🇦", utcOffset: 2 },
    "LAD": { country: "Angola", code: "AO", city: "Luanda", flag: "🇦🇴", utcOffset: 1 },
    "SSG": { country: "Äquatorialguinea", code: "GQ", city: "Malabo", flag: "🇬🇶", utcOffset: 1 },
    
    // Middle East
    "DXB": { country: "Vereinigte Arabische Emirate", code: "AE", city: "Dubai", flag: "🇦🇪", utcOffset: 4 },
    "AUH": { country: "Vereinigte Arabische Emirate", code: "AE", city: "Abu Dhabi", flag: "🇦🇪", utcOffset: 4 },
    "DOH": { country: "Katar", code: "QA", city: "Doha", flag: "🇶🇦", utcOffset: 3 },
    "RUH": { country: "Saudi-Arabien-Riad", code: "SA", city: "Riad", flag: "🇸🇦", utcOffset: 3 },
    "JED": { country: "Saudi-Arabien", code: "SA", city: "Dschidda", flag: "🇸🇦", utcOffset: 3 },
    "DMM": { country: "Saudi-Arabien", code: "SA", city: "Dammam", flag: "🇸🇦", utcOffset: 3 },
    "TLV": { country: "Israel", code: "IL", city: "Tel Aviv", flag: "🇮🇱", utcOffset: 2 },
    "AMM": { country: "Jordanien", code: "JO", city: "Amman", flag: "🇯🇴", utcOffset: 2 },
    "KWI": { country: "Kuwait", code: "KW", city: "Kuwait City", flag: "🇰🇼", utcOffset: 3 },
    "BAH": { country: "Bahrain", code: "BH", city: "Manama", flag: "🇧🇭", utcOffset: 3 },
    "MCT": { country: "Oman", code: "OM", city: "Maskat", flag: "🇴🇲", utcOffset: 4 },
    "BGW": { country: "Irak", code: "IQ", city: "Bagdad", flag: "🇮🇶", utcOffset: 3 },
    "EBL": { country: "Irak", code: "IQ", city: "Erbil", flag: "🇮🇶", utcOffset: 3 },
    "IKA": { country: "Iran", code: "IR", city: "Teheran", flag: "🇮🇷", utcOffset: 3.5 },
    "BEY": { country: "Libanon", code: "LB", city: "Beirut", flag: "🇱🇧", utcOffset: 2 },
    
    // North America
    "JFK": { country: "USA-New York Staat", code: "US", city: "New York JFK", flag: "🇺🇸", utcOffset: -5 },
    "EWR": { country: "USA", code: "US", city: "Newark", flag: "🇺🇸", utcOffset: -5 },
    "LAX": { country: "USA", code: "US", city: "Los Angeles", flag: "🇺🇸", utcOffset: -8 },
    "ORD": { country: "USA-Chicago", code: "US", city: "Chicago", flag: "🇺🇸", utcOffset: -6 },
    "SFO": { country: "USA", code: "US", city: "San Francisco", flag: "🇺🇸", utcOffset: -8 },
    "MIA": { country: "USA", code: "US", city: "Miami", flag: "🇺🇸", utcOffset: -5 },
    "DFW": { country: "USA", code: "US", city: "Dallas", flag: "🇺🇸", utcOffset: -6 },
    "IAH": { country: "USA", code: "US", city: "Houston", flag: "🇺🇸", utcOffset: -6 },
    "BOS": { country: "USA", code: "US", city: "Boston", flag: "🇺🇸", utcOffset: -5 },
    "ATL": { country: "USA", code: "US", city: "Atlanta", flag: "🇺🇸", utcOffset: -5 },
    "SEA": { country: "USA", code: "US", city: "Seattle", flag: "🇺🇸", utcOffset: -8 },
    "DEN": { country: "USA", code: "US", city: "Denver", flag: "🇺🇸", utcOffset: -7 },
    "PHX": { country: "USA", code: "US", city: "Phoenix", flag: "🇺🇸", utcOffset: -7 },
    "IAD": { country: "USA", code: "US", city: "Washington Dulles", flag: "🇺🇸", utcOffset: -5 },
    "DCA": { country: "USA", code: "US", city: "Washington Reagan", flag: "🇺🇸", utcOffset: -5 },
    "PHL": { country: "USA", code: "US", city: "Philadelphia", flag: "🇺🇸", utcOffset: -5 },
    "DTW": { country: "USA", code: "US", city: "Detroit", flag: "🇺🇸", utcOffset: -5 },
    "MSP": { country: "USA", code: "US", city: "Minneapolis", flag: "🇺🇸", utcOffset: -6 },
    "CLT": { country: "USA", code: "US", city: "Charlotte", flag: "🇺🇸", utcOffset: -5 },
    "SAN": { country: "USA", code: "US", city: "San Diego", flag: "🇺🇸", utcOffset: -8 },
    "LAS": { country: "USA", code: "US", city: "Las Vegas", flag: "🇺🇸", utcOffset: -8 },
    "STL": { country: "USA", code: "US", city: "St. Louis", flag: "🇺🇸", utcOffset: -6 },
    "AUS": { country: "USA", code: "US", city: "Austin", flag: "🇺🇸", utcOffset: -6 },
    "YYZ": { country: "Kanada", code: "CA", city: "Toronto", flag: "🇨🇦", utcOffset: -5 },
    "YVR": { country: "Kanada", code: "CA", city: "Vancouver", flag: "🇨🇦", utcOffset: -8 },
    "YUL": { country: "Kanada", code: "CA", city: "Montreal", flag: "🇨🇦", utcOffset: -5 },
    "YYC": { country: "Kanada", code: "CA", city: "Calgary", flag: "🇨🇦", utcOffset: -7 },
    "YOW": { country: "Kanada", code: "CA", city: "Ottawa", flag: "🇨🇦", utcOffset: -5 },
    "MEX": { country: "Mexiko", code: "MX", city: "Mexiko-Stadt", flag: "🇲🇽", utcOffset: -6 },
    "CUN": { country: "Mexiko", code: "MX", city: "Cancún", flag: "🇲🇽", utcOffset: -5 },
    
    // Central & South America
    "GRU": { country: "Brasilien", code: "BR", city: "São Paulo", flag: "🇧🇷", utcOffset: -3 },
    "GIG": { country: "Brasilien", code: "BR", city: "Rio de Janeiro", flag: "🇧🇷", utcOffset: -3 },
    "EZE": { country: "Argentinien", code: "AR", city: "Buenos Aires", flag: "🇦🇷", utcOffset: -3 },
    "SCL": { country: "Chile", code: "CL", city: "Santiago", flag: "🇨🇱", utcOffset: -3 },
    "BOG": { country: "Kolumbien", code: "CO", city: "Bogotá", flag: "🇨🇴", utcOffset: -5 },
    "LIM": { country: "Peru", code: "PE", city: "Lima", flag: "🇵🇪", utcOffset: -5 },
    "CCS": { country: "Venezuela", code: "VE", city: "Caracas", flag: "🇻🇪", utcOffset: -4 },
    "PTY": { country: "Panama", code: "PA", city: "Panama City", flag: "🇵🇦", utcOffset: -5 },
    "SJO": { country: "Costa Rica", code: "CR", city: "San José", flag: "🇨🇷", utcOffset: -6 },
    "HAV": { country: "Kuba", code: "CU", city: "Havanna", flag: "🇨🇺", utcOffset: -5 },
    "PUJ": { country: "Dom. Republik", code: "DO", city: "Punta Cana", flag: "🇩🇴", utcOffset: -4 },
    "SDQ": { country: "Dom. Republik", code: "DO", city: "Santo Domingo", flag: "🇩🇴", utcOffset: -4 },
    "MBJ": { country: "Jamaika", code: "JM", city: "Montego Bay", flag: "🇯🇲", utcOffset: -5 },
    "UIO": { country: "Ecuador", code: "EC", city: "Quito", flag: "🇪🇨", utcOffset: -5 },
    
    // Asia
    "PEK": { country: "China", code: "CN", city: "Peking", flag: "🇨🇳", utcOffset: 8 },
    "PVG": { country: "China", code: "CN", city: "Shanghai", flag: "🇨🇳", utcOffset: 8 },
    "CAN": { country: "China", code: "CN", city: "Guangzhou", flag: "🇨🇳", utcOffset: 8 },
    "HKG": { country: "Hongkong", code: "HK", city: "Hongkong", flag: "🇭🇰", utcOffset: 8 },
    "NRT": { country: "Japan", code: "JP", city: "Tokio Narita", flag: "🇯🇵", utcOffset: 9 },
    "HND": { country: "Japan", code: "JP", city: "Tokio Haneda", flag: "🇯🇵", utcOffset: 9 },
    "KIX": { country: "Japan", code: "JP", city: "Osaka Kansai", flag: "🇯🇵", utcOffset: 9 },
    "ICN": { country: "Südkorea", code: "KR", city: "Seoul Incheon", flag: "🇰🇷", utcOffset: 9 },
    "SIN": { country: "Singapur", code: "SG", city: "Singapur", flag: "🇸🇬", utcOffset: 8 },
    "BKK": { country: "Thailand", code: "TH", city: "Bangkok", flag: "🇹🇭", utcOffset: 7 },
    "HKT": { country: "Thailand", code: "TH", city: "Phuket", flag: "🇹🇭", utcOffset: 7 },
    "KUL": { country: "Malaysia", code: "MY", city: "Kuala Lumpur", flag: "🇲🇾", utcOffset: 8 },
    "CGK": { country: "Indonesien", code: "ID", city: "Jakarta", flag: "🇮🇩", utcOffset: 7 },
    "DPS": { country: "Indonesien", code: "ID", city: "Bali", flag: "🇮🇩", utcOffset: 8 },
    "MNL": { country: "Philippinen", code: "PH", city: "Manila", flag: "🇵🇭", utcOffset: 8 },
    "SGN": { country: "Vietnam", code: "VN", city: "Ho Chi Minh", flag: "🇻🇳", utcOffset: 7 },
    "HAN": { country: "Vietnam", code: "VN", city: "Hanoi", flag: "🇻🇳", utcOffset: 7 },
    "DEL": { country: "Indien", code: "IN", city: "Neu-Delhi", flag: "🇮🇳", utcOffset: 5.5 },
    "BOM": { country: "Indien-Mumbai", code: "IN", city: "Mumbai", flag: "🇮🇳", utcOffset: 5.5 },
    "BLR": { country: "Indien", code: "IN", city: "Bangalore", flag: "🇮🇳", utcOffset: 5.5 },
    "MAA": { country: "Indien-Chennai", code: "IN", city: "Chennai", flag: "🇮🇳", utcOffset: 5.5 },
    "CCU": { country: "Indien", code: "IN", city: "Kolkata", flag: "🇮🇳", utcOffset: 5.5 },
    "HYD": { country: "Indien", code: "IN", city: "Hyderabad", flag: "🇮🇳", utcOffset: 5.5 },
    "CMB": { country: "Sri Lanka", code: "LK", city: "Colombo", flag: "🇱🇰", utcOffset: 5.5 },
    "MLE": { country: "Malediven", code: "MV", city: "Malé", flag: "🇲🇻", utcOffset: 5 },
    "KTM": { country: "Nepal", code: "NP", city: "Kathmandu", flag: "🇳🇵", utcOffset: 5.75 },
    "DAC": { country: "Bangladesch", code: "BD", city: "Dhaka", flag: "🇧🇩", utcOffset: 6 },
    "ISB": { country: "Pakistan", code: "PK", city: "Islamabad", flag: "🇵🇰", utcOffset: 5 },
    "KHI": { country: "Pakistan", code: "PK", city: "Karachi", flag: "🇵🇰", utcOffset: 5 },
    "TPE": { country: "Taiwan", code: "TW", city: "Taipei", flag: "🇹🇼", utcOffset: 8 },
    
    // Oceania
    "SYD": { country: "Australien", code: "AU", city: "Sydney", flag: "🇦🇺", utcOffset: 10 },
    "MEL": { country: "Australien", code: "AU", city: "Melbourne", flag: "🇦🇺", utcOffset: 10 },
    "BNE": { country: "Australien", code: "AU", city: "Brisbane", flag: "🇦🇺", utcOffset: 10 },
    "PER": { country: "Australien", code: "AU", city: "Perth", flag: "🇦🇺", utcOffset: 8 },
    "AKL": { country: "Neuseeland", code: "NZ", city: "Auckland", flag: "🇳🇿", utcOffset: 12 },
    
    // Europe
    "LHR": { country: "Großbritannien", code: "GB", city: "London Heathrow", flag: "🇬🇧", utcOffset: 0 },
    "LGW": { country: "Großbritannien", code: "GB", city: "London Gatwick", flag: "🇬🇧", utcOffset: 0 },
    "STN": { country: "Großbritannien", code: "GB", city: "London Stansted", flag: "🇬🇧", utcOffset: 0 },
    "LCY": { country: "Großbritannien", code: "GB", city: "London City", flag: "🇬🇧", utcOffset: 0 },
    "MAN": { country: "Großbritannien", code: "GB", city: "Manchester", flag: "🇬🇧", utcOffset: 0 },
    "EDI": { country: "Großbritannien", code: "GB", city: "Edinburgh", flag: "🇬🇧", utcOffset: 0 },
    "BHX": { country: "Großbritannien", code: "GB", city: "Birmingham", flag: "🇬🇧", utcOffset: 0 },
    "CDG": { country: "Frankreich", code: "FR", city: "Paris CDG", flag: "🇫🇷", utcOffset: 1 },
    "ORY": { country: "Frankreich", code: "FR", city: "Paris Orly", flag: "🇫🇷", utcOffset: 1 },
    "NCE": { country: "Frankreich", code: "FR", city: "Nizza", flag: "🇫🇷", utcOffset: 1 },
    "LYS": { country: "Frankreich", code: "FR", city: "Lyon", flag: "🇫🇷", utcOffset: 1 },
    "MRS": { country: "Frankreich", code: "FR", city: "Marseille", flag: "🇫🇷", utcOffset: 1 },
    "TLS": { country: "Frankreich", code: "FR", city: "Toulouse", flag: "🇫🇷", utcOffset: 1 },
    "AMS": { country: "Niederlande", code: "NL", city: "Amsterdam", flag: "🇳🇱", utcOffset: 1 },
    "BRU": { country: "Belgien", code: "BE", city: "Brüssel", flag: "🇧🇪", utcOffset: 1 },
    "ZRH": { country: "Schweiz", code: "CH", city: "Zürich", flag: "🇨🇭", utcOffset: 1 },
    "GVA": { country: "Schweiz", code: "CH", city: "Genf", flag: "🇨🇭", utcOffset: 1 },
    "BSL": { country: "Schweiz", code: "CH", city: "Basel", flag: "🇨🇭", utcOffset: 1 },
    "VIE": { country: "Österreich", code: "AT", city: "Wien", flag: "🇦🇹", utcOffset: 1 },
    "SZG": { country: "Österreich", code: "AT", city: "Salzburg", flag: "🇦🇹", utcOffset: 1 },
    "INN": { country: "Österreich", code: "AT", city: "Innsbruck", flag: "🇦🇹", utcOffset: 1 },
    "MAD": { country: "Spanien", code: "ES", city: "Madrid", flag: "🇪🇸", utcOffset: 1 },
    "BCN": { country: "Spanien", code: "ES", city: "Barcelona", flag: "🇪🇸", utcOffset: 1 },
    "PMI": { country: "Spanien", code: "ES", city: "Palma de Mallorca", flag: "🇪🇸", utcOffset: 1 },
    "AGP": { country: "Spanien", code: "ES", city: "Málaga", flag: "🇪🇸", utcOffset: 1 },
    "VLC": { country: "Spanien", code: "ES", city: "Valencia", flag: "🇪🇸", utcOffset: 1 },
    "ALC": { country: "Spanien", code: "ES", city: "Alicante", flag: "🇪🇸", utcOffset: 1 },
    "TFS": { country: "Spanien", code: "ES", city: "Teneriffa", flag: "🇪🇸", utcOffset: 0 },
    "LPA": { country: "Spanien", code: "ES", city: "Gran Canaria", flag: "🇪🇸", utcOffset: 0 },
    "FCO": { country: "Italien", code: "IT", city: "Rom", flag: "🇮🇹", utcOffset: 1 },
    "MXP": { country: "Italien", code: "IT", city: "Mailand Malpensa", flag: "🇮🇹", utcOffset: 1 },
    "VCE": { country: "Italien", code: "IT", city: "Venedig", flag: "🇮🇹", utcOffset: 1 },
    "NAP": { country: "Italien", code: "IT", city: "Neapel", flag: "🇮🇹", utcOffset: 1 },
    "FLR": { country: "Italien", code: "IT", city: "Florenz", flag: "🇮🇹", utcOffset: 1 },
    "LIS": { country: "Portugal", code: "PT", city: "Lissabon", flag: "🇵🇹", utcOffset: 0 },
    "OPO": { country: "Portugal", code: "PT", city: "Porto", flag: "🇵🇹", utcOffset: 0 },
    "FAO": { country: "Portugal", code: "PT", city: "Faro", flag: "🇵🇹", utcOffset: 0 },
    "CPH": { country: "Dänemark", code: "DK", city: "Kopenhagen", flag: "🇩🇰", utcOffset: 1 },
    "OSL": { country: "Norwegen", code: "NO", city: "Oslo", flag: "🇳🇴", utcOffset: 1 },
    "BGO": { country: "Norwegen", code: "NO", city: "Bergen", flag: "🇳🇴", utcOffset: 1 },
    "ARN": { country: "Schweden", code: "SE", city: "Stockholm", flag: "🇸🇪", utcOffset: 1 },
    "GOT": { country: "Schweden", code: "SE", city: "Göteborg", flag: "🇸🇪", utcOffset: 1 },
    "HEL": { country: "Finnland", code: "FI", city: "Helsinki", flag: "🇫🇮", utcOffset: 2 },
    "DUB": { country: "Irland", code: "IE", city: "Dublin", flag: "🇮🇪", utcOffset: 0 },
    "ATH": { country: "Griechenland", code: "GR", city: "Athen", flag: "🇬🇷", utcOffset: 2 },
    "SKG": { country: "Griechenland", code: "GR", city: "Thessaloniki", flag: "🇬🇷", utcOffset: 2 },
    "HER": { country: "Griechenland", code: "GR", city: "Heraklion", flag: "🇬🇷", utcOffset: 2 },
    "RHO": { country: "Griechenland", code: "GR", city: "Rhodos", flag: "🇬🇷", utcOffset: 2 },
    "IST": { country: "Türkei", code: "TR", city: "Istanbul", flag: "🇹🇷", utcOffset: 3 },
    "SAW": { country: "Türkei", code: "TR", city: "Istanbul Sabiha", flag: "🇹🇷", utcOffset: 3 },
    "AYT": { country: "Türkei", code: "TR", city: "Antalya", flag: "🇹🇷", utcOffset: 3 },
    "ADB": { country: "Türkei", code: "TR", city: "Izmir", flag: "🇹🇷", utcOffset: 3 },
    "ESB": { country: "Türkei", code: "TR", city: "Ankara", flag: "🇹🇷", utcOffset: 3 },
    "WAW": { country: "Polen", code: "PL", city: "Warschau", flag: "🇵🇱", utcOffset: 1 },
    "KRK": { country: "Polen", code: "PL", city: "Krakau", flag: "🇵🇱", utcOffset: 1 },
    "GDN": { country: "Polen", code: "PL", city: "Danzig", flag: "🇵🇱", utcOffset: 1 },
    "PRG": { country: "Tschechien", code: "CZ", city: "Prag", flag: "🇨🇿", utcOffset: 1 },
    "BUD": { country: "Ungarn", code: "HU", city: "Budapest", flag: "🇭🇺", utcOffset: 1 },
    "OTP": { country: "Rumänien", code: "RO", city: "Bukarest", flag: "🇷🇴", utcOffset: 2 },
    "SOF": { country: "Bulgarien", code: "BG", city: "Sofia", flag: "🇧🇬", utcOffset: 2 },
    "BEG": { country: "Serbien", code: "RS", city: "Belgrad", flag: "🇷🇸", utcOffset: 1 },
    "ZAG": { country: "Kroatien", code: "HR", city: "Zagreb", flag: "🇭🇷", utcOffset: 1 },
    "SPU": { country: "Kroatien", code: "HR", city: "Split", flag: "🇭🇷", utcOffset: 1 },
    "DBV": { country: "Kroatien", code: "HR", city: "Dubrovnik", flag: "🇭🇷", utcOffset: 1 },
    "LJU": { country: "Slowenien", code: "SI", city: "Ljubljana", flag: "🇸🇮", utcOffset: 1 },
    "BTS": { country: "Slowakei", code: "SK", city: "Bratislava", flag: "🇸🇰", utcOffset: 1 },
    "RIX": { country: "Lettland", code: "LV", city: "Riga", flag: "🇱🇻", utcOffset: 2 },
    "VNO": { country: "Litauen", code: "LT", city: "Vilnius", flag: "🇱🇹", utcOffset: 2 },
    "TLL": { country: "Estland", code: "EE", city: "Tallinn", flag: "🇪🇪", utcOffset: 2 },
    "KIV": { country: "Moldawien", code: "MD", city: "Chișinău", flag: "🇲🇩", utcOffset: 2 },
    "KBP": { country: "Ukraine", code: "UA", city: "Kiew", flag: "🇺🇦", utcOffset: 2 },
    "LWO": { country: "Ukraine", code: "UA", city: "Lwiw", flag: "🇺🇦", utcOffset: 2 },
    "TBS": { country: "Georgien", code: "GE", city: "Tiflis", flag: "🇬🇪", utcOffset: 4 },
    "EVN": { country: "Armenien", code: "AM", city: "Eriwan", flag: "🇦🇲", utcOffset: 4 },
    "GYD": { country: "Aserbaidschan", code: "AZ", city: "Baku", flag: "🇦🇿", utcOffset: 4 },
    "SVO": { country: "Russland", code: "RU", city: "Moskau SVO", flag: "🇷🇺", utcOffset: 3 },
    "DME": { country: "Russland", code: "RU", city: "Moskau DME", flag: "🇷🇺", utcOffset: 3 },
    "LED": { country: "Russland", code: "RU", city: "St. Petersburg", flag: "🇷🇺", utcOffset: 3 },
    
    // Central Asia
    "NQZ": { country: "Kasachstan", code: "KZ", city: "Astana", flag: "🇰🇿", utcOffset: 6 },
    "ALA": { country: "Kasachstan", code: "KZ", city: "Almaty", flag: "🇰🇿", utcOffset: 6 },
    "TAS": { country: "Usbekistan", code: "UZ", city: "Taschkent", flag: "🇺🇿", utcOffset: 5 },
    
    // Caribbean
    "SXM": { country: "Sint Maarten", code: "SX", city: "St. Maarten", flag: "🇸🇽", utcOffset: -4 },
    "CUR": { country: "Curaçao", code: "CW", city: "Curaçao", flag: "🇨🇼", utcOffset: -4 },
    "AUA": { country: "Aruba", code: "AW", city: "Aruba", flag: "🇦🇼", utcOffset: -4 },
    "BGI": { country: "Barbados", code: "BB", city: "Bridgetown", flag: "🇧🇧", utcOffset: -4 },
    "POS": { country: "Trinidad", code: "TT", city: "Port of Spain", flag: "🇹🇹", utcOffset: -4 },
};

// Helper function to get airport info
function getAirportInfo(iataCode) {
    const code = iataCode?.toUpperCase?.() || '';
    return AIRPORTS[code] || {
        country: "Unbekannt",
        code: "XX",
        city: code,
        flag: "🏳️",
        utcOffset: 0
    };
}

// Get country from IATA code
function getCountry(iataCode) {
    return getAirportInfo(iataCode).country;
}

// Get country code (ISO 2-letter) from IATA code
function getCountryCode(iataCode) {
    return getAirportInfo(iataCode).code;
}

// Get flag from IATA code
function getFlag(iataCode) {
    return getAirportInfo(iataCode).flag;
}

// Get UTC offset from IATA code (in hours, can be fractional e.g. 5.5 for India)
function getUtcOffset(iataCode) {
    return getAirportInfo(iataCode).utcOffset;
}

// Check if airport is in Germany (homebase logic)
function isGermany(iataCode) {
    const info = getAirportInfo(iataCode);
    return info.code === 'DE';
}

// Convert UTC time to local time at a given airport
// Returns object with { hours: 0-23, crossesMidnight: boolean, dayOffset: -1, 0, or 1 }
function utcToLocalTime(utcHours, utcMinutes, iataCode) {
    const offset = getUtcOffset(iataCode);
    let localHours = utcHours + offset;
    let dayOffset = 0;
    
    // Handle day boundary crossing
    if (localHours >= 24) {
        localHours -= 24;
        dayOffset = 1; // Next day
    } else if (localHours < 0) {
        localHours += 24;
        dayOffset = -1; // Previous day
    }
    
    return {
        hours: localHours,
        minutes: utcMinutes,
        dayOffset: dayOffset
    };
}

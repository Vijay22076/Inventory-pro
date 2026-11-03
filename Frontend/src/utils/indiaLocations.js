/**
 * Standard Indian States, Cities, and 6-Digit Postal/PIN Codes
 * Used for Warehouse Management System (WMS) address selection.
 */

export const STATE_CITY_PIN_DATA = {
    "Andhra Pradesh": {
        "Visakhapatnam": ["530001", "530002", "530016", "530048"],
        "Vijayawada": ["520001", "520002", "520008", "520010"],
        "Guntur": ["522001", "522002", "522006"],
        "Tirupati": ["517501", "517502", "517507"],
        "Nellore": ["524001", "524002", "524003"],
        "Kurnool": ["518001", "518002", "518003"],
        "Rajahmundry": ["533101", "533103", "533105"],
        "Kakinada": ["533001", "533003", "533005"],
        "Anantapur": ["515001", "515002"],
        "Kadapa": ["516001", "516002"],
    },
    "Assam": {
        "Guwahati": ["781001", "781005", "781022"],
        "Silchar": ["788001", "788005"],
        "Dibrugarh": ["786001", "786002"],
        "Jorhat": ["785001", "785006"],
    },
    "Bihar": {
        "Patna": ["800001", "800002", "800020"],
        "Gaya": ["823001", "823002"],
        "Bhagalpur": ["812001", "812002"],
        "Muzaffarpur": ["842001", "842002"],
    },
    "Chandigarh": {
        "Chandigarh": ["160001", "160017", "160022"],
    },
    "Chhattisgarh": {
        "Raipur": ["492001", "492002", "492010"],
        "Bhilai": ["490001", "490006", "490020"],
        "Bilaspur": ["495001", "495004"],
    },
    "Delhi": {
        "New Delhi": ["110001", "110002", "110003", "110011", "110020"],
        "Central Delhi": ["110005", "110006", "110008"],
        "South Delhi": ["110016", "110017", "110024", "110049"],
        "North Delhi": ["110007", "110009", "110054"],
        "West Delhi": ["110015", "110026", "110058"],
        "East Delhi": ["110091", "110092", "110095"],
    },
    "Goa": {
        "Panaji": ["403001", "403002"],
        "Margao": ["403601", "403602"],
        "Vasco da Gama": ["403802"],
    },
    "Gujarat": {
        "Ahmedabad": ["380001", "380006", "380009", "380015", "380054"],
        "Surat": ["395001", "395002", "395003", "395007"],
        "Vadodara": ["390001", "390002", "390007", "390020"],
        "Rajkot": ["360001", "360002", "360005"],
        "Bhavnagar": ["364001", "364002"],
        "Gandhinagar": ["382010", "382016", "382024"],
    },
    "Haryana": {
        "Gurugram": ["122001", "122002", "122016", "122018"],
        "Faridabad": ["121001", "121002", "121006"],
        "Panipat": ["132103", "132104"],
        "Ambala": ["133001", "134003"],
        "Karnal": ["132001"],
        "Rohtak": ["124001"],
        "Hisar": ["125001"],
    },
    "Himachal Pradesh": {
        "Shimla": ["171001", "171002"],
        "Dharamshala": ["176215", "176216"],
        "Mandi": ["175001"],
        "Solan": ["173212"],
    },
    "Jharkhand": {
        "Ranchi": ["834001", "834002", "834004"],
        "Jamshedpur": ["831001", "831002"],
        "Dhanbad": ["826001", "826004"],
        "Bokaro": ["827001", "827004"],
    },
    "Karnataka": {
        "Bangalore": ["560001", "560002", "560025", "560034", "560066", "560100"],
        "Mysuru": ["570001", "570002", "570010"],
        "Mangaluru": ["575001", "575002", "575003"],
        "Hubballi-Dharwad": ["580020", "580029", "580030"],
        "Belagavi": ["590001", "590002"],
        "Davanagere": ["577001", "577002"],
        "Ballari": ["583101", "583102"],
        "Kalaburagi": ["585101", "585102"],
    },
    "Kerala": {
        "Kochi": ["682001", "682011", "682030"],
        "Thiruvananthapuram": ["695001", "695002", "695014"],
        "Kozhikode": ["673001", "673002"],
        "Thrissur": ["680001", "680002"],
        "Kollam": ["691001", "691002"],
        "Kannur": ["670001", "670002"],
    },
    "Madhya Pradesh": {
        "Indore": ["452001", "452002", "452010"],
        "Bhopal": ["462001", "462003", "462016"],
        "Jabalpur": ["482001", "482002"],
        "Gwalior": ["474001", "474002"],
        "Ujjain": ["456001", "456010"],
    },
    "Maharashtra": {
        "Mumbai": ["400001", "400002", "400050", "400078", "400099"],
        "Pune": ["411001", "411002", "411014", "411038", "411057"],
        "Nagpur": ["440001", "440002", "440010", "440025"],
        "Thane": ["400601", "400602", "400607"],
        "Nashik": ["422001", "422002", "422009"],
        "Navi Mumbai": ["400703", "400705", "400708"],
        "Aurangabad": ["431001", "431003", "431005"],
        "Solapur": ["413001", "413002"],
    },
    "Odisha": {
        "Bhubaneswar": ["751001", "751002", "751024"],
        "Cuttack": ["753001", "753002"],
        "Rourkela": ["769001", "769004"],
        "Berhampur": ["760001", "760002"],
    },
    "Punjab": {
        "Ludhiana": ["141001", "141002", "141008"],
        "Amritsar": ["143001", "143002"],
        "Jalandhar": ["144001", "144002"],
        "Patiala": ["147001", "147002"],
        "Bathinda": ["151001"],
    },
    "Rajasthan": {
        "Jaipur": ["302001", "302002", "302015", "302020"],
        "Jodhpur": ["342001", "342003", "342008"],
        "Udaipur": ["313001", "313002"],
        "Kota": ["324001", "324005"],
        "Bikaner": ["334001", "334003"],
        "Ajmer": ["305001", "305002"],
    },
    "Tamil Nadu": {
        "Chennai": ["600001", "600002", "600018", "600028", "600040", "600096"],
        "Coimbatore": ["641001", "641002", "641012", "641018"],
        "Madurai": ["625001", "625002", "625020"],
        "Tiruchirappalli": ["620001", "620002", "620018"],
        "Salem": ["636001", "636004", "636007"],
        "Tirunelveli": ["627001", "627002"],
        "Vellore": ["632001", "632004"],
    },
    "Telangana": {
        "Hyderabad": ["500001", "500002", "500032", "500034", "500081", "500084"],
        "Warangal": ["506001", "506002", "506009"],
        "Nizamabad": ["503001", "503002"],
        "Karimnagar": ["505001", "505002"],
        "Khammam": ["507001", "507002"],
    },
    "Uttar Pradesh": {
        "Noida": ["201301", "201303", "201307", "201313"],
        "Lucknow": ["226001", "226002", "226010", "226016", "226024"],
        "Kanpur": ["208001", "208002", "208012"],
        "Varanasi": ["221001", "221002", "221005"],
        "Agra": ["282001", "282002", "282005"],
        "Ghaziabad": ["201001", "201002", "201009", "201010"],
        "Prayagraj": ["211001", "211002"],
        "Meerut": ["250001", "250002"],
        "Bareilly": ["243001", "243003"],
        "Aligarh": ["202001", "202002"],
    },
    "Uttarakhand": {
        "Dehradun": ["248001", "248002"],
        "Haridwar": ["249401", "249402"],
        "Roorkee": ["247667"],
        "Nainital": ["263001", "263002"],
    },
    "West Bengal": {
        "Kolkata": ["700001", "700002", "700019", "700029", "700091"],
        "Howrah": ["711101", "711102", "711104"],
        "Siliguri": ["734001", "734003"],
        "Durgapur": ["713201", "713203"],
        "Asansol": ["713301", "713304"],
    },
};

export const INDIAN_STATES = Object.keys(STATE_CITY_PIN_DATA).sort();

export const getCitiesForState = (state) => {
    if (!state || !STATE_CITY_PIN_DATA[state]) return [];
    return Object.keys(STATE_CITY_PIN_DATA[state]).sort();
};

export const getPincodesForCity = (state, city) => {
    if (state && STATE_CITY_PIN_DATA[state] && STATE_CITY_PIN_DATA[state][city]) {
        return STATE_CITY_PIN_DATA[state][city];
    }
    // Fallback: search across all states if state not provided
    for (const st of Object.keys(STATE_CITY_PIN_DATA)) {
        if (STATE_CITY_PIN_DATA[st][city]) {
            return STATE_CITY_PIN_DATA[st][city];
        }
    }
    return [];
};

export const isValidPincode = (pincode) => {
    return /^\d{6}$/.test(String(pincode || "").trim());
};


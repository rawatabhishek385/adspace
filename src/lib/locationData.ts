// ─── Country → States → Cities Data ─────────────────────────────────────────
// Covers major Asian countries with their key states/provinces and cities.

export interface LocationData {
  [country: string]: {
    [state: string]: string[];
  };
}

export const LOCATION_DATA: LocationData = {
  "India": {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati", "Kurnool", "Rajahmundry", "Kakinada", "Kadapa", "Anantapur"],
    "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia", "Arrah", "Begusarai"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon"],
    "Delhi": ["New Delhi", "Delhi"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Nadiad"],
    "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar", "Rohtak", "Sonipat"],
    "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Kullu", "Mandi", "Solan"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh"],
    "Karnataka": ["Bengaluru", "Mysuru", "Hubli", "Mangaluru", "Belgaum", "Davangere", "Gulbarga", "Shimoga"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kannur", "Kollam", "Palakkad", "Alappuzha"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Rewa", "Satna"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Navi Mumbai", "Vasai-Virar"],
    "Manipur": ["Imphal", "Thoubal", "Bishnupur"],
    "Meghalaya": ["Shillong", "Tura", "Jowai"],
    "Mizoram": ["Aizawl", "Lunglei", "Champhai"],
    "Nagaland": ["Kohima", "Dimapur", "Mokokchung"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri"],
    "Punjab": ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Alwar", "Bhilwara"],
    "Sikkim": ["Gangtok", "Namchi", "Pelling"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Secunderabad"],
    "Tripura": ["Agartala", "Udaipur", "Dharmanagar"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut", "Allahabad", "Ghaziabad", "Noida", "Greater Noida", "Bareilly"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Rishikesh", "Nainital", "Haldwani", "Roorkee"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Kharagpur"],
  },
  "Singapore": {
    "Central Region": ["Singapore City", "Bukit Merah", "Geylang", "Kallang", "Marine Parade", "Queenstown", "Toa Payoh"],
    "East Region": ["Bedok", "Changi", "Pasir Ris", "Tampines"],
    "North Region": ["Woodlands", "Sembawang", "Yishun", "Mandai"],
    "North-East Region": ["Ang Mo Kio", "Hougang", "Punggol", "Sengkang", "Serangoon"],
    "West Region": ["Jurong East", "Jurong West", "Bukit Batok", "Bukit Panjang", "Choa Chu Kang", "Clementi"],
  },
  "United Arab Emirates": {
    "Abu Dhabi": ["Abu Dhabi City", "Al Ain", "Al Dhafra"],
    "Dubai": ["Dubai City", "Jebel Ali", "Dubai Marina", "Business Bay", "Downtown Dubai"],
    "Sharjah": ["Sharjah City", "Khor Fakkan", "Kalba"],
    "Ajman": ["Ajman City", "Masfout"],
    "Ras Al Khaimah": ["Ras Al Khaimah City"],
    "Fujairah": ["Fujairah City", "Dibba Al-Fujairah"],
    "Umm Al Quwain": ["Umm Al Quwain City"],
  },
  "Saudi Arabia": {
    "Riyadh": ["Riyadh City", "Al Kharj", "Dawadmi"],
    "Makkah": ["Mecca", "Jeddah", "Taif"],
    "Madinah": ["Medina", "Yanbu"],
    "Eastern Province": ["Dammam", "Dhahran", "Al Khobar", "Jubail", "Hofuf"],
    "Asir": ["Abha", "Khamis Mushait"],
    "Tabuk": ["Tabuk City"],
    "Qassim": ["Buraidah", "Unaizah"],
  },
  "Malaysia": {
    "Kuala Lumpur": ["Kuala Lumpur City"],
    "Selangor": ["Shah Alam", "Petaling Jaya", "Subang Jaya", "Klang", "Kajang"],
    "Penang": ["George Town", "Butterworth", "Bayan Lepas"],
    "Johor": ["Johor Bahru", "Batu Pahat", "Muar", "Kluang"],
    "Perak": ["Ipoh", "Taiping", "Teluk Intan"],
    "Sabah": ["Kota Kinabalu", "Sandakan", "Tawau"],
    "Sarawak": ["Kuching", "Miri", "Sibu"],
    "Pahang": ["Kuantan", "Temerloh"],
    "Kedah": ["Alor Setar", "Sungai Petani", "Langkawi"],
    "Melaka": ["Melaka City"],
  },
  "Bangladesh": {
    "Dhaka": ["Dhaka City", "Gazipur", "Narayanganj", "Tongi", "Savar"],
    "Chittagong": ["Chittagong City", "Comilla", "Cox's Bazar"],
    "Rajshahi": ["Rajshahi City", "Bogura", "Pabna"],
    "Khulna": ["Khulna City", "Jessore", "Satkhira"],
    "Sylhet": ["Sylhet City", "Habiganj"],
    "Rangpur": ["Rangpur City", "Dinajpur"],
  },
  "Pakistan": {
    "Punjab": ["Lahore", "Faisalabad", "Rawalpindi", "Multan", "Gujranwala", "Sialkot"],
    "Sindh": ["Karachi", "Hyderabad", "Sukkur", "Larkana"],
    "Khyber Pakhtunkhwa": ["Peshawar", "Mardan", "Abbottabad", "Swat"],
    "Balochistan": ["Quetta", "Gwadar", "Turbat"],
    "Islamabad": ["Islamabad City"],
  },
  "Sri Lanka": {
    "Western": ["Colombo", "Dehiwala-Mount Lavinia", "Moratuwa", "Negombo"],
    "Central": ["Kandy", "Nuwara Eliya", "Matale"],
    "Southern": ["Galle", "Matara", "Hambantota"],
    "Northern": ["Jaffna", "Kilinochchi"],
    "Eastern": ["Trincomalee", "Batticaloa"],
  },
  "Nepal": {
    "Bagmati": ["Kathmandu", "Lalitpur", "Bhaktapur"],
    "Gandaki": ["Pokhara", "Gorkha"],
    "Lumbini": ["Butwal", "Bhairahawa", "Nepalgunj"],
    "Province 1": ["Biratnagar", "Dharan", "Itahari"],
    "Province 2": ["Janakpur", "Birgunj"],
  },
  "Thailand": {
    "Bangkok": ["Bangkok City", "Nonthaburi", "Pak Kret"],
    "Chiang Mai": ["Chiang Mai City", "San Kamphaeng"],
    "Phuket": ["Phuket City", "Patong"],
    "Chonburi": ["Pattaya", "Si Racha", "Chonburi City"],
    "Nakhon Ratchasima": ["Korat City"],
    "Songkhla": ["Hat Yai", "Songkhla City"],
  },
  "Indonesia": {
    "Jakarta": ["Central Jakarta", "South Jakarta", "North Jakarta", "East Jakarta", "West Jakarta"],
    "West Java": ["Bandung", "Bekasi", "Depok", "Bogor", "Tangerang"],
    "East Java": ["Surabaya", "Malang", "Sidoarjo"],
    "Central Java": ["Semarang", "Solo", "Yogyakarta"],
    "Bali": ["Denpasar", "Ubud", "Kuta", "Seminyak"],
    "North Sumatra": ["Medan", "Binjai"],
    "South Sulawesi": ["Makassar"],
  },
  "Philippines": {
    "Metro Manila": ["Manila", "Quezon City", "Makati", "Taguig", "Pasig", "Mandaluyong"],
    "Cebu": ["Cebu City", "Mandaue", "Lapu-Lapu"],
    "Davao": ["Davao City"],
    "Calabarzon": ["Antipolo", "Batangas City", "Lucena"],
    "Central Luzon": ["Angeles", "San Fernando", "Olongapo"],
    "Western Visayas": ["Iloilo City", "Bacolod"],
  },
  "Vietnam": {
    "Ho Chi Minh City": ["District 1", "District 3", "District 7", "Binh Thanh", "Thu Duc"],
    "Hanoi": ["Hoan Kiem", "Ba Dinh", "Dong Da", "Cau Giay"],
    "Da Nang": ["Hai Chau", "Son Tra", "Ngu Hanh Son"],
    "Hai Phong": ["Hai Phong City"],
    "Can Tho": ["Can Tho City"],
  },
  "Japan": {
    "Tokyo": ["Shinjuku", "Shibuya", "Minato", "Chiyoda", "Toshima", "Setagaya"],
    "Osaka": ["Osaka City", "Sakai", "Higashiosaka"],
    "Kanagawa": ["Yokohama", "Kawasaki", "Sagamihara"],
    "Aichi": ["Nagoya", "Toyota", "Okazaki"],
    "Hokkaido": ["Sapporo", "Asahikawa", "Hakodate"],
    "Fukuoka": ["Fukuoka City", "Kitakyushu"],
    "Kyoto": ["Kyoto City", "Uji"],
  },
  "South Korea": {
    "Seoul": ["Gangnam", "Jongno", "Mapo", "Yongsan", "Songpa"],
    "Busan": ["Haeundae", "Jung", "Busanjin"],
    "Incheon": ["Incheon City", "Yeonsu"],
    "Gyeonggi": ["Suwon", "Seongnam", "Goyang", "Yongin"],
    "Daegu": ["Daegu City"],
    "Daejeon": ["Daejeon City"],
  },
  "China": {
    "Beijing": ["Beijing City", "Chaoyang", "Haidian", "Dongcheng"],
    "Shanghai": ["Shanghai City", "Pudong", "Minhang", "Jing'an"],
    "Guangdong": ["Guangzhou", "Shenzhen", "Dongguan", "Foshan", "Zhuhai"],
    "Zhejiang": ["Hangzhou", "Ningbo", "Wenzhou"],
    "Jiangsu": ["Nanjing", "Suzhou", "Wuxi"],
    "Sichuan": ["Chengdu", "Mianyang"],
    "Hubei": ["Wuhan", "Yichang"],
  },
  "Qatar": {
    "Doha": ["Doha City", "West Bay", "The Pearl", "Lusail"],
    "Al Rayyan": ["Al Rayyan City"],
    "Al Wakrah": ["Al Wakrah City"],
  },
  "Kuwait": {
    "Al Asimah": ["Kuwait City", "Sharq", "Mirqab"],
    "Hawalli": ["Hawalli City", "Salmiya"],
    "Farwaniya": ["Farwaniya City", "Jleeb Al-Shuyoukh"],
    "Ahmadi": ["Ahmadi City", "Fahaheel"],
  },
  "Bahrain": {
    "Capital": ["Manama", "Juffair", "Adliya"],
    "Muharraq": ["Muharraq City"],
    "Northern": ["Budaiya", "Diraz"],
    "Southern": ["Riffa", "Isa Town"],
  },
  "Oman": {
    "Muscat": ["Muscat City", "Ruwi", "Muttrah", "Seeb"],
    "Dhofar": ["Salalah"],
    "North Al Batinah": ["Sohar", "Saham"],
    "South Al Batinah": ["Rustaq"],
  },
  "Cambodia": {
    "Phnom Penh": ["Phnom Penh City", "Chamkarmon", "Daun Penh"],
    "Siem Reap": ["Siem Reap City"],
    "Battambang": ["Battambang City"],
  },
  "Myanmar": {
    "Yangon": ["Yangon City", "Insein", "Thanlyin"],
    "Mandalay": ["Mandalay City", "Amarapura"],
    "Naypyidaw": ["Naypyidaw City"],
  },
  "Maldives": {
    "Malé": ["Malé City", "Hulhumalé", "Villimalé"],
    "Addu Atoll": ["Hithadhoo", "Addu City"],
  },
};

/** Get sorted list of all country names */
export function getCountries(): string[] {
  return Object.keys(LOCATION_DATA).sort();
}

/** Get sorted list of states for a country */
export function getStates(country: string): string[] {
  return Object.keys(LOCATION_DATA[country] || {}).sort();
}

/** Get sorted list of cities for a country + state */
export function getCities(country: string, state: string): string[] {
  return (LOCATION_DATA[country]?.[state] || []).sort();
}

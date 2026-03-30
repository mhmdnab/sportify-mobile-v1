export interface Country {
  name: string;
  code: string;
  phoneCode: string;
  flag: string;
  cities: string[];
}

export const countries: Country[] = [
  {
    name: 'Jordan',
    code: 'JO',
    phoneCode: '+962',
    flag: '🇯🇴',
    cities: ['Amman', 'Irbid', 'Zarqa', 'Aqaba', 'Madaba', 'Jerash', 'Mafraq', 'Karak', 'Salt', 'Ajloun'],
  },
  {
    name: 'Saudi Arabia',
    code: 'SA',
    phoneCode: '+966',
    flag: '🇸🇦',
    cities: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Abha', 'Taif', 'Buraidah'],
  },
  {
    name: 'United Arab Emirates',
    code: 'AE',
    phoneCode: '+971',
    flag: '🇦🇪',
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Al Ain'],
  },
  {
    name: 'Egypt',
    code: 'EG',
    phoneCode: '+20',
    flag: '🇪🇬',
    cities: ['Cairo', 'Alexandria', 'Giza', 'Luxor', 'Aswan', 'Hurghada', 'Sharm El Sheikh', 'Mansoura', 'Tanta', 'Port Said'],
  },
  {
    name: 'Lebanon',
    code: 'LB',
    phoneCode: '+961',
    flag: '🇱🇧',
    cities: ['Beirut', 'Tripoli', 'Sidon', 'Tyre', 'Byblos', 'Jounieh', 'Zahle', 'Baalbek'],
  },
  {
    name: 'Iraq',
    code: 'IQ',
    phoneCode: '+964',
    flag: '🇮🇶',
    cities: ['Baghdad', 'Basra', 'Erbil', 'Sulaymaniyah', 'Mosul', 'Kirkuk', 'Najaf', 'Karbala'],
  },
  {
    name: 'Kuwait',
    code: 'KW',
    phoneCode: '+965',
    flag: '🇰🇼',
    cities: ['Kuwait City', 'Hawalli', 'Salmiya', 'Jahra', 'Fahaheel', 'Mangaf'],
  },
  {
    name: 'Qatar',
    code: 'QA',
    phoneCode: '+974',
    flag: '🇶🇦',
    cities: ['Doha', 'Al Wakrah', 'Al Khor', 'Al Rayyan', 'Umm Salal', 'Lusail'],
  },
  {
    name: 'Bahrain',
    code: 'BH',
    phoneCode: '+973',
    flag: '🇧🇭',
    cities: ['Manama', 'Riffa', 'Muharraq', 'Hamad Town', 'Isa Town', 'Sitra'],
  },
  {
    name: 'Oman',
    code: 'OM',
    phoneCode: '+968',
    flag: '🇴🇲',
    cities: ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur', 'Ibra'],
  },
  {
    name: 'Palestine',
    code: 'PS',
    phoneCode: '+970',
    flag: '🇵🇸',
    cities: ['Ramallah', 'Gaza', 'Nablus', 'Hebron', 'Bethlehem', 'Jenin', 'Tulkarm', 'Jericho'],
  },
  {
    name: 'Turkey',
    code: 'TR',
    phoneCode: '+90',
    flag: '🇹🇷',
    cities: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Gaziantep', 'Konya'],
  },
  {
    name: 'United States',
    code: 'US',
    phoneCode: '+1',
    flag: '🇺🇸',
    cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'San Francisco', 'Miami', 'Seattle'],
  },
  {
    name: 'United Kingdom',
    code: 'GB',
    phoneCode: '+44',
    flag: '🇬🇧',
    cities: ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Glasgow', 'Edinburgh', 'Bristol'],
  },
  {
    name: 'Germany',
    code: 'DE',
    phoneCode: '+49',
    flag: '🇩🇪',
    cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Dortmund', 'Dusseldorf'],
  },
  {
    name: 'France',
    code: 'FR',
    phoneCode: '+33',
    flag: '🇫🇷',
    cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Bordeaux'],
  },
  {
    name: 'Spain',
    code: 'ES',
    phoneCode: '+34',
    flag: '🇪🇸',
    cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao', 'Malaga', 'Zaragoza'],
  },
  {
    name: 'Italy',
    code: 'IT',
    phoneCode: '+39',
    flag: '🇮🇹',
    cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Florence', 'Bologna', 'Venice', 'Genoa'],
  },
  {
    name: 'India',
    code: 'IN',
    phoneCode: '+91',
    flag: '🇮🇳',
    cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'],
  },
  {
    name: 'Pakistan',
    code: 'PK',
    phoneCode: '+92',
    flag: '🇵🇰',
    cities: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Peshawar', 'Multan'],
  },
];

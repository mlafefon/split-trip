export const fetchExchangeRates = async (baseCurrency: string = 'USD') => {
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
    if (!response.ok) throw new Error('Failed to fetch rates');
    const data = await response.json();
    return data.rates as Record<string, number>;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return null;
  }
};

export const CURRENCIES = [
  { code: 'ILS', name: 'ישראל - שקל חדש', countryCode: 'il' },
  { code: 'USD', name: 'ארה"ב - דולר', countryCode: 'us' },
  { code: 'EUR', name: 'אירופה - אירו', countryCode: 'eu' },
  { code: 'GBP', name: 'בריטניה - לירה שטרלינג', countryCode: 'gb' },
  { code: 'THB', name: 'תאילנד - בהט', countryCode: 'th' },
  { code: 'JPY', name: 'יפן - ין', countryCode: 'jp' },
  { code: 'AED', name: 'איחוד האמירויות - דירהם', countryCode: 'ae' },
  { code: 'CZK', name: 'צ\'כיה - קורונה', countryCode: 'cz' },
  { code: 'HUF', name: 'הונגריה - פורינט', countryCode: 'hu' },
  { code: 'RON', name: 'רומניה - לאו', countryCode: 'ro' },
  { code: 'CAD', name: 'קנדה - דולר', countryCode: 'ca' },
  { code: 'AUD', name: 'אוסטרליה - דולר', countryCode: 'au' },
  { code: 'CHF', name: 'שוויץ - פרנק', countryCode: 'ch' },
  { code: 'CNY', name: 'סין - יואן', countryCode: 'cn' },
  { code: 'HKD', name: 'הונג קונג - דולר', countryCode: 'hk' },
  { code: 'NZD', name: 'ניו זילנד - דולר', countryCode: 'nz' },
  { code: 'SGD', name: 'סינגפור - דולר', countryCode: 'sg' },
  { code: 'KRW', name: 'דרום קוריאה - וון', countryCode: 'kr' },
  { code: 'INR', name: 'הודו - רופי', countryCode: 'in' },
  { code: 'MXN', name: 'מקסיקו - פזו', countryCode: 'mx' },
  { code: 'BRL', name: 'ברזיל - ריאל', countryCode: 'br' },
  { code: 'ZAR', name: 'דרום אפריקה - ראנד', countryCode: 'za' },
  { code: 'TRY', name: 'טורקיה - לירה', countryCode: 'tr' },
  { code: 'PLN', name: 'פולין - זלוטי', countryCode: 'pl' },
  { code: 'SEK', name: 'שוודיה - קרונה', countryCode: 'se' },
  { code: 'NOK', name: 'נורווגיה - קרונה', countryCode: 'no' },
  { code: 'DKK', name: 'דנמרק - קרונה', countryCode: 'dk' },
  { code: 'ISK', name: 'איסלנד - קרונה', countryCode: 'is' },
  { code: 'BGN', name: 'בולגריה - לב', countryCode: 'bg' },
  { code: 'GEL', name: 'גיאורגיה - לארי', countryCode: 'ge' },
  { code: 'VND', name: 'וייטנאם - דונג', countryCode: 'vn' },
  { code: 'PHP', name: 'פיליפינים - פזו', countryCode: 'ph' },
  { code: 'MYR', name: 'מלזיה - רינגיט', countryCode: 'my' },
  { code: 'IDR', name: 'אינדונזיה - רופיה', countryCode: 'id' },
  { code: 'TWD', name: 'טאיוואן - דולר', countryCode: 'tw' },
  { code: 'ARS', name: 'ארגנטינה - פזו', countryCode: 'ar' },
  { code: 'CLP', name: 'צ\'ילה - פזו', countryCode: 'cl' },
  { code: 'COP', name: 'קולומביה - פזו', countryCode: 'co' },
  { code: 'PEN', name: 'פרו - סול', countryCode: 'pe' },
  { code: 'EGP', name: 'מצרים - לירה', countryCode: 'eg' },
  { code: 'JOD', name: 'ירדן - דינר', countryCode: 'jo' },
  { code: 'SAR', name: 'ערב הסעודית - ריאל', countryCode: 'sa' },
  { code: 'QAR', name: 'קטאר - ריאל', countryCode: 'qa' },
  { code: 'KWD', name: 'כווית - דינר', countryCode: 'kw' },
  { code: 'BHD', name: 'בחריין - דינר', countryCode: 'bh' },
  { code: 'OMR', name: 'עומאן - ריאל', countryCode: 'om' },
  { code: 'MAD', name: 'מרוקו - דירהם', countryCode: 'ma' },
  { code: 'UAH', name: 'אוקראינה - הריבניה', countryCode: 'ua' },
  { code: 'KZT', name: 'קזחסטן - טנגה', countryCode: 'kz' },
  { code: 'AZN', name: 'אזרבייג\'ן - מנאט', countryCode: 'az' },
  { code: 'AMD', name: 'ארמניה - דראם', countryCode: 'am' },
  { code: 'LKR', name: 'סרי לנקה - רופי', countryCode: 'lk' },
  { code: 'NPR', name: 'נפאל - רופי', countryCode: 'np' },
  { code: 'MVR', name: 'מלדיביים - רופיה', countryCode: 'mv' },
  { code: 'MUR', name: 'מאוריציוס - רופי', countryCode: 'mu' },
  { code: 'SCR', name: 'סיישל - רופי', countryCode: 'sc' },
  { code: 'TZS', name: 'טנזניה - שילינג', countryCode: 'tz' },
  { code: 'KES', name: 'קניה - שילינג', countryCode: 'ke' },
].sort((a, b) => a.name.localeCompare(b.name, 'he'));

export const formatAmount = (amount: number): string => {
  if (amount % 1 === 0) {
    return amount.toFixed(0);
  }
  return amount.toFixed(2);
};

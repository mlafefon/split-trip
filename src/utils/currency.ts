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

export const convertCurrency = (amount: number, fromRate: number, toRate: number) => {
  return (amount / fromRate) * toRate;
};

export const CURRENCIES = [
  { code: 'ILS', name: 'ישראל - שקל חדש' },
  { code: 'USD', name: 'ארה"ב - דולר' },
  { code: 'EUR', name: 'אירופה - אירו' },
  { code: 'GBP', name: 'בריטניה - לירה שטרלינג' },
  { code: 'THB', name: 'תאילנד - בהט' },
  { code: 'JPY', name: 'יפן - ין' },
  { code: 'AED', name: 'איחוד האמירויות - דירהם' },
  { code: 'CZK', name: 'צ\'כיה - קורונה' },
  { code: 'HUF', name: 'הונגריה - פורינט' },
  { code: 'RON', name: 'רומניה - לאו' },
  { code: 'CAD', name: 'קנדה - דולר' },
  { code: 'AUD', name: 'אוסטרליה - דולר' },
  { code: 'CHF', name: 'שוויץ - פרנק' },
  { code: 'CNY', name: 'סין - יואן' },
  { code: 'HKD', name: 'הונג קונג - דולר' },
  { code: 'NZD', name: 'ניו זילנד - דולר' },
  { code: 'SGD', name: 'סינגפור - דולר' },
  { code: 'KRW', name: 'דרום קוריאה - וון' },
  { code: 'INR', name: 'הודו - רופי' },
  { code: 'MXN', name: 'מקסיקו - פזו' },
  { code: 'BRL', name: 'ברזיל - ריאל' },
  { code: 'ZAR', name: 'דרום אפריקה - ראנד' },
  { code: 'TRY', name: 'טורקיה - לירה' },
  { code: 'PLN', name: 'פולין - זלוטי' },
  { code: 'SEK', name: 'שוודיה - קרונה' },
  { code: 'NOK', name: 'נורווגיה - קרונה' },
  { code: 'DKK', name: 'דנמרק - קרונה' },
  { code: 'ISK', name: 'איסלנד - קרונה' },
  { code: 'BGN', name: 'בולגריה - לב' },
  { code: 'GEL', name: 'גיאורגיה - לארי' },
  { code: 'VND', name: 'וייטנאם - דונג' },
  { code: 'PHP', name: 'פיליפינים - פזו' },
  { code: 'MYR', name: 'מלזיה - רינגיט' },
  { code: 'IDR', name: 'אינדונזיה - רופיה' },
  { code: 'TWD', name: 'טאיוואן - דולר' },
  { code: 'ARS', name: 'ארגנטינה - פזו' },
  { code: 'CLP', name: 'צ\'ילה - פזו' },
  { code: 'COP', name: 'קולומביה - פזו' },
  { code: 'PEN', name: 'פרו - סול' },
  { code: 'EGP', name: 'מצרים - לירה' },
  { code: 'JOD', name: 'ירדן - דינר' },
  { code: 'SAR', name: 'ערב הסעודית - ריאל' },
  { code: 'QAR', name: 'קטאר - ריאל' },
  { code: 'KWD', name: 'כווית - דינר' },
  { code: 'BHD', name: 'בחריין - דינר' },
  { code: 'OMR', name: 'עומאן - ריאל' },
  { code: 'MAD', name: 'מרוקו - דירהם' },
  { code: 'UAH', name: 'אוקראינה - הריבניה' },
  { code: 'KZT', name: 'קזחסטן - טנגה' },
  { code: 'AZN', name: 'אזרבייג\'ן - מנאט' },
  { code: 'AMD', name: 'ארמניה - דראם' },
  { code: 'LKR', name: 'סרי לנקה - רופי' },
  { code: 'NPR', name: 'נפאל - רופי' },
  { code: 'MVR', name: 'מלדיביים - רופיה' },
  { code: 'MUR', name: 'מאוריציוס - רופי' },
  { code: 'SCR', name: 'סיישל - רופי' },
  { code: 'TZS', name: 'טנזניה - שילינג' },
  { code: 'KES', name: 'קניה - שילינג' },
].sort((a, b) => a.name.localeCompare(b.name, 'he'));

// 30 countries — code, ISO2, flag emoji (legacy), name. Names now come from namePools.ts via COUNTRY_POOLS.

export interface Country {
  code: string;   // ATP 3-letter
  iso2: string;   // ISO alpha-2 lowercase
  name: string;
  flag: string;   // legacy emoji (still in Player type for safety)
}

export const COUNTRIES: Country[] = [
  { code: 'ESP', iso2: 'es', name: 'Spain',          flag: '🇪🇸' },
  { code: 'SUI', iso2: 'ch', name: 'Switzerland',    flag: '🇨🇭' },
  { code: 'SRB', iso2: 'rs', name: 'Serbia',         flag: '🇷🇸' },
  { code: 'GBR', iso2: 'gb', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'USA', iso2: 'us', name: 'United States',  flag: '🇺🇸' },
  { code: 'FRA', iso2: 'fr', name: 'France',         flag: '🇫🇷' },
  { code: 'ARG', iso2: 'ar', name: 'Argentina',      flag: '🇦🇷' },
  { code: 'GER', iso2: 'de', name: 'Germany',        flag: '🇩🇪' },
  { code: 'ITA', iso2: 'it', name: 'Italy',          flag: '🇮🇹' },
  { code: 'AUS', iso2: 'au', name: 'Australia',      flag: '🇦🇺' },
  { code: 'RUS', iso2: 'ru', name: 'Russia',         flag: '🇷🇺' },
  { code: 'CRO', iso2: 'hr', name: 'Croatia',        flag: '🇭🇷' },
  { code: 'CAN', iso2: 'ca', name: 'Canada',         flag: '🇨🇦' },
  { code: 'AUT', iso2: 'at', name: 'Austria',        flag: '🇦🇹' },
  { code: 'BUL', iso2: 'bg', name: 'Bulgaria',       flag: '🇧🇬' },
  { code: 'GRE', iso2: 'gr', name: 'Greece',         flag: '🇬🇷' },
  { code: 'NOR', iso2: 'no', name: 'Norway',         flag: '🇳🇴' },
  { code: 'CZE', iso2: 'cz', name: 'Czechia',        flag: '🇨🇿' },
  { code: 'POL', iso2: 'pl', name: 'Poland',         flag: '🇵🇱' },
  { code: 'NED', iso2: 'nl', name: 'Netherlands',    flag: '🇳🇱' },
  { code: 'POR', iso2: 'pt', name: 'Portugal',       flag: '🇵🇹' },
  { code: 'CHI', iso2: 'cl', name: 'Chile',          flag: '🇨🇱' },
  { code: 'BRA', iso2: 'br', name: 'Brazil',         flag: '🇧🇷' },
  { code: 'JPN', iso2: 'jp', name: 'Japan',          flag: '🇯🇵' },
  { code: 'KAZ', iso2: 'kz', name: 'Kazakhstan',     flag: '🇰🇿' },
  { code: 'BEL', iso2: 'be', name: 'Belgium',        flag: '🇧🇪' },
  { code: 'KOR', iso2: 'kr', name: 'South Korea',    flag: '🇰🇷' },
  { code: 'HUN', iso2: 'hu', name: 'Hungary',        flag: '🇭🇺' },
  { code: 'COL', iso2: 'co', name: 'Colombia',       flag: '🇨🇴' },
  { code: 'FIN', iso2: 'fi', name: 'Finland',        flag: '🇫🇮' },
];

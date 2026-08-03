// List of African ISO 3166-1 alpha-2 country codes
export const AFRICAN_COUNTRIES = [
  "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD", "KM", "CG", "CD",
  "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "CI", "KE",
  "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "YT", "MA", "MZ", "NA", "NE",
  "NG", "RE", "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG",
  "TN", "UG", "EH", "ZM", "ZW"
];

/**
 * Checks if a country code belongs to an African country
 */
export function isAfricanCountry(countryCode: string): boolean {
  if (!countryCode) return false;
  return AFRICAN_COUNTRIES.includes(countryCode.toUpperCase());
}

/**
 * Calculates the shipping fee based on country and state
 */
export function calculateShippingFee(
  country: string,
  state: string,
  rates: {
    shippingLagos: number;
    shippingRestOfNigeria: number;
    shippingAfrica: number;
    shippingInternational: number;
  }
): number {
  if (!country) return 0;
  
  const countryUpper = country.toUpperCase();
  const stateLower = state?.trim().toLowerCase() ?? "";

  // 1. Nigeria Check
  if (countryUpper === "NG" || countryUpper === "NIGERIA") {
    if (!stateLower) return 0;
    if (stateLower === "lagos") {
      return rates.shippingLagos;
    }
    return rates.shippingRestOfNigeria;
  }

  // 2. Rest of Africa Check
  if (isAfricanCountry(countryUpper)) {
    return rates.shippingAfrica;
  }

  // 3. International Check
  return rates.shippingInternational;
}

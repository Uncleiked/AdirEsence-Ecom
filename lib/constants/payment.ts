// List of African ISO 3166-1 alpha-2 country codes
export const AFRICAN_COUNTRIES = [
  "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD", "KM", "CG", "CD",
  "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "CI", "KE",
  "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "YT", "MA", "MZ", "NA", "NE",
  "NG", "RE", "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG",
  "TN", "UG", "EH", "ZM", "ZW"
];

export type PaymentProvider = "stripe" | "paystack";

/**
 * Checks if a country code belongs to an African country
 */
export function isAfricanCountry(countryCode: string): boolean {
  if (!countryCode) return false;
  return AFRICAN_COUNTRIES.includes(countryCode.toUpperCase());
}

/**
 * Determines the payment provider based on country code
 */
export function getPaymentProvider(countryCode: string): PaymentProvider {
  return isAfricanCountry(countryCode) ? "paystack" : "stripe";
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

/**
 * Calculates the gross transaction amount (including service charge)
 * to ensure we receive the target net amount.
 * 
 * Formula: Gross = (Net + Fixed) / (1 - Rate)
 * Service Charge = Gross - Net
 */
export function calculateServiceCharge(
  netAmount: number,
  provider: PaymentProvider,
  isLocalNGCard: boolean = true // Paystack local vs international
): number {
  if (netAmount <= 0) return 0;

  let rate = 0;
  let fixed = 0;
  let cap = Infinity;

  if (provider === "paystack") {
    if (isLocalNGCard) {
      // Local Paystack fee: 1.5% + ₦100 (capped at ₦2,000)
      // Note: ₦100 flat fee is waived if total is under ₦2,500
      rate = 0.015;
      fixed = netAmount < 2500 ? 0 : 100;
      cap = 2000;

      // Special case: if cap is reached
      // Gross = Net + 2000
      // Let's check if the normal formula goes over cap.
      const normalGross = (netAmount + fixed) / (1 - rate);
      const normalFee = normalGross - netAmount;

      if (normalFee >= cap) {
        return cap;
      }

      return Math.ceil(normalGross - netAmount);
    } else {
      // International Paystack fee (non-NG African cards): 3.9% + ₦100 (no cap)
      rate = 0.039;
      fixed = 100;
      const gross = (netAmount + fixed) / (1 - rate);
      return Math.ceil(gross - netAmount);
    }
  } else {
    // Stripe fee: 2.9% + ₦100 (no cap)
    rate = 0.029;
    fixed = 100;
    const gross = (netAmount + fixed) / (1 - rate);
    return Math.ceil(gross - netAmount);
  }
}

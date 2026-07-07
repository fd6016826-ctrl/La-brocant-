export interface Currency {
  code: string;
  symbol: string;
  rate: number; // rate compared to EUR (1 EUR = rate * code)
  label: string;
}

export const CURRENCIES: Currency[] = [
  { code: "XOF", symbol: "FCFA", rate: 655.95, label: "Franc CFA (FCFA)" },
  { code: "EUR", symbol: "€", rate: 1.0, label: "Euro (€)" },
  { code: "USD", symbol: "$", rate: 1.08, label: "Dollar ($)" },
  { code: "GBP", symbol: "£", rate: 0.84, label: "Livre (£)" },
  { code: "CHF", symbol: "CHF", rate: 0.95, label: "Franc Suisse (CHF)" }
];

export function formatPrice(priceInEur: number, currency: Currency): string {
  const converted = priceInEur * currency.rate;
  if (currency.code === "XOF") {
    // CFA Franc uses whole numbers
    return `${Math.round(converted).toLocaleString("fr-FR")} ${currency.symbol}`;
  }
  // Standard 2 decimal formatting, stripping trailing .00 if clean
  const fixed = converted.toFixed(2);
  if (fixed.endsWith(".00")) {
    return `${Math.round(converted).toLocaleString("fr-FR")} ${currency.symbol}`;
  }
  return `${Number(fixed).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency.symbol}`;
}

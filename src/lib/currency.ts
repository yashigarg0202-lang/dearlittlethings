/**
 * Format currency in Indian Rupees (INR)
 * Pure utility function safe for both Client and Server components
 */
export function formatINR(amountInMinorUnits: number): string {
  const amount = (amountInMinorUnits || 0) / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatRupees(amountInRupees: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amountInRupees || 0);
}

/**
 * Format currency in Indian Rupees (INR)
 * Pure utility function safe for both Client and Server components
 */
export function formatINR(amountInMinorUnits: number): string {
  const rupees = amountInMinorUnits / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(rupees);
}

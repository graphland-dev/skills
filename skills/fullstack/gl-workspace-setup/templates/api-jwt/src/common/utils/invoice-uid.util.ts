/**
 * Utility function to generate invoiceUID
 * Pattern: ORD-YYYYMMDD-XXXX
 * Example: ORD-20251219-0001 (Order prefix, date, sequential number)
 *
 * @param orderCount - Sequential order count for the tenant
 * @param prefix - Optional prefix (default: 'ORD')
 * @param padding - Number of digits for sequential number (default: 4)
 */
export function generateInvoiceUID(
  orderCount: number,
  prefix: string = 'INV',
  padding: number = 4,
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const sequential = String(orderCount).padStart(padding, '0');

  return `${prefix}-${year}${month}${day}-${sequential}`;
}

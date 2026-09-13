/**
 * Amount Sanitization & Comma Formatting Utilities for PolyPaid (USDC).
 */

/**
 * Sanitizes numeric amount input strings for USDC.
 * Rules:
 *  - Strips non-numeric characters except a single decimal point and commas.
 *  - Removes multiple leading zeros (e.g., '00101' -> '101', '000.9' -> '0.9', '00' -> '0').
 *  - Supports decimal cents and fractional values (e.g., '0.9', '0.99', '1,250.50').
 *  - Limits decimal precision to max 6 places (USDC native precision).
 */
export function sanitizeAmountInput(val: string): string {
  if (!val) return '';

  // Remove existing commas for raw processing
  let cleaned = val.replace(/,/g, '').replace(/[^0-9.]/g, '');

  // Keep only the first decimal point
  const firstDotIndex = cleaned.indexOf('.');
  if (firstDotIndex !== -1) {
    cleaned =
      cleaned.slice(0, firstDotIndex + 1) +
      cleaned.slice(firstDotIndex + 1).replace(/\./g, '');
  }

  // Handle leading dot e.g. '.9' -> '0.9'
  if (cleaned.startsWith('.')) {
    cleaned = '0' + cleaned;
  }

  // Split integer and decimal parts
  const parts = cleaned.split('.');
  let integerPart = parts[0];

  // Remove multiple leading zeros from integer part (e.g., '00101' -> '101', '00' -> '0')
  if (integerPart.length > 1) {
    integerPart = integerPart.replace(/^0+/, '');
    if (integerPart === '') {
      integerPart = '0';
    }
  }

  if (parts.length > 1) {
    const decimalPart = parts[1].slice(0, 6);
    return `${integerPart}.${decimalPart}`;
  }

  return integerPart;
}

/**
 * Formats a raw number or numeric string with comma thousands separators (e.g., '100000' -> '100,000', '1000' -> '1,000').
 */
export function formatWithCommas(val: string | number): string {
  if (val === undefined || val === null || val === '') return '0';

  const str = typeof val === 'number' ? val.toString() : val;
  const sanitized = sanitizeAmountInput(str);

  if (!sanitized) return '0';

  const parts = sanitized.split('.');
  const formattedInteger = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (parts.length > 1) {
    return `${formattedInteger}.${parts[1]}`;
  }

  return formattedInteger;
}

/**
 * Formats amount values cleanly for display in UI preview cards, headers, tables, and modals.
 */
export function formatAmountDisplay(val: string | number): string {
  if (typeof val === 'number') {
    if (isNaN(val) || val <= 0) return '0';
    return val.toLocaleString('en-US', {
      minimumFractionDigits: val % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 6,
    });
  }
  return formatWithCommas(val);
}

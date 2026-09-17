/**
 * Centralised GST helpers (18%).
 * Import from anywhere:  import { calculateGst, GST_RATE } from '../../Utils/gst';
 */

export const GST_RATE = 18;

/**
 * Calculate GST breakdown for a given base amount.
 * @param {number} baseAmount – price before tax
 * @returns {{ baseAmount: number, gstAmount: number, totalAmount: number }}
 */
export const calculateGst = baseAmount => {
  const gst = Math.round(baseAmount * (GST_RATE / 100) * 100) / 100;
  return {
    baseAmount,
    gstAmount: gst,
    totalAmount: baseAmount + gst,
  };
};

/**
 * Format a human-readable GST summary string.
 * @param {number} baseAmount
 * @returns {string}  e.g. "Base: ₹500 | GST (18%): ₹90 | Total: ₹590"
 */
export const formatGstSummary = baseAmount => {
  const { baseAmount: b, gstAmount: g, totalAmount: t } = calculateGst(baseAmount);
  return `Base: ₹${b} | GST (18%): ₹${g} | Total: ₹${t}`;
};

// currency.js — shared SAR (Saudi Riyal) formatting.
//
// Uses the new official Saudi Riyal symbol (Unicode U+20C1, "SAUDI RIYAL
// SIGN", approved February 2025 by the Saudi Central Bank, added to
// Unicode 17.0 in September 2025). Since it's a very new character, font
// support varies by device — this always pairs the symbol with the plain
// text "SAR" for accessibility (screen readers) and as a safety net in
// case a device's font can't render the glyph yet.

const SAR_SYMBOL = "\u20C1"; // ⃁ SAUDI RIYAL SIGN

// Formats a number as a price string with the Riyal symbol, e.g. "25.30 ⃁"
function formatPrice(amount) {
  const n = parseFloat(amount);
  const value = isNaN(n) ? "0.00" : n.toFixed(2);
  return `${value} <span class="sar-symbol" aria-hidden="true">${SAR_SYMBOL}</span><span class="sr-only">SAR</span>`;
}

// Plain-text version (no HTML) for places that can't render markup, like
// alert()/confirm() dialogs or <title> text.
function formatPriceText(amount) {
  const n = parseFloat(amount);
  const value = isNaN(n) ? "0.00" : n.toFixed(2);
  return `${value} SAR`;
}

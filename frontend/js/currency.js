// currency.js — shared SAR (Saudi Riyal) formatting.
//
// Earlier versions of this file used the new official Saudi Riyal Unicode
// symbol (U+20C1, approved by SAMA in Feb 2025). In real-world testing it
// didn't render on several mobile browsers (reported: Samsung Internet) —
// there's no reliable way to feature-detect font support for a brand-new
// character across every browser from plain client-side JS, so rather than
// risk a broken/missing glyph in front of customers, this now uses plain
// "SAR" text everywhere. It's guaranteed to render correctly on every
// device, immediately understood, and matches what's commonly used in
// Saudi apps and receipts today anyway.

// Formats a number as a price string with the SAR suffix, e.g. "25.30 SAR"
function formatPrice(amount) {
  const n = parseFloat(amount);
  const value = isNaN(n) ? "0.00" : n.toFixed(2);
  return `${value} <span class="sar-symbol">SAR</span>`;
}

// Plain-text version (no HTML) for places that can't render markup, like
// alert()/confirm() dialogs or <title> text.
function formatPriceText(amount) {
  const n = parseFloat(amount);
  const value = isNaN(n) ? "0.00" : n.toFixed(2);
  return `${value} SAR`;
}

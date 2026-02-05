// Simple phone normalization helpers for Nigerian phone numbers (E.164)
const DEFAULT_COUNTRY = process.env.DEFAULT_COUNTRY_CODE || '234';

function digitsOnly(input) {
  if (!input) return '';
  return String(input).replace(/[^0-9]/g, '');
}

// Normalize common local formats to E.164 with +<country>
function normalizeToE164(raw, countryCode = DEFAULT_COUNTRY) {
  if (!raw) return '';
  let d = digitsOnly(raw);

  // If already starts with country code
  if (d.startsWith(countryCode)) {
    return `+${d}`;
  }

  // If starts with leading 0 (local format), drop 0 and prepend +country
  if (d.startsWith('0')) {
    return `+${countryCode}${d.slice(1)}`;
  }

  // If looks like international without plus (e.g., 44123...), just add +
  if (d.length > 8) {
    return `+${d}`;
  }

  // Fallback: return digits only
  return d;
}

// Produce common lookup variants for a provided input so that stored values in different forms will match.
function lookupVariants(raw, countryCode = DEFAULT_COUNTRY) {
  const d = digitsOnly(raw);
  const variants = new Set();
  if (!d) return [];

  // E.164
  variants.add(`+${d}`);
  // If starts with country, add +country and 0-prefixed
  if (d.startsWith(countryCode)) {
    variants.add(`+${d}`);
    variants.add(`0${d.slice(countryCode.length)}`);
    variants.add(d.slice(countryCode.length));
  } else if (d.startsWith('0')) {
    // local leading zero -> +country
    variants.add(`+${countryCode}${d.slice(1)}`);
    variants.add(d);
    variants.add(d.slice(1));
  } else {
    // generic
    variants.add(d);
    variants.add(`+${countryCode}${d}`);
    variants.add(`0${d}`);
  }

  return Array.from(variants);
}

module.exports = { normalizeToE164, lookupVariants, digitsOnly };

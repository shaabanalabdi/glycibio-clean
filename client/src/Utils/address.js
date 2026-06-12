// ============================================================
// Helpers for the structured French shipping address used on
// the Profile page (saved as JSON in users.address) and the
// Checkout page (composed into orders.shipping_address).
// ============================================================

export const POSTAL_CODE_RE = /^\d{5}$/;
export const PHONE_RE = /^(?:(?:\+|00)33[\s.-]?|0)[1-9](?:[\s.-]?\d{2}){4}$/;

export const emptyAddress = () => ({
  civility: 'M.',
  street: '',
  complement: '',
  postal_code: '',
  city: '',
});

// Parse a value previously stored in users.address.
// Accepts JSON (new format) or a legacy plain-text string
// (legacy values dropped into the street field).
export const parseStoredAddress = (raw) => {
  const base = emptyAddress();
  if (!raw || typeof raw !== 'string') return base;
  const trimmed = raw.trim();
  if (!trimmed) return base;

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object') {
      return { ...base, ...parsed };
    }
  } catch {
    // legacy free-text value
    return { ...base, street: trimmed };
  }
  return base;
};

export const serializeAddress = (address) => JSON.stringify(address);

// Validates the parts the user must fill in.
// Returns a French error message or null if valid.
export const validateAddress = (a, { phone } = {}) => {
  if (!a.street.trim() || !a.postal_code.trim() || !a.city.trim()) {
    return 'Veuillez completer tous les champs obligatoires';
  }
  if (!POSTAL_CODE_RE.test(a.postal_code.trim())) {
    return 'Code postal invalide (5 chiffres attendus)';
  }
  if (phone !== undefined && !PHONE_RE.test(phone.trim())) {
    return 'Numero de telephone invalide (format francais attendu, ex. 06 12 34 56 78)';
  }
  return null;
};

// Compose the multi-line, human-readable string stored in
// orders.shipping_address (rendered in confirmation emails).
export const composeShippingAddress = (a, { first_name, last_name, phone }) => {
  const line1 = `${a.civility} ${first_name} ${last_name}`.replace(/\s+/g, ' ').trim();
  const lines = [
    line1,
    a.street.trim(),
    a.complement.trim(),
    `${a.postal_code} ${a.city.trim().toUpperCase()}`,
    'FRANCE',
    `Tel : ${phone.trim()}`,
  ].filter(Boolean);
  return lines.join('\n');
};

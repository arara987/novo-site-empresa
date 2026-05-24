(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BelfortAuthUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  const LOWER = 'abcdefghijkmnopqrstuvwxyz';
  const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const DIGITS = '23456789';
  const ALL = LOWER + UPPER + DIGITS;

  function pick(chars, randomFn) {
    return chars[Math.floor(randomFn() * chars.length) % chars.length];
  }

  function secureRandom() {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] / 4294967296;
    }
    return Math.random();
  }

  function generateSecurityCode(randomFn) {
    const random = randomFn || secureRandom;
    const chars = [pick(LOWER, random), pick(UPPER, random), pick(DIGITS, random)];
    while (chars.length < 18) chars.push(pick(ALL, random));
    for (let i = chars.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      const tmp = chars[i];
      chars[i] = chars[j];
      chars[j] = tmp;
    }
    return chars.join('');
  }

  function isStrongSecurityCode(code) {
    return typeof code === 'string'
      && code.length >= 18
      && /[a-z]/.test(code)
      && /[A-Z]/.test(code)
      && /[0-9]/.test(code);
  }

  async function sha256Hex(value) {
    const text = String(value || '');
    if (typeof require === 'function') {
      try {
        return require('node:crypto').createHash('sha256').update(text).digest('hex');
      } catch (error) {}
    }
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function parseCurrencyValue(value) {
    const text = String(value || '').trim();
    if (!text) return 0;
    const normalized = text
      .replace(/R\$\s?/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^0-9.\-]/g, '');
    return Number.parseFloat(normalized) || 0;
  }

  function splitClienteDocumento(value) {
    const text = String(value || '');
    const tipo = text.toUpperCase().includes('CNPJ') ? 'CNPJ' : 'CPF';
    return { tipo, numero: text.replace(/\D/g, '') };
  }

  function parseInteger(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed;
  }

  function normalizeDate(value) {
    return value || null;
  }

  return {
    generateSecurityCode,
    isStrongSecurityCode,
    sha256Hex,
    parseCurrencyValue,
    parseInteger,
    splitClienteDocumento,
    normalizeDate
  };
});

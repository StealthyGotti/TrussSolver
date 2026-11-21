// Display and input only. The solver and the JSON model always use numbers.
const NumericDisplay = (() => {
  const decimals = new Intl.NumberFormat('it-IT', {maximumSignificantDigits: 9, useGrouping: false});
  const decimal = value => decimals.format(value === 0 ? 0 : value);

  function decimalFraction(value) {
    const [digits, power = '0'] = String(value).toLowerCase().split('e');
    const places = (digits.split('.')[1] || '').length - Number(power);
    let numerator = BigInt(digits.replace('.', ''));
    if (places <= 0) return String(numerator * 10n ** BigInt(-places));
    let denominator = 10n ** BigInt(places);
    for (const factor of [2n, 5n]) {
      while (denominator % factor === 0n && numerator % factor === 0n) {
        numerator /= factor;
        denominator /= factor;
      }
    }
    return denominator === 1n ? String(numerator) : numerator + '/' + denominator;
  }

  function fraction(value, editable = false) {
    if (!Number.isFinite(value)) return '—';
    if (Number.isInteger(value)) return decimalFraction(value);
    const target = Math.abs(value);
    let rest = target, p0 = 0, q0 = 1, p1 = 1, q1 = 0, approximate;
    // Convergents recover simple ratios even after floating-point equilibrium solves.
    for (let i = 0; i < 64; i++) {
      const a = Math.floor(rest), p = a * p1 + p0, q = a * q1 + q0;
      if (!Number.isSafeInteger(p) || !Number.isSafeInteger(q)) break;
      const error = Math.abs(target - p / q);
      const signed = value < 0 ? -p : p;
      const text = q === 1 ? String(signed) : signed + '/' + q;
      if (editable ? error === 0 : error <= target * 32 * Number.EPSILON) return text;
      if (approximate === undefined && error <= target * 1e-7) approximate = text;
      if (!editable && q > 1000000 && approximate !== undefined) break;
      [p0, p1] = [p1, p];
      [q0, q1] = [q1, q];
      rest = 1 / (rest - a);
    }
    return (!editable && approximate) || decimalFraction(value);
  }

  const literal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
  function parse(text) {
    const parts = text.trim().replace(/,/g, '.').split('/').map(s => s.trim());
    if (parts.length > 2 || !parts.every(s => literal.test(s))) return NaN;
    const [a, b = '1'] = parts;
    const result = Number(a) / Number(b);
    if (!Number.isFinite(result) || !Number.isFinite(Number(b)) || Number(b) === 0) return NaN;
    return result;
  }

  return {decimal, fraction: value => fraction(value), inputFraction: value => fraction(value, true), parse};
})();

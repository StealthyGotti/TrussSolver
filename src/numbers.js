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

  // Convergents of the continued fraction of |value|. Returns the first one within the
  // relative tolerance whose denominator does not exceed the limit, as [p, q], or null.
  function ratio(value, tolerance, limit) {
    const target = Math.abs(value);
    let rest = target, p0 = 0, q0 = 1, p1 = 1, q1 = 0;
    for (let i = 0; i < 64; i++) {
      const a = Math.floor(rest), p = a * p1 + p0, q = a * q1 + q0;
      if (!Number.isSafeInteger(p) || !Number.isSafeInteger(q) || q > limit) return null;
      if (Math.abs(target - p / q) <= target * tolerance) return [p, q];
      [p0, p1] = [p1, p];
      [q0, q1] = [q1, q];
      rest = 1 / (rest - a);
    }
    return null;
  }

  // Radicands of the irrational member lengths of the current model, such as 5 for √5 b.
  // Results of such a model are sums a + c√n with rational a and c.
  let radicands = [];
  const cache = new Map();
  function squareFree(n) {
    for (let f = 2; f * f <= n; f++)
      while (n % (f * f) === 0) n /= f * f;
    return n;
  }
  function learn(model) {
    const found = new Set(), nodes = new Map((model.nodes || []).map(n => [n.id, n]));
    for (const e of model.members || []) {
      const a = nodes.get(e.a), b = nodes.get(e.b);
      if (!a || !b) continue;
      const squared = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
      if (!(squared > 0) || ratio(Math.sqrt(squared), 1e-12, 10000)) continue;
      const r = ratio(squared, 1e-12, 10000);
      if (r) found.add(squareFree(r[0] * r[1]));
    }
    const list = [...found].filter(n => n > 1 && n < 1e6).sort((p, q) => p - q);
    if (list.join() !== radicands.join()) {
      radicands = list;
      cache.clear();
    }
    return radicands;
  }
  const quotient = (p, q) => q === 1 ? String(p) : p + '/' + q;
  const rootTerm = (p, q, n) => (p === 1 ? '' : p) + '√' + n + (q === 1 ? '' : '/' + q);
  // value = ±(p/q)√n, or a/d + (c/d)√n with small integers.
  function withRoots(value) {
    const target = Math.abs(value), sign = value < 0 ? '-' : '';
    for (const n of radicands) {
      const r = ratio(target / Math.sqrt(n), 1e-10, 5000);
      if (r) return sign + rootTerm(r[0], r[1], n);
    }
    for (const n of radicands) {
      const root = Math.sqrt(n);
      for (let d = 1; d <= 96; d++) {
        const x = value * d, reach = Math.min(400, Math.ceil(Math.abs(x) / root) + 40);
        for (let c = -reach; c <= reach; c++) {
          if (!c) continue;
          const a = Math.round(x - c * root);
          if (!a || Math.abs(a + c * root - x) > 1e-9 * Math.max(1, Math.abs(x))) continue;
          const g = (u, v) => v ? g(v, u % v) : Math.abs(u);
          const ga = g(a, d), gc = g(c, d);
          return quotient(a / ga, d / ga) + (c < 0 ? '-' : '+') + rootTerm(Math.abs(c) / gc, d / gc, n);
        }
      }
    }
    return '';
  }

  function fraction(value, editable = false) {
    if (!Number.isFinite(value)) return '—';
    if (Number.isInteger(value)) return decimalFraction(value);
    const sign = value < 0 ? '-' : '';
    if (editable) {
      const exact = ratio(value, 0, Number.MAX_SAFE_INTEGER);
      return exact ? sign + quotient(...exact) : decimalFraction(value);
    }
    // Simple ratios survive the floating-point equilibrium solves.
    const exact = ratio(value, 32 * Number.EPSILON, 1e6);
    if (exact) return sign + quotient(...exact);
    if (radicands.length) {
      if (!cache.has(value)) cache.set(value, withRoots(value));
      if (cache.get(value)) return cache.get(value);
    }
    // Anything else is not a simple fraction: a short ratio when one is close, otherwise the decimal.
    const close = ratio(value, 1e-9, 100000);
    return close ? sign + quotient(...close) : decimal(value);
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

  return {decimal, fraction: value => fraction(value), inputFraction: value => fraction(value, true), parse, learn};
})();

// Stresses on a cross-section symmetric about its vertical axis. The section is given by its
// width profile [[y, width], ...] in mm, with y measured upwards from the lower edge; a repeated
// y marks a step and a sloping side is a segment between two widths. Stresses are in N/mm².
const CrossSection = (() => {
  const slabs = profile => profile.slice(1).map((p, k) => [profile[k], p]).filter(([a, b]) => b[0] > a[0]);
  function valid(profile) {
    return Array.isArray(profile) && profile.length >= 2 &&
        profile.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && p[1] >= 0) &&
        profile.every((p, k) => !k || p[0] >= profile[k - 1][0]) && slabs(profile).some(([a, b]) => a[1] + b[1] > 0);
  }
  // Area, centroid and central moments of inertia. Each slab is a trapezium of linear width.
  function properties(profile) {
    let area = 0, first = 0, second = 0, inertiaV = 0;
    for (const [[y0, w0], [y1, w1]] of slabs(profile)) {
      const h = y1 - y0, dw = w1 - w0;
      // ∫ w dy, ∫ y w dy and ∫ y² w dy with w(t) = w0 + dw t / h and y = y0 + t.
      area += h * (w0 + w1) / 2;
      first += y0 * h * (w0 + w1) / 2 + h * h * (w0 / 2 + dw / 3);
      second += y0 * y0 * h * (w0 + w1) / 2 + 2 * y0 * h * h * (w0 / 2 + dw / 3) + h ** 3 * (w0 / 3 + dw / 4);
      inertiaV += h * (w0 ** 3 + w0 * w0 * w1 + w0 * w1 * w1 + w1 ** 3) / 48;
    }
    const centroid = first / area;
    return {
      area, centroid, inertia: second - area * centroid * centroid, inertiaV,
      bottom: profile[0][0], top: profile.at(-1)[0], width: Math.max(...profile.map(p => p[1]))
    };
  }
  // Width of the chord at quota y. On a step the narrower part is taken.
  function chord(profile, y) {
    const widths = slabs(profile).filter(([a, b]) => y >= a[0] && y <= b[0])
        .map(([a, b]) => a[1] + (b[1] - a[1]) * (y - a[0]) / (b[0] - a[0]));
    return widths.length ? Math.min(...widths) : 0;
  }
  // First moment about the centroid of the part of the section above quota y.
  function firstMoment(profile, y, centroid) {
    let moment = 0;
    for (const [[y0, w0], [y1, w1]] of slabs(profile)) {
      if (y1 <= y)
        continue;
      const from = Math.max(y0, y), wFrom = w0 + (w1 - w0) * (from - y0) / (y1 - y0), h = y1 - from, dw = w1 - wFrom;
      moment += (from - centroid) * h * (wFrom + w1) / 2 + h * h * (wFrom / 2 + dw / 3);
    }
    return moment;
  }
  // Outline of the section as [x, y] points, anticlockwise from the lower right corner.
  function outline(profile) {
    const width = Math.max(...profile.map(p => p[1])), right = profile.map(([y, w]) => [(width + w) / 2, y]);
    return [...right, ...profile.map(([y, w]) => [(width - w) / 2, y]).reverse()];
  }
  // n, t in N and m in N·mm act on the section, with m positive when the lower edge is in tension.
  function stresses(section, n, t, m) {
    const {profile, cut} = section, p = properties(profile);
    const sigma = y => n / p.area - m * (y - p.centroid) / p.inertia;
    const yMax = Math.abs(sigma(p.bottom)) >= Math.abs(sigma(p.top)) ? p.bottom : p.top;
    // The extreme stress is quoted at the left corner of the lower edge or at the right corner of the upper one.
    const edge = profile[yMax === p.bottom ? 0 : profile.length - 1][1];
    const xMax = yMax === p.bottom ? (p.width - edge) / 2 : (p.width + edge) / 2;
    const web = chord(profile, cut), firstCut = Math.abs(firstMoment(profile, cut, p.centroid));
    const stress = sigma(cut), shear = web ? Math.abs(t) * firstCut / (p.inertia * web) : 0;
    return {
      ...p, n, t, m, xMax, yMax, uMax: xMax - p.width / 2, vMax: yMax - p.centroid, maxStress: sigma(yMax),
      xCut: p.width / 2, cut, vCut: cut - p.centroid, web, firstMoment: firstCut, stress, shear,
      vonMises: Math.hypot(stress, Math.sqrt(3) * shear)
    };
  }
  // Member of the model named from → to in either direction, with the section actions at node `at`.
  // The lower edge of the section lies on the right of the from → to direction.
  function actions(model, result, state = result.final) {
    const s = model.section;
    if (!s || !valid(s.profile) || !Number.isFinite(s.cut) || !model.ref)
      return null;
    const k = result.elements.findIndex(
        e => e.type === 'beam' && ((e.a === s.from && e.b === s.to) || (e.a === s.to && e.b === s.from)));
    if (k < 0 || ![s.from, s.to].includes(s.at))
      return null;
    const e = result.elements[k], x = s.at === e.a ? 0 : e.L, field = state.fields[k], {F, b} = model.ref;
    const value = poly => poly.reduceRight((sum, c) => sum * x + c, 0);
    // Seen from the other end the right-hand side changes: only the moment changes sign.
    const sign = e.a === s.from ? 1 : -1;
    return {index: k, x, coefficients: {n: value(field.N), t: value(field.T), m: sign * value(field.M)},
            n: F * value(field.N), t: F * value(field.T), m: sign * F * b * value(field.M)};
  }
  function evaluate(model, result) {
    const a = actions(model, result);
    return a ? {...a, ...stresses(model.section, a.n, a.t, a.m)} : null;
  }
  return {valid, properties, chord, firstMoment, outline, stresses, actions, evaluate};
})();
if (typeof module !== 'undefined')
  module.exports = CrossSection;

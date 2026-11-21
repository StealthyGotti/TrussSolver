// Section checks of the exam sheets, compared with the published values.
const test = require('node:test');
const assert = require('node:assert/strict');
const {solve} = require('../src/solver');
const {examples} = require('../src/examples');
const Section = require('../src/section');
const exam = number => examples.find(m => m.title.startsWith('Tema ' + number + ' '));
const near = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);
const rounded = (value, digits) => Number(value.toFixed(digits));

// [tema, A, Ju, Jv, yg, N, T, M, xm, ym, σm, σc, τc, σ von Mises, S*]
const published = [
  [1, 1183, 549474, 139287, 38.98, -2391, 6375, -3060000, 14, 0, -219.1, -135.6, 15.87, 138.3, 9573],
  [2, 1332, 341004, 150768, 31.01, -3740, -4675, -2384250, 12, 0, -219.6, -128.8, 8.484, 129.6, 7426],
  [8, 894, 284424, 80442, 19.9, -1674, 3565, 1782500, 30, 53, -209.3, -127.9, 12.49, 129.7, 5978],
  [11, 558, 198314, 34074, 31.66, 0, -1950, -1310400, 12, 0, -209.2, -149.7, 5.271, 150.0, 3216],
  [13, 612, 225968, 40716, 32.65, 1495, 2300, 1407600, 12, 0, 205.8, 156.0, 5.954, 156.3, 3510]
];
for (const [number, area, ju, jv, yg, n, t, m, xm, ym, sm, sc, tc, vm, s] of published)
  test('Sezione del tema ' + number + ': proprietà e tensioni come nella soluzione', () => {
    const model = exam(number), h = Section.evaluate(model, solve(model));
    near(h.area, area);
    assert.equal(Math.round(h.inertia), ju);
    assert.equal(Math.round(h.inertiaV), jv);
    assert.equal(rounded(h.centroid, 2), yg);
    assert.equal(Math.round(h.n), n);
    near(h.t, t);
    near(h.m, m);
    assert.deepEqual([h.xMax, h.yMax], [xm, ym]);
    assert.equal(rounded(h.maxStress, 1), sm);
    assert.equal(rounded(h.stress, 1), sc);
    assert.equal(Number(h.shear.toPrecision(4)), tc);
    assert.equal(rounded(h.vonMises, 1), vm);
    assert.equal(Math.round(h.firstMoment), s);
  });

test('Profilo della sezione: tratti inclinati, corda e momento statico', () => {
  // Triangle of base 48 and height 6 above a 48 × 13 flange, as on the roof of the section of tema 2.
  const roof = [[0, 48], [13, 48], [19, 0]], p = Section.properties(roof);
  near(p.area, 48 * 13 + 48 * 6 / 2);
  near(p.centroid, (48 * 13 * 6.5 + 144 * 15) / (48 * 13 + 144));
  near(Section.chord(roof, 16), 24);
  near(Section.chord([[0, 20], [10, 20], [10, 4], [30, 4]], 10), 4);
  // The parts above and below any quota have opposite first moments about the centroid.
  near(Section.firstMoment(roof, 0, p.centroid), 0, 1e-9);
  assert.ok(Section.firstMoment(roof, 10, p.centroid) > 0);
  assert.equal(Section.outline(roof).length, 6);
  assert.ok(!Section.valid([[0, 10], [5]]) && !Section.valid([[5, 10], [0, 10]]) && Section.valid(roof));
  // Seen from the other end of the member the moment changes sign and the shear does not.
  const model = structuredClone(exam(1)), r = solve(model), direct = Section.actions(model, r);
  model.section = {...model.section, from: 'F', to: 'H'};
  const turned = Section.actions(model, r);
  near(turned.m, -direct.m);
  near(turned.t, direct.t);
  near(turned.n, direct.n);
});

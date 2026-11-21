// Exam sheets used as models: results are compared with the published solutions.
const test = require('node:test');
const assert = require('node:assert/strict');
const {solve, evaluate} = require('../src/solver');
const {examples} = require('../src/examples');
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);
const exam = number => examples.find(m => m.title.startsWith('Tema ' + number + ' '));
// Checks N at the start and M at both ends of every listed member a/b.
function check(r, table) {
  for (const [key, n, m0, mL] of table) {
    const k = r.elements.findIndex(e => e.key === key), f = r.final.fields[k];
    assert.ok(k >= 0, key);
    near(evaluate(f.N, 0), n);
    near(evaluate(f.M, 0), m0);
    near(evaluate(f.M, r.elements[k].L), mL);
  }
}
const unknown = r => r.descriptors[r.free[0]].label;

test('Tema 2: carrello interno inclinato, molla rotazionale e carichi su un lato', () => {
  const r = solve(exam(2));
  assert.equal(r.X.length, 1);
  assert.equal(unknown(r), 'W_FD');
  near(r.X[0], 31 / 42);
  near(r.delta[0], -31 / 18);
  near(r.flexibility[0][0], 7 / 3);
  check(r, [
    ['A/B', -1 / 3, 2 / 3, 0], ['C/A', -53 / 84, 0, 11 / 42], ['D/E', -2 / 3, 0, -5 / 6],
    ['F/D', -31 / 84, -31 / 42, 0], ['G/E', -1 / 3, 1 / 6, 5 / 6], ['B/G', -1 / 3, 0, 1 / 6],
    ['A/D', -13 / 14, 25 / 42, 0], ['C/F', -31 / 42, 0, -31 / 42]
  ]);
  // On BG the moment has an interior minimum of −Fb/18 at b/3.
  near(evaluate(r.final.fields[5].M, 1 / 3), -1 / 18);
});

test('Tema 11: pattini interni, carico sul lato dell’asta e molla rotazionale', () => {
  const r = solve(exam(11));
  assert.equal(r.X.length, 1);
  assert.equal(unknown(r), 'W_AD');
  near(r.X[0], 39 / 31);
  near(r.delta[0], -13 / 4);
  near(r.flexibility[0][0], 31 / 12);
  check(r, [
    ['A/B', 5 / 2, 39 / 31, 0], ['B/C', 5 / 2, 0, 1], ['D/E', 1, 139 / 62, 3 / 2], ['F/G', -5 / 2, 0, 3],
    ['G/H', -5 / 2, 4, 4], ['A/D', -23 / 62, -39 / 31, 77 / 62], ['B/E', -163 / 62, 0, 0],
    ['C/H', 0, 1, -4], ['E/G', -3, 3 / 2, 1]
  ]);
  // The sliders leave no shear in EG at G and no axial force in CH.
  const eg = r.final.fields[8];
  near(evaluate(eg.T, 1), 0);
  near(evaluate(eg.T, 0), -1);
});

test('Tema 8: doppio pendolo a terra, carrello con molla traslazionale e asta inclinata', () => {
  const r = solve(exam(8));
  assert.equal(r.X.length, 1);
  assert.equal(unknown(r), 'W_BC');
  near(r.X[0], -553 / 264);
  near(r.delta[0], 553 / 24);
  near(r.flexibility[0][0], 11);
  near(r.elements[0].L, 5);
  check(r, [
    ['A/B', -1647 / 1760, 0, 553 / 264], ['B/C', -1, 553 / 264, 289 / 176], ['C/D', 7 / 20, 289 / 176, -301 / 66],
    ['D/E', 7 / 20, 23 / 4, 0], ['F/C', -23 / 8, 27 / 4, 0], ['F/G', -27 / 20, -23 / 4, 0],
    ['G/H', -27 / 20, 0, 23 / 4], ['H/E', 23 / 8, 23 / 4, 0]
  ]);
  // The roller in E pushes on its spring with 4F, but no virtual reaction acts there.
  near(r.final.vector[r.descriptors.findIndex(d => d.label === 'H_E')], 4);
  near(r.final.vector[r.descriptors.findIndex(d => d.label === 'V_A')], -239 / 1056);
  near(r.supportX[0][0][0].spring, 0);
});

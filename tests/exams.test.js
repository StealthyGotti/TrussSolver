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

test('Tema 13: cedimento imposto in I, carrello interno in F e asta lunga √5 b', () => {
  const r = solve(exam(13));
  assert.equal(r.X.length, 1);
  assert.equal(unknown(r), 'V_G');
  near(r.X[0], -59 / 8);
  near(r.delta[0], 295 / 6);
  near(r.flexibility[0][0], 20 / 3);
  // The settlement enters the known term with the work of the virtual reaction, −V_I v_I = 3.
  near(r.support0[0][0].settle, 3);
  near(r.elements[4].L, Math.sqrt(5));
  check(r, [
    ['A/B', 0, 0, 4], ['B/C', 5 / 4, 0, 5 / 2], ['C/D', 0, 5 / 2, 0], ['D/E', 0, 0, -5 / 2],
    ['F/E', -Math.sqrt(5) / 4, 0, 5 / 2], ['B/G', 13 / 4, 4, 9], ['G/H', -5, 9, 3 / 4],
    ['H/F', 33 / 8, -1 / 4, 43 / 4], ['F/I', 11, 43 / 4, 0]
  ]);
  near(evaluate(r.final.fields[4].T, 0), Math.sqrt(5) / 2);
  near(evaluate(r.final.fields[8].T, 0), -43 / 8);
});

// A sheet that is not among the models: three internal rollers, a rotational spring beside a roller,
// a double pendulum on the ground, loads on one side of two rollers and a member √5 b long.
test('Tema di controllo: carrelli interni, molla, doppio pendolo e asta √5 b insieme', () => {
  const {node, beam} = require('../src/examples');
  const model = {
    axial: false,
    release: 'B/C/mi',
    nodes: [
      node('A', 0, 2, 'pin'), node('B', 0, 1), node('C', 0, 0), node('D', 3, 0), node('E', 4, 0, 'sliderX'),
      node('F', 2, 1, 'free', {m: -1}), node('G', 3, 1)
    ],
    members: [
      beam('A', 'B'), beam('B', 'C', {springI: 2}), beam('C', 'D', {eps: -1}), beam('D', 'E'),
      beam('C', 'F', {hi: true, slideI: 'incl', slideIdx: 0, slideIdy: 1, fyI: -1}),
      beam('B', 'F', {qy: -1, hi: true, slideI: 'incl', slideIdx: 1, slideIdy: 0}), beam('F', 'G'),
      beam('G', 'D', {hj: true, slideJ: 'incl', slideJdx: 1, slideJdy: 0, fxJ: -1})
    ]
  };
  const r = solve(model);
  assert.equal(r.X.length, 1);
  assert.equal(unknown(r), 'W_BC');
  near(r.X[0], 108 / 115);
  near(r.delta[0], -18);
  near(r.flexibility[0][0], 115 / 6);
  near(r.work0[0][2].bend, -9);
  near(r.work0[0][2].imposed, -3);
  near(r.workX[0][0][1].spring, 1 / 2);
  // Primary moments of the sheet: CF from the roller in C, BF under the distributed load.
  near(evaluate(r.primary.fields[4].M, Math.sqrt(5)), -3);
  near(evaluate(r.primary.fields[5].M, 1), 3 / 2);
  near(evaluate(r.primary.fields[5].M, 2), 2);
});

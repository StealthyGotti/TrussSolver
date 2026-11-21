const test = require('node:test');
const assert = require('node:assert/strict');
const {solve, evaluate} = require('../src/solver');
const {node, beam, examples} = require('../src/examples');
const copy = model => structuredClone(model);
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8 * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);
const value = (r, id) => r.final.vector[r.descriptors.findIndex(d => d.id === id)];
const exam = examples[0];
const member = (r, key) => r.elements.findIndex(e => e.key === key);
const moment = (r, key, s) => evaluate(r.final.fields[member(r, key)].M, s);
// Analytical fixtures for the solver, independent of the model menu.
function loadedBeam(leftSupport) {
  return {nodes: [node('A',0,0,leftSupport),node('B',6,0,'rollerY')],
    members: [beam('A','B',{qy:-12, ei: 20000, ea: 200000})], axial:false, release:''};
}
test('Trave appoggiata, reazioni e parabola sotto carico uniforme', () => {
  const r = solve(loadedBeam('pin')), f = r.final.fields[0];
  assert.equal(r.free.length, 0);
  near(value(r, 'r/A/1'), 36);
  near(value(r, 'r/B/1'), 36);
  near(evaluate(f.M, 0), 0);
  near(evaluate(f.M, 3), 54);
  near(evaluate(f.M, 6), 0);
  near(evaluate(f.T, 3), 0);
});
test('Mensola puntellata, integrali e sovrapposizione', () => {
  const r = solve(loadedBeam('fixed')), L = 6, q = 12, EJ = 20000;
  near(r.delta[0], -q * L ** 4 / (8 * EJ));
  near(r.flexibility[0][0], L ** 3 / (3 * EJ));
  near(r.X[0], 3 * q * L / 8);
  near(evaluate(r.primary.fields[0].M, 0), -q * L ** 2 / 2);
  near(evaluate(r.service[0].fields[0].M, 0), L);
  assert.equal(r.descriptors[r.free[0]].label, 'V_B');
  near(evaluate(r.final.fields[0].M, 0), -q * L ** 2 / 8);
});
test('Telaio libero con deformazione impressa, primo tema', () => {
  const r = solve(exam);
  assert.equal(r.floating, true);
  assert.equal(r.X.length, 1);
  assert.equal(r.descriptors[r.free[0]].label, 'W_AE');
  near(r.X[0], -13 / 16);
  near(value(r, 'A/B/n'), 57 / 16);
  near(value(r, 'C/D/n'), -31 / 32);
  near(moment(r, 'B/F', 0), 51 / 16);
  near(moment(r, 'A/E', 0), 13 / 16);
  near(moment(r, 'C/A', 2), 13 / 16);
  near(r.flexibility[0][0], 8 / 3);
  near(r.delta[0], 13 / 6);
  near(r.work0[0][0].imposed, -2);
  for (const [i, d] of r.descriptors.entries())
    if (d.artificial)
      near(r.final.vector[i], 0);
});
test('Il cambio di rilascio modifica il servizio e conserva la soluzione finale', () => {
  const m = copy(exam), r = solve(m);
  m.release = 'A/B/n';
  const other = solve(m);
  near(other.X[0], 57 / 16);
  for (const d of r.descriptors)
    near(value(other, d.id), value(r, d.id));
});
test('Biella termica bloccata e lavoro assiale', () => {
  const m = {
    nodes: [node('A', 0, 0, 'pin'), node('B', 2, 0, 'pin')],
    members: [beam('A', 'B', {type: 'bar', ea: 5000, eps: .001})],
    release: 'A/B/n',
    axial: true
  };
  const r = solve(m);
  near(r.X[0], -5);
  near(r.flexibility[0][0], 2 / 5000);
  near(r.delta[0], .002);
  m.axial = false;
  assert.throws(() => solve(m), /singolare/);
});
test('Trave doppiamente incastrata, tre compatibilità accoppiate', () => {
  const m = loadedBeam('fixed');
  m.nodes[1].support = 'fixed';
  m.axial = true;
  const r = solve(m);
  assert.equal(r.X.length, 3);
  near(value(r, 'r/B/1'), 36);
  near(evaluate(r.final.fields[0].M, 0), -36);
  near(evaluate(r.final.fields[0].M, 3), 18);
  r.flexibility.forEach((row, i) => {
    near(r.delta[i] + row.reduce((s, v, j) => s + v * r.X[j], 0), 0);
    row.forEach((v, j) => near(v, r.flexibility[j][i]));
  });
});
test('Asta inclinata con carichi distribuiti globali', () => {
  const m = {
    nodes: [node('A', 0, 0, 'fixed'), node('B', 3, 4)],
    members: [beam('A', 'B', {qx: 2, qy: -3, ea: 200000})],
    axial: true
  };
  const r = solve(m);
  near(value(r, 'r/A/0'), -10);
  near(value(r, 'r/A/1'), 15);
  near(value(r, 'r/A/2'), 42.5);
  for (const p of Object.values(r.final.fields[0]))
    near(evaluate(p, 5), 0);
});
test('Curvatura impressa costante tra due incastri', () => {
  const m = loadedBeam('fixed');
  m.nodes[1].support = 'fixed';
  m.axial = true;
  Object.assign(m.members[0], {qy: 0, kappa: .001});
  const r = solve(m);
  near(evaluate(r.final.fields[0].M, 3), -20);
  near(evaluate(r.final.fields[0].T, 3), 0);
});
test('Riconosce meccanismi, carichi sbilanciati e rilasci inammissibili', () => {
  const m = loadedBeam('pin');
  m.nodes[1].support = 'free';
  assert.throws(() => solve(m), /labile/);
  const closed = copy(exam);
  closed.nodes[0].fx = 0;
  assert.throws(() => solve(closed), /autoequilibrati/);
  const p = loadedBeam('fixed');
  p.release = 'r/A/0';
  assert.throws(() => solve(p), /meccanismo/);
});
test('Tutti gli esempi soddisfano ogni equazione nodale in ogni stato', () => {
  for (const m of examples) {
    const r = solve(m);
    for (const state of [r.primary, ...r.service, r.final]) {
      for (const row of r.equations)
        near(state.vector.reduce((s, v, i) => s + v * row[i], 0), r.service.includes(state) ? 0 : row.at(-1));
    }
  }
});
test('Mensola puntellata con molla rotazionale al piede', () => {
  const m = loadedBeam('fixed'), L = 6, q = 12, EJ = 20000, k = 7000;
  m.members[0].springI = k;
  const r = solve(m);
  const delta = -q * L ** 4 / (8 * EJ) - q * L ** 3 / (2 * k), f = L ** 3 / (3 * EJ) + L ** 2 / k;
  near(r.delta[0], delta);
  near(r.X[0], -delta / f);
  near(r.workX[0][0][0].spring, L ** 2 / k);
});
test('Sezione H dal campo finale, confronto con i risultati del tema', () => {
  const {atH}=require('../src/section');
  const r=solve(exam), h=atH(r.final.fields[r.elements.findIndex(e=>e.a==='H' && e.b==='F')], exam.ref);
  near(h.n,-2390.625); near(h.t,6375); near(h.m,-3060000); near(h.area,1183);
  assert.equal(Math.round(h.inertia),549474); assert.equal(Math.round(h.firstMoment),9573);
  assert.equal(h.maxStress.toFixed(1),'-219.1'); assert.equal(h.stress.toFixed(1),'-135.6');
  assert.equal(h.shear.toFixed(2),'15.87'); assert.equal(h.vonMises.toFixed(1),'138.3');
});

// Internal sliding connections between a member end and its node.
function span(data, left = 'fixed', right = 'fixed') {
  return {nodes: [node('A', 0, 0, left), node('B', 4, 0, right)], members: [beam('A', 'B', data)],
    axial: true, release: ''};
}
test('Pattino trasversale: trave incastrata e guidata sotto carico uniforme', () => {
  const q = 3, L = 4, r = solve(span({qy: -q, slideJ: 'normal'})), f = r.final.fields[0];
  assert.equal(r.X.length, 2);
  near(evaluate(f.T, L), 0);
  near(evaluate(f.M, 0), -q * L * L / 3);
  near(evaluate(f.M, L), q * L * L / 6);
  near(value(r, 'r/B/1'), 0);
  near(value(r, 'r/A/1'), q * L);
});
test('Pattino assiale: lo sforzo normale si annulla all’estremo che scorre', () => {
  const p = 2, L = 4, r = solve(span({qx: p, qy: -1, slideI: 'axis'})), f = r.final.fields[0];
  near(evaluate(f.N, 0), 0);
  near(evaluate(f.N, L), -p * L);
  near(value(r, 'r/A/0'), 0);
  near(value(r, 'r/B/0'), -p * L);
  // The transverse response is that of a beam fixed at both ends.
  near(evaluate(f.M, 0), -L * L / 12);
  near(evaluate(f.M, L / 2), L * L / 24);
});
test('Carrello interno su piano inclinato a 45°: reazione perpendicolare al piano', () => {
  const q = 6, L = 4;
  const r = solve(span({qy: -q, hj: true, slideJ: 'incl', slideJdx: 1, slideJdy: 1}, 'pin', 'fixed'));
  assert.equal(r.X.length, 0);
  near(value(r, 'r/B/1'), q * L / 2);
  near(value(r, 'r/B/0'), -q * L / 2);
  near(value(r, 'r/B/2'), 0);
  near(value(r, 'r/A/0'), q * L / 2);
  near(value(r, 'A/B/n'), -q * L / 2);
  near(evaluate(r.final.fields[0].M, L / 2), q * L * L / 8);
});
test('Carrello interno che scorre lungo l’asta: trasmette solo il taglio', () => {
  const r = solve(span({qy: -6, hj: true, slideJ: 'axis'}, 'pin', 'fixed'));
  near(value(r, 'A/B/n'), 0);
  near(value(r, 'r/B/1'), 12);
  near(value(r, 'r/B/0'), 0);
  assert.throws(() => solve(span({hi: true, slideI: 'axis', hj: true, slideJ: 'axis'})), /labile/);
  assert.throws(() => solve({...span({}), members: [beam('A', 'B', {type: 'bar', slideI: 'axis'})]}), /Pattini/);
});

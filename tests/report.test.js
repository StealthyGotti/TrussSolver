// The virtual work sheet is compared with the text of the published solution sheets.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = vm.createContext({Intl});
for (const file of ['solver', 'examples', 'numbers', 'section', 'drawing', 'report'])
  vm.runInContext(fs.readFileSync(require.resolve('../src/' + file), 'utf8'), context, {filename: file + '.js'});
const {Mechanics, Models, NumericDisplay, Report} = vm.runInContext('({Mechanics, Models, NumericDisplay, Report})', context);
const exam = number => Models.examples.find(m => m.title.startsWith('Tema ' + number + ' '));

// Renders one tab into a stand-in host and returns its rows as plain text, cells separated by |.
function sheet(number, tab, decimals = false) {
  const model = exam(number), r = Mechanics.solve(model);
  NumericDisplay.learn(model);
  const plot = id => ({id, clientWidth: 420, clientHeight: 320, setAttribute() {}});
  const host = {innerHTML: '', querySelectorAll: () => [], querySelector: q => /plot|plv/.test(q) ? plot(q.slice(1)) : null};
  Report.render(host, model, r, {tab, stage: 'final', comp: 'all', decimals}, () => {});
  return host.innerHTML.replace(/<\/tr>/g, '\n').replace(/<br>/g, '\n').replace(/<\/t[dh]>/g, '|').replace(/<[^>]+>/g, '');
}
const row = (text, start) => text.split('\n').find(line => line.startsWith(start));

test('Quadro PLV del tema 1: stessi polinomi e stessi integrali della soluzione', () => {
  const text = sheet(1, 'plv');
  assert.match(text, /Quadro contributi PLV per iperstatica X=WAE/);
  assert.equal(row(text, 'CA 2b'), 'CA 2b|-1/2x/b|11/4Fb-11/8Fx|-11/8Fx+11/16Fx²/b|1/4x²/b²|-11/12Fb²/EJ|2/3Xb/EJ|');
  assert.equal(row(text, 'AC 2b'), 'AC 2b|1-1/2x/b|-11/8Fx|-11/8Fx+11/16Fx²/b|1-x/b+1/4x²/b²|');
  assert.equal(row(text, 'BG 2b'), 'BG 2b|-1+1/2x/b|-4Fb+19/8Fx|4Fb-35/8Fx+19/16Fx²/b|1-x/b+1/4x²/b²|');
  assert.equal(row(text, 'DG b'), 'DG b|0|11/4Fx-7/2qx²|0|0|0|0|');
  assert.equal(row(text, 'GD b'), 'GD b|0|3/4Fb-17/4Fx+7/2qx²|0|0|');
  assert.equal(row(text, 'AB|'), 'AB|elongazione asta N1ABεABLAB|-2Fb²/EJ||');
  assert.equal(row(text, '|totali'), '|totali|13/6Fb²/EJ|8/3Xb/EJ|');
  assert.equal(row(text, '|iperstatica'), '|iperstatica X=WAE|-13/16Fb||');
  assert.match(text, /LXXAE = ∫02b \(1-x\/b\+1\/4x²\/b²\) 1\/EJ dx = \[x-1\/2x²\/b\+1\/12x³\/b²\]02b 1\/EJ = 2\/3b\/EJ/);
  assert.match(text, /LXoBF = ∫02b \(4Fb-4Fx\+Fx²\/b\) 1\/EJ dx = \[4Fbx-2Fx²\+1\/3Fx³\/b\]02b 1\/EJ = 8\/3Fb²\/EJ/);
});

test('Quadro PLV del tema 2: molla rotazionale ed elongazione termica', () => {
  const text = sheet(2, 'plv');
  assert.equal(row(text, 'AD 2b'), 'AD 2b|-1+1/2x/b|4/3Fb-2/3Fx|-4/3Fb+4/3Fx-1/3Fx²/b|1-x/b+1/4x²/b²|-8/9Fb²/EJ|2/3Xb/EJ|');
  assert.equal(row(text, 'BG b'), 'BG b|0|-1/3Fx+1/2qx²|0|0|0|0|');
  assert.equal(row(text, 'CA|'), 'CA|elongazione asta N1CAεCALCA|-1/2Fb²/EJ||');
  assert.equal(row(text, 'FD|'), 'FD|molla asta W1FD(WoFD+XWxFD)/kFD||1/3Xb/EJ|');
  assert.equal(row(text, '|totali'), '|totali|-31/18Fb²/EJ|7/3Xb/EJ|');
  assert.equal(row(text, '|iperstatica'), '|iperstatica X=WFD|31/42Fb||');
});

test('Quadro PLV del tema 13: incognita forza, curvatura, cedimento e radici', () => {
  const text = sheet(13, 'plv');
  assert.equal(row(text, 'GH 2b'), 'GH 2b|x|9Fb+13/4Fx|4Fb/EJ|9Fbx+13/4Fx²|4Fbx/EJ|x²|(80/3+8)Fb³/EJ|8/3Xb³/EJ|');
  assert.equal(row(text, 'HG 2b'), 'HG 2b|-2b+x|-31/2Fb+13/4Fx|-4Fb/EJ|31Fb²-22Fbx+13/4Fx²|8Fb²/EJ-4Fbx/EJ|4b²-4bx+x²|');
  assert.equal(row(text, 'HF b'), 'HF b|2b-4x|29/2Fb-37/2Fx|0|29Fb²-95Fbx+74Fx²|0|4b²-16bx+16x²|(37/6+0)Fb³/EJ|4/3Xb³/EJ|');
  assert.equal(row(text, 'FE √5b'), 'FE √5b|0|√5/2Fx|0|0|0|0|0+0|0|');
  assert.equal(row(text, 'I|'), 'I|cedimento nodo −V1I vI|3Fb³/EJ||');
  assert.equal(row(text, '|totali'), '|totali|295/6Fb³/EJ|20/3Xb³/EJ|');
  assert.equal(row(text, '|iperstatica'), '|iperstatica X=VG|-59/8F||');
});

test('Quadro PLV del tema 8: curvatura termica su asta inclinata', () => {
  const text = sheet(8, 'plv');
  assert.equal(row(text, 'AB 5b'), 'AB 5b|-1/5x/b|0|-Fb/EJ|0|1/5Fx/EJ|1/25x²/b²|(0+5/2)Fb²/EJ|5/3Xb/EJ|');
  assert.equal(row(text, 'BA 5b'), 'BA 5b|1-1/5x/b|0|Fb/EJ|0|Fb/EJ-1/5Fx/EJ|1-2/5x/b+1/25x²/b²|');
  assert.equal(row(text, 'CD 2b'), 'CD 2b|-3/2-1/4x/b|-3/2Fb-29/8Fx|0|9/4Fb+93/16Fx+29/32Fx²/b|0|9/4+3/4x/b+1/16x²/b²|(445/24+0)Fb²/EJ|37/6Xb/EJ|');
  assert.equal(row(text, '|totali'), '|totali|553/24Fb²/EJ|11Xb/EJ|');
  assert.equal(row(text, '|iperstatica'), '|iperstatica X=WBC|-553/264Fb||');
});

test('Reazioni: azioni dei nodi sulle aste e reazioni vincolari', () => {
  const text = sheet(1, 'reactions');
  assert.equal(row(text, 'CD|C'), 'CD|C|31/32 F|11/4 F|11/4 Fb|');
  assert.equal(row(text, 'AB|A'), 'AB|A|-57/16 F|0|0|');
  // W_AE is the unknown of the sheet: the couple of node A on member AE.
  assert.equal(row(text, 'AE|A'), 'AE|A|-13/32 F|-11/4 F|-13/16 Fb|');
  assert.match(text, /Corpo libero in equilibrio/);
  assert.equal(row(sheet(13, 'reactions'), 'VG'), 'VG|-59/8 F|');
  // Every member is in equilibrium under its end actions and its own loads.
  for (const model of Models.examples) {
    const r = Mechanics.solve(model);
    Report.endActions(r, r.final).forEach(([a, b], k) => {
      const e = r.elements[k];
      assert.ok(Math.abs(a.h + b.h + e.qx * e.L + e.endLoads[0][0] + e.endLoads[1][0]) < 1e-9, model.title + ' ' + e.key);
      assert.ok(Math.abs(a.v + b.v + e.qy * e.L + e.endLoads[0][1] + e.endLoads[1][1]) < 1e-9, model.title + ' ' + e.key);
    });
  }
});

test('Con Mostra decimali il quadro usa numeri decimali', () => {
  assert.equal(row(sheet(1, 'plv', true), '|iperstatica'), '|iperstatica X=WAE|-0,8125Fb||');
});

test('Più incognite: un quadro per ciascuna, con i termini misti', () => {
  const {node, beam} = Models;
  const model = {title: 'Trave incastrata e appoggiata in mezzeria', ref: {b: 1000, F: 1000}, axial: false, release: '',
    nodes: [node('A', 0, 0, 'fixed'), node('B', 2, 0, 'rollerY'), node('C', 4, 0, 'rollerY')],
    members: [beam('A', 'B', {qy: -1}), beam('B', 'C', {qy: -1})]};
  const r = Mechanics.solve(model);
  assert.equal(r.X.length, 2);
  NumericDisplay.learn(model);
  const plot = id => ({id, clientWidth: 420, clientHeight: 320, setAttribute() {}});
  const host = {innerHTML: '', querySelectorAll: () => [], querySelector: q => /plot|plv/.test(q) ? plot(q.slice(1)) : null};
  for (const tab of ['diagrams', 'reactions', 'equilibrium', 'plv'])
    Report.render(host, model, r, {tab, stage: 'final', comp: 'all'}, () => {});
  const text = host.innerHTML.replace(/<[^>]+>/g, '');
  assert.match(text, /Quadro contributi PLV per iperstatica X1=/);
  assert.match(text, /Quadro contributi PLV per iperstatica X2=/);
  assert.match(text, /∫X2M1M2\/EJdx/);
  // The three vertical reactions carry the whole distributed load.
  const value = label => r.final.vector[r.descriptors.findIndex(d => d.label === label)];
  assert.ok(Math.abs(value('V_A') + value('V_B') + value('V_C') - 4) < 1e-9);
});

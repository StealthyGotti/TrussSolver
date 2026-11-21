const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Models = require('../src/examples');
const Mechanics = require('../src/solver');

const context = vm.createContext({Models, Mechanics});
vm.runInContext(fs.readFileSync(require.resolve('../src/numbers'), 'utf8'), context);
const draft = vm.runInContext(fs.readFileSync(require.resolve('../src/drawing'), 'utf8') + '\nDraft', context);

function draw(model, result, state, component, extra = {}) {
  const view = draft.viewport(model.nodes, 500, 400);
  const svg = {id: 'plot', setAttribute() {}};
  draft.draw(svg, model, view, {result, state, component, ...extra});
  return svg.innerHTML;
}
function taggedLine(svg, tag) {
  return svg.match(new RegExp('<line [^>]*class="' + tag + '"[^>]*/>'))[0];
}
function envelope(svg) {
  return svg.match(/<path d="([^"]*)"[^>]*class="diagram-envelope"/)[1];
}
function loadedBeam() {
  return {nodes:[Models.node('A',0,0,'pin'), Models.node('B',6,0,'rollerY',{fx:2})],
          members:[Models.beam('A','B',{qy:-12, ei:20000, ea:200000})], axial:true};
}

test('Cambio del tratteggio dopo il calcolo: M cambia segno e conserva la curva fisica', () => {
  const model=loadedBeam(), r=Mechanics.solve(model), e=model.members[0];
  const before=draw(model,r,r.final,'M');
  assert.match(before,/>54</);
  const rightFields=draft.diagramField(e,r.final.fields[0],'M');
  e.fiberSide='left';
  const after=draw(model,r,r.final,'M');
  assert.match(after,/>-54</);
  assert.notEqual(taggedLine(before,'fiber-mark'),taggedLine(after,'fiber-mark'));
  assert.equal(envelope(before),envelope(after));
  assert.equal(Mechanics.evaluate(rightFields,3),54);
  assert.equal(Mechanics.evaluate(draft.diagramField(e,r.final.fields[0],'M'),3),-54);
});

test('Il lato delle ordinate N e T segue il riferimento, i segni N e T rimangono invariati', () => {
  for (const component of ['N','T']) {
    const model=loadedBeam(), r=Mechanics.solve(model), e=model.members[0];
    const before=draw(model,r,r.final,component);
    e.fiberSide='left';
    const after=draw(model,r,r.final,component);
    assert.notEqual(envelope(before),envelope(after));
    assert.deepEqual(draft.diagramField(e,r.final.fields[0],component),r.final.fields[0][component]);
  }
});

test('Tratteggi e quote del primo tema: sotto le aste orizzontali e a ovest dei montanti', () => {
  const model=Models.examples[0], r=Mechanics.solve(model);
  for (const [k,e] of model.members.entries()) {
    const a=model.nodes.find(n=>n.id===e.a), b=model.nodes.find(n=>n.id===e.b);
    assert.equal(e.fiberSide,'right');
    if (b.y===a.y) assert.ok(b.x>a.x); // right of an eastward member is below it
    else assert.ok(b.y<a.y);            // right of a southward member is west of it
    if(e.a==='A' && e.b==='E') {
      const field=draft.diagramField(e,r.final.fields[k],'M');
      assert.equal(draft.fraction(Mechanics.evaluate(field,0)),'13/16');
    }
  }
  const svg=draw(model,r,r.final,'N');
  assert.match(svg,/>57\/16</);
  assert.match(svg,/>N \[F\]</);
  assert.match(draw(model),/>7q</);
  assert.match(draw(model),/>2b</);
});

test('Gli schemi di risultato omettono griglia, simboli di vincolo e marcatori dei nodi', () => {
  const model=loadedBeam();
  model.nodes[0].support='fixed';
  model.members[0].hj=true;
  model.members[0].springI=4000;
  const r=Mechanics.solve(model);
  assert.match(draw(model),/<circle/);
  for(const state of [r.primary,...r.service,r.final]) {
    const svg=draw(model,r,state,'M');
    assert.doesNotMatch(svg,/<circle|<pattern|data-node|data-edge|#e1f1e9|#f2faf6/);
    assert.match(svg,/class="fiber-mark"/);
    assert.match(svg,/class="diagram-ribs"/);
  }
});

test('Deformazioni termiche: quadratino per ε e trapezio per θ a metà asta', () => {
  const model=loadedBeam();
  assert.doesNotMatch(draw(model),/thermal-/);
  model.members[0].eps=-1;
  assert.match(draw(model),/class="thermal-elongation"/);
  assert.doesNotMatch(draw(model),/thermal-curvature/);
  model.members[0].eps=0;
  model.members[0].kappa=-1;
  const up=draw(model).match(/<path d="([^"]*)"[^>]*class="thermal-curvature"/)[1];
  model.members[0].kappa=1;
  const down=draw(model).match(/<path d="([^"]*)"[^>]*class="thermal-curvature"/)[1];
  // The wide base of the trapezium follows the stretched side: below an eastward member for θ > 0.
  const firstY=d=>Number(d.split(' ')[2]);
  assert.ok(firstY(down) > firstY(up));
  // The marks belong to the scheme, not to the result diagrams.
  const r=Mechanics.solve(model);
  assert.doesNotMatch(draw(model,r,r.final,'M'),/thermal-/);
});

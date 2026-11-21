const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Models = require('../src/examples');
const Mechanics = require('../src/solver');

const context = vm.createContext({Models, Mechanics});
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
          members:[Models.beam('A','B',{qy:-12})], axial:true};
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

test('Tratteggi e quote del primo tema, orientati rispetto ai due montanti', () => {
  const model=Models.examples[0], r=Mechanics.solve(model);
  for (const [k,e] of model.members.entries()) {
    const a=model.nodes.find(n=>n.id===e.a), b=model.nodes.find(n=>n.id===e.b);
    const sign=e.fiberSide==='left'?-1:1;
    if (b.y===a.y) assert.ok(-(b.x-a.x)*sign < 0); // below the horizontal member
    else assert.ok((b.y-a.y)*sign < 0);             // west of the vertical member
    if(e.a==='E' && e.b==='A') {
      const field=draft.diagramField(e,r.final.fields[k],'M');
      const value=Mechanics.evaluate(field,r.elements[k].L)/Models.reference.W;
      assert.equal(draft.fraction(value),'13/16');
    }
  }
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

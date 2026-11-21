const test = require('node:test');
const assert = require('node:assert/strict');
const {attach} = require('../src/navigation');

function canvas(handActive = true) {
  const view = {width: 800, height: 450, ox: 90, oy: 300, scale: 50, fitScale: 50};
  const handlers = new Map();
  const svg = {
    createSVGPoint() { return {matrixTransform() { return this; }}; },
    getScreenCTM() { return {inverse() { return {}; }}; },
    addEventListener(type, fn) { handlers.set(type, fn); },
    setPointerCapture() {},
    classList: {add() {}, remove() {}}
  };
  const nav = attach(svg, () => view, () => handActive, () => {});
  function send(type, id, x, y, extra = {}) {
    handlers.get(type)({target: svg, pointerId: id, clientX: x, clientY: y, button: 0,
                        preventDefault() {}, ...extra});
  }
  const world = (x, y) => [(x - view.ox)/view.scale, (view.oy - y)/view.scale];
  return {view, world, nav, send};
}
function samePoint(actual, expected) {
  actual.forEach((v, i) => assert.ok(Math.abs(v-expected[i]) < 1e-10));
}

test('La mano trascina il punto della griglia e si ferma al rilascio', () => {
  const {world, send, view} = canvas();
  const initial = world(120,130);
  send('pointerdown',1,120,130);
  send('pointermove',1,182,98);
  samePoint(world(182,98),initial);
  send('pointerup',1,182,98);
  send('pointermove',1,210,120);
  samePoint(world(182,98),initial);
  assert.equal(view.scale,50);
});

test('Rotellina e lenti conservano rispettivamente il punto sotto il mouse e il centro', () => {
  const {world, send, nav, view} = canvas(false);
  const initial = world(200,150);
  send('pointerdown',1,200,150);
  send('pointermove',1,270,120);
  samePoint(world(200,150),initial);
  send('wheel',0,200,150,{deltaY:-80,deltaMode:0});
  assert.ok(view.scale>50);
  samePoint(world(200,150),initial);
  const central = world(400,225);
  nav.zoom(1.25);
  samePoint(world(400,225),central);
  nav.zoom(1e-8);
  assert.equal(view.scale,view.fitScale/32);
  nav.zoom(1e8);
  assert.equal(view.scale,view.fitScale*32);
  samePoint(world(400,225),central);
});

test('Il pinch combina traslazione e zoom e prosegue con il dito rimasto', () => {
  const {world, send, view} = canvas();
  const initial = world(150,90);
  send('pointerdown',1,100,90);
  send('pointerdown',2,200,90);
  send('pointermove',2,300,90);
  assert.equal(view.scale,100);
  samePoint(world(200,90),initial);
  send('pointercancel',2,300,90);
  send('pointermove',1,110,110);
  samePoint(world(210,110),initial);
  send('lostpointercapture',1,110,110);
  send('pointermove',1,0,0);
  samePoint(world(210,110),initial);
});

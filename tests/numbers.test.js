const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Models = require('../src/examples');
const Mechanics = require('../src/solver');

const context = vm.createContext({Models, Mechanics, Intl});
const numbers = vm.runInContext(fs.readFileSync(require.resolve('../src/numbers'), 'utf8') + '\nNumericDisplay', context);
const draft = vm.runInContext(fs.readFileSync(require.resolve('../src/drawing'), 'utf8') + '\nDraft', context);
const exam = number => Models.examples.find(m => m.title.startsWith('Tema ' + number + ' '));

test('Frazioni ricostruite dal calcolo e campi di inserimento', () => {
  numbers.learn(exam(1));
  assert.equal(numbers.fraction(-13 / 16), '-13/16');
  assert.equal(numbers.fraction(0.1 + 0.2), '3/10');
  assert.equal(numbers.fraction(57 / 16), '57/16');
  assert.equal(numbers.fraction(-4), '-4');
  assert.equal(numbers.inputFraction(0.48), '12/25');
  assert.equal(numbers.inputFraction(-1 / 3), '-1/3');
  assert.equal(numbers.parse('3/2'), 1.5);
  assert.equal(numbers.parse('1,5'), 1.5);
  assert.ok(Number.isNaN(numbers.parse('b/2')));
  assert.equal(numbers.decimal(-13 / 16), '-0,8125');
  // Not a simple fraction: shown as a decimal instead of a long ratio.
  assert.equal(numbers.fraction(Math.PI / 1000), '0,00314159265');
});

test('Lunghezze irrazionali: i risultati si scrivono con le radici', () => {
  assert.deepEqual([...numbers.learn(exam(1))], []);
  assert.deepEqual([...numbers.learn(exam(8))], []);  // 3-4-5 triangle: rational length
  assert.deepEqual([...numbers.learn(exam(13))], [5]);
  const root = Math.sqrt(5);
  assert.equal(numbers.fraction(root), '√5');
  assert.equal(numbers.fraction(-root / 4), '-√5/4');
  assert.equal(numbers.fraction(3 * root / 7), '3√5/7');
  assert.equal(numbers.fraction(1 / 2 + 3 * root / 4), '1/2+3√5/4');
  assert.equal(numbers.fraction(2 - root), '2-√5');
  assert.equal(numbers.fraction(-59 / 8), '-59/8');
  const diagonal = {nodes: [Models.node('A', 0, 0), Models.node('B', 1, 1)], members: [Models.beam('A', 'B')]};
  assert.deepEqual([...numbers.learn(diagonal)], [2]);
  assert.equal(numbers.fraction(Math.SQRT1_2), '√2/2');
});

test('Tema 13: normale e taglio dell’asta inclinata quotati con √5', () => {
  const model = exam(13), r = Mechanics.solve(model);
  numbers.learn(model);
  const draw = component => {
    const svg = {id: 'plot', setAttribute() {}};
    draft.draw(svg, model, draft.viewport(model.nodes, 620, 420), {result: r, state: r.final, component});
    return svg.innerHTML;
  };
  assert.match(draw('N'), />-√5\/4</);
  assert.match(draw('T'), />√5\/2</);
  assert.match(draw('M'), />43\/4</);
});

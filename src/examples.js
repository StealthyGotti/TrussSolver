// Models are written in the units of the exam sheets: lengths in b, forces in F,
// couples in W = Fb, distributed loads in q = F/b and stiffnesses in EJ.
const Models = (() => {
  const node = (id, x, y, support = 'free', loads = {}) =>
      ({id, x, y, support, fx: 0, fy: 0, m: 0, ...loads});
  // An a → b member is named ab on the sheets. Its dashed side is on the right of that direction.
  const beam = (a, b, data = {}) => ({
    a,
    b,
    type: 'beam',
    fiberSide: 'right',
    hi: false,
    hj: false,
    ea: 1000,
    ei: 1,
    qx: 0,
    qy: 0,
    eps: 0,
    kappa: 0,
    ...data
  });
  const firstExam = {
    title: 'Tema 1 · Telaio con biella AB',
    exercise: 'tema-1',
    ref: {b: 480, F: 1500},
    grid: 1 / 2,
    axial: false,
    // W_AE, the couple that node A applies to the end A of member AE.
    release: 'A/E/mi',
    nodes: [
      node('E', 0, 0, 'free', {fx: 2}), node('F', 2, 0), node('A', 0, 2, 'free', {fx: -3}),
      node('B', 2, 2), node('C', 0, 4), node('D', 1, 4), node('G', 2, 4, 'free', {fx: 1}),
      node('H', 1, 0, 'free', {m: 5})
    ],
    members: [
      beam('A', 'B', {type: 'bar', eps: -1}), beam('C', 'D', {hj: true}), beam('A', 'E', {hj: true}),
      beam('C', 'A'), beam('B', 'F', {hj: true}), beam('G', 'B'), beam('H', 'F'),
      beam('D', 'G', {qy: -7}), beam('E', 'H', {qy: 7})
    ]
  };
  return {node, beam, examples: [firstExam]};
})();
if (typeof module !== 'undefined')
  module.exports = Models;

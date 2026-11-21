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
  // Tema 2: carrello interno su piano inclinato in B, molla rotazionale in F, carichi su un lato del nodo.
  const inclinedRoller = {
    title: 'Tema 2 · Carrello inclinato e molla rotazionale',
    ref: {b: 510, F: 5610},
    grid: 1 / 2,
    axial: false,
    release: 'F/D/mi',
    nodes: [
      node('E', 0, 2, 'rollerX'), node('G', 1, 2), node('B', 2, 2), node('D', 0, 1, 'rollerX'),
      node('A', 2, 1, 'free', {m: -1}), node('F', 0, 0), node('C', 2, 0, 'rollerY')
    ],
    members: [
      beam('A', 'B', {fxJ: -1}), beam('C', 'A', {hi: true, eps: -1, fxI: -1}), beam('D', 'E', {hi: true}),
      beam('F', 'D', {hj: true, springI: 3}), beam('G', 'E'),
      beam('B', 'G', {qy: -1, hi: true, slideI: 'incl', slideIdx: 1, slideIdy: 1}), beam('A', 'D', {hj: true}),
      beam('C', 'F', {hi: true})
    ]
  };
  // Tema 11: pattini interni in C e in G, carico V_CB sul lato dell'asta, molla rotazionale in A.
  const internalSliders = {
    title: 'Tema 11 · Pattini interni e carico su un lato',
    ref: {b: 420, F: 780},
    grid: 1 / 2,
    axial: false,
    release: 'A/D/mi',
    nodes: [
      node('A', 0, 2), node('B', 2, 2), node('C', 3, 2), node('D', 0, 1, 'rollerX'), node('E', 2, 1),
      node('F', 1, 0, 'pin'), node('G', 2, 0), node('H', 3, 0)
    ],
    members: [
      beam('A', 'B', {qy: -1, springI: 4, hj: true}), beam('B', 'C', {hi: true, fyJ: -1}),
      beam('D', 'E', {mI: -1}), beam('F', 'G'), beam('G', 'H'), beam('A', 'D'),
      beam('B', 'E', {type: 'bar', eps: -1}), beam('C', 'H', {slideI: 'axis'}), beam('E', 'G', {qx: 1, slideJ: 'normal'})
    ]
  };
  return {node, beam, examples: [firstExam, inclinedRoller, internalSliders]};
})();
if (typeof module !== 'undefined')
  module.exports = Models;

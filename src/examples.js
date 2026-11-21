const Models = (() => {
  const node = (id, x, y, support = 'free', loads = {}) =>
      ({id, x, y, support, fx: 0, fy: 0, m: 0, ...loads});
  const beam = (a, b, data = {}) => ({
    a,
    b,
    type: 'beam',
    fiberSide: 'right',
    hi: false,
    hj: false,
    ea: 200000,
    ei: 20000,
    qx: 0,
    qy: 0,
    eps: 0,
    kappa: 0,
    ...data
  });
  const b = 0.48, F = 1.5, EJ = 1000;
  const q = F / b, W = F * b;
  const firstExam = {
    title: 'Tema 1 · Telaio con biella AB',
    exercise: 'tema-1',
    axial: false,
    // At the j end of E → A the nodal moment on the member is +M(L) = W_AE.
    release: 'E/A/mj',
    nodes: [
      node('E', 0, 0, 'free', {fx: 2 * F}), node('F', 2 * b, 0), node('A', 0, 2 * b, 'free', {fx: -3 * F}),
      node('B', 2 * b, 2 * b), node('C', 0, 4 * b), node('D', b, 4 * b),
      node('G', 2 * b, 4 * b, 'free', {fx: F}), node('H', b, 0, 'free', {m: 5 * W})
    ],
    members: [
      beam('A', 'B', {type: 'bar', eps: -b * b * F / EJ}), beam('C', 'D', {hj: true}),
      beam('E', 'A', {hi: true, fiberSide: 'left'}), beam('C', 'A'), beam('B', 'F', {hj: true}), beam('G', 'B'), beam('H', 'F'),
      beam('D', 'G', {qy: -7 * q}), beam('E', 'H', {qy: 7 * q})
    ].map(e => ({...e, ei: EJ}))
  };
  return {node, beam, reference: {b, F, EJ, q, W}, examples: [firstExam]};
})();
if (typeof module !== 'undefined')
  module.exports = Models;

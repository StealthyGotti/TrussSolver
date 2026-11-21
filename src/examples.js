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
  // Gives a node the letter it has on the exam sheet. Members, the chosen unknown and the section
  // follow the new name. Returns a message when the name cannot be used.
  function renameNode(model, from, to) {
    if (!/^[A-Za-z0-9_-]{1,14}$/.test(to))
      return 'Il nome usa da 1 a 14 lettere o cifre, senza spazi.';
    if (to === from)
      return '';
    if (model.nodes.some(n => n.id === to))
      return 'Esiste già un nodo con questo nome.';
    const node = model.nodes.find(n => n.id === from);
    if (!node)
      return 'Nodo non trovato.';
    const swap = id => id === from ? to : id;
    node.id = to;
    for (const e of model.members)
      Object.assign(e, {a: swap(e.a), b: swap(e.b)});
    // Unknowns are named r/node/component for reactions and a/b/kind for member actions.
    const parts = (model.release || '').split('/');
    if (parts.length === 3)
      model.release = (parts[0] === 'r' ? ['r', swap(parts[1]), parts[2]] : [swap(parts[0]), swap(parts[1]), parts[2]]).join('/');
    if (model.section)
      Object.assign(model.section, {from: swap(model.section.from), to: swap(model.section.to), at: swap(model.section.at)});
    return '';
  }
  const firstExam = {
    title: 'Tema 1 · Telaio con biella AB',
    ref: {b: 480, F: 1500},
    // Section of beam HF at H, lower edge on the dashed side: width profile in mm and quota of point *.
    section: {from: 'H', to: 'F', at: 'H', cut: 15, profile: [[0, 21], [14, 21], [14, 7], [50, 7], [50, 49], [63, 49]]},
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
    section: {from: 'D', to: 'E', at: 'E', cut: 13,
              profile: [[0, 24], [12, 24], [12, 12], [35, 12], [35, 48], [48, 48], [54, 0]]},
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
    section: {from: 'C', to: 'H', at: 'H', cut: 9, profile: [[0, 18], [5, 18], [5, 6], [48, 6], [48, 42], [53, 42]]},
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
  // Tema 8: doppio pendolo a terra in D, carrello con molla traslazionale in E, asta inclinata AB.
  const springSupport = {
    title: 'Tema 8 · Doppio pendolo e molla traslazionale',
    ref: {b: 250, F: 1240},
    section: {from: 'G', to: 'H', at: 'H', cut: 40, profile: [[0, 42], [12, 42], [12, 6], [41, 6], [41, 18], [53, 18]]},
    grid: 1,
    axial: false,
    release: 'B/C/mi',
    nodes: [
      node('A', 0, 3, 'rollerY'), node('B', 4, 0), node('C', 6, 0), node('D', 8, 0, 'sliderY'),
      node('E', 10, 0, 'rollerX', {kx: 4}), node('F', 6, 5, 'free', {m: -1}), node('G', 8, 5), node('H', 10, 5)
    ],
    members: [
      beam('A', 'B', {kappa: -1, fxI: 1}), beam('B', 'C'), beam('C', 'D'), beam('D', 'E', {hj: true}),
      beam('F', 'C', {hj: true}), beam('F', 'G', {hj: true}), beam('G', 'H'), beam('H', 'E', {qx: -1, hj: true})
    ]
  };
  // Tema 13: cedimento verticale imposto in I, carrello interno in F, asta inclinata FE lunga √5 b.
  const settlement = {
    title: 'Tema 13 · Cedimento imposto e asta inclinata',
    ref: {b: 340, F: 460},
    section: {from: 'B', to: 'G', at: 'G', cut: 8, profile: [[0, 18], [6, 18], [6, 6], [48, 6], [48, 42], [54, 42]]},
    grid: 1,
    axial: false,
    release: 'r/G/1',
    nodes: [
      node('A', 0, 1, 'free', {fy: 2}), node('B', 2, 1), node('C', 2, 2), node('D', 4, 2), node('E', 6, 2),
      node('F', 4, 1), node('G', 2, 0, 'rollerY'), node('H', 4, 0, 'rollerX', {m: 1}),
      node('I', 6, 1, 'pin', {uy: 3})
    ],
    members: [
      beam('A', 'B'), beam('B', 'C', {qx: 5, hi: true}), beam('C', 'D'), beam('D', 'E'),
      beam('F', 'E', {hi: true, slideI: 'incl', slideIdx: 1, slideIdy: 0}), beam('B', 'G'),
      beam('G', 'H', {kappa: 4}), beam('H', 'F'), beam('F', 'I')
    ]
  };
  return {node, beam, renameNode, examples: [firstExam, inclinedRoller, springSupport, internalSliders, settlement]};
})();
if (typeof module !== 'undefined')
  module.exports = Models;

/* Plane frames by the force method, in units of F, b and EJ. All element forces use one i → j axis. */
const Mechanics = (() => {
  const zeros = n => Array(n).fill(0);
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const fail = message => {
    throw new Error(message);
  };
  // Restrained components of each support: 0 = H, 1 = V, 2 = W. A double pendulum (slider)
  // blocks the rotation and one translation.
  const supportAxes =
      {free: [], pin: [0, 1], rollerY: [1], rollerX: [0], sliderY: [1, 2], sliderX: [0, 2], fixed: [0, 1, 2]};
  // Free relative translation of a member end: along the member, across it or along an inclined plane.
  const slideModes = {'': () => null, axis: (c, s) => [c, s], normal: (c, s) => [-s, c], incl: () => null};
  const axis = ['H', 'V', 'W'];
  const unit = ['F', 'F', 'Fb'];
  function geometry(model) {
    const {nodes, members} = model;
    if (!Array.isArray(nodes) || !Array.isArray(members) || !members.length)
      fail('Disegna almeno un’asta fra due nodi.');
    if (nodes.length > 120 || members.length > 200)
      fail('Il limite del banco è di 120 nodi e 200 aste.');
    const indices = new Map();
    for (const [i, n] of nodes.entries()) {
      if (typeof n.id !== 'string' || !/^[A-Za-z0-9_-]{1,14}$/.test(n.id) || indices.has(n.id))
        fail('Gli identificativi dei nodi devono essere univoci e alfanumerici.');
      if (![n.x, n.y, n.fx, n.fy, n.m].every(finite) || !Object.hasOwn(supportAxes, n.support))
        fail('Controlla coordinate, vincoli e carichi nodali.');
      if (![n.kx, n.ky, n.kr].every(k => k === undefined || (finite(k) && k >= 0)))
        fail('Le molle dei vincoli richiedono rigidezze positive. Il valore 0 indica un vincolo rigido.');
      const settled = [n.ux, n.uy, n.ur].map(u => u ?? 0);
      if (!settled.every(finite) || settled.some((u, d) => u && !supportAxes[n.support].includes(d)))
        fail('Un cedimento si assegna solo lungo una componente vincolata del nodo.');
      indices.set(n.id, i);
    }
    const pairs = new Set();
    const elements = members.map(e => {
      const i = indices.get(e.a), j = indices.get(e.b);
      if (i === undefined || j === undefined || i === j)
        fail('Ogni asta richiede due nodi distinti.');
      const key = [i, j].sort().join('/');
      if (pairs.has(key))
        fail('Due aste collegano la stessa coppia di nodi.');
      pairs.add(key);
      const dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y, L = Math.hypot(dx, dy);
      if (L < 1e-8)
        fail('Un’asta ha lunghezza nulla.');
      if (!['beam', 'bar'].includes(e.type) || ![e.ea, e.ei, e.qx, e.qy, e.eps, e.kappa].every(finite) ||
          e.ea <= 0 || e.ei <= 0)
        fail('Controlla carichi, deformazioni e rigidezze positive delle aste.');
      for (const [k, pin] of [[e.springI ?? 0, e.hi], [e.springJ ?? 0, e.hj]]) {
        if (!finite(k) || k < 0 || (k > 0 && (pin || e.type === 'bar')))
          fail('Una molla rotazionale richiede un estremo di trave senza cerniera e rigidezza positiva.');
      }
      if (e.type === 'bar' && (e.qx || e.qy || e.kappa))
        fail('La biella ammette carichi solo ai nodi e deformazione iniziale assiale.');
      const c = dx / L, s = dy / L;
      // Loads applied to the member side of each end connection: [H, V, W] at i and at j.
      const endLoads = [[e.fxI, e.fyI, e.mI], [e.fxJ, e.fyJ, e.mJ]].map(load => load.map(value => value ?? 0));
      if (!endLoads.flat().every(finite) || (e.type === 'bar' && endLoads.flat().some(Boolean)))
        fail('I carichi di estremità si assegnano alle travi con valori numerici.');
      // Unit vector along which an end may slide with respect to its node, or null.
      const sliding = (mode = '', sx, sy) => {
        if (!Object.hasOwn(slideModes, mode) || (mode && e.type === 'bar'))
          fail('Pattini e carrelli interni si assegnano agli estremi delle travi.');
        if (mode !== 'incl')
          return slideModes[mode](c, s);
        const norm = Math.hypot(sx, sy);
        if (!finite(norm) || norm < 1e-9)
          fail('Il piano di scorrimento inclinato richiede una direzione non nulla.');
        return [sx / norm, sy / norm];
      };
      return {
        ...e, i, j, L, c, s, name: e.a + '–' + e.b, key: e.a + '/' + e.b, endLoads,
        slides: [sliding(e.slideI, e.slideIdx, e.slideIdy), sliding(e.slideJ, e.slideJdx, e.slideJdy)]
      };
    });
    const connected = new Set([0]);
    for (let k = 0; k < nodes.length; k++)
      for (const e of elements) {
        if (connected.has(e.i) || connected.has(e.j)) {
          connected.add(e.i);
          connected.add(e.j);
        }
      }
    if (connected.size !== nodes.length)
      fail('Collega tutti i nodi in una sola struttura.');
    return elements;
  }

  // Gauss–Jordan elimination with prescribed column priority. Extra RHS columns
  // undergo the same row operations and directly give the particular solution.
  function reduce(matrix, count) {
    const rows = matrix.map(row => {
      const scale = Math.max(...row.slice(0, count).map(Math.abs)) || 1;
      return row.map(x => x / scale);
    });
    const pivots = [];
    for (let col = 0; col < count && pivots.length < rows.length; col++) {
      const k = pivots.length;
      let p = k;
      for (let r = k + 1; r < rows.length; r++)
        if (Math.abs(rows[r][col]) > Math.abs(rows[p][col]))
          p = r;
      if (Math.abs(rows[p][col]) < 1e-10)
        continue;
      [rows[k], rows[p]] = [rows[p], rows[k]];
      const divisor = rows[k][col];
      rows[k] = rows[k].map(v => v / divisor);
      for (let r = 0; r < rows.length; r++)
        if (r !== k) {
          const f = rows[r][col];
          if (f)
            rows[r] = rows[r].map((v, j) => v - f * rows[k][j]);
        }
      pivots.push(col);
    }
    return {rows, pivots};
  }
  function field(element, forces, real) {
    const {L, c, s} = element;
    const px = real ? c * element.qx + s * element.qy : 0;
    const py = real ? -s * element.qx + c * element.qy : 0;
    const t = (forces.mj - forces.mi) / L - py * L / 2;
    return {N: [forces.n, -px], T: [t, py], M: [forces.mi, t, py / 2]};
  }
  const evaluate = (poly, x) => poly.reduceRight((acc, coefficient) => acc * x + coefficient, 0);
  function integral(p, q, L) {
    let v = 0;
    p.forEach((a, i) => q.forEach((b, j) => {
      v += a * b * L ** (i + j + 1) / (i + j + 1);
    }));
    return v;
  }
  function solve(model) {
    const elements = geometry(model), {nodes} = model;
    // Rows: three equilibrium equations per node, then one equation per sliding release.
    const descriptors = [], loads = nodes.flatMap(n => [n.fx, n.fy, n.m]);
    const rowLabels = nodes.flatMap(n => ['ΣFx', 'ΣFy', 'ΣM'].map(t => n.id + ' · ' + t));
    const entry = (d, terms) => descriptors.push({...d, terms});
    for (const [k, e] of elements.entries()) {
      const {i, j, c, s, L} = e;
      const px = c * e.qx + s * e.qy, py = -s * e.qx + c * e.qy;
      // Coefficients of N, M(0) and M(L) in the rows. Each row equates minus the
      // forces that the unknowns apply to a node with the known loads on it.
      const basic = {
        n: [[3 * i, -c], [3 * i + 1, -s], [3 * j, c], [3 * j + 1, s]],
        mi: [[3 * i, s / L], [3 * i + 1, -c / L], [3 * j, -s / L], [3 * j + 1, c / L], [3 * i + 2, -1]],
        mj: [[3 * i, -s / L], [3 * i + 1, c / L], [3 * j, s / L], [3 * j + 1, -c / L], [3 * j + 2, 1]]
      };
      // Shear at the first end when the end moments vanish, under the uniform load.
      const v = -py * L / 2;
      e.slides.forEach((d, end) => {
        if (!d)
          return;
        // The force passed to the node has no component along the sliding direction.
        // At i it is N t − T(0) n, at j it is −N(L) t + T(L) n.
        const td = c * d[0] + s * d[1], nd = -s * d[0] + c * d[1], sign = end ? -1 : 1;
        // A load on the member side of the connection passes through it as well.
        const [fx, fy] = e.endLoads[end], row = loads.length;
        rowLabels.push(e.name + ' · scorrimento in ' + (end ? e.b : e.a));
        loads.push(v * nd - (end ? px * L * td : 0) - fx * d[0] - fy * d[1]);
        basic.n.push([row, sign * td]);
        basic.mi.push([row, sign * nd / L]);
        basic.mj.push([row, -sign * nd / L]);
      });
      // W_ab is the couple that the node applies to end a of member ab, positive counter-clockwise.
      // It equals −M(0) at the first end and +M(L) at the second one.
      const member = (kind, label, terms) =>
          entry({kind, k, id: e.key + '/' + kind, label, unit: kind === 'n' ? 'F' : 'Fb'}, terms);
      member('n', 'N_' + e.a + e.b, basic.n);
      // At a hinged end the moment balances the couple applied on the member side.
      e.hinged = {mi: -e.endLoads[0][2], mj: e.endLoads[1][2]};
      if (e.type === 'beam') {
        if (!e.hi)
          member('mi', 'W_' + e.a + e.b, basic.mi.map(([r, value]) => [r, -value]));
        if (!e.hj)
          member('mj', 'W_' + e.b + e.a, basic.mj);
        for (const kind of ['mi', 'mj'])
          if (kind === 'mi' ? e.hi : e.hj)
            for (const [r, value] of basic[kind])
              loads[r] -= value * e.hinged[kind];
      }
      // End loads reach the node through the connection.
      [i, j].forEach((n, end) => e.endLoads[end].forEach((value, d) => {
        loads[3 * n + d] += value;
      }));
      // Known end actions for zero basic forces, under a uniform global load.
      loads[3 * i] += s * v;
      loads[3 * i + 1] -= c * v;
      loads[3 * j] += c * px * L + s * v;
      loads[3 * j + 1] += s * px * L - c * v;
    }
    const floating = nodes.every(n => n.support === 'free');
    let gauge;
    if (floating) {
      // Remove only the three rigid-body modes. Artificial reactions must vanish.
      const a = nodes[0];
      let far = 1;
      nodes.forEach((n, i) => {
        if (Math.hypot(n.x - a.x, n.y - a.y) > Math.hypot(nodes[far].x - a.x, nodes[far].y - a.y))
          far = i;
      });
      gauge = [[0, 0], [0, 1], [far, Math.abs(nodes[far].x - a.x) > Math.abs(nodes[far].y - a.y) ? 1 : 0]];
    }
    function reaction(i, d, artificial) {
      const name = axis[d] + '_' + nodes[i].id;
      entry(
          {kind: 'r', k: i, d, id: 'r/' + nodes[i].id + '/' + d, label: name, unit: unit[d], artificial},
          [[3 * i + d, -1]]);
    }
    nodes.forEach((n, i) => supportAxes[n.support].forEach(d => reaction(i, d, false)));
    for (const [i, d] of gauge || [])
      reaction(i, d, true);
    const requested = model.release || '';
    if (requested && !descriptors.some(v => v.id === requested && !v.artificial))
      fail('Il rilascio scelto non appartiene più al modello.');
    const priority = v => v.artificial ? -1 : v.id === requested ? 3 : v.kind === 'r' ? 2 : 0;
    descriptors.sort((a, b) => priority(a) - priority(b));
    for (const d of descriptors) {
      d.col = zeros(loads.length);
      for (const [r, value] of d.terms)
        d.col[r] += value;
    }
    const count = descriptors.length, equations = [], labels = [];
    for (let r = 0; r < loads.length; r++) {
      const row = descriptors.map(v => v.col[r]);
      if (r < 3 * nodes.length && r % 3 === 2 && row.every(v => v === 0)) {
        if (Math.abs(loads[r]) > 1e-12)
          fail('Una coppia agisce su un nodo con sole cerniere.');
        continue;
      }
      equations.push([...row, loads[r]]);
      labels.push(rowLabels[r]);
    }
    const {rows, pivots} = reduce(equations, count);
    if (pivots.length < rows.length)
      fail('Struttura labile. Verifica vincoli, cerniere e collegamenti.');
    const free = descriptors.map((_, j) => j).filter(j => !pivots.includes(j));
    if (requested && !free.some(j => descriptors[j].id === requested))
      fail('Questo rilascio produce un meccanismo. Scegli un’altra incognita o la selezione automatica.');
    const base = zeros(count);
    pivots.forEach((j, r) => {
      base[j] = rows[r][count];
    });
    const services = free.map(j => {
      const v = zeros(count);
      v[j] = 1;
      pivots.forEach((p, r) => {
        v[p] = -rows[r][j];
      });
      return v;
    });
    if (floating &&
        descriptors.some(
            (d, j) => d.artificial && Math.abs(base[j]) > 1e-8 * Math.max(1, ...loads.map(Math.abs))))
      fail(
          'Corpo libero con carichi non autoequilibrati. Verifica risultante e momento dei carichi o aggiungi i vincoli.');
    function state(vector, real) {
      const end = elements.map(e => ({
        n: 0,
        mi: real && e.type === 'beam' && e.hi ? e.hinged.mi : 0,
        mj: real && e.type === 'beam' && e.hj ? e.hinged.mj : 0
      }));
      descriptors.forEach((d, j) => {
        if (d.kind !== 'r')
          end[d.k][d.kind] = d.kind === 'mi' ? -vector[j] : vector[j];
      });
      return {vector, end, fields: elements.map((e, k) => field(e, end[k], real))};
    }
    const primary = state(base, true), service = services.map(v => state(v, false));
    function work(u, v, initial) {
      return elements.map((e, k) => {
        const a = u.fields[k], b = v.fields[k];
        const bend = integral(a.M, b.M, e.L) / e.ei;
        const axial = model.axial ? integral(a.N, b.N, e.L) / e.ea : 0;
        const imposed = initial ? integral(a.N, [e.eps], e.L) + integral(a.M, [e.kappa], e.L) : 0;
        let spring = 0;
        if (e.springI)
          spring += u.end[k].mi * v.end[k].mi / e.springI;
        if (e.springJ)
          spring += u.end[k].mj * v.end[k].mj / e.springJ;
        return {bend, axial, imposed, spring, total: bend + axial + imposed + spring};
      });
    }
    // Elastic supports: the node moves by −R/k, so the work of the virtual reaction adds R'R/k.
    // Imposed settlements: the virtual reaction works on the given displacement, which adds −R'u.
    function supportWork(u, v, initial) {
      return descriptors.flatMap((d, j) => {
        if (d.kind !== 'r' || d.artificial)
          return [];
        const n = nodes[d.k], k = [n.kx, n.ky, n.kr][d.d] || 0, moved = [n.ux, n.uy, n.ur][d.d] || 0;
        if (!k && !moved)
          return [];
        const spring = k ? u.vector[j] * v.vector[j] / k : 0, settle = initial ? -u.vector[j] * moved : 0;
        return [{label: d.label, node: n.id, stiffness: k, moved, spring, settle, total: spring + settle}];
      });
    }
    const sum = terms => terms.reduce((s, t) => s + t.total, 0);
    const work0 = service.map(u => work(u, primary, true));
    const workX = service.map(u => service.map(v => work(u, v, false)));
    const support0 = service.map(u => supportWork(u, primary, true));
    const supportX = service.map(u => service.map(v => supportWork(u, v, false)));
    const delta = work0.map((terms, i) => sum(terms) + sum(support0[i]));
    const flexibility = workX.map((row, i) => row.map((terms, j) => sum(terms) + sum(supportX[i][j])));
    const system = flexibility.map((row, i) => [...row, -delta[i]]);
    const solution = reduce(system, free.length);
    if (solution.pivots.length !== free.length)
      fail('Compatibilità singolare. Attiva la deformabilità assiale e verifica le rigidezze.');
    const X = solution.rows.map(row => row[free.length]);
    const final = state(base.map((v, j) => services.reduce((a, s, i) => a + s[j] * X[i], v)), true);
    if (![...final.vector, ...delta, ...flexibility.flat()].every(finite))
      fail('Calcolo fuori scala. Controlla unità e valori inseriti.');
    return {
      elements,
      descriptors,
      equations,
      rowLabels: labels,
      free,
      primary,
      service,
      final,
      delta,
      flexibility,
      work0,
      workX,
      support0,
      supportX,
      X,
      floating
    };
  }
  // World unit vector along which end 0 or 1 of a model member slides, for a member directed along (c, s).
  function slideDirection(member, end, c, s) {
    const mode = (end ? member.slideJ : member.slideI) || '';
    if (member.type === 'bar' || !Object.hasOwn(slideModes, mode) || !mode)
      return null;
    if (mode !== 'incl')
      return slideModes[mode](c, s);
    const dx = end ? member.slideJdx : member.slideIdx, dy = end ? member.slideJdy : member.slideIdy;
    const norm = Math.hypot(dx, dy);
    return finite(norm) && norm > 1e-9 ? [dx / norm, dy / norm] : null;
  }
  return {solve, evaluate, supportAxes, slideDirection};
})();
if (typeof module !== 'undefined')
  module.exports = Mechanics;

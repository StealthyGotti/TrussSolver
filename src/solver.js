/* Plane frames by the force method. All element forces use one i → j axis. */
const Mechanics = (() => {
  const zeros = n => Array(n).fill(0);
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const fail = message => {
    throw new Error(message);
  };
  const supportAxes = {free: [], pin: [0, 1], rollerY: [1], rollerX: [0], fixed: [0, 1, 2]};
  const axis = ['H', 'V', 'C'];
  const unit = ['kN', 'kN', 'kN·m'];
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
      return {...e, i, j, L, c: dx / L, s: dy / L, name: e.a + '–' + e.b, key: e.a + '/' + e.b};
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
    const descriptors = [], loads = nodes.flatMap(n => [n.fx, n.fy, n.m]);
    const entry = (d, terms) => {
      const col = zeros(loads.length);
      for (const [r, v] of terms)
        col[r] += v;
      descriptors.push({...d, col});
    };
    for (const [k, e] of elements.entries()) {
      const {i, j, c, s, L} = e;
      const member = (kind, label, terms) => entry(
          {kind, k, id: e.key + '/' + kind, label: label + ' ' + e.name, unit: kind === 'n' ? 'kN' : 'kN·m'},
          terms);
      member('n', 'N', [[3 * i, -c], [3 * i + 1, -s], [3 * j, c], [3 * j + 1, s]]);
      if (e.type === 'beam') {
        const moments = [[3 * i, s / L], [3 * i + 1, -c / L], [3 * j, -s / L], [3 * j + 1, c / L]];
        if (!e.hi)
          member('mi', 'Mᵢ', [...moments, [3 * i + 2, -1]]);
        if (!e.hj)
          member('mj', 'Mⱼ', [...moments.map(([r, v]) => [r, -v]), [3 * j + 2, 1]]);
      }
      // Known end actions for zero basic forces, under a uniform global load.
      const px = c * e.qx + s * e.qy, py = -s * e.qx + c * e.qy;
      const v = -py * L / 2;
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
    const count = descriptors.length, equations = [], rowLabels = [];
    for (let r = 0; r < loads.length; r++) {
      const row = descriptors.map(v => v.col[r]);
      if (r % 3 === 2 && row.every(v => v === 0)) {
        if (loads[r] !== 0)
          fail('Una coppia agisce su un nodo con sole cerniere.');
        continue;
      }
      equations.push([...row, loads[r]]);
      rowLabels.push(nodes[Math.floor(r / 3)].id + ' · ' + ['ΣFx', 'ΣFy', 'ΣM'][r % 3]);
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
      const end = elements.map(() => ({n: 0, mi: 0, mj: 0}));
      descriptors.forEach((d, j) => {
        if (d.kind !== 'r')
          end[d.k][d.kind] = vector[j];
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
    const sum = terms => terms.reduce((s, t) => s + t.total, 0);
    const work0 = service.map(u => work(u, primary, true));
    const workX = service.map(u => service.map(v => work(u, v, false)));
    const delta = work0.map(sum), flexibility = workX.map(row => row.map(sum));
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
      rowLabels,
      free,
      primary,
      service,
      final,
      delta,
      flexibility,
      work0,
      workX,
      X,
      floating
    };
  }
  return {solve, evaluate, supportAxes};
})();
if (typeof module !== 'undefined')
  module.exports = Mechanics;

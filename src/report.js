// Presentation of a solved model, laid out as the solution sheets of the exams: internal actions,
// member reactions, equilibrium, the virtual work procedure and the section check.
const Report = (() => {
  const {esc} = Draft;
  // W_AB becomes W with subscript AB, as on the exam sheets.
  const name = text => esc(text).replace(/([A-Za-zα-ω])_([A-Za-z0-9,]+)/g, '$1<sub>$2</sub>');
  const table = (heads, rows, style = '') => `<div class="scroll"><table class="${style}"><thead><tr>${
      heads.map(x => '<th>' + name(x) + '</th>').join('')}</tr></thead><tbody>${
      rows.map(r => '<tr>' + r.map(x => '<td>' + name(x) + '</td>').join('') + '</tr>')
          .join('')}</tbody></table></div>`;
  const tabs = [
    ['diagrams', 'Azioni interne'], ['reactions', 'Reazioni'], ['equilibrium', 'Equilibrio'],
    ['plv', 'Lavori virtuali'], ['section', 'Sezione']
  ];
  const superscript = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷'];
  const power = (symbol, n) => n === 0 ? '' : symbol + (n === 1 ? '' : superscript[n] ?? '^' + n);
  const lengthOf = (value, fmt) => (Math.abs(value - 1) < 1e-12 ? '' : wrap(fmt(value))) + 'b';
  // A coefficient written as a sum, such as 1/2+3√5/4, needs brackets in front of a symbol.
  const wrap = text => /.[+-]/.test(text) ? '(' + text + ')' : text;

  // c F^f b^(m−k) x^k written as on the sheets: 11/4Fb, 1/4x²/b², 16bx, 11/16Fx²/b.
  // The sheets write the loaded moments with q = F/b: 7/2qx².
  // f is 0 for a pure number, 1 for the load F, or the symbol of an unknown such as X.
  function monomial(c, k, f, m, fmt, first, distributed = false) {
    let b = m - k, load = typeof f === 'string' ? f : f ? 'F' : '';
    if (distributed && f === 1 && b < 0) {
      load = 'q';
      b += 1;
    }
    const tail = load + (b > 0 ? power('b', b) : '') + power('x', k) + (b < 0 ? '/' + power('b', -b) : '');
    const size = Math.abs(c), number = tail && !tail.startsWith('/') && Math.abs(size - 1) < 1e-12 ? '' : wrap(fmt(size));
    return (c < 0 ? '-' : first ? '' : '+') + number + tail;
  }
  function polynomial(p, f, m, fmt, suffix = '', distributed = false) {
    const scale = Math.max(...p.map(Math.abs), 1e-300);
    const terms = p.map((c, k) => [c, k]).filter(([c]) => Math.abs(c) > 1e-11 * Math.max(1, scale));
    return terms.map(([c, k], n) => monomial(c, k, f, m, fmt, !n, distributed) + suffix).join('') || '0';
  }
  // Polynomial in the abscissa s of the report tables, with numeric coefficients.
  function plain(p, fmt) {
    const terms = p.map((v, i) => ({v, i})).filter(t => Math.abs(t.v) > 1e-12);
    return terms.map(({v, i}, k) => (v < 0 ? '− ' : k ? '+ ' : '') + (i && Math.abs(Math.abs(v) - 1) < 1e-12 ? '' : wrap(fmt(Math.abs(v)))) +
        power('s', i)).join(' ') || '0';
  }
  const product = (p, q) => {
    const out = Array(p.length + q.length - 1).fill(0);
    p.forEach((a, i) => q.forEach((b, j) => {
      out[i + j] += a * b;
    }));
    return out;
  };
  const primitive = p => [0, ...p.map((c, k) => c / (k + 1))];
  // The same moment read from the other end of the member: x → L − x, and the right-hand side swaps.
  function reversed(p, L) {
    const out = p.map(() => 0);
    p.forEach((c, k) => {
      for (let j = 0, binomial = 1; j <= k; binomial = binomial * (k - j) / (j + 1), j++)
        out[j] -= c * binomial * L ** (k - j) * (-1) ** j;
    });
    return out;
  }
  // Powers of b carried by an unknown: a couple leaves the service moments pure numbers, a force gives lengths.
  const order = d => d.unit === 'Fb' ? 0 : 1;
  const unitOf = (f, b, fmt) => (f ? 'F' : '') + power('b', b) + '/EJ';

  function release(d, model) {
    if (d.kind === 'r')
      return [
        'Libera la traslazione orizzontale', 'Libera la traslazione verticale', 'Libera la rotazione'
      ][d.d] +
          ' del nodo ' + model.nodes[d.k].id + '.';
    const e = model.members[d.k];
    if (d.kind === 'n')
      return e.type === 'bar' ?
          'Rimuovi la biella ' + e.a + e.b + ' e sostituiscila con il suo sforzo normale.' :
          'Consenti uno scorrimento assiale all’origine dell’asta ' + e.a + e.b + '.';
    const at = d.kind === 'mi' ? e.a : e.b, spring = d.kind === 'mi' ? e.springI : e.springJ;
    return (spring ? 'Scollega la molla rotazionale e lascia una cerniera' : 'Inserisci una cerniera') + ' all’estremo ' + at +
        ' dell’asta ' + e.a + e.b + '.';
  }
  function stateFor(r, stage) {
    return stage === 'final' ? r.final : stage === 'primary' ? r.primary : r.service[Number(stage)];
  }

  // Engineering values of the section check, written with decimals as on the exam sheets.
  const digits = (value, places) => new Intl.NumberFormat('it-IT', {maximumFractionDigits: places, useGrouping: false})
      .format(Math.abs(value) < 5 * 10 ** (-places - 1) ? 0 : value);
  function sectionSheet(model, h, fmt) {
    const s = model.section, {F, b} = model.ref, c = h.coefficients;
    const row = (symbol, value, unit, note = '') =>
        `<tr><td>${name(symbol)}</td><td>${note}</td><td>${value}</td><td>${unit}</td></tr>`;
    const stress = 'N/A − M<sub>x</sub> v/J<sub>u</sub>';
    return `<h3>Sezione ${esc(s.at)} della trave ${esc(s.from)}${esc(s.to)}</h3>
      <p>Azioni interne dal diagramma finale, con b = ${digits(b, 3)} mm e F = ${digits(F, 3)} N. Il lembo inferiore della sezione è sul lato tratteggiato, a destra andando da ${esc(s.from)} a ${esc(s.to)}. La quota y parte dal lembo inferiore, u e v sono gli assi baricentrici.</p>
      <div class="section-sheet"><div class="plot"><svg id="section-plot" aria-label="Sezione con assi baricentrici ed ellisse d’inerzia"></svg></div>
      <div class="scroll"><table class="values"><tbody>${
        row('A', digits(h.area, 1), 'mm²') + row('J_u', digits(h.inertia, 0), 'mm⁴') +
        row('J_v', digits(h.inertiaV, 0), 'mm⁴') + row('y_g', digits(h.centroid, 2), 'mm') +
        row('N', digits(h.n, 0), 'N', fmt(c.n) + ' F') + row('T_y', digits(h.t, 0), 'N', fmt(c.t) + ' F') +
        row('M_x', digits(h.m, 0), 'N·mm', fmt(c.m) + ' Fb') +
        row('x_m', digits(h.xMax, 2), 'mm') + row('y_m', digits(h.yMax, 2), 'mm') +
        row('u_m', digits(h.uMax, 2), 'mm') + row('v_m', digits(h.vMax, 2), 'mm') +
        row('σ_m', digits(h.maxStress, 1), 'N/mm²', stress) +
        row('x_c', digits(h.xCut, 2), 'mm') + row('y_c', digits(h.cut, 2), 'mm') + row('v_c', digits(h.vCut, 2), 'mm') +
        row('σ_c', digits(h.stress, 1), 'N/mm²', stress) +
        row('τ_c', Number(h.shear.toPrecision(4)).toLocaleString('it-IT'), 'N/mm²',
            '|T<sub>y</sub>| S* / (J<sub>u</sub> · ' + digits(h.web, 2) + ')') +
        row('σ_o', digits(h.vonMises, 1), 'N/mm²', '√(σ² + 3τ²)') + row('S*', digits(h.firstMoment, 0), 'mm³')
      }</tbody></table></div></div>
      <p class="help">σ<sub>m</sub> è la tensione normale di massimo valore assoluto, nel punto di quota y<sub>m</sub>. Nel punto * di quota y<sub>c</sub> si calcolano σ<sub>c</sub>, τ<sub>c</sub> e la tensione di von Mises σ<sub>o</sub>. S* è il momento statico rispetto all’asse u della parte di sezione oltre la corda per *.</p>`;
  }

  // Forces and couple that each node applies to the two ends of every member, in global axes:
  // H_AB, V_AB and W_AB act on member AB at A.
  function endActions(r, state) {
    return r.elements.map((e, k) => {
      const f = state.fields[k], real = !r.service.includes(state);
      const at = (poly, x) => Mechanics.evaluate(poly, x);
      return [0, 1].map(end => {
        const x = end ? e.L : 0, sign = end ? 1 : -1, load = real ? e.endLoads[end] : [0, 0, 0];
        const n = at(f.N, x), t = at(f.T, x), m = at(f.M, x);
        return {
          member: k, end, from: end ? e.b : e.a, to: end ? e.a : e.b,
          h: sign * (n * e.c + t * e.s) - load[0], v: sign * (n * e.s - t * e.c) - load[1], w: sign * m - load[2]
        };
      });
    });
  }

  // N, T and M of one member as functions of x, on the primary structure, on every service
  // structure (per unit of its unknown, written with the symbol X) and on the final one.
  function memberEquations(model, r, index, fmt, xi) {
    const k = Math.min(Math.max(index || 0, 0), r.elements.length - 1), e = r.elements[k];
    const unknowns = r.free.map(j => r.descriptors[j]), many = unknowns.length > 1;
    const field = (state, c) => Draft.diagramField(model.members[k], state.fields[k], c);
    // Powers of b of N, T and M: forces for loads, and X/b, X/b, X for an unknown couple.
    const row = (title, state, f, shift, note) => '<tr><td>' + title + '</td>' + ['N', 'T', 'M'].map((c, n) =>
        '<td>' + polynomial(field(state, c), f, shift + (n === 2 ? 1 : 0), fmt, '', f === 1) + '</td>').join('') +
        '<td class="note">' + note + '</td></tr>';
    const X = i => many ? xi(i) : 'X', value = i => X(i) + ' = ' + fmt(r.X[i]) + ' ' + unknowns[i].unit;
    const picker = '<select id="member-equations" aria-label="Asta di cui mostrare le equazioni">' +
        r.elements.map((m, n) => `<option value="${n}" ${n === k ? 'selected' : ''}>${
            esc((m.type === 'bar' ? 'Biella ' : 'Trave ') + m.a + m.b)}</option>`).join('') + '</select>';
    const sub = index => '<sub>' + index + '</sub>';
    return `<h3>Equazioni di un’asta</h3>
      <div class="result-bar equations-bar">${picker}<span class="subtext">${esc(e.a)} → ${esc(e.b)} · L = ${lengthOf(e.L, fmt)} · x parte da ${
        esc(e.a)}${e.type === 'bar' ? ' · la biella ha solo sforzo normale' : ''}</span></div>
      <div class="scroll"><table class="equations"><thead><tr><th>Struttura</th><th>N(x)</th><th>T(x)</th><th>M(x)</th><th></th></tr></thead><tbody>${
        row('Principale', r.primary, 1, 0, unknowns.length ? 'carichi assegnati, ' + unknowns.map((_, i) => X(i)).join(' = ') + ' = 0' : 'carichi assegnati') +
        unknowns.map((d, i) => row('Servizio' + (many ? ' ' + (i + 1) : ''), r.service[i], X(i), order(d) - 1,
            'effetto di ' + name(X(i) + ' = ' + d.label))).join('') +
        (unknowns.length ? row('Finale', r.final, 1, 0, unknowns.map((_, i) => value(i)).join(' · ')) : '')
      }</tbody></table></div>
      <p class="help">${unknowns.length ? 'La riga finale è la somma della principale e dei servizi con il valore dell’incognita: S = S' + sub('o') + ' + ' +
        unknowns.map((_, i) => X(i) + ' S' + sub(many ? i + 1 : 'x')).join(' + ') + '. ' : ''}N e T sono in F e M in Fb, con q = F/b. Il segno di M segue il tratteggio dell’asta.</p>`;
  }

  // Quadro contributi PLV of one unknown, with the rows of every member read from both ends.
  function workSheet(model, r, i, fmt, xi) {
    const unknowns = r.free.map(j => r.descriptors[j]), d = unknowns[i], oi = order(d);
    const curved = r.elements.some(e => e.kappa), many = unknowns.length > 1;
    const X = j => many ? xi(j) : 'X', M = index => 'M<sub>' + index + '</sub>';
    const mx = M(many ? i + 1 : 'x'), mo = M('o'), other = j => M(many ? j + 1 : 'x');
    const heads = ['→', mx + '(x)', mo + '(x)', ...(curved ? ['θ'] : []), mx + mo, ...(curved ? [mx + 'θ'] : []),
      ...unknowns.map((_, j) => mx + other(j)),
      curved ? '∫' + mx + '(' + mo + '/EJ+θ)dx' : '∫' + mx + mo + '/EJdx',
      ...unknowns.map((_, j) => '∫' + X(j) + mx + other(j) + '/EJdx')];
    const known = value => Math.abs(value) < 1e-12 ? '0' : fmt(value) + unitOf(1, 2 + oi);
    const flex = (value, j) => Math.abs(value) < 1e-12 ? '0' : fmt(value) + X(j) + power('b', 1 + oi + order(unknowns[j])) + '/EJ';
    let rows = '';
    r.elements.forEach((e, k) => {
      const mi = r.service[i].fields[k].M, m0 = r.primary.fields[k].M, w0 = r.work0[i][k];
      const curvature = Mechanics.integral(mi, [e.kappa], e.L), bend = w0.bend;
      const integral = curved ? (Math.abs(bend) + Math.abs(curvature) < 1e-12 ? '0+0' :
          '(' + fmt(bend) + (curvature < 0 ? '' : '+') + fmt(curvature) + ')' + unitOf(1, 2 + oi)) : known(bend);
      const both = [[e.a + e.b, mi, m0, e.kappa, 1], [e.b + e.a, reversed(mi, e.L), reversed(m0, e.L), -e.kappa, -1]];
      both.forEach(([tag, a, b, theta, way], n) => {
        const c = [
          polynomial(a, 0, oi, fmt), polynomial(b, 1, 1, fmt, '', true),
          ...(curved ? [polynomial([theta], 1, 1, fmt, '/EJ')] : []),
          polynomial(product(a, b), 1, 1 + oi, fmt),
          ...(curved ? [polynomial(product(a, [theta]), 1, 1 + oi, fmt, '/EJ')] : []),
          ...unknowns.map((u, j) => {
            const mj = r.service[j].fields[k].M;
            return polynomial(product(a, way > 0 ? mj : reversed(mj, e.L)), 0, oi + order(u), fmt);
          })
        ];
        rows += '<tr' + (n ? ' class="pair"' : '') + '><td>' + name(tag) + ' ' + lengthOf(e.L, fmt) + '</td>' +
            c.map(t => '<td>' + name(t) + '</td>').join('') +
            (n ? '' : '<td rowspan="2" class="sum">' + name(integral) + '</td>' +
                 unknowns.map((_, j) => '<td rowspan="2" class="sum">' + name(flex(r.workX[i][j][k].bend, j)) + '</td>').join('')) +
            '</tr>';
      });
    });
    const span = heads.length - 1 - unknowns.length - 1;
    const extra = (tag, text, delta, flexes) => {
      rows += '<tr class="extra"><td>' + name(tag) + '</td><td colspan="' + span + '">' + text + '</td><td class="sum">' +
          name(delta) + '</td>' + flexes.map(t => '<td class="sum">' + name(t) + '</td>').join('') + '</tr>';
    };
    const blank = value => Math.abs(value) < 1e-12 ? '' : known(value);
    const blankFlex = (value, j) => Math.abs(value) < 1e-12 ? '' : flex(value, j);
    const first = many ? String(i + 1) : '1';
    r.elements.forEach((e, k) => {
      const w0 = r.work0[i][k], tag = e.a + e.b, sub = t => '<sub>' + esc(t) + '</sub>';
      const stretch = e.eps ? Mechanics.integral(r.service[i].fields[k].N, [e.eps], e.L) : 0;
      if (Math.abs(stretch) > 1e-12)
        extra(tag, 'elongazione asta N' + sub(first + tag) + 'ε' + sub(tag) + 'L' + sub(tag), known(stretch), unknowns.map(() => ''));
      if (r.workX[i].some(row => Math.abs(row[k].axial) > 1e-12) || Math.abs(w0.axial) > 1e-12)
        extra(tag, 'deformabilità assiale ∫N' + sub(first + tag) + '(N' + sub('o' + tag) + '+XN' + sub('x' + tag) + ')/EA dx',
              blank(w0.axial), unknowns.map((_, j) => blankFlex(r.workX[i][j][k].axial, j)));
      if (e.springI || e.springJ)
        extra(tag, 'molla asta W' + sub(first + tag) + '(W' + sub('o' + tag) + '+XW' + sub('x' + tag) + ')/k' + sub(tag),
              blank(w0.spring), unknowns.map((_, j) => blankFlex(r.workX[i][j][k].spring, j)));
    });
    r.support0[i].forEach((p, n) => {
      const symbol = p.label.replace('_', '<sub>' + first) + '</sub>', sub = '<sub>' + esc(p.node) + '</sub>';
      if (p.stiffness)
        extra(p.node, 'molla del vincolo ' + symbol + '(' + name(p.label.replace('_', '_o')) + '+X' + name(p.label.replace('_', '_x')) + ')/k' + sub,
              blank(p.spring), unknowns.map((_, j) => blankFlex(r.supportX[i][j][n].spring, j)));
      if (p.moved)
        extra(p.node, 'cedimento nodo −' + symbol + ' ' + ['u', 'v', 'φ']['HVW'.indexOf(p.label[0])] + sub, known(p.settle), unknowns.map(() => ''));
    });
    extra('', 'totali', known(r.delta[i]), unknowns.map((_, j) => flex(r.flexibility[i][j], j)));
    extra('', 'iperstatica ' + name(X(i) + '=' + d.label), fmt(r.X[i]) + d.unit, unknowns.map(() => ''));
    return `<h3>Quadro contributi PLV per iperstatica ${name(X(i) + '=' + d.label)}</h3>
      <div class="scroll"><table class="quadro"><thead><tr>${heads.map(t => '<th>' + t + '</th>').join('')}</tr></thead><tbody>${
        rows}</tbody></table></div>`;
  }
  // Sviluppi di calcolo: every non-zero integral of the sheet, with its primitive.
  function developments(r, i, fmt, xi) {
    const unknowns = r.free.map(j => r.descriptors[j]), oi = order(unknowns[i]), many = unknowns.length > 1;
    const limits = L => '<sub>0</sub><sup>' + lengthOf(L, fmt) + '</sup>';
    const line = (tag, index, integrand, f, m, factor, value, unit) =>
        'L<sup>' + index + '</sup><sub>' + esc(tag) + '</sub> = ∫' + limits(integrand.L) + ' (' +
        polynomial(integrand.p, f, m, fmt) + ') ' + factor + ' dx = [' + polynomial(primitive(integrand.p), f, m + 1, fmt) + ']' +
        limits(integrand.L) + ' ' + factor + ' = ' + fmt(value) + unit;
    const lines = [];
    r.elements.forEach((e, k) => {
      const mi = r.service[i].fields[k].M, tag = e.a + e.b, stiff = Math.abs(e.ei - 1) < 1e-12 ? '1/EJ' : '1/(' + fmt(e.ei) + 'EJ)';
      unknowns.forEach((u, j) => {
        const value = r.workX[i][j][k].bend;
        if (Math.abs(value) > 1e-12)
          lines.push(line(tag, many ? (i + 1) + '' + (j + 1) : 'XX', {p: product(mi, r.service[j].fields[k].M), L: e.L}, 0,
                          oi + order(u), stiff, value, power('b', 1 + oi + order(u)) + '/EJ'));
      });
      const bend = r.work0[i][k].bend, curvature = Mechanics.integral(mi, [e.kappa], e.L);
      if (Math.abs(bend) > 1e-12)
        lines.push(line(tag, many ? (i + 1) + 'o' : 'Xo', {p: product(mi, r.primary.fields[k].M), L: e.L}, 1, 1 + oi, stiff, bend,
                        unitOf(1, 2 + oi)));
      if (Math.abs(curvature) > 1e-12)
        lines.push(line(tag, many ? (i + 1) + 'θ' : 'Xθ', {p: mi, L: e.L}, 0, oi, 'θ<sub>' + esc(tag) + '</sub>', curvature,
                        unitOf(1, 2 + oi)));
    });
    return lines.length ? '<div class="formula developments">' + lines.join('<br>') + '</div>' : '';
  }

  function render(host, model, r, ui, onChange) {
    const fmt = ui.decimals ? NumericDisplay.decimal : NumericDisplay.fraction;
    const section = CrossSection.evaluate(model, r);
    const available = tabs.filter(([key]) => key !== 'section' || section);
    if (!available.some(([key]) => key === ui.tab)) ui.tab = 'diagrams';
    const unknowns = r.free.map(j => r.descriptors[j]);
    const xi = i => 'X' + String(i + 1);
    const card = unknowns.length ? unknowns.map((d,i)=>
      `<div class="result-card"><div class="cap">Incognita iperstatica ${unknowns.length > 1 ? xi(i) : 'X'} = ${name(d.label)}</div>
        <div class="big">${fmt(r.X[i])} <small>${d.unit}</small></div></div>`
    ).join('') : '<div class="result-card"><div class="cap">Struttura isostatica</div><strong>Soluzione dall’equilibrio</strong></div>';
    const stageNames = [
      ['final', 'Struttura finale'], ['primary', 'Struttura principale'],
      ...unknowns.map((d, i) => [String(i), 'Servizio ' + (unknowns.length > 1 ? (i + 1) + ' · ' : '· ') + d.label.replace('_', ' ') + ' = 1'])
    ];
    const state = stateFor(r, ui.stage), comp = ui.comp, units = comp === 'M' ? 'Fb' : 'F';
    const components = ['N','T','M'];
    const names = {all:'Tutti', N:'N · Normale', T:'T · Taglio', M:'M · Momento'};
    const shown = comp==='all' ? components : [comp];
    const nav = `<div class="result-nav">${
        available.map(([key, title]) => `<button data-tab="${key}" class="${ui.tab === key ? 'on' : ''}">${title}</button>`)
            .join('')}</div>`;
    const stateSelect = `<select id="report-stage" aria-label="Struttura da analizzare">${
        stageNames.map(([v, t]) => `<option value="${v}" ${ui.stage === v ? 'selected' : ''}>${esc(t)}</option>`)
            .join('')}</select>`;
    const stageInfo = ui.stage === 'final' ?
        'Azioni interne dopo la sovrapposizione.' :
        ui.stage === 'primary' ?
        'Carichi assegnati sul sistema rilasciato. Tutte le incognite iperstatiche valgono zero.' :
        `Sistema rilasciato con ${unknowns[+ui.stage].label} = +1 ${
            unknowns[+ui.stage].unit}. Tutte le altre incognite e i carichi assegnati valgono zero.`;
    const plots = [];
    const plot = (id, options, caption = '', wide = false) => {
      plots.push([id, options]);
      return `<figure class="plot ${wide || r.elements.length > 5 ? 'complex' : ''}"><svg id="${id}"></svg>${
          caption ? '<figcaption>' + caption + '</figcaption>' : ''}</figure>`;
    };
    let body = '';
    if (ui.tab === 'diagrams') {
      const sections = r.elements.map((e, i) => {
        const field = c => Draft.diagramField(model.members[i],state.fields[i],c);
        if (comp==='all') return [e.a + e.b,lengthOf(e.L, fmt),...components.map(c=>plain(field(c), fmt))];
        const p = field(comp), ord = Draft.ordinates(p, e.L);
        return [
          e.a + e.b, lengthOf(e.L, fmt), plain(p, fmt), fmt(ord[0][1]), fmt(ord[1][1]),
          ord.length > 2 ? fmt(ord[2][1]) + ' in s = ' + fmt(ord[2][0]) : '—'
        ];
      });
      const controls = ['all',...components].map(c=>
        `<button class="${c===comp?'active':''}" aria-pressed="${c===comp}" data-comp="${c}">${names[c]}</button>`
      ).join('');
      const heads = comp==='all' ? ['Asta','L','N(s) [F]','T(s) [F]','M(s) [Fb]'] :
        ['Asta','L',comp+'(s) ['+units+']',comp+'(0)',comp+'(L)','Estremo interno'];
      body = `<div class="result-bar">${stateSelect}<div class="seg" aria-label="Azione interna">${controls}</div></div>
        <div class="${comp==='all'?'diagram-sheet':'result-grid'}">${
          shown.map(c => plot('result-plot-' + c, {state, component: c, showLoads: ui.showLoads, reduced: ui.stage !== 'final'})).join('')
        }<div class="diagram-notes">${card}
        <p class="subtext">${name(stageInfo)}</p><label class="check"><input id="show-loads" type="checkbox" ${ui.showLoads?'checked':''}> Mostra i carichi sullo schema</label>
        <p class="help">Diagrammi in multipli di F per normale e taglio e di Fb per il momento. Le ordinate positive sono disegnate sul lato tratteggiato. Nel diagramma M la curva si trova sul lato delle fibre tese.</p></div></div>
        ${memberEquations(model, r, ui.member, fmt, xi)}
        <details ${comp==='all'?'':'open'}><summary>Equazioni e valori di tutte le aste · ${esc(stageNames.find(([v]) => v === ui.stage)[1])}</summary>${table(heads,sections)}
        <p class="subtext">Ascissa s in unità di b dal primo al secondo nodo dell’asta. I segni di M(s) seguono il tratteggio scelto per ciascuna asta.</p></details>`;
    } else if (ui.tab === 'reactions') {
      const reactions = r.descriptors.flatMap(
          (d, i) => d.kind === 'r' && !d.artificial && (ui.stage === 'final' || !r.free.includes(i)) ?
              [[d.label, fmt(state.vector[i]) + ' ' + d.unit]] : []);
      const value = (v, unit) => Math.abs(v) < 1e-12 ? '0' : fmt(v) + ' ' + unit;
      const ends = endActions(r, state).flat().map(a => [
        a.from + a.to, a.from, value(a.h, 'F'), value(a.v, 'F'), value(a.w, 'Fb')
      ]);
      body = `<div class="result-bar">${stateSelect}</div>
        <div class="result-grid reactions">${plot('reactions-plot', {state, exploded: true}, '', true)}<div class="diagram-notes">${card}
        <p class="subtext">${name(stageInfo)}</p>
        <p class="help">Ogni asta è isolata dai nodi. Le frecce mostrano le forze e le coppie che i nodi le trasmettono, con il loro verso effettivo e il valore in multipli di F e di Fb.</p>
        <h4>Reazioni vincolari</h4>${reactions.length ? table(['Componente', 'Valore'], reactions) : '<p class="subtext">Corpo libero in equilibrio.</p>'}
        </div></div>
        <details><summary>Azioni dei nodi sulle aste</summary>${
          table(['Asta', 'Estremo', 'H → [F]', 'V ↑ [F]', 'W ↺ [Fb]'], ends)}
        <p class="subtext">H_AB, V_AB e W_AB agiscono sull’asta AB nell’estremo A, positive verso destra, verso l’alto e in senso antiorario.</p></details>`;
    } else if (ui.tab === 'section') {
      body = sectionSheet(model, section, fmt);
    } else if (ui.tab === 'equilibrium') {
      body = `<h3>Equilibrio ai nodi</h3><p>Per ogni nodo si impongono ΣFₓ = 0, ΣFᵧ = 0 e, se trasmette coppie, ΣM = 0. Le incognite d’asta sono lo sforzo normale N<sub>AB</sub> = N(0) e le coppie di estremità W<sub>AB</sub> = −M(0) e W<sub>BA</sub> = M(L), positive se antiorarie sull’asta. Agli estremi incernierati il momento vale zero. Ogni pattino o carrello interno aggiunge l’equazione che annulla la forza trasmessa lungo lo scorrimento.</p>
      <div class="formula">N(s) = N(0) − p s<br>T(0) = [M(L) − M(0)] / L − q L / 2<br>T(s) = T(0) + q s<br>M(s) = M(0) + T(0) s + q s² / 2</div>
      <p class="subtext">p e q sono qui le componenti del carico distribuito lungo l’asta e di traverso. Il momento locale è positivo con fibre tese a destra andando dal primo al secondo nodo.</p>
      <h3>Sistema assemblato</h3><p>${r.rowLabels.length} equazioni indipendenti e ${
          r.descriptors.length} incognite. Grado di iperstaticità <strong>${r.free.length}</strong>.</p>${
          r.floating ?
              '<p class="help">Per il corpo libero si fissano tre moti rigidi di riferimento. Le tre reazioni ausiliarie, indicate con *, sono nulle.</p>' :
              ''}
      ${
          table(
              ['Equazione', ...r.descriptors.map(d => d.label + (d.artificial ? '*' : '')), 'Termine noto'],
              r.equations.map((row, i) => [r.rowLabels[i], ...row.map(fmt)]))}
      <h3>Soluzioni dei sistemi statici</h3><p class="help">Principale: carichi reali con X = 0. In ogni servizio si annullano i carichi reali e si assegna +1 alla corrispondente incognita.</p>
      ${
          table(
              [
                'Incognita', 'Unità', 'Principale', ...unknowns.map((_, i) => 'Servizio ' + (i + 1)), 'Finale'
              ],
              r.descriptors.map(
                  (d, i) =>
                      [d.label + (d.artificial ? '*' : ''), d.unit,
                       ...[r.primary, ...r.service, r.final].map(s => fmt(s.vector[i]))]))}`;
    } else if (!unknowns.length) {
      body =
          '<h3>Struttura isostatica</h3><p>Le equazioni di equilibrio determinano tutte le reazioni e le azioni interne. La struttura principale coincide con quella finale.</p>';
    } else {
      const many = unknowns.length > 1, X = i => many ? xi(i) : 'X';
      const choices = unknowns.map((d, i) => `<li><strong>${name(X(i) + ' = ' + d.label)}</strong> · ${esc(release(d, model))}</li>`).join('');
      body = `<h3>Schema di calcolo iperstatico</h3><ul class="choices">${choices}</ul>
        <div class="diagram-sheet">${
          plot('plv-scheme', {schema: true, reduced: true}, 'Schema di calcolo iperstatico') +
          plot('plv-primary', {state: r.primary, component: 'M', reduced: true}, 'M<sub>o</sub> flessione da carichi assegnati') +
          unknowns.map((d, i) => plot('plv-service-' + i, {state: r.service[i], component: 'M', reduced: true},
              'M<sub>' + (many ? i + 1 : 'x') + '</sub> flessione da iperstatica ' + X(i) + '=1')).join('')}</div>
        <p class="help">Il lavoro virtuale del servizio misura lo spostamento relativo lungo il rilascio, che nella struttura reale è nullo: δ<sub>o</sub> + Σ f X = 0. ${
          model.axial ? 'Deformabilità assiale e flessionale attive.' : 'Si trascura la deformabilità assiale elastica.'} I momenti sono positivi con fibre tese a destra percorrendo l’asta nel verso della freccia →, e l’ascissa x parte dalla prima lettera.</p>
        ${unknowns.map((_, i) => workSheet(model, r, i, fmt, xi) +
            '<details open><summary>Sviluppi di calcolo iperstatica' + (many ? ' ' + xi(i) : '') + '</summary>' + developments(r, i, fmt, xi) + '</details>').join('')}
        <h3>Soluzione e sovrapposizione</h3><div class="formula">${
          r.flexibility.map((row, i) => fmt(r.delta[i]) + row.map((v, j) => (v < 0 ? ' − ' : ' + ') + fmt(Math.abs(v)) + ' ' + X(j)).join('') + ' = 0').join('<br>')}<br>${
          r.X.map((x, j) => name(X(j) + ' = ' + unknowns[j].label) + ' = ' + fmt(x) + ' ' + unknowns[j].unit).join(' · ')}</div>
        <p>Per ciascuna azione S ∈ {N, T, M} il diagramma finale si ottiene da S = S<sub>o</sub> + Σ X S<sub>x</sub>.</p>`;
    }
    host.innerHTML = nav + '<div class="report-body">' + body + '</div>';
    host.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => onChange({tab: b.dataset.tab}));
    host.querySelectorAll('[data-comp]').forEach(b => b.onclick = () => onChange({comp: b.dataset.comp}));
    const select = host.querySelector('#report-stage');
    if (select)
      select.onchange = () => onChange({stage: select.value});
    const member = host.querySelector('#member-equations');
    if (member)
      member.onchange = () => onChange({member: Number(member.value)});
    const overlay = host.querySelector('#show-loads');
    if (overlay)
      overlay.onchange = () => onChange({showLoads: overlay.checked});
    const sectionPlot = host.querySelector('#section-plot');
    if (sectionPlot && section)
      Draft.section(sectionPlot, model.section, section, sectionPlot.clientWidth || 360, sectionPlot.clientHeight || 330);
    for (const [id, options] of plots) {
      const svg = host.querySelector('#' + id), w = Math.max(220, svg.clientWidth), h = svg.clientHeight || 300;
      if (options.exploded)
        Draft.reactions(svg, model, r, endActions(r, options.state), w, h, ui.decimals);
      else
        Draft.draw(svg, model, Draft.viewport(model.nodes, w, h, Boolean(options.schema)), {result: r, decimals: ui.decimals, ...options});
    }
  }
  return {render, endActions, polynomial, reversed};
})();
if (typeof module !== 'undefined')
  module.exports = Report;

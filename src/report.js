const Report = (() => {
  const {esc} = Draft;
  // W_AB becomes W with subscript AB, as on the exam sheets.
  const name = text => esc(text).replace(/([A-Za-zα-ω])_([A-Za-z0-9,]+)/g, '$1<sub>$2</sub>');
  const table = (heads, rows) => `<div class="scroll"><table><thead><tr>${
      heads.map(x => '<th>' + name(x) + '</th>').join('')}</tr></thead><tbody>${
      rows.map(r => '<tr>' + r.map(x => '<td>' + name(x) + '</td>').join('') + '</tr>')
          .join('')}</tbody></table></div>`;
  function poly(p, fmt) {
    const terms = p.map((v, i) => ({v, i})).filter(t => Math.abs(t.v) > 1e-12);
    return terms
               .map(
                   ({v, i}, k) => (v < 0 ? '− ' :
                                       k ? '+ ' :
                                           '') +
                       (i && Math.abs(v) === 1 ? '' : fmt(Math.abs(v))) +
                       (['', 's', 's²', 's³', 's⁴', 's⁵'][i] ?? ('s^' + i)))
               .join(' ') ||
        '0';
  }
  function workedIntegral(model, r, ui, fmt) {
    const index = Math.min(ui.workElement ?? 0, r.elements.length - 1);
    const i = Math.min(ui.workService ?? 0, r.service.length - 1);
    const j = Math.min(ui.workPartner ?? -1, r.service.length - 1);
    const e = r.elements[index], a = r.service[i].fields[index],
          b = (j < 0 ? r.primary : r.service[j]).fields[index];
    const p = [0, 0, 0, 0, 0], products = [];
    function product(left, right, factor, denominator) {
      if (!left.some(x => x !== 0) || !right.some(x => x !== 0))
        return;
      left.forEach((v, k) => right.forEach((w, h) => {
        p[k + h] += v * w * factor;
      }));
      products.push('(' + poly(left, fmt) + ') · (' + poly(right, fmt) + ')' + denominator);
    }
    product(a.M, b.M, 1 / e.ei, ' / ' + fmt(e.ei));
    if (model.axial)
      product(a.N, b.N, 1 / e.ea, ' / ' + fmt(e.ea));
    if (j < 0) {
      product(a.N, [e.eps], 1, '');
      product(a.M, [e.kappa], 1, '');
    }
    const primitive = [0, ...p.map((v, k) => v / (k + 1))];
    const term = (j < 0 ? r.work0[i] : r.workX[i][j])[index];
    function picker(id, label, items, current) {
      return '<label>' + label + ' <select id="' + id + '">' +
          items
              .map(
                  ([v, t]) => '<option value="' + v + '" ' + (v === current ? 'selected' : '') + '>' +
                      esc(t) + '</option>')
              .join('') +
          '</select></label>';
    }
    const services = r.free.map((_, k) => [k, 'Servizio ' + (k + 1)]);
    return '<h3>Integrale di una singola asta</h3><div class="result-bar">' +
        picker('work-element', 'Asta', r.elements.map((e, k) => [k, e.name]), index) +
        picker('work-service', 'Sistema virtuale', services, i) +
        picker('work-partner', 'Secondo sistema', [[-1, 'Principale'], ...services], j) +
        '</div><div class="formula">g(s) = ' + (products.join(' + ') || '0') + '<br>g(s) = ' + poly(p, fmt) +
        '<br>∫₀ᴸ g(s) ds = [' + poly(primitive, fmt) + '] da 0 a ' + fmt(e.L) + ' = ' +
        fmt(term.total - term.spring) +
        (term.spring ? '<br>Contributo con la molla = ' + fmt(term.total - term.spring) + ' + (' +
                 fmt(term.spring) + ') = ' + fmt(term.total) :
                       '') +
        '</div>';
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
  function release(d, model) {
    if (d.kind === 'r')
      return [
        'Libera la traslazione orizzontale', 'Libera la traslazione verticale', 'Libera la rotazione'
      ][d.d] +
          ' del nodo ' + model.nodes[d.k].id + '.';
    const e = model.members[d.k];
    if (d.kind === 'n')
      return e.type === 'bar' ?
          'Rimuovi la biella ' + e.a + '–' + e.b + ' e sostituiscila con la sua azione assiale.' :
          'Consenti uno scorrimento assiale all’origine dell’asta ' + e.a + '–' + e.b + '.';
    return 'Inserisci una cerniera all’estremo ' + (d.kind === 'mi' ? e.a : e.b) + ' dell’asta ' + e.a + '–' +
        e.b + '.';
  }
  function stateFor(r, stage) {
    return stage === 'final' ? r.final : stage === 'primary' ? r.primary : r.service[Number(stage)];
  }
  function render(host, model, r, ui, onChange) {
    const fmt = ui.decimals ? NumericDisplay.decimal : NumericDisplay.fraction;
    const tabs = ['Diagrammi', 'Equilibrio', 'Lavori virtuali'];
    const section = CrossSection.evaluate(model, r);
    if (section) tabs.push('Sezione');
    if (ui.tab>=tabs.length) ui.tab=0;
    const unknowns = r.free.map(j => r.descriptors[j]);
    const xi = i => 'X' + String(i + 1);
    const card = unknowns.length ? unknowns.map((d,i)=>{
      return `<div class="result-card"><div class="cap">Incognita iperstatica ${xi(i)} = ${name(d.label)}</div>
        <div class="big">${fmt(r.X[i])} <small>${d.unit}</small></div></div>`;
    }).join('') : '<div class="result-card"><div class="cap">Struttura isostatica</div><strong>Soluzione dall’equilibrio</strong></div>';
    const stageNames = [
      ['final', 'Struttura finale'], ['primary', 'Struttura principale'],
      ...unknowns.map((_, i) => [String(i), 'Servizio ' + (i + 1)])
    ];
    const state = stateFor(r, ui.stage), comp = ui.comp, units = comp === 'M' ? 'Fb' : 'F';
    const components = ['N','T','M'];
    const names = {all:'Tutti', N:'N · Normale', T:'T · Taglio', M:'M · Momento'};
    const shown = comp==='all' ? components : [comp];
    const nav = `<div class="result-nav">${
        tabs.map((t, i) => `<button data-tab="${i}" class="${ui.tab === i ? 'on' : ''}">${t}</button>`)
            .join('')}</div>`;
    const coordinate =
        'Ascissa s in unità di b dal primo al secondo nodo. I segni di M(s) in questa tabella seguono il tratteggio scelto per ciascuna asta.';
    const stateSelect = `<select id="report-stage" aria-label="Struttura da analizzare">${
        stageNames.map(([v, t]) => `<option value="${v}" ${ui.stage === v ? 'selected' : ''}>${t}</option>`)
            .join('')}</select>`;
    let body = '';
    if (ui.tab === 0) {
      const reactions = r.descriptors.flatMap(
          (d, i) => d.kind === 'r' && !d.artificial && (ui.stage === 'final' || !r.free.includes(i)) ?
              [[d.label, fmt(state.vector[i]), d.unit]] :
              []);
      const sections = r.elements.map((e, i) => {
        const field = c => Draft.diagramField(model.members[i],state.fields[i],c);
        if (comp==='all') return [e.name,fmt(e.L),...components.map(c=>poly(field(c), fmt))];
        const p = field(comp), ord = Draft.ordinates(p, e.L);
        return [
          e.name, fmt(e.L), poly(p, fmt), fmt(ord[0][1]), fmt(ord[1][1]),
          ord.length > 2 ? fmt(ord[2][1]) + ' in s = ' + fmt(ord[2][0]) : '—'
        ];
      });
      const stageInfo = ui.stage === 'final' ?
          'Azioni interne dopo la sovrapposizione.' :
          ui.stage === 'primary' ?
          'Carichi assegnati sul sistema rilasciato. Tutte le incognite iperstatiche valgono zero.' :
          `Sistema rilasciato con ${unknowns[+ui.stage].label} = +1 ${
              unknowns[+ui.stage].unit}. Tutte le altre incognite e i carichi assegnati valgono zero.`;
      const controls = ['all',...components].map(c=>
        `<button class="${c===comp?'active':''}" aria-pressed="${c===comp}" data-comp="${c}">${names[c]}</button>`
      ).join('');
      const plots = shown.map(c=>`<div class="plot ${r.elements.length>5?'complex':''}">
        <svg id="result-plot-${c}" aria-label="Diagramma ${names[c]}"></svg></div>`).join('');
      const heads = comp==='all' ? ['Asta i → j','L [b]','N(s) [F]','T(s) [F]','M(s) [Fb]'] :
        ['Asta i → j','L [b]',comp+'(s) ['+units+']',comp+'(0)',comp+'(L)','Estremo interno'];
      body = `<div class="result-bar">${stateSelect}<div class="seg" aria-label="Azione interna">${controls}</div></div>
        <div class="${comp==='all'?'diagram-sheet':'result-grid'}">${plots}<div class="diagram-notes">${card}
        <p class="subtext">${name(stageInfo)}</p><label class="check"><input id="show-loads" type="checkbox" ${ui.showLoads?'checked':''}> Mostra i carichi sullo schema</label>
        <p class="help">Le ordinate positive sono disegnate sul lato tratteggiato. Nel diagramma M la curva si trova sul lato delle fibre tese per flessione.</p></div></div>
        <details ${comp==='all'?'':'open'}><summary>Equazioni e valori per asta</summary>${table(heads,sections)}</details>
      <details><summary>Reazioni vincolari</summary>${
          reactions.length ?
              table(['Componente', 'Valore', 'Unità'], reactions) :
              '<p>Corpo libero in equilibrio.</p>'}</details><p class="subtext">${coordinate}</p>`;
    } else if (ui.tab === 3) {
      body = sectionSheet(model, section, fmt);
    } else if (ui.tab === 1) {
      body = `<h3>Equilibrio ai nodi</h3><p>Per ogni nodo si impongono ΣFₓ = 0, ΣFᵧ = 0 e, se trasmette coppie, ΣM = 0. Le incognite d’asta sono lo sforzo normale N<sub>AB</sub> = N(0) e le coppie di estremità W<sub>AB</sub> = −M(0) e W<sub>BA</sub> = M(L), positive se antiorarie sull’asta. Agli estremi incernierati il momento vale zero.</p>
      <div class="formula">N(s) = N(0) − qₓ s<br>T(0) = [M(L) − M(0)] / L − qᵧ L / 2<br>T(s) = T(0) + qᵧ s<br>M(s) = M(0) + T(0) s + qᵧ s² / 2</div>
      <p class="subtext">qₓ e qᵧ sono le componenti del carico distribuito negli assi locali dell’asta. Per l’equilibrio si usa il momento locale positivo con fibre tese a destra nel verso i → j. Le azioni di estremità sull’asta sono [−N(0), T(0), −M(0)] in i e [N(L), −T(L), M(L)] in j.</p>
      <h3>Sistema assemblato</h3><p>${r.rowLabels.length} equazioni indipendenti e ${
          r.descriptors.length} incognite. Grado di iperstaticità <strong>${r.free.length}</strong>.</p>${
          r.floating ?
              '<p class="help">Per il corpo libero si fissano tre moti rigidi di riferimento. Le tre reazioni ausiliarie, indicate con *, sono nulle.</p>' :
              ''}
      ${
          table(
              ['Nodo', ...r.descriptors.map(d => d.label + (d.artificial ? '*' : '')), 'Termine noto'],
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
      const formulas = unknowns
                           .map(
                               (d, i) => `<div class="result-card"><strong>${xi(i)} = ${
                                   name(d.label)}</strong><p>${esc(release(d, model))} Nel servizio ${
                                   i + 1} assegna +1 ${d.unit} alla coordinata rilasciata.</p></div>`)
                           .join('');
      const terms =
          r.work0
              .map(
                  (parts, i) => `<details ${i === 0 ? 'open' : ''}><summary>Contributi per asta · servizio ${
                      i + 1}</summary>${
                      table(
                          [
                            'Asta', '∫ MᵢM₀/EJ', '∫ NᵢN₀/EA', '∫ (Nᵢε₀ + Mᵢκ₀)', 'Σ MᵢM₀/k', 'δᵢ₀',
                            ...unknowns.map((_, j) => 'f' + (i + 1) + ',' + (j + 1))
                          ],
                          parts
                              .map(
                                  (p, k) =>
                                      [r.elements[k].name,
                                       ...[p.bend, p.axial, p.imposed, p.spring, p.total,
                                           ...r.workX[i].map(a => a[k].total)]
                                           .map(fmt)])
                              .concat(r.support0[i].map((p, k) => [
                                (p.stiffness ? 'Molla del vincolo ' : 'Cedimento del vincolo ') + p.label, '', '',
                                p.moved ? fmt(p.settle) : '', p.stiffness ? fmt(p.spring) : '', fmt(p.total),
                                ...r.supportX[i].map(a => fmt(a[k].total))
                              ]))
                              .concat([
                                ['Somma', '', '', '', '', fmt(r.delta[i]), ...r.flexibility[i].map(fmt)]
                              ]))}</details>`)
              .join('');
      body = `<h3>1. Scelta della struttura principale</h3>${
          formulas}<h3>2. Congruenza lungo i rilasci</h3><p>Il lavoro virtuale del servizio i misura lo spostamento o la rotazione relativa lungo il rilascio. Ripristinando il vincolo, tale grandezza deve annullarsi.</p>
      <div class="formula">δᵢ₀ + Σⱼ fᵢⱼ Xⱼ = 0<br>δᵢ₀ = Σ ∫₀ᴸ [Mᵢ M₀/EJ + Nᵢ N₀/EA + Nᵢ ε₀ + Mᵢ κ₀] ds + Σₘ Mᵢ M₀/kₘ + Σᵥ Rᵢ R₀/kᵥ<br>fᵢⱼ = Σ ∫₀ᴸ [Mᵢ Mⱼ/EJ + Nᵢ Nⱼ/EA] ds + Σₘ Mᵢ Mⱼ/kₘ + Σᵥ Rᵢ Rⱼ/kᵥ</div>
      <p class="help">Le somme su m riguardano le molle rotazionali fra asta e nodo, quelle su v le molle dei vincoli a terra, dove R è la reazione nel verso della molla. Un cedimento imposto u aggiunge a δᵢ₀ il termine −Rᵢ u, lavoro della reazione virtuale sullo spostamento assegnato.</p>
      <p class="help">${
          model.axial ?
              'Deformabilità assiale e flessionale attive.' :
              'Deformabilità flessionale attiva. I termini elastici in 1/EA valgono zero.'} Gli integrali usano i momenti locali delle aste, positivi con fibre tese a destra nel verso i → j.</p>${
          terms}${workedIntegral(model, r, ui, fmt)}
      <h3>3. Soluzione e sovrapposizione</h3><div class="formula">${
          r.flexibility
              .map(
                  (row, i) => poly([r.delta[i]], fmt) +
                      row.map((v, j) => (v < 0 ? ' − ' : ' + ') + fmt(Math.abs(v)) + ' ' + xi(j)).join('') +
                      ' = 0')
              .join('<br>')}<br>${
          r.X.map((x, j) => xi(j) + ' = ' + fmt(x) + ' ' + unknowns[j].unit)
              .join(
                  ' · ')}</div><p>Per ciascuna azione S ∈ {N, T, M}, il diagramma finale si ottiene da S(s) = S₀(s) + Σⱼ Xⱼ Sⱼ(s).</p>`;
    }
    host.innerHTML = nav + '<div class="report-body">' + body + '</div>';
    host.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => onChange({tab: +b.dataset.tab}));
    host.querySelectorAll('[data-comp]').forEach(b => b.onclick = () => onChange({comp: b.dataset.comp}));
    const select = host.querySelector('#report-stage');
    if (select)
      select.onchange = () => onChange({stage: select.value});
    for (const [id, key] of [
             ['work-element', 'workElement'], ['work-service', 'workService'],
             ['work-partner', 'workPartner']]) {
      const picker = host.querySelector('#' + id);
      if (picker)
        picker.onchange = () => onChange({[key]: Number(picker.value)});
    }
    const overlay = host.querySelector('#show-loads');
    if (overlay)
      overlay.onchange = () => onChange({showLoads: overlay.checked});
    const sectionPlot = host.querySelector('#section-plot');
    if (sectionPlot)
      Draft.section(sectionPlot, model.section, section, sectionPlot.clientWidth || 360, sectionPlot.clientHeight || 330);
    if (ui.tab===0) for (const component of shown) {
      const plot=host.querySelector('#result-plot-'+component);
      Draft.draw(plot,model,Draft.viewport(model.nodes,Math.max(220,plot.clientWidth),plot.clientHeight||300),
        {result:r,state,component,showLoads:ui.showLoads,decimals:ui.decimals,reduced:ui.stage!=='final'});
    }
  }
  return {render};
})();

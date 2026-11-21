(() => {
  const $ = s => document.querySelector(s), {esc} = Draft, tr = I18n.t;
  const paths = {
    folder: 'M3 7h6l2 2h10l-2 10H3z M3 7V5h6l2 2h8v2',
    save: 'M4 3h13l3 3v15H4z M8 3v6h8V3 M8 21v-8h8v8',
    layers: 'm3 8 9-5 9 5-9 5z M3 12l9 5 9-5 M3 16l9 5 9-5',
    play: 'm8 4 12 8-12 8z',
    draft: 'M3 20 11 4l10 16H3z M8 17l3-6 4 6z',
    sliders: 'M3 6h7m5 0h6M3 17h12m4 0h2 M10 3v6m5 5v6',
    wave: 'M2 16h4l4-11 4 15 3-9h5',
    select: 'M5 3l14 10-7 1-3 7z',
    node: 'M12 2v5m0 10v5M2 12h5m10 0h5 M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8',
    edge: 'M5 17 17 5 M3 17h4v4H3z M17 3h4v4h-4z',
    pan: 'M8 12V6a1.5 1.5 0 0 1 3 0v5-7a1.5 1.5 0 0 1 3 0v7-6a1.5 1.5 0 0 1 3 0v7-4a1.5 1.5 0 0 1 3 0v6c0 5-2 8-7 8-3 0-5-2-7-5l-3-5a1.6 1.6 0 0 1 2.5-2L8 13z',
    zoomIn: 'M16 16l5 5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0 M6 10h8 M10 6v8',
    zoomOut: 'M16 16l5 5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0 M6 10h8',
    fit: 'M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6',
    undo: 'M9 5 3 10l6 5 M4 10h10a6 6 0 0 1 6 6v3'
  };
  const icon = k => `<svg class="icon" viewBox="0 0 24 24" fill="${
      k === 'play' ?
          'currentColor' :
          'none'}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${
      paths[k]}"/></svg>`;
  document.querySelectorAll('[data-icon]').forEach(i => i.outerHTML = icon(i.dataset.icon));
  const clone = o => JSON.parse(JSON.stringify(o));
  let model = clone(Models.examples[0]), result = null, problem = '', selection = '', tool = 'select',
      first = '', view, step = Models.examples[0].grid, history = [], ui = {tab: 'diagrams', stage: 'final', comp: 'all', decimals: false};
  const fmt = value => ui.decimals ? NumericDisplay.decimal(value) : NumericDisplay.fraction(value);
  let pointer = null;
  let fitNeeded = true;
  const supports = {
    free: 'Libero',
    pin: 'Cerniera a terra',
    rollerY: 'Carrello · reazione verticale',
    rollerX: 'Carrello · reazione orizzontale',
    sliderY: 'Doppio pendolo · scorre in orizzontale',
    sliderX: 'Doppio pendolo · scorre in verticale',
    fixed: 'Incastro'
  };
  // Connection of a beam end to its node: [couple released, sliding mode].
  const connections = {
    rigid: [false, '', 'Continuo'],
    hinge: [true, '', 'Cerniera'],
    padNormal: [false, 'normal', 'Pattino · scorre di traverso all’asta'],
    padAxis: [false, 'axis', 'Pattino · scorre lungo l’asta'],
    padIncl: [false, 'incl', 'Pattino · piano inclinato'],
    rollerNormal: [true, 'normal', 'Carrello · scorre di traverso all’asta'],
    rollerAxis: [true, 'axis', 'Carrello · scorre lungo l’asta'],
    rollerIncl: [true, 'incl', 'Carrello · piano inclinato']
  };
  const connectionOf = (e, end) => Object.keys(connections).find(
      k => connections[k][0] === Boolean(e['h' + end.toLowerCase()]) && connections[k][1] === (e['slide' + end] || ''));
  const endLoadKeys = ['fxI', 'fyI', 'mI', 'fxJ', 'fyJ', 'mJ'];
  const names = {select: 'Seleziona', node: 'Nodo', edge: 'Asta', pan: 'Mano'};
  const tips = {
    select: 'Seleziona un nodo o un’asta per modificarne le proprietà.',
    node: 'Tocca la griglia per inserire un nodo. Puoi regolare le coordinate nelle proprietà.',
    edge: 'Seleziona due nodi in sequenza per collegarli con un’asta.',
    pan: 'Trascina per spostare la vista. Usa le lenti, la rotellina o due dita per lo zoom.'
  };
  const obj = () => selection[0] === 'n' ? model.nodes[+selection.slice(1)] :
      selection[0] === 'e'               ? model.members[+selection.slice(1)] :
                                           model;
  function remember() {
    history.push(JSON.stringify(model));
    if (history.length > 60)
      history.shift();
  }
  function resetResult() {
    result = null;
    problem = '';
    ui.stage = 'final';
  }
  function change(fn, fit = false) {
    remember();
    fn();
    resetResult();
    fitNeeded = fit;
    render();
  }
  function load(m) {
    remember();
    model = clone(m);
    step = model.grid || .5;
    selection = '';
    first = '';
    tool = 'select';
    fitNeeded = true;
    calculate();
  }
  function calculate() {
    resetResult();
    try {
      result = Mechanics.solve(model);
    } catch (err) {
      problem = err.message;
    }
    render();
  }
  function options(items, value) {
    return items
        .map(
            ([v, t]) => `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${
                esc(t)}</option>`)
        .join('');
  }
  function field(key, title, value) {
    const shown = ui.decimals ? NumericDisplay.plain(value) : NumericDisplay.inputFraction(value);
    return `<label>${title}<input type="text" data-numeric data-prop="${key}" value="${esc(shown)}" required></label>`;
  }
  function check(key, title, value) {
    return `<label class="check"><input type="checkbox" data-prop="${key}" ${value ? 'checked' : ''}>${
        title}</label>`;
  }
  function select(key, title, items, value) {
    return `<label class="full-field">${title}<select data-prop="${key}">${
        options(items, value)}</select></label>`;
  }
  function releaseList() {
    const items = [['', tr('Automatica')]];
    for (const n of model.nodes)
      Mechanics.supportAxes[n.support].forEach(
          d => items.push(['r/' + n.id + '/' + d, ['H', 'V', 'W'][d] + '_' + n.id + tr(' · reazione in {0}', n.id)]));
    for (const e of model.members) {
      const id = e.a + '/' + e.b + '/', tag = e.a + '–' + e.b;
      items.push([id + 'n', 'N_' + e.a + e.b + tr(' · sforzo normale di {0}', tag)]);
      if (e.type === 'beam' && !e.hi)
        items.push([id + 'mi', 'W_' + e.a + e.b + tr(' · coppia in {0} su {1}', e.a, tag)]);
      if (e.type === 'beam' && !e.hj)
        items.push([id + 'mj', 'W_' + e.b + e.a + tr(' · coppia in {0} su {1}', e.b, tag)]);
    }
    return items;
  }
  // Elastic stiffness of each restrained component of a support.
  function supportDetails(n) {
    const axes = Mechanics.supportAxes[n.support];
    if (!axes.length)
      return '';
    const springs = [['kx', tr('k orizzontale [EJ/b³]')], ['ky', tr('k verticale [EJ/b³]')], ['kr', tr('k rotazionale [EJ/b]')]];
    const moves = [['ux', tr('u orizzontale [Fb³/EJ]')], ['uy', tr('v verticale [Fb³/EJ]')], ['ur', tr('φ rotazione ↺ [Fb²/EJ]')]];
    return '<details' + (axes.some(d => n[springs[d][0]] || n[moves[d][0]]) ? ' open' : '') +
        '><summary>' + tr('Molle e cedimenti del vincolo') + '</summary><p class="help">' +
        tr('Rigidezza della molla interposta fra nodo e terreno. Il valore 0 indica un vincolo rigido.') + '</p><div class="props">' +
        axes.map(d => field(springs[d][0], springs[d][1], n[springs[d][0]] || 0)).join('') +
        '</div><p class="help">' + tr('Spostamento imposto al vincolo, positivo verso destra, verso l’alto o in senso antiorario.') +
        '</p><div class="props">' +
        axes.map(d => field(moves[d][0], moves[d][1], n[moves[d][0]] || 0)).join('') + '</div></details>';
  }
  // Section check of the exam sheets: reference values, beam, node, width profile and point *.
  function sectionDetails() {
    const s = model.section, ref = model.ref || {b: 1000, F: 1000};
    const beams = model.members.filter(e => e.type === 'beam');
    const directions = [['', tr('Nessuna verifica')], ...beams.flatMap(e => [[e.a + '/' + e.b, e.a + ' → ' + e.b], [e.b + '/' + e.a, e.b + ' → ' + e.a]])];
    const plain = NumericDisplay.plain, text = s ? s.profile.map(p => p.map(plain).join('  ')).join('\n') : '';
    return `<details class="model-opts"${s ? ' open' : ''}><summary>${tr('Sezione e tensioni')}</summary><div class="props">
      <label>b [mm]<input id="ref-b" value="${esc(plain(ref.b))}"></label><label>F [N]<input id="ref-F" value="${esc(plain(ref.F))}"></label>
      <label class="span2">${tr('Trave, con il lembo inferiore a destra andando da')}<select id="section-member">${
        options(directions, s ? s.from + '/' + s.to : '')}</select></label>${s ? `
      <label>${tr('Sezione nel nodo')}<select id="section-at">${options([[s.from, s.from], [s.to, s.to]], s.at)}</select></label>
      <label>${tr('Quota del punto * [mm]')}<input id="section-cut" value="${esc(plain(s.cut))}"></label>
      <label class="span2">${tr('Profilo dal lembo inferiore: quota y e larghezza [mm], un punto per riga')}<textarea id="section-profile" rows="7" spellcheck="false">${
        esc(text)}</textarea></label>` : ''}</div>${
      s ? '<p class="help">' + tr('La sezione è simmetrica rispetto all’asse verticale. Ripeti la stessa quota per un gradino. Due larghezze diverse a quote diverse danno un tratto inclinato.') + '</p>' : ''}</details>`;
  }
  function sectionHandlers() {
    const invalid = (input, message) => {
      input.setCustomValidity(message);
      input.reportValidity();
      input.oninput = () => input.setCustomValidity('');
    };
    for (const key of ['b', 'F']) {
      const input = $('#ref-' + key);
      if (input) input.onchange = () => {
        const value = NumericDisplay.parse(input.value);
        if (!(value > 0)) return invalid(input, tr('Inserisci un valore positivo.'));
        change(() => { model.ref = {...(model.ref || {b: 1000, F: 1000}), [key]: value}; });
      };
    }
    if ($('#section-member')) $('#section-member').onchange = e => {
      const [from, to] = e.target.value.split('/');
      change(() => {
        if (!to) delete model.section;
        else model.section = {
          cut: 15, profile: [[0, 20], [10, 20], [10, 6], [50, 6], [50, 40], [60, 40]], ...model.section, from, to,
          at: model.section && [from, to].includes(model.section.at) ? model.section.at : from
        };
        if (to && !model.ref) model.ref = {b: 1000, F: 1000};
      });
    };
    if ($('#section-at')) $('#section-at').onchange = e => change(() => { model.section.at = e.target.value; });
    if ($('#section-cut')) $('#section-cut').onchange = e => {
      const value = NumericDisplay.parse(e.target.value);
      if (!Number.isFinite(value)) return invalid(e.target, tr('Inserisci la quota del punto in mm.'));
      change(() => { model.section.cut = value; });
    };
    if ($('#section-profile')) $('#section-profile').onchange = e => {
      const profile = e.target.value.split('\n').map(row => row.trim()).filter(Boolean)
          .map(row => row.split(/[\s;]+/).map(NumericDisplay.parse));
      if (!CrossSection.valid(profile))
        return invalid(e.target, tr('Ogni riga contiene quota e larghezza, con quote crescenti dal lembo inferiore.'));
      change(() => { model.section.profile = profile; });
    };
  }
  function inspector() {
    const o = obj(), isNode = selection[0] === 'n', isEdge = selection[0] === 'e';
    const choices = [
      ['', tr('Modello completo')], ...model.nodes.map((n, i) => ['n' + i, tr('Nodo {0}', n.id)]),
      ...model.members.map((e, i) => ['e' + i, tr('Asta {0}', e.a + '–' + e.b)])
    ];
    let html = '<label class="cap" for="object">' + tr('Selezione') + '</label><select class="object" id="object">' +
        options(choices, selection) + '</select>';
    if (isNode) {
      html += '<span class="cap">' + tr('Nome') + '</span><label class="full-field">' + tr('Lettera del nodo sulla traccia') +
          '<input id="node-name" maxlength="14" autocomplete="off" value="' +
          esc(o.id) + '"></label><span class="cap">' + tr('Geometria') + '</span><div class="props">' + field('x', 'x [b]', o.x) +
          field('y', 'y [b]', o.y) + '</div><span class="cap">' + tr('Vincolo esterno') + '</span>' +
          select('support', tr('Tipo di appoggio'), Object.entries(supports).map(([k, v]) => [k, tr(v)]), o.support) + supportDetails(o) +
          '<span class="cap">' + tr('Carichi nodali') + '</span><div class="props">' + field('fx', 'H [F]', o.fx) +
          field('fy', 'V [F]', o.fy) + field('m', tr('Coppia W ↺ [Fb]'), o.m) + '</div>';
    } else if (isEdge) {
      html += '<span class="cap">' + tr('Elemento') + '</span>' +
          select('type', tr('Tipo'), [['beam', tr('Trave')], ['bar', tr('Biella')]], o.type);
      html += '<span class="cap">' + tr('Tratteggio') + '</span>' +
          select('fiberSide', tr('Fibre tese per M positivo · {0}', esc(o.a) + ' → ' + esc(o.b)),
                 [['right', tr('A destra')], ['left', tr('A sinistra')]], o.fiberSide);
      if (o.type === 'beam') {
        html += '<span class="cap">' + tr('Collegamenti ai nodi') + '</span>';
        for (const [end, id] of [['I', o.a], ['J', o.b]]) {
          html += select('conn' + end, tr('In {0}', esc(id)), Object.entries(connections).map(([k, v]) => [k, tr(v[2])]),
                         connectionOf(o, end));
          if (o['slide' + end] === 'incl')
            html += '<div class="props">' + field('slide' + end + 'dx', tr('Piano in {0} · Δx', esc(id)), o['slide' + end + 'dx']) +
                field('slide' + end + 'dy', 'Δy', o['slide' + end + 'dy']) + '</div>';
        }
        html += '<span class="cap">' + tr('Carico uniforme · assi globali') + '</span><div class="props">' +
            field('qx', tr('p lungo x [F/b]'), o.qx) + field('qy', tr('q lungo y [F/b]'), o.qy) + '</div>';
      }
      if (o.type === 'beam') {
        html += '<details' + (endLoadKeys.some(k => o[k]) ? ' open' : '') +
            '><summary>' + tr('Carichi su un solo lato del nodo') + '</summary><p class="help">' +
            tr('Forze e coppie applicate all’estremo dell’asta, dalla parte dell’asta rispetto a cerniere, pattini e carrelli.') + '</p>';
        for (const [end, from, to] of [['I', o.a, o.b], ['J', o.b, o.a]]) {
          const tag = '<sub>' + esc(from) + esc(to) + '</sub>';
          html += '<div class="props">' + field('fx' + end, 'H' + tag + ' [F]', o['fx' + end] || 0) +
              field('fy' + end, 'V' + tag + ' [F]', o['fy' + end] || 0) +
              field('m' + end, 'W' + tag + ' ↺ [Fb]', o['m' + end] || 0) + '</div>';
        }
        html += '</details>';
      }
      if (o.type === 'beam' && !(o.hi && o.hj))
        html +=
            '<details><summary>' + tr('Molle rotazionali agli estremi') + '</summary><p class="help">' +
            tr('Rigidezza tra asta e nodo in EJ/b. Il valore 0 mantiene il collegamento rigido.') + '</p><div class="props">' +
            (o.hi ? '' : field('springI', tr('k in {0}', esc(o.a)), o.springI || 0)) +
            (o.hj ? '' : field('springJ', tr('k in {0}', esc(o.b)), o.springJ || 0)) +
            '</div></details>';
      html += '<span class="cap">' + tr('Rigidezza') + '</span><div class="props">' +
          (o.type === 'beam' ? field('ei', tr('Rigidezza [EJ]'), o.ei) : '') +
          field('ea', 'EA [EJ/b²]', o.ea) +
          '</div><details' + (o.eps || o.kappa ? ' open' : '') + '><summary>' + tr('Deformazioni impresse') + '</summary><div class="props">' +
          field('eps', 'ε [Fb²/EJ]', o.eps) + (o.type === 'beam' ? field('kappa', 'θ [Fb/EJ]', o.kappa) : '') +
          '</div></details>';
    } else {
      const restraint = model.nodes.filter(n => n.support !== 'free').length;
      html +=
          `<div class="setting"><span>${tr('Schema')}</span><strong>${tr('Telaio piano')}</strong></div><div class="setting"><span>${tr('Vincoli esterni')}</span><strong>${
              restraint}</strong></div><div class="setting"><span>${tr('Unità')}</span><strong>F · b · EJ</strong></div><span class="cap">${tr('Metodo delle forze')}</span>` +
          select('release', tr('Incognita da rilasciare'), releaseList(), model.release) +
          check('axial', tr('Includi la deformabilità assiale'), model.axial) + sectionDetails() +
          `<details class="model-opts"><summary>${tr('Impostazioni del disegno')}</summary><div class="props"><label class="span2">${tr('Nome del modello')}<input id="rename" maxlength="70" value="${
              esc(tr(model.title))}"></label><label>${tr('Passo griglia [b]')}<select id="grid">${
              options([.1, .25, .5, 1, 2].map(n => [n, fmt(n)]), step)}</select></label></div></details>`;
    }
    if (selection)
      html += '<button class="delete" id="remove">' + (isNode ? tr('Elimina nodo') : tr('Elimina asta')) + '</button>';
    $('#inspector').innerHTML = html;
    $('#object').onchange = e => {
      selection = e.target.value;
      if (selection[0] === 'e') ui.member = +selection.slice(1);
      render();
    };
    document.querySelectorAll('[data-prop]').forEach(input => input.onchange = () => {
      const key = input.dataset.prop, numeric = input.hasAttribute('data-numeric');
      const value = numeric ? NumericDisplay.parse(input.value) : input.type === 'checkbox' ? input.checked : input.value;
      if (numeric && (!Number.isFinite(value) || (['ei', 'ea'].includes(key) && value <= 0) ||
          (['springI', 'springJ', 'kx', 'ky', 'kr'].includes(key) && value < 0))) {
        input.setCustomValidity(tr('Inserisci un decimale o una frazione valida. EA ed EJ devono essere positivi e le molle hanno rigidezza positiva o nulla.'));
        input.reportValidity();
        input.oninput = () => input.setCustomValidity('');
        return;
      }
      if (value === o[key]) return;
      if (key === 'connI' || key === 'connJ') {
        const end = key.at(-1), [hinge, slide] = connections[value];
        change(() => {
          o['h' + end.toLowerCase()] = hinge;
          o['slide' + end] = slide;
          if (slide === 'incl' && !Number.isFinite(o['slide' + end + 'dx']))
            Object.assign(o, {['slide' + end + 'dx']: 1, ['slide' + end + 'dy']: 1});
          if (hinge)
            o['spring' + end] = 0;
          if (!releaseList().some(([v]) => v === model.release))
            model.release = '';
        });
        return;
      }
      if (key === 'fiberSide') {
        remember();
        o.fiberSide = value;
        render();
        return;
      }
      change(() => {
        o[key] = value;
        if (key === 'hi' && value)
          o.springI = 0;
        if (key === 'hj' && value)
          o.springJ = 0;
        if (key === 'support')
          // A settlement needs a restrained component.
          ['ux', 'uy', 'ur'].forEach((u, d) => {
            if (!Mechanics.supportAxes[value].includes(d))
              o[u] = 0;
          });
        if (key === 'type' && value === 'bar')
          Object.assign(o, {qx: 0, qy: 0, kappa: 0, hi: false, hj: false, springI: 0, springJ: 0, slideI: '', slideJ: '',
                            ...Object.fromEntries(endLoadKeys.map(k => [k, 0]))});
        if (!releaseList().some(([v]) => v === model.release))
          model.release = '';
      }, key === 'x' || key === 'y');
    });
    sectionHandlers();
    if ($('#node-name'))
      $('#node-name').onchange = e => {
        const input = e.target, name = input.value.trim(), trial = clone(model);
        const problem = Models.renameNode(trial, o.id, name);
        if (problem) {
          input.setCustomValidity(tr(problem));
          input.reportValidity();
          input.oninput = () => input.setCustomValidity('');
          return;
        }
        if (name === o.id) return;
        // Same structure with other letters: results are recomputed so that they carry the new names.
        const solved = Boolean(result);
        remember();
        model = trial;
        first = '';
        if (solved) calculate();
        else {
          resetResult();
          render();
        }
      };
    if ($('#rename'))
      $('#rename').onchange = e => {
        const title = e.target.value.trim() || tr('Struttura senza nome');
        change(() => {
          model.title = title;
        });
      };
    if ($('#grid'))
      $('#grid').onchange = e => {
        step = +e.target.value;
        render();
      };
    if ($('#remove'))
      $('#remove').onclick = () => change(() => {
        if (isNode) {
          model.members = model.members.filter(e => e.a !== o.id && e.b !== o.id);
          model.nodes.splice(+selection.slice(1), 1);
        } else
          model.members.splice(+selection.slice(1), 1);
        selection = '';
        first = '';
        if (!releaseList().some(([v]) => v === model.release))
          model.release = '';
      });
  }
  function paintCanvas() {
    Draft.draw($('#canvas'), model, view, {selected: selection, first, step, decimals: ui.decimals});
    $('#zoom-level').textContent = Math.round(100 * view.scale / view.fitScale) + '%';
    $('#zoom-out').disabled = view.scale <= view.fitScale / 32;
    $('#zoom-in').disabled = view.scale >= view.fitScale * 32;
  }
  function board() {
    const svg = $('#canvas'), width = Math.max(300, svg.clientWidth), height = svg.clientHeight;
    if (fitNeeded || !view) {
      view = Draft.viewport(model.nodes, width, height, true);
      view.fitScale = view.scale;
      fitNeeded = false;
    } else if (view.width !== width || view.height !== height) {
      // Keep the world point at the centre when the window changes size.
      view.ox += (width - view.width) / 2;
      view.oy += (height - view.height) / 2;
      view.width = width;
      view.height = height;
    }
    svg.classList.toggle('hand-tool', tool === 'pan');
    $('#step-label').textContent = fmt(step) + ' b';
    paintCanvas();
    $('#tools').innerHTML =
        Object.entries(names)
            .map(
                ([k, title]) => `<button data-tool="${k}" class="${k === tool ? 'active' : ''}" aria-pressed="${
                    k === tool}">${icon(k)} ${tr(title)}</button>`)
            .join('') +
        `<button id="undo" aria-label="${tr('Annulla modifica')}" title="${tr('Annulla modifica')}" ${
            history.length ? '' : 'disabled'}>${icon('undo')}</button>`;
    document.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => {
      tool = b.dataset.tool;
      if (tool !== 'pan' && tool !== 'edge') first = '';
      render();
    });
    $('#undo').onclick = () => {
      model = JSON.parse(history.pop());
      selection = '';
      first = '';
      resetResult();
      fitNeeded = true;
      render();
    };
    $('#hint').textContent = first && tool === 'edge' ? tr('Primo nodo {0} · scegli il secondo estremo.', first) : tr(tips[tool]);
    $('#counts').textContent = tr('{0} nodi · {1} aste', model.nodes.length, model.members.length);
  }
  function analysis() {
    $('#status').innerHTML = result ?
        `<span class="tag">${
            result.free.length ? tr('Iperstatica · grado {0}', result.free.length) : tr('Isostatica')}</span>` :
        `<span class="tag pending">${problem ? tr('Verifica modello') : tr('Da calcolare')}</span>`;
    if (result)
      Report.render($('#analysis'), model, result, ui, newUI => {
        Object.assign(ui, newUI);
        analysis();
      });
    else
      $('#analysis').innerHTML = '<div class="note ' + (problem ? 'error-box' : '') + '">' +
          esc(problem ? tr(problem) : tr('Premi Calcola per ottenere i diagrammi e lo svolgimento del modello corrente.')) +
          '</div>';
  }
  function render() {
    // Irrational member lengths, such as √5 b, tell which roots may appear in the results.
    NumericDisplay.learn(model);
    $('#model-name').textContent = tr(model.title);
    board();
    inspector();
    analysis();
  }
  function world(e) {
    const a = BoardNavigation.point($('#canvas'), e);
    const snap = v => Number((Math.round(v / step) * step).toFixed(8));
    return [snap((a.x - view.ox) / view.scale), snap((view.oy - a.y) / view.scale)];
  }
  function nextName() {
    for (let i = 0;; i++) {
      const id = String.fromCharCode(65 + i % 26) + (i >= 26 ? Math.floor(i / 26) : '');
      if (!model.nodes.some(n => n.id === id))
        return id;
    }
  }
  const navigation = BoardNavigation.attach($('#canvas'), () => view, () => tool === 'pan', paintCanvas);
  $('#canvas').onpointermove = e => {
    pointer = world(e);
    const [x, y] = pointer;
    $('#pointer-pos').textContent = 'x ' + fmt(x) + ' · y ' + fmt(y) + ' b';
  };
  $('#canvas').onclick = e => {
    if (tool === 'pan') return;
    const n = e.target.closest('[data-node]')?.dataset.node,
          k = e.target.closest('[data-edge]')?.dataset.edge;
    if (tool === 'select') {
      selection = n !== undefined ? 'n' + n : k !== undefined ? 'e' + k : '';
      // The member picked on the board is also the one whose equations are shown in the results.
      if (n === undefined && k !== undefined) ui.member = +k;
      render();
      return;
    }
    if (tool === 'node') {
      const [x, y] = world(e), i = model.nodes.findIndex(v => v.x === x && v.y === y);
      if (i >= 0 || n !== undefined) {
        selection = 'n' + (n ?? i);
        render();
        return;
      }
      change(() => {
        model.nodes.push(Models.node(nextName(), x, y));
        selection = 'n' + (model.nodes.length - 1);
      });
      return;
    }
    if (n === undefined)
      return;
    const id = model.nodes[+n].id;
    if (!first) {
      first = id;
      selection = 'n' + n;
      render();
      return;
    }
    if (id === first) {
      first = '';
      render();
      return;
    }
    if (model.members.some(m => [m.a, m.b].includes(id) && [m.a, m.b].includes(first))) {
      $('#hint').textContent = tr('Questi nodi sono già collegati. Scegli un altro estremo.');
      return;
    }
    change(() => {
      model.members.push(Models.beam(first, id));
      first = '';
      selection = 'e' + (model.members.length - 1);
    });
  };
  $('#show-decimals').checked = ui.decimals;
  $('#show-decimals').onchange = e => {
    ui.decimals = e.target.checked;
    const open = Array.from(document.querySelectorAll('details'), d => d.open);
    render();
    document.querySelectorAll('details').forEach((d, i) => { d.open = open[i]; });
    if (pointer) $('#pointer-pos').textContent = 'x ' + fmt(pointer[0]) + ' · y ' + fmt(pointer[1]) + ' b';
  };
  $('#zoom-in').onclick = () => navigation.zoom(1.25);
  $('#zoom-out').onclick = () => navigation.zoom(1 / 1.25);
  $('#fit').onclick = () => {
    fitNeeded = true;
    render();
  };
  $('#solve').onclick = () => {
    calculate();
    $('#status').scrollIntoView({block: 'nearest', behavior: 'smooth'});
  };
  // Texts of the page that are not rebuilt at every render: static labels and the model menu.
  function staticTexts() {
    document.documentElement.lang = I18n.lang;
    document.title = tr('TrussSolver · Banco di calcolo');
    document.querySelectorAll('[data-t]').forEach(el => {
      el.textContent = tr(el.dataset.t);
    });
    for (const attribute of ['title', 'aria-label'])
      document.querySelectorAll('[data-t-' + attribute + ']').forEach(el => {
        el.setAttribute(attribute, tr(el.getAttribute('data-t-' + attribute)));
      });
    $('#example').innerHTML = '<option value="">' + tr('Modelli') + '</option>' +
        options(Models.examples.map((m, i) => [i, tr(m.title)]), '') +
        '<option value="new">' + tr('＋ Nuovo disegno') + '</option>';
    $('#language').value = I18n.lang;
  }
  $('#language').onchange = e => {
    I18n.use(e.target.value);
    NumericDisplay.setLocale(I18n.locale);
    staticTexts();
    const open = Array.from(document.querySelectorAll('details'), d => d.open);
    render();
    document.querySelectorAll('details').forEach((d, i) => { d.open = open[i]; });
  };
  NumericDisplay.setLocale(I18n.locale);
  staticTexts();
  $('#example').onchange = e => {
    const v = e.target.value;
    if (v === '')
      return;
    load(
        v === 'new' ? {title: tr('Nuova struttura'), ref: {b: 1000, F: 1000}, nodes: [], members: [], release: '', axial: false} :
                      Models.examples[+v]);
    if (v === 'new') {
      resetResult();
      tool = 'node';
      render();
    }
    e.target.value = '';
  };
  $('#save').onclick = () => {
    const url = URL.createObjectURL(
        new Blob([JSON.stringify({version: 2, model: {...model, grid: step}}, null, 2)], {type: 'application/json'}));
    const a = document.createElement('a');
    a.href = url;
    a.download = (model.title.replace(/[^\p{L}\p{N}_-]/gu, '_') || 'struttura') + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  $('#open').onclick = () => $('#file').click();
  $('#file').onchange = async e => {
    const f = e.target.files[0];
    if (!f)
      return;
    try {
      if (f.size > 1000000)
        throw Error();
      const doc = JSON.parse(await f.text()), m = doc.model;
      if (![1, 2].includes(doc.version) || !m || typeof m.title !== 'string' || typeof m.axial !== 'boolean' ||
          typeof m.release !== 'string' || !Array.isArray(m.nodes) || !Array.isArray(m.members) ||
          m.nodes.length > 120 || m.members.length > 200)
        throw Error();
      const ids = new Set();
      for (const n of m.nodes) {
        if (!n || typeof n.id !== 'string' || !/^[A-Za-z0-9_-]{1,14}$/.test(n.id) || ids.has(n.id) ||
            !Object.hasOwn(supports, n.support) || ![n.x, n.y, n.fx, n.fy, n.m].every(Number.isFinite) ||
            ![n.kx, n.ky, n.kr].every(k => k === undefined || (Number.isFinite(k) && k >= 0)) ||
            ![n.ux, n.uy, n.ur].every(u => u === undefined || Number.isFinite(u)))
          throw Error();
        ids.add(n.id);
      }
      for (const a of m.members)
        if (!a || !ids.has(a.a) || !ids.has(a.b) || a.a === a.b || !['beam', 'bar'].includes(a.type) ||
            typeof a.hi !== 'boolean' || typeof a.hj !== 'boolean' ||
            ![a.ei, a.ea, a.qx, a.qy, a.eps, a.kappa].every(Number.isFinite))
          throw Error();
      for (const a of m.members) {
        if (a.fiberSide === undefined) a.fiberSide = 'right';
        if (!['left','right'].includes(a.fiberSide)) throw Error();
        if (!endLoadKeys.every(k => a[k] === undefined || Number.isFinite(a[k]))) throw Error();
        for (const end of ['I', 'J']) {
          const mode = a['slide' + end];
          if (![undefined, '', 'axis', 'normal', 'incl'].includes(mode)) throw Error();
          if (mode === 'incl' && ![a['slide' + end + 'dx'], a['slide' + end + 'dy']].every(Number.isFinite)) throw Error();
        }
      }
      // Version 1 files were written in kN and m: read them with F = 1 kN, b = 1 m and EJ = 1 kN·m².
      if (doc.version === 1) {
        delete m.exercise;
        m.ref = {b: 1000, F: 1000};
      }
      if (m.ref !== undefined && !(m.ref && [m.ref.b, m.ref.F].every(v => Number.isFinite(v) && v > 0))) throw Error();
      if (m.grid !== undefined && !(Number.isFinite(m.grid) && m.grid > 0)) throw Error();
      if (m.section !== undefined && !(m.section && [m.section.from, m.section.to, m.section.at].every(v => typeof v === 'string') &&
          Number.isFinite(m.section.cut) && CrossSection.valid(m.section.profile))) throw Error();
      load(m);
    } catch {
      $('#hint').textContent =
          tr('Impossibile aprire il file. Seleziona un modello JSON salvato da TrussSolver.');
    }
    e.target.value = '';
  };
  window.addEventListener('resize', () => {
    board();
    analysis();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      first = '';
      tool = 'select';
      render();
    }
  });
  calculate();
})();

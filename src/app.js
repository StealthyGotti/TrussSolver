(() => {
  const $ = s => document.querySelector(s), {esc} = Draft;
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
      first = '', view, step = Models.examples[0].grid, history = [], ui = {tab: 0, stage: 'final', comp: 'all', decimals: false};
  const fmt = value => ui.decimals ? NumericDisplay.decimal(value) : NumericDisplay.fraction(value);
  let pointer = null;
  let fitNeeded = true;
  const supports = {
    free: 'Libero',
    pin: 'Cerniera a terra',
    rollerY: 'Carrello · reazione verticale',
    rollerX: 'Carrello · reazione orizzontale',
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
    const shown = ui.decimals ? String(value).replace('.', ',') : NumericDisplay.inputFraction(value);
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
    const items = [['', 'Automatica']];
    for (const n of model.nodes)
      Mechanics.supportAxes[n.support].forEach(
          d => items.push(['r/' + n.id + '/' + d, ['H', 'V', 'W'][d] + '_' + n.id + ' · reazione in ' + n.id]));
    for (const e of model.members) {
      const id = e.a + '/' + e.b + '/', tag = e.a + '–' + e.b;
      items.push([id + 'n', 'N_' + e.a + e.b + ' · sforzo normale di ' + tag]);
      if (e.type === 'beam' && !e.hi)
        items.push([id + 'mi', 'W_' + e.a + e.b + ' · coppia in ' + e.a + ' su ' + tag]);
      if (e.type === 'beam' && !e.hj)
        items.push([id + 'mj', 'W_' + e.b + e.a + ' · coppia in ' + e.b + ' su ' + tag]);
    }
    return items;
  }
  function inspector() {
    const o = obj(), isNode = selection[0] === 'n', isEdge = selection[0] === 'e';
    const choices = [
      ['', 'Modello completo'], ...model.nodes.map((n, i) => ['n' + i, 'Nodo ' + n.id]),
      ...model.members.map((e, i) => ['e' + i, 'Asta ' + e.a + '–' + e.b])
    ];
    let html = '<label class="cap" for="object">Selezione</label><select class="object" id="object">' +
        options(choices, selection) + '</select>';
    if (isNode) {
      html += '<span class="cap">Geometria</span><div class="props">' + field('x', 'x [b]', o.x) +
          field('y', 'y [b]', o.y) + '</div><span class="cap">Vincolo esterno</span>' +
          select('support', 'Tipo di appoggio', Object.entries(supports), o.support) +
          '<span class="cap">Carichi nodali</span><div class="props">' + field('fx', 'H [F]', o.fx) +
          field('fy', 'V [F]', o.fy) + field('m', 'Coppia W ↺ [Fb]', o.m) + '</div>';
    } else if (isEdge) {
      html += '<span class="cap">Elemento</span>' +
          select('type', 'Tipo', [['beam', 'Trave'], ['bar', 'Biella']], o.type);
      html += '<span class="cap">Tratteggio</span>' +
          select('fiberSide', 'Fibre tese per M positivo · ' + esc(o.a) + ' → ' + esc(o.b),
                 [['right','A destra'], ['left','A sinistra']], o.fiberSide);
      if (o.type === 'beam') {
        html += '<span class="cap">Collegamenti ai nodi</span>';
        for (const [end, id] of [['I', o.a], ['J', o.b]]) {
          html += select('conn' + end, 'In ' + esc(id), Object.entries(connections).map(([k, v]) => [k, v[2]]),
                         connectionOf(o, end));
          if (o['slide' + end] === 'incl')
            html += '<div class="props">' + field('slide' + end + 'dx', 'Piano in ' + esc(id) + ' · Δx', o['slide' + end + 'dx']) +
                field('slide' + end + 'dy', 'Δy', o['slide' + end + 'dy']) + '</div>';
        }
        html += '<span class="cap">Carico uniforme · assi globali</span><div class="props">' +
            field('qx', 'p lungo x [F/b]', o.qx) + field('qy', 'q lungo y [F/b]', o.qy) + '</div>';
      }
      if (o.type === 'beam' && !(o.hi && o.hj))
        html +=
            '<details><summary>Molle rotazionali agli estremi</summary><p class="help">Rigidezza tra asta e nodo in EJ/b. Il valore 0 mantiene il collegamento rigido.</p><div class="props">' +
            (o.hi ? '' : field('springI', 'k in ' + esc(o.a), o.springI || 0)) +
            (o.hj ? '' : field('springJ', 'k in ' + esc(o.b), o.springJ || 0)) +
            '</div></details>';
      html += '<span class="cap">Rigidezza</span><div class="props">' +
          (o.type === 'beam' ? field('ei', 'Rigidezza [EJ]', o.ei) : '') +
          field('ea', 'EA [EJ/b²]', o.ea) +
          '</div><details><summary>Deformazioni impresse</summary><div class="props">' +
          field('eps', 'ε [Fb²/EJ]', o.eps) + (o.type === 'beam' ? field('kappa', 'θ [Fb/EJ]', o.kappa) : '') +
          '</div></details>';
    } else {
      const restraint = model.nodes.filter(n => n.support !== 'free').length;
      html +=
          `<div class="setting"><span>Schema</span><strong>Telaio piano</strong></div><div class="setting"><span>Vincoli esterni</span><strong>${
              restraint}</strong></div><div class="setting"><span>Unità</span><strong>F · b · EJ</strong></div><span class="cap">Metodo delle forze</span>` +
          select('release', 'Incognita da rilasciare', releaseList(), model.release) +
          check('axial', 'Includi la deformabilità assiale', model.axial) +
          `<details class="model-opts"><summary>Impostazioni del disegno</summary><div class="props"><label class="span2">Nome del modello<input id="rename" maxlength="70" value="${
              esc(model.title)}"></label><label>Passo griglia [b]<select id="grid">${
              options([.1, .25, .5, 1, 2].map(n => [n, fmt(n)]), step)}</select></label></div></details>`;
    }
    if (selection)
      html += '<button class="delete" id="remove">Elimina ' + (isNode ? 'nodo' : 'asta') + '</button>';
    $('#inspector').innerHTML = html;
    $('#object').onchange = e => {
      selection = e.target.value;
      render();
    };
    document.querySelectorAll('[data-prop]').forEach(input => input.onchange = () => {
      const key = input.dataset.prop, numeric = input.hasAttribute('data-numeric');
      const value = numeric ? NumericDisplay.parse(input.value) : input.type === 'checkbox' ? input.checked : input.value;
      if (numeric && (!Number.isFinite(value) || (['ei', 'ea'].includes(key) && value <= 0) ||
          (['springI', 'springJ'].includes(key) && value < 0))) {
        input.setCustomValidity('Inserisci un decimale o una frazione valida. EA ed EJ devono essere positivi e le molle hanno rigidezza positiva o nulla.');
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
        if (key === 'type' && value === 'bar')
          Object.assign(o, {qx: 0, qy: 0, kappa: 0, hi: false, hj: false, springI: 0, springJ: 0, slideI: '', slideJ: ''});
        if (!releaseList().some(([v]) => v === model.release))
          model.release = '';
      }, key === 'x' || key === 'y');
    });
    if ($('#rename'))
      $('#rename').onchange = e => {
        const title = e.target.value.trim() || 'Struttura senza nome';
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
      view = Draft.viewport(model.nodes, width, height);
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
                ([k, t]) => `<button data-tool="${k}" class="${k === tool ? 'active' : ''}" aria-pressed="${
                    k === tool}">${icon(k)} ${t}</button>`)
            .join('') +
        `<button id="undo" aria-label="Annulla modifica" title="Annulla modifica" ${
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
    $('#hint').textContent = first && tool === 'edge' ? 'Primo nodo ' + first + ' · scegli il secondo estremo.' : tips[tool];
    $('#counts').textContent = model.nodes.length + ' nodi · ' + model.members.length + ' aste';
  }
  function analysis() {
    $('#status').innerHTML = result ?
        `<span class="tag">${
            result.free.length ? 'Iperstatica · grado ' + result.free.length : 'Isostatica'}</span>` :
        `<span class="tag pending">${problem ? 'Verifica modello' : 'Da calcolare'}</span>`;
    if (result)
      Report.render($('#analysis'), model, result, ui, newUI => {
        Object.assign(ui, newUI);
        analysis();
      });
    else
      $('#analysis').innerHTML = '<div class="note ' + (problem ? 'error-box' : '') + '">' +
          esc(problem || 'Premi Calcola per ottenere i diagrammi e lo svolgimento del modello corrente.') +
          '</div>';
  }
  function render() {
    $('#model-name').textContent = model.title;
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
      $('#hint').textContent = 'Questi nodi sono già collegati. Scegli un altro estremo.';
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
  $('#example').innerHTML = '<option value="">Modelli</option>' +
      options(Models.examples.map((m, i) => [i, m.title]), '') +
      '<option value="new">＋ Nuovo disegno</option>';
  $('#example').onchange = e => {
    const v = e.target.value;
    if (v === '')
      return;
    load(
        v === 'new' ? {title: 'Nuova struttura', ref: {b: 1000, F: 1000}, nodes: [], members: [], release: '', axial: false} :
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
            !Object.hasOwn(supports, n.support) || ![n.x, n.y, n.fx, n.fy, n.m].every(Number.isFinite))
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
      load(m);
    } catch {
      $('#hint').textContent =
          'Impossibile aprire il file. Seleziona un modello JSON salvato da TrussSolver.';
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

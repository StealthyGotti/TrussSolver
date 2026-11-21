// Italian is the language of the code; English comes from the dictionary in src/i18n.js.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = file => fs.readFileSync(require.resolve('../src/' + file), 'utf8');
function load() {
  const context = vm.createContext({Intl});
  for (const file of ['i18n', 'solver', 'examples', 'numbers', 'section', 'drawing', 'report'])
    vm.runInContext(source(file), context, {filename: file + '.js'});
  return vm.runInContext('({I18n, Mechanics, Models, NumericDisplay, Report})', context);
}
const strings = text => [...text.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(m => m[1]);
// Text of a results tab, rendered into a stand-in host.
function tab(api, model, name, extra = {}) {
  const r = api.Mechanics.solve(model);
  api.NumericDisplay.learn(model);
  const plot = id => ({id, clientWidth: 420, clientHeight: 320, setAttribute() {}});
  const host = {innerHTML: '', querySelectorAll: () => [], querySelector: q => /plot|plv/.test(q) ? plot(q.slice(1)) : null};
  api.Report.render(host, model, r, {tab: name, stage: 'final', comp: 'all', ...extra}, () => {});
  return host.innerHTML.replace(/<[^>]+>/g, ' ');
}

test('Ogni testo dell’interfaccia ha la sua traduzione inglese', () => {
  const {I18n} = load(), wanted = new Set();
  // Texts passed directly to the translator and labels of the page.
  for (const file of ['app', 'report', 'drawing'])
    for (const m of source(file).matchAll(/\b(?:tr|I18n\.t)\(\s*'((?:[^'\\]|\\.)*)'/g))
      wanted.add(m[1]);
  const page = fs.readFileSync(require.resolve('../index.html'), 'utf8');
  for (const m of page.matchAll(/data-t(?:-title|-aria-label)?="([^"]+)"/g))
    wanted.add(m[1]);
  // Texts kept in tables and translated where they are shown: supports, connections, tools and hints,
  // tabs, messages of the solver and of the rename helper, titles of the models.
  const app = source('app');
  for (const name of ['supports', 'connections', 'names', 'tips']) {
    const block = app.slice(app.indexOf('const ' + name + ' = {'));
    strings(block.slice(0, block.indexOf('};'))).filter(s => /[A-Z]/.test(s[0] || '') && s.length > 3).forEach(s => wanted.add(s));
  }
  for (const m of source('solver').matchAll(/fail\(\s*'((?:[^'\\]|\\.)*)'/g))
    wanted.add(m[1]);
  for (const m of source('examples').matchAll(/(?:return|title:) '((?:[^'\\]|\\.)+)'/g))
    wanted.add(m[1]);
  for (const m of source('report').matchAll(/\['[a-z]+', '([A-Z][^']+)'\]/g))
    wanted.add(m[1]);
  assert.ok(wanted.size > 200, 'found ' + wanted.size + ' texts');
  const missing = [...wanted].filter(text => text && !Object.hasOwn(I18n.entries, text));
  assert.deepEqual(missing, []);
  // Placeholders survive the translation.
  for (const [it, en] of Object.entries(I18n.entries))
    assert.deepEqual((en.match(/\{\d\}/g) || []).sort(), (it.match(/\{\d\}/g) || []).sort(), it);
});

test('L’italiano è la lingua di partenza e l’inglese si sceglie', () => {
  const {I18n} = load();
  assert.equal(I18n.lang, 'it');
  assert.equal(I18n.t('Calcola'), 'Calcola');
  assert.equal(I18n.t('Nodo {0}', 'A'), 'Nodo A');
  I18n.use('xx');
  assert.equal(I18n.lang, 'it');
  I18n.use('en');
  assert.equal(I18n.t('Calcola'), 'Solve');
  assert.equal(I18n.t('{0} nodi · {1} aste', 8, 9), '8 nodes · 9 members');
  assert.equal(I18n.locale, 'en-US');
  // A text without an entry stays in Italian and is recorded.
  assert.equal(I18n.t('Testo nuovo'), 'Testo nuovo');
  assert.ok(I18n.missing.has('Testo nuovo'));
});

test('Risultati in inglese: tutte le schede dei cinque temi senza testi mancanti', () => {
  const api = load();
  api.I18n.use('en');
  api.NumericDisplay.setLocale(api.I18n.locale);
  for (const model of api.Models.examples)
    for (const name of ['diagrams', 'reactions', 'equilibrium', 'plv', 'section'])
      tab(api, model, name);
  for (const message of ['Struttura labile. Verifica vincoli, cerniere e collegamenti.', 'Esiste già un nodo con questo nome.'])
    api.I18n.t(message);
  for (const model of api.Models.examples)
    api.I18n.t(model.title);
  assert.deepEqual([...api.I18n.missing], []);
  const plv = tab(api, api.Models.examples[0], 'plv');
  assert.match(plv, /Virtual work table for the redundant X=W AE/);
  assert.match(plv, /member elongation/);
  assert.match(plv, /redundant X=W AE\s+-13\/16Fb/);
  assert.doesNotMatch(plv, /iperstatica|asta|Servizio/);
  // English decimals use a point, Italian ones a comma.
  assert.match(tab(api, api.Models.examples[0], 'section'), /38\.98/);
  assert.match(tab(api, api.Models.examples[0], 'diagrams', {decimals: true}), /-0\.8125/);
  const italian = load();
  assert.match(tab(italian, italian.Models.examples[0], 'section'), /38,98/);
});

// Interface languages. Texts are written in Italian in the code and looked up here when
// English is chosen; a text without an entry is shown in Italian.
const I18n = (() => {
  const en = {
    // Page
    'TrussSolver · Banco di calcolo': 'TrussSolver · Structural workbench',
    'Analisi strutturale 2D': '2D structural analysis',
    'Apri': 'Open',
    'Salva': 'Save',
    'MODELLO ATTIVO': 'ACTIVE MODEL',
    'Mostra decimali': 'Show decimals',
    'Scegli un tema o crea un disegno': 'Choose an exam or start a drawing',
    'Calcola': 'Solve',
    'Tavola di disegno': 'Drawing board',
    'Inquadratura della tavola': 'Board view',
    'Riduci lo zoom': 'Zoom out',
    'Livello di zoom': 'Zoom level',
    'Aumenta lo zoom': 'Zoom in',
    'Inquadra tutta la struttura': 'Fit the whole structure',
    'Editor grafico della struttura piana': 'Graphic editor of the plane structure',
    'Griglia': 'Grid',
    'Proprietà': 'Properties',
    'Analisi strutturale': 'Structural analysis',
    'Modelli': 'Models',
    '＋ Nuovo disegno': '＋ New drawing',
    'Nuova struttura': 'New structure',
    'Struttura senza nome': 'Untitled structure',
    // Models
    'Tema 1 · Telaio con biella AB': 'Exam 1 · Frame with bar AB',
    'Tema 2 · Carrello inclinato e molla rotazionale': 'Exam 2 · Inclined roller and rotational spring',
    'Tema 8 · Doppio pendolo e molla traslazionale': 'Exam 8 · Double pendulum and translational spring',
    'Tema 11 · Pattini interni e carico su un lato': 'Exam 11 · Internal sliders and one-sided load',
    'Tema 13 · Cedimento imposto e asta inclinata': 'Exam 13 · Imposed settlement and inclined member',
    // Board
    'Seleziona': 'Select',
    'Nodo': 'Node',
    'Asta': 'Member',
    'Mano': 'Pan',
    'Annulla modifica': 'Undo',
    'Seleziona un nodo o un’asta per modificarne le proprietà.': 'Select a node or a member to edit its properties.',
    'Tocca la griglia per inserire un nodo. Puoi regolare le coordinate nelle proprietà.':
        'Click the grid to add a node. You can adjust its coordinates in the properties.',
    'Seleziona due nodi in sequenza per collegarli con un’asta.': 'Pick two nodes in sequence to join them with a member.',
    'Trascina per spostare la vista. Usa le lenti, la rotellina o due dita per lo zoom.':
        'Drag to move the view. Use the lenses, the wheel or two fingers to zoom.',
    'Primo nodo {0} · scegli il secondo estremo.': 'First node {0} · pick the other end.',
    'Questi nodi sono già collegati. Scegli un altro estremo.': 'These nodes are already joined. Pick another end.',
    '{0} nodi · {1} aste': '{0} nodes · {1} members',
    'Impossibile aprire il file. Seleziona un modello JSON salvato da TrussSolver.':
        'The file cannot be opened. Choose a JSON model saved by TrussSolver.',
    // Status
    'Iperstatica · grado {0}': 'Statically indeterminate · degree {0}',
    'Isostatica': 'Statically determinate',
    'Verifica modello': 'Check the model',
    'Da calcolare': 'Not solved yet',
    'Premi Calcola per ottenere i diagrammi e lo svolgimento del modello corrente.':
        'Press Solve to get the diagrams and the worked solution of the current model.',
    // Properties: selection and node
    'Selezione': 'Selection',
    'Modello completo': 'Whole model',
    'Nodo {0}': 'Node {0}',
    'Asta {0}': 'Member {0}',
    'Nome': 'Name',
    'Lettera del nodo sulla traccia': 'Node letter on the exam sheet',
    'Geometria': 'Geometry',
    'Vincolo esterno': 'Support',
    'Tipo di appoggio': 'Support type',
    'Libero': 'Free',
    'Cerniera a terra': 'Pinned support',
    'Carrello · reazione verticale': 'Roller · vertical reaction',
    'Carrello · reazione orizzontale': 'Roller · horizontal reaction',
    'Doppio pendolo · scorre in orizzontale': 'Double pendulum · slides horizontally',
    'Doppio pendolo · scorre in verticale': 'Double pendulum · slides vertically',
    'Incastro': 'Fixed support',
    'Molle e cedimenti del vincolo': 'Support springs and settlements',
    'Rigidezza della molla interposta fra nodo e terreno. Il valore 0 indica un vincolo rigido.':
        'Stiffness of the spring between the node and the ground. The value 0 means a rigid support.',
    'Spostamento imposto al vincolo, positivo verso destra, verso l’alto o in senso antiorario.':
        'Displacement imposed on the support, positive to the right, upwards or anticlockwise.',
    'k orizzontale [EJ/b³]': 'horizontal k [EJ/b³]',
    'k verticale [EJ/b³]': 'vertical k [EJ/b³]',
    'k rotazionale [EJ/b]': 'rotational k [EJ/b]',
    'u orizzontale [Fb³/EJ]': 'horizontal u [Fb³/EJ]',
    'v verticale [Fb³/EJ]': 'vertical v [Fb³/EJ]',
    'φ rotazione ↺ [Fb²/EJ]': 'rotation φ ↺ [Fb²/EJ]',
    'Carichi nodali': 'Nodal loads',
    'Coppia W ↺ [Fb]': 'Couple W ↺ [Fb]',
    'Elimina nodo': 'Delete node',
    'Elimina asta': 'Delete member',
    // Properties: member
    'Elemento': 'Element',
    'Tipo': 'Type',
    'Trave': 'Beam',
    'Biella': 'Bar',
    'Trave {0}': 'Beam {0}',
    'Biella {0}': 'Bar {0}',
    'Tratteggio': 'Dashed side',
    'Fibre tese per M positivo · {0}': 'Fibres in tension for positive M · {0}',
    'A destra': 'On the right',
    'A sinistra': 'On the left',
    'Collegamenti ai nodi': 'Connections to the nodes',
    'In {0}': 'At {0}',
    'Continuo': 'Continuous',
    'Cerniera': 'Hinge',
    'Pattino · scorre di traverso all’asta': 'Slider · slides across the member',
    'Pattino · scorre lungo l’asta': 'Slider · slides along the member',
    'Pattino · piano inclinato': 'Slider · inclined plane',
    'Carrello · scorre di traverso all’asta': 'Roller · slides across the member',
    'Carrello · scorre lungo l’asta': 'Roller · slides along the member',
    'Carrello · piano inclinato': 'Roller · inclined plane',
    'Piano in {0} · Δx': 'Plane at {0} · Δx',
    'Carico uniforme · assi globali': 'Uniform load · global axes',
    'p lungo x [F/b]': 'p along x [F/b]',
    'q lungo y [F/b]': 'q along y [F/b]',
    'Carichi su un solo lato del nodo': 'Loads on one side of the node',
    'Forze e coppie applicate all’estremo dell’asta, dalla parte dell’asta rispetto a cerniere, pattini e carrelli.':
        'Forces and couples applied to the member end, on the member side of hinges, sliders and rollers.',
    'Molle rotazionali agli estremi': 'Rotational springs at the ends',
    'Rigidezza tra asta e nodo in EJ/b. Il valore 0 mantiene il collegamento rigido.':
        'Stiffness between member and node in EJ/b. The value 0 keeps the connection rigid.',
    'k in {0}': 'k at {0}',
    'Rigidezza': 'Stiffness',
    'Rigidezza [EJ]': 'Stiffness [EJ]',
    'Deformazioni impresse': 'Imposed strains',
    'Inserisci un decimale o una frazione valida. EA ed EJ devono essere positivi e le molle hanno rigidezza positiva o nulla.':
        'Enter a valid decimal or fraction. EA and EJ must be positive and spring stiffnesses cannot be negative.',
    // Properties: whole model
    'Schema': 'Scheme',
    'Telaio piano': 'Plane frame',
    'Vincoli esterni': 'Supports',
    'Unità': 'Units',
    'Metodo delle forze': 'Force method',
    'Incognita da rilasciare': 'Unknown to release',
    'Automatica': 'Automatic',
    ' · reazione in {0}': ' · reaction at {0}',
    ' · sforzo normale di {0}': ' · axial force of {0}',
    ' · coppia in {0} su {1}': ' · couple at {0} on {1}',
    'Includi la deformabilità assiale': 'Include axial deformability',
    'Impostazioni del disegno': 'Drawing settings',
    'Nome del modello': 'Model name',
    'Passo griglia [b]': 'Grid step [b]',
    'Sezione e tensioni': 'Cross-section and stresses',
    'Nessuna verifica': 'No check',
    'Trave, con il lembo inferiore a destra andando da': 'Beam, with the lower edge on the right going from',
    'Sezione nel nodo': 'Section at node',
    'Quota del punto * [mm]': 'Height of point * [mm]',
    'Profilo dal lembo inferiore: quota y e larghezza [mm], un punto per riga':
        'Profile from the lower edge: height y and width [mm], one point per line',
    'La sezione è simmetrica rispetto all’asse verticale. Ripeti la stessa quota per un gradino. Due larghezze diverse a quote diverse danno un tratto inclinato.':
        'The section is symmetric about the vertical axis. Repeat the same height for a step. Two different widths at different heights give a sloping side.',
    'Inserisci un valore positivo.': 'Enter a positive value.',
    'Inserisci la quota del punto in mm.': 'Enter the height of the point in mm.',
    'Ogni riga contiene quota e larghezza, con quote crescenti dal lembo inferiore.':
        'Each line holds a height and a width, with heights increasing from the lower edge.',
    'Il nome usa da 1 a 14 lettere o cifre, senza spazi.': 'The name uses 1 to 14 letters or digits, without spaces.',
    'Esiste già un nodo con questo nome.': 'A node with this name already exists.',
    'Nodo non trovato.': 'Node not found.',
    // Solver messages
    'Disegna almeno un’asta fra due nodi.': 'Draw at least one member between two nodes.',
    'Il limite del banco è di 120 nodi e 200 aste.': 'The workbench is limited to 120 nodes and 200 members.',
    'Gli identificativi dei nodi devono essere univoci e alfanumerici.': 'Node names must be unique and alphanumeric.',
    'Controlla coordinate, vincoli e carichi nodali.': 'Check coordinates, supports and nodal loads.',
    'Le molle dei vincoli richiedono rigidezze positive. Il valore 0 indica un vincolo rigido.':
        'Support springs need positive stiffnesses. The value 0 means a rigid support.',
    'Un cedimento si assegna solo lungo una componente vincolata del nodo.':
        'A settlement can only be given along a restrained component of the node.',
    'Ogni asta richiede due nodi distinti.': 'Every member needs two distinct nodes.',
    'Due aste collegano la stessa coppia di nodi.': 'Two members join the same pair of nodes.',
    'Un’asta ha lunghezza nulla.': 'A member has zero length.',
    'Controlla carichi, deformazioni e rigidezze positive delle aste.': 'Check loads, imposed strains and positive stiffnesses of the members.',
    'Una molla rotazionale richiede un estremo di trave senza cerniera e rigidezza positiva.':
        'A rotational spring needs a beam end without a hinge and a positive stiffness.',
    'La biella ammette carichi solo ai nodi e deformazione iniziale assiale.': 'A bar takes loads at its nodes only and an axial imposed strain.',
    'I carichi di estremità si assegnano alle travi con valori numerici.': 'End loads are given to beams, as numbers.',
    'Pattini e carrelli interni si assegnano agli estremi delle travi.': 'Sliders and internal rollers are assigned to beam ends.',
    'Il piano di scorrimento inclinato richiede una direzione non nulla.': 'The inclined sliding plane needs a non-zero direction.',
    'Collega tutti i nodi in una sola struttura.': 'Join all the nodes into one structure.',
    'Il rilascio scelto non appartiene più al modello.': 'The chosen unknown no longer belongs to the model.',
    'Una coppia agisce su un nodo con sole cerniere.': 'A couple acts on a node where every member is hinged.',
    'Struttura labile. Verifica vincoli, cerniere e collegamenti.': 'The structure is a mechanism. Check supports, hinges and connections.',
    'Questo rilascio produce un meccanismo. Scegli un’altra incognita o la selezione automatica.':
        'Releasing this unknown gives a mechanism. Choose another unknown or the automatic choice.',
    'Corpo libero con carichi non autoequilibrati. Verifica risultante e momento dei carichi o aggiungi i vincoli.':
        'Free body with loads that are not self-balanced. Check the resultant and the moment of the loads, or add supports.',
    'Compatibilità singolare. Attiva la deformabilità assiale e verifica le rigidezze.':
        'Singular compatibility. Turn on axial deformability and check the stiffnesses.',
    'Calcolo fuori scala. Controlla unità e valori inseriti.': 'The computation is out of range. Check units and values.',
    // Results: tabs and stages
    'Azioni interne': 'Internal forces',
    'Reazioni': 'Reactions',
    'Equilibrio': 'Equilibrium',
    'Lavori virtuali': 'Virtual work',
    'Sezione': 'Cross-section',
    'Incognita iperstatica': 'Redundant unknown',
    'Struttura isostatica': 'Statically determinate structure',
    'Soluzione dall’equilibrio': 'Solved by equilibrium alone',
    'Struttura finale': 'Final structure',
    'Struttura principale': 'Primary structure',
    'Servizio': 'Unit-load structure',
    'Principale': 'Primary',
    'Finale': 'Final',
    'Struttura': 'Structure',
    'Struttura da analizzare': 'Structure to show',
    'Azioni interne dopo la sovrapposizione.': 'Internal forces after superposition.',
    'Carichi assegnati sul sistema rilasciato. Tutte le incognite iperstatiche valgono zero.':
        'Given loads on the released system. All redundant unknowns are zero.',
    'Sistema rilasciato con {0} = +1 {1}. Tutte le altre incognite e i carichi assegnati valgono zero.':
        'Released system with {0} = +1 {1}. All other unknowns and the given loads are zero.',
    // Results: internal forces
    'Tutti': 'All',
    'N · Normale': 'N · Axial',
    'T · Taglio': 'T · Shear',
    'M · Momento': 'M · Moment',
    'Azione interna': 'Internal force',
    'Mostra i carichi sullo schema': 'Show the loads on the scheme',
    'Diagrammi in multipli di F per normale e taglio e di Fb per il momento. Le ordinate positive sono disegnate sul lato tratteggiato. Nel diagramma M la curva si trova sul lato delle fibre tese.':
        'Diagrams in multiples of F for axial and shear force and of Fb for the moment. Positive ordinates are drawn on the dashed side. In the M diagram the curve lies on the side of the fibres in tension.',
    'Estremo interno': 'Interior extreme',
    'Equazioni e valori di tutte le aste': 'Equations and values of all members',
    'Ascissa s in unità di b dal primo al secondo nodo dell’asta. I segni di M(s) seguono il tratteggio scelto per ciascuna asta.':
        'Abscissa s in units of b from the first to the second node of the member. The signs of M(s) follow the dashed side chosen for each member.',
    'Convenzione positiva': 'Positive convention',
    'Asta di cui mostrare le equazioni': 'Member whose equations are shown',
    'Equazioni di un’asta': 'Equations of one member',
    'x parte da {0}': 'x starts at {0}',
    ' · la biella ha solo sforzo normale': ' · a bar carries axial force only',
    'carichi assegnati, {0} = 0': 'given loads, {0} = 0',
    'carichi assegnati': 'given loads',
    'effetto di {0}': 'effect of {0}',
    'La riga finale è la somma della principale e dei servizi con il valore dell’incognita: {0}. ':
        'The final row is the sum of the primary and the unit-load rows with the value of the unknown: {0}. ',
    'N e T sono in F e M in Fb, con q = F/b. Il segno di M segue il tratteggio dell’asta.':
        'N and T are in F and M in Fb, with q = F/b. The sign of M follows the dashed side of the member.',
    // Results: reactions
    'Ogni asta è isolata dai nodi. Le frecce mostrano le forze e le coppie che i nodi le trasmettono, con il loro verso effettivo e il valore in multipli di F e di Fb.':
        'Every member is isolated from its nodes. The arrows show the forces and couples that the nodes apply to it, with their actual direction and their value in multiples of F and Fb.',
    'Reazioni vincolari': 'Support reactions',
    'Componente': 'Component',
    'Valore': 'Value',
    'Corpo libero in equilibrio.': 'Free body in equilibrium.',
    'Azioni dei nodi sulle aste': 'Actions of the nodes on the members',
    'Estremo': 'End',
    'H_AB, V_AB e W_AB agiscono sull’asta AB nell’estremo A, positive verso destra, verso l’alto e in senso antiorario.':
        'H_AB, V_AB and W_AB act on member AB at its end A, positive to the right, upwards and anticlockwise.',
    // Results: equilibrium
    'Equilibrio ai nodi': 'Equilibrium of the nodes',
    'Per ogni nodo si impongono ΣFₓ = 0, ΣFᵧ = 0 e, se trasmette coppie, ΣM = 0. Le incognite d’asta sono lo sforzo normale N_AB = N(0) e le coppie di estremità W_AB = −M(0) e W_BA = M(L), positive se antiorarie sull’asta. Agli estremi incernierati il momento vale zero. Ogni pattino o carrello interno aggiunge l’equazione che annulla la forza trasmessa lungo lo scorrimento.':
        'For every node ΣFₓ = 0, ΣFᵧ = 0 and, if it carries couples, ΣM = 0. The member unknowns are the axial force N_AB = N(0) and the end couples W_AB = −M(0) and W_BA = M(L), positive when anticlockwise on the member. At hinged ends the moment is zero. Every slider or internal roller adds the equation that cancels the force passed along the sliding direction.',
    'p e q sono qui le componenti del carico distribuito lungo l’asta e di traverso. Il momento locale è positivo con fibre tese a destra andando dal primo al secondo nodo.':
        'Here p and q are the components of the distributed load along the member and across it. The local moment is positive with the fibres in tension on the right, going from the first to the second node.',
    'Sistema assemblato': 'Assembled system',
    '{0} equazioni indipendenti e {1} incognite. Grado di iperstaticità {2}.':
        '{0} independent equations and {1} unknowns. Degree of static indeterminacy {2}.',
    'Per il corpo libero si fissano tre moti rigidi di riferimento. Le tre reazioni ausiliarie, indicate con *, sono nulle.':
        'For the free body three reference rigid motions are fixed. The three auxiliary reactions, marked with *, are zero.',
    'Equazione': 'Equation',
    'Termine noto': 'Known term',
    'scorrimento in': 'sliding at',
    'Soluzioni dei sistemi statici': 'Solutions of the static systems',
    'Principale: carichi reali con X = 0. In ogni servizio si annullano i carichi reali e si assegna +1 alla corrispondente incognita.':
        'Primary: real loads with X = 0. In every unit-load structure the real loads are removed and +1 is given to its unknown.',
    'Incognita': 'Unknown',
    'Le equazioni di equilibrio determinano tutte le reazioni e le azioni interne. La struttura principale coincide con quella finale.':
        'The equilibrium equations give all the reactions and internal forces. The primary structure is the final one.',
    // Results: virtual work
    'Schema di calcolo iperstatico': 'Released structure for the calculation',
    'Libera la traslazione orizzontale del nodo {0}.': 'Release the horizontal translation of node {0}.',
    'Libera la traslazione verticale del nodo {0}.': 'Release the vertical translation of node {0}.',
    'Libera la rotazione del nodo {0}.': 'Release the rotation of node {0}.',
    'Rimuovi la biella {0} e sostituiscila con il suo sforzo normale.': 'Remove bar {0} and replace it with its axial force.',
    'Consenti uno scorrimento assiale all’origine dell’asta {0}.': 'Allow an axial sliding at the start of member {0}.',
    'Scollega la molla rotazionale e lascia una cerniera all’estremo {0} dell’asta {1}.':
        'Disconnect the rotational spring and leave a hinge at end {0} of member {1}.',
    'Inserisci una cerniera all’estremo {0} dell’asta {1}.': 'Insert a hinge at end {0} of member {1}.',
    'flessione da carichi assegnati': 'bending due to the given loads',
    'flessione da iperstatica': 'bending due to the redundant',
    'Il lavoro virtuale del servizio misura lo spostamento relativo lungo il rilascio, che nella struttura reale è nullo: δ_o + Σ f X = 0.':
        'The virtual work of the unit-load structure measures the relative displacement at the release, which is zero in the real structure: δ_o + Σ f X = 0.',
    'Deformabilità assiale e flessionale attive.': 'Axial and bending deformability are both on.',
    'Si trascura la deformabilità assiale elastica.': 'Elastic axial deformability is neglected.',
    'I momenti sono positivi con fibre tese a destra percorrendo l’asta nel verso della freccia →, e l’ascissa x parte dalla prima lettera.':
        'Moments are positive with the fibres in tension on the right when going along the member in the direction of the arrow →, and the abscissa x starts at the first letter.',
    'Quadro contributi PLV per iperstatica': 'Virtual work table for the redundant',
    'elongazione asta': 'member elongation',
    'deformabilità assiale': 'axial deformability',
    'molla asta': 'member spring',
    'molla del vincolo': 'support spring',
    'cedimento nodo': 'node settlement',
    'totali': 'totals',
    'iperstatica': 'redundant',
    'Sviluppi di calcolo iperstatica': 'Worked integrals for the redundant',
    'Soluzione e sovrapposizione': 'Solution and superposition',
    'Per ciascuna azione S ∈ {N, T, M} il diagramma finale si ottiene da S = S_o + Σ X S_x.':
        'For each internal force S ∈ {N, T, M} the final diagram is S = S_o + Σ X S_x.',
    // Results: cross-section
    'Sezione {0} della trave {1}': 'Section {0} of beam {1}',
    'Azioni interne dal diagramma finale, con b = {0} mm e F = {1} N. Il lembo inferiore della sezione è sul lato tratteggiato, a destra andando da {2} a {3}. La quota y parte dal lembo inferiore, u e v sono gli assi baricentrici.':
        'Internal forces from the final diagram, with b = {0} mm and F = {1} N. The lower edge of the section lies on the dashed side, on the right going from {2} to {3}. The height y starts at the lower edge, u and v are the centroidal axes.',
    'Sezione con assi baricentrici ed ellisse d’inerzia': 'Section with centroidal axes and ellipse of inertia',
    'σ_m è la tensione normale di massimo valore assoluto, nel punto di quota y_m. Nel punto * di quota y_c si calcolano σ_c, τ_c e la tensione di von Mises σ_o. S* è il momento statico rispetto all’asse u della parte di sezione oltre la corda per *.':
        'σ_m is the normal stress of largest absolute value, at the point of height y_m. At the point * of height y_c the check gives σ_c, τ_c and the von Mises stress σ_o. S* is the first moment about the u axis of the part of the section beyond the chord through *.'
  };
  const languages = {it: 'Italiano', en: 'English'};
  const missing = new Set();
  let lang = 'it';
  try {
    const saved = localStorage.getItem('trusssolver-language');
    if (Object.hasOwn(languages, saved))
      lang = saved;
  } catch {
    // No storage: the page starts in Italian.
  }
  // Text in the current language, with {0}, {1}, … replaced by the given values.
  function t(text, ...values) {
    let out = text;
    if (lang === 'en') {
      if (Object.hasOwn(en, text))
        out = en[text];
      else
        missing.add(text);
    }
    return values.length ? out.replace(/\{(\d)\}/g, (_, i) => values[i]) : out;
  }
  function use(code) {
    if (!Object.hasOwn(languages, code))
      return;
    lang = code;
    try {
      localStorage.setItem('trusssolver-language', code);
    } catch {
      // The choice lasts until the page is closed.
    }
  }
  return {
    t, use, languages, missing, entries: en,
    get lang() { return lang; },
    get locale() { return lang === 'en' ? 'en-US' : 'it-IT'; }
  };
})();
if (typeof module !== 'undefined')
  module.exports = I18n;

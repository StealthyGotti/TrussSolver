# TrussSolver

Editor per strutture piane che svolge il metodo delle forze come nei temi d’esame: disegni travi, bielle, vincoli e carichi, scegli l’incognita iperstatica e ottieni i diagrammi di sforzo normale, taglio e momento della struttura principale, di servizio e finale, con il procedimento dei lavori virtuali e la verifica della sezione.

## Avvio

Scarica ed estrai la cartella del progetto, oppure clona il repository. Apri **index.html** con un browser moderno su Windows, macOS o Linux. I file in `src/` e `style.css` devono restare accanto a `index.html`. Il programma funziona offline e non richiede installazioni. Per ospitarlo su un server statico o su GitHub Pages, usa la radice del progetto come cartella del sito.

## Temi d’esame fra i modelli

Il menu **Modelli** contiene cinque temi già svolti, scelti perché insieme coprono tutti i vincoli e i carichi che compaiono nelle tracce. I risultati di ciascuno sono confrontati con la soluzione pubblicata dai test del progetto.

| Modello | Che cosa contiene | Incognita |
| --- | --- | --- |
| [Tema 1](tutorial/01-telaio-con-biella/README.md) | Telaio libero, biella con elongazione termica, cerniere interne | W_AE = −13/16 Fb |
| [Tema 2](tutorial/02-telaio-con-molla/README.md) | Carrello interno su piano inclinato, molla rotazionale, carichi su un lato del nodo, sezione con tratti inclinati | W_FD = 31/42 Fb |
| [Tema 8](tutorial/08-doppio-pendolo-e-molla/README.md) | Doppio pendolo a terra, carrello con molla traslazionale, asta inclinata con curvatura termica | W_BC = −553/264 Fb |
| [Tema 11](tutorial/11-pattini-interni/README.md) | Pattini interni, carico e coppia su un lato del nodo, molla rotazionale | W_AD = 39/31 Fb |
| [Tema 13](tutorial/13-cedimento-imposto/README.md) | Cedimento imposto, carrello interno, asta lunga √5 b | V_G = −59/8 F |

La [raccolta dei tutorial](tutorial/README.md) spiega come leggere schemi, segni e risultati.

## Unità e convenzioni

Il modello si scrive nelle unità delle tracce, senza valori numerici.

| Grandezza | Unità | Esempio |
| --- | --- | --- |
| Lunghezze e coordinate | b | un nodo in x = 2 dista 2b dall’origine |
| Forze H, V | F | `-3` è una forza 3F verso sinistra o verso il basso |
| Coppie W | Fb | positive in senso antiorario |
| Carichi distribuiti p, q | F/b | p lungo x, q lungo y, assi globali |
| Rigidezze flessionali | EJ | `1` su tutte le aste dei temi |
| Molle rotazionali e traslazionali | EJ/b ed EJ/b³ | `3` per k = 3EJ/b |
| Elongazione ε e curvatura θ | Fb²/EJ e Fb/EJ | `-1` per ε = −b²F/EJ |
| Cedimenti e rotazioni imposte | Fb³/EJ e Fb²/EJ | `3` per v = 3b³F/EJ |

- **Verso delle aste.** L’asta AB va da A a B, come nel nome scritto sulla traccia. L’ascissa x parte dalla prima lettera.
- **Tratteggio.** La linea tratteggiata indica il lembo teso per momento positivo e all’inizio sta a destra di chi percorre l’asta da A a B. Puoi spostarla in **Proprietà → Tratteggio**. Nel diagramma M la curva resta sul lato delle fibre tese.
- **Nomi delle incognite.** H_A, V_A e W_A sono le reazioni del vincolo in A. N_AB è lo sforzo normale di AB. W_AB è la coppia che il nodo A trasmette all’asta AB, positiva se antioraria.
- **Frazioni, decimali e radici.** I valori compaiono come frazioni. Con **Mostra decimali**, accanto a **Modelli**, diventano numeri decimali. Se un’asta ha lunghezza irrazionale, per esempio √5 b, i risultati si scrivono con la radice, come −√5/4. Nei campi puoi inserire `3/2` oppure `1,5`.

## Disegno della struttura

Seleziona **Mano** e trascina la tavola con il mouse o con un dito. Le lenti regolano lo zoom, la rotellina ingrandisce attorno al puntatore e **Inquadra tutta la struttura** ripristina la vista d’insieme. Sotto e a sinistra della struttura compaiono le quote in multipli di b.

- **Nodi e aste.** Con **Nodo** tocca la griglia, con **Asta** tocca in sequenza il primo e il secondo nodo. Un carico concentrato intermedio richiede un nodo nel punto di applicazione. I nodi prendono le lettere A, B, C nell’ordine in cui li crei: nelle proprietà del nodo puoi dare a ciascuno la lettera della traccia, così aste e incognite hanno gli stessi nomi della soluzione.
- **Vincoli a terra.** Nelle proprietà del nodo scegli incastro, cerniera, carrello o doppio pendolo. Il doppio pendolo blocca la rotazione e una traslazione. In **Molle e cedimenti del vincolo** assegni la rigidezza di una molla e lo spostamento imposto lungo ogni componente vincolata.
- **Collegamenti interni.** Nelle proprietà dell’asta scegli come ogni estremo si collega al nodo.

  | Collegamento | Che cosa trasmette |
  | --- | --- |
  | Continuo | forza e coppia |
  | Cerniera | solo forza |
  | Pattino | coppia e forza perpendicolare allo scorrimento |
  | Carrello | solo forza perpendicolare allo scorrimento |

  Pattini e carrelli scorrono lungo l’asta, di traverso oppure su un piano inclinato di cui indichi la direzione con Δx e Δy. Per un piano 1:1 inserisci `1` e `1`.
- **Carichi.** Forze e coppie nodali si assegnano al nodo, il carico uniforme all’asta. In **Carichi su un solo lato del nodo** inserisci forze e coppie come H_BA o W_CF, applicate all’estremo di un’asta dalla sua parte rispetto a cerniere, pattini e carrelli.
- **Molle rotazionali e deformazioni impresse.** Le molle fra asta e nodo e i valori di ε e θ si trovano nelle proprietà dell’asta.
- **Incognita.** In **Modello completo** scegli l’incognita da rilasciare oppure lasci la scelta automatica. Ogni modifica richiede un nuovo calcolo.
- **Salvataggio.** **Salva** scarica un file JSON riapribile con **Apri**. La freccia curva annulla l’ultima modifica.

## Risultati

Dopo **Calcola** la sezione **Analisi strutturale** mostra cinque schede, impaginate come i fogli delle soluzioni.

| Scheda | Contenuto |
| --- | --- |
| **Azioni interne** | Diagrammi N, T e M quotati in multipli di F e Fb, per la struttura finale, la principale e ogni servizio. Sotto, le equazioni N(x), T(x) e M(x) dell’asta scelta su principale, servizio e finale |
| **Reazioni** | Aste isolate con le forze e le coppie trasmesse dai nodi, e le reazioni dei vincoli |
| **Equilibrio** | Sistema delle equazioni di equilibrio e soluzioni statiche |
| **Lavori virtuali** | Schema di calcolo iperstatico, M₀ e Mₓ, quadro dei contributi del PLV, sviluppo degli integrali e valore dell’incognita |
| **Sezione** | Area, baricentro, momenti d’inerzia, σ massima, σ, τ e von Mises nel punto assegnato |

Per la verifica della sezione apri **Modello completo → Sezione e tensioni**. Inserisci b in mm e F in N, scegli la trave con il verso che lascia il lembo inferiore a destra, il nodo in cui calcolare le tensioni e la quota del punto *. Il profilo della sezione è l’elenco delle coppie quota e larghezza a partire dal lembo inferiore. La stessa quota ripetuta crea un gradino, due larghezze diverse a quote diverse creano un tratto inclinato. La sezione del tema 1 si scrive così:

```text
0   21
14  21
14  7
50  7
50  49
63  49
```

## Modello meccanico

Analisi elastica lineare di telai piani a piccoli spostamenti, con aste rettilinee di Eulero–Bernoulli e rigidezze costanti per asta. Il solutore assembla le equazioni di equilibrio dei nodi, aggiunge un’equazione per ogni scorrimento libero e separa le incognite iperstatiche. Risolve la struttura principale con i carichi assegnati, poi un servizio per ogni incognita unitaria. I prodotti dei momenti sono polinomi integrati in forma chiusa.

Nell’equazione di congruenza entrano la flessione, l’elongazione e la curvatura impresse, le molle rotazionali, le molle dei vincoli e i cedimenti imposti. La deformabilità assiale elastica è facoltativa ed è spenta nei temi. Una struttura senza vincoli a terra è ammessa se i carichi sono autoequilibrati.

**Limiti.** Una sola struttura connessa per calcolo, carichi distribuiti uniformi, vincoli a terra allineati agli assi, sezioni simmetriche rispetto all’asse verticale. L’incognita è una reazione, uno sforzo normale o una coppia di estremità.

## Codice

Il progetto è scritto in **JavaScript**, con HTML e CSS per l’interfaccia e SVG per i disegni. Non ci sono pacchetti da installare.

| File | Funzione |
| --- | --- |
| [src/solver.js](src/solver.js) | Equilibrio, vincoli interni, campi di sollecitazione, lavori virtuali e congruenza |
| [src/examples.js](src/examples.js) | Temi d’esame disponibili nel menu Modelli |
| [src/section.js](src/section.js) | Proprietà della sezione e tensioni |
| [src/numbers.js](src/numbers.js) | Frazioni, radici e decimali |
| [src/drawing.js](src/drawing.js) e [src/navigation.js](src/navigation.js) | Tavola, simboli dei vincoli, diagrammi, reazioni, spostamento e zoom |
| [src/report.js](src/report.js) e [src/app.js](src/app.js) | Schede dei risultati e comandi dell’editor |

## Verifica

Con Node.js 18 o successivo, dalla cartella del progetto:

```sh
node --test
```

I test confrontano il solutore con casi analitici e i cinque temi con le soluzioni pubblicate: incognita iperstatica, azioni interne di ogni asta, quadro dei lavori virtuali e tensioni nella sezione. Node.js serve solo per eseguire i test.

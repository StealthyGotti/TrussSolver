# TrussSolver

Editor per strutture piane con svolgimento numerico del metodo delle forze. Disegna travi e bielle, scegli un rilascio e confronta i diagrammi di sforzo normale, taglio e momento della principale, di ogni servizio unitario e della struttura finale.

## Avvio

Scarica ed estrai la cartella del progetto, oppure clona il repository. Apri **index.html** con un browser moderno su Windows, macOS o Linux. I file in `src/` e `style.css` devono restare accanto a `index.html`. Il programma funziona offline. Per ospitarlo su un server statico o su GitHub Pages, usa la radice del progetto come cartella del sito.

## Temi svolti

All’avvio trovi il **telaio con biella AB**, unico esempio nel menu **Modelli**. Premi **Calcola**, poi apri **Diagrammi** per confrontare principale, servizio unitario e struttura finale. In **Lavori virtuali** puoi verificare il contributo di ogni asta alla congruenza. In **Sezione H** puoi passare dalle azioni interne alle tensioni.

| Tutorial | Cosa puoi fare |
| --- | --- |
| [1 · Telaio libero con biella](tutorial/01-telaio-con-biella/README.md) | Apri il modello, rilascia un momento, calcola l’iperstatica e verifica il risultato cambiando rilascio. |
| [2 · Telaio con molla rotazionale](tutorial/02-telaio-con-molla/README.md) | Segui lo svolgimento analitico con un carrello interno inclinato e ricostruisci i tre diagrammi finali. |

La [raccolta dei tutorial](tutorial/README.md) include i riferimenti per leggere ordinate, segni e unità.

## Disegno e salvataggio

Seleziona **Mano** e trascina la tavola con il mouse o con un dito. Le lenti **+** e **−** regolano lo zoom dal centro. Con la rotellina puoi ingrandire o ridurre attorno al puntatore anche mentre disegni. Con **Mano** attiva puoi anche avvicinare o allontanare due dita su uno schermo touch. **Inquadra tutta la struttura** ripristina la vista d’insieme.

- Seleziona **Nuovo disegno**, attiva **Nodo** e tocca la griglia. Per inserire un punto con coordinate esatte modifica x e y nelle proprietà del nodo.
- Con **Asta** tocca in sequenza il nodo iniziale e quello finale. Il loro ordine definisce l’asse locale s. Un incrocio collega due aste solo se condividono un nodo. Per un carico concentrato intermedio crea due tratti con un nodo comune.
- Con **Seleziona** tocca un nodo o un’asta, oppure usa l’elenco nelle proprietà. Nei nodi puoi assegnare incastro, cerniera a terra, carrello orizzontale o verticale, forze e coppie. Sulle travi puoi assegnare cerniere di estremità, molle rotazionali, rigidezze, carichi distribuiti uniformi e deformazioni iniziali costanti. Le bielle lavorano assialmente.
- Usa **Modello completo** per scegliere l’incognita o attivare la deformabilità assiale. Quando il grado di iperstaticità è maggiore di uno, il programma completa automaticamente la scelta con rilasci indipendenti. Ogni modifica richiede un nuovo calcolo.
- **Salva** scarica un JSON riapribile con **Apri**. Il pulsante con la freccia curva annulla l’ultima modifica. Salva il modello prima di chiudere la pagina.

## Tratteggio e convenzioni dei diagrammi

Seleziona un’asta sulla tavola e, in **Proprietà → Tratteggio**, scegli **A destra** o **A sinistra** guardando dal primo nodo verso il secondo. La linea tratteggiata indica il lembo teso per momento positivo. La scelta viene salvata nel JSON. Nel primo tema il tratteggio è in basso sulle aste orizzontali e sul lato ovest sui due montanti.

La vista **Tutti** affianca i diagrammi di normale, taglio e momento. Le ordinate positive si riportano sul lato tratteggiato. Invertendo il riferimento di un’asta, N (positivo a trazione) e T mantengono il proprio valore e le loro ordinate passano all’altro lato. Per M cambia il segno riportato e la curva rimane sul lembo fisicamente teso per flessione. Equilibrio, sezione H e prodotti di lavoro virtuale usano i campi meccanici negli assi locali. La tavola di disegno mostra appoggi, cerniere e molle. I diagrammi usano il solo profilo delle aste.

## Modello meccanico

Analisi elastica lineare di telai piani a piccoli spostamenti con aste rettilinee di Eulero–Bernoulli e rigidezze costanti per tratto. L’unità di lunghezza è il metro e quella di forza è il kN. x e y globali sono positivi verso destra e verso l’alto. Le coppie nodali positive agiscono in senso antiorario.

Il solutore assembla le equazioni di equilibrio usando gli sforzi di estremità e le reazioni come incognite. Separa le incognite iperstatiche dalle colonne indipendenti dell’equilibrio. Risolve prima per i carichi reali con tutti i rilasci scarichi, poi per ciascuna azione iperstatica unitaria. I campi N(s), T(s), M(s) sono polinomiali e i prodotti negli integrali di lavoro virtuale vengono integrati per coefficienti. La sovrapposizione finale segue dalla soluzione del sistema di congruenza.

La deformabilità flessionale è sempre attiva. Quella assiale è facoltativa ed è disattivata nel tema iniziale. Le deformazioni assiali e le curvature impresse contribuiscono anche quando si trascura il termine elastico assiale. Per una molla rotazionale all’estremo di un’asta il PLV comprende il prodotto dei due momenti diviso per la rigidezza della molla. Il modello di corpo libero richiede carichi autoequilibrati e usa tre vincoli di riferimento con reazioni nulle.

Questa versione tratta una struttura connessa per calcolo. Restano da implementare carrelli inclinati, cedimenti imposti dei vincoli, molle traslazionali, carichi distribuiti variabili e definizione di sezioni arbitrarie. Il calcolo usa dati numerici. Le espressioni nelle variabili simboliche F, b ed EJ richiedono una normalizzazione.

## Codice

Il progetto è scritto in **JavaScript**. HTML e CSS definiscono l’interfaccia e SVG disegna la struttura e i diagrammi. Non serve installare pacchetti o compilare il progetto.

| File | Funzione |
| --- | --- |
| [src/solver.js](src/solver.js) | Equilibrio, campi di sollecitazione, lavori virtuali e congruenza |
| [src/examples.js](src/examples.js) | Dati del telaio di partenza e costruzione di nodi e aste |
| [src/drawing.js](src/drawing.js) e [src/navigation.js](src/navigation.js) | Tavola SVG, diagrammi, spostamento e zoom |
| [src/app.js](src/app.js) e [src/report.js](src/report.js) | Comandi dell’editor e presentazione del calcolo |
| [src/section.js](src/section.js) | Calcolo delle tensioni nella sezione H del primo tema |

## Verifica del solutore

Con Node.js 18 o successivo, dalla cartella del progetto:

```sh
node --test
```

I test confrontano le soluzioni con casi analitici, controllano equilibrio e congruenza e verificano l’invarianza delle azioni finali al cambio del rilascio. Node.js serve solo per eseguire i test.

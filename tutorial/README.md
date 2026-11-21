**🇮🇹 Italiano** · [🇬🇧 English](README.en.md)

# Temi svolti

Ogni tema si apre dal menu **Modelli** dell’editor oppure con **Apri**, scegliendo il file `modello.json` della sua cartella. Premi **Calcola** e confronta le schede dei risultati con i valori riportati nella guida.

| Tema | Che cosa mostra | Incognita |
| --- | --- | --- |
| [1 · Telaio libero con biella AB](01-telaio-con-biella/README.md) | Struttura senza vincoli a terra, elongazione termica, cambio dell’incognita | W_AE = −13/16 Fb |
| [2 · Carrello inclinato e molla rotazionale](02-telaio-con-molla/README.md) | Carrello interno su piano inclinato, molla nel PLV, sezione con tratti inclinati | W_FD = 31/42 Fb |
| [8 · Doppio pendolo e molla traslazionale](08-doppio-pendolo-e-molla/README.md) | Doppio pendolo a terra, vincolo elastico, curvatura termica | W_BC = −553/264 Fb |
| [11 · Pattini interni](11-pattini-interni/README.md) | Pattini fra aste, carichi su un lato del nodo | W_AD = 39/31 Fb |
| [13 · Cedimento imposto](13-cedimento-imposto/README.md) | Cedimento di un vincolo, incognita forza, lunghezza √5 b | V_G = −59/8 F |

## Come leggere schemi e risultati

- $F$ è la forza di riferimento, $b$ la lunghezza di riferimento ed $EJ$ la rigidezza flessionale. $W=Fb$ è la coppia di riferimento e $q=F/b$ il carico distribuito di riferimento.
- La doppia lettera di un’asta indica il verso di percorrenza: su CA l’ascissa $x$ parte da C e cresce verso A.
- Il tratteggio sta a destra di chi percorre l’asta e identifica il lembo teso per **momento positivo**. Il diagramma del momento si disegna sul lembo teso.
- $W_{AB}$ è la coppia che il nodo A trasmette all’asta AB, positiva se antioraria. $H$ e $V$ sono positive verso destra e verso l’alto.
- Le ordinate dei diagrammi sono multipli di $F$ per normale e taglio e di $Fb$ per il momento.

Nella scheda **Lavori virtuali** il quadro dei contributi riporta ogni asta letta dai due estremi, per esempio CA e AC. Le due righe descrivono lo stesso diagramma e danno lo stesso integrale.

[Torna al progetto](../README.md)

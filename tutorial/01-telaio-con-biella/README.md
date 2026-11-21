# 1 · Telaio libero con biella AB

Apri `index.html` e premi **Calcola** sul tema iniziale. Puoi anche scegliere **Apri** e caricare [modello.json](modello.json). Lo scopo è trovare lo sforzo nella biella AB e i diagrammi del telaio usando come incognita il momento trasmesso in A.

![Telaio con le cerniere in D, E e F, la biella AB e i carichi applicati](schema.svg)

## 1. Controlla l’equilibrio prima del rilascio

Il telaio ha larghezza $2b$ e altezza $4b$. Usa $b=0{,}48$ m, $F=1{,}5$ kN e $q=F/b$. Su DG agisce un carico uniforme verso il basso, su EH uno verso l’alto. Entrambi hanno intensità $7q$ e lunghezza $b$. In H agisce una coppia antioraria $5Fb$. La biella presenta una deformazione assiale impressa uniforme $\varepsilon_{AB}=-b^2F/EJ$. Si trascura la deformabilità assiale elastica.

Il telaio è libero. Le forze orizzontali danno $2F-3F+F=0$ e i due carichi verticali hanno risultanti opposte. Prendendo i momenti rispetto a E, con segno positivo antiorario, si ottiene

$$
(3F)(2b)-F(4b)-(7F)(3b/2)+(7F)(b/2)+5Fb=0.
$$

I tre riferimenti che il solutore introduce per bloccare i moti rigidi hanno quindi reazioni nulle.

## 2. Costruisci principale e servizio

Il telaio ha una sola iperstatica. Rilascia il momento in A sull’estremità finale dell’asta **E → A** e chiama $X$ la coppia antioraria esercitata su quell’estremità. Sulla parte collegata agisce la coppia opposta.

- **Principale.** Poni $X=0$, mantieni i carichi assegnati e risolvi l’equilibrio. AB ha solo sforzo normale. Il momento si annulla nelle cerniere D, E e F e sul lato rilasciato in A.
- **Servizio.** Togli i carichi assegnati e applica la coppia unitaria al rilascio con il verso scelto. Indica con $m_1$ il momento e con $n_1$ la normale per unità di $X$. La deformazione impressa entrerà nel lavoro virtuale.

Usa $\xi=s/b$ misurata dalla prima lettera alla seconda. Le colonne dei momenti usano gli assi locali del calcolo, così puoi moltiplicarle direttamente nel PLV. Per esempio, sul tratto DG l’equilibrio di un segmento dà $M_0(s)=(11F/4)s-(7q/2)s^2$. Il primo termine viene dal taglio in D, il secondo dal carico distribuito.

| Tratto | $L/b$ | $M_0/(Fb)$ | $m_1$ | $N_0/F$ | $b\,n_1$ |
| --- | ---: | --- | --- | ---: | ---: |
| AB | 2 | 0 | 0 | 35/8 | 1 |
| CD | 1 | $-11/4+11\xi/4$ | 0 | −11/8 | −1/2 |
| EA | 2 | 0 | $\xi/2$ | −11/4 | 0 |
| CA | 2 | $11/4-11\xi/8$ | $-\xi/2$ | −11/4 | 0 |
| BF | 2 | $4-2\xi$ | $1-\xi/2$ | −17/4 | 0 |
| GB | 2 | $-3/4+19\xi/8$ | $\xi/2$ | −17/4 | 0 |
| HF | 1 | $-17/4+17\xi/4$ | 0 | −2 | −1/2 |
| DG | 1 | $11\xi/4-7\xi^2/2$ | 0 | −11/8 | −1/2 |
| EH | 1 | $-11\xi/4+7\xi^2/2$ | 0 | −2 | −1/2 |

## 3. Imponi la congruenza in A

La rotazione relativa al rilascio deve essere nulla. In **Lavori virtuali** trovi le due quantità dell’equazione $\delta_{10}+f_{11}X=0$.

$$
\delta_{10}=\sum_e\int_e\frac{m_1 M_0}{EJ}\,ds
+\int_{AB} n_1\varepsilon_{AB}\,ds,
\qquad
f_{11}=\sum_e\int_e\frac{m_1^2}{EJ}\,ds.
$$

Per esempio, su CA il prodotto $(-\xi/2)(11/4-11\xi/8)$ integrato tra 0 e 2 dà $-11/12$. La deformazione impressa della biella contribuisce per $(1/b)(-b^2F/EJ)(2b)=-2Fb^2/EJ$.

| Contributo | $\delta_{10}$ in unità $Fb^2/EJ$ | $f_{11}$ in unità $b/EJ$ |
| --- | ---: | ---: |
| EA | 0 | 2/3 |
| CA | −11/12 | 2/3 |
| BF | 8/3 | 2/3 |
| GB | 29/12 | 2/3 |
| AB, deformazione impressa | −2 | 0 |
| **Totale** | **13/6** | **8/3** |

$$
X=-\frac{\delta_{10}}{f_{11}}=-\frac{13}{16}Fb=-0{,}585\ \mathrm{kN\,m}.
$$

## 4. Ricostruisci i diagrammi e verifica la sezione H

Su ogni tratto usa $M=M_0+Xm_1$, $N=N_0+Xn_1$ e $T=dM/ds$ negli assi locali della tabella. Per AB ottieni $N_{AB}=(35/8-13/16)F=57F/16=5{,}34375$ kN, quindi la biella è tesa. Sul tratto caricato DG il taglio si annulla a $s=11b/28$, dove il momento ha un estremo.

![Diagrammi finali affiancati di normale, taglio e momento con il lembo di riferimento tratteggiato](diagrammi.svg)

In H leggi le azioni **dal lato HF**, a $s=0$. La coppia applicata produce un salto nel diagramma del momento fra i due lati del nodo.

| Azione in H | Valore |
| --- | ---: |
| $N$ | −2,390625 kN |
| $T$ | +6,375 kN |
| $M$ | −3,060 kN·m |

Nella scheda **Sezione H** la quota $y$ parte dal lembo inferiore. Le tre fasce hanno larghezza × altezza di 21 × 14, 7 × 36 e 49 × 13 mm, dal basso verso l’alto. Sommando aree e momenti statici ottieni $A=1183$ mm² e $y_g=38{,}979$ mm. Con il teorema di trasporto risulta $J_x=549474$ mm⁴. Nel punto a $y=15$ mm lo spessore è 7 mm e il momento statico della parte superiore è circa 9573 mm³.

Usa N e mm in $\sigma=N/A-M(y-y_g)/J_x$ e $\tau=TQ/(J_x t)$. Nel punto trovi $\sigma=-135{,}6$ MPa, $\tau=15{,}87$ MPa e $\sqrt{\sigma^2+3\tau^2}=138{,}3$ MPa. La tensione normale di massimo valore assoluto è **−219,1 MPa** al lembo inferiore.

**Controllo nell’editor.** In **Modello completo → Incognita da rilasciare** scegli la normale di A–B e premi di nuovo **Calcola**. Ora l’incognita è direttamente $N_{AB}=5{,}34375$ kN. Principale e servizio cambiano, mentre i tre diagrammi finali coincidono con quelli sopra.

[Indice dei tutorial](../README.md)

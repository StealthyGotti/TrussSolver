**🇮🇹 Italiano** · [🇬🇧 English](README.en.md)

# 2 · Carrello inclinato e molla rotazionale

Scegli **Modelli → Tema 2** oppure apri [modello.json](modello.json). L’incognita è la coppia $W_{FD}$ trasmessa dalla molla rotazionale in F. Il tema usa un carrello interno su piano inclinato e due forze applicate su un solo lato del nodo.

![Telaio con carrello interno inclinato in B, molla rotazionale in F e carrelli a terra in E, D e C](schema.svg)

## 1. Come è inserito nell’editor

- **Carrello interno in B.** Seleziona l’asta BG. Il collegamento in B è **Carrello · piano inclinato** con Δx = 1 e Δy = 1, cioè il piano 1:1 della traccia. Il carrello trasmette solo una forza perpendicolare al piano, con componenti di uguale modulo e segno opposto.
- **Molla in F.** L’asta FD ha in F una molla rotazionale di rigidezza 3, cioè $k=3EJ/b$. Sulla tavola compare come doppio cerchio.
- **Forze su un lato.** $H_{BA}=-F$ è inserita in **Carichi su un solo lato del nodo** dell’asta AB, nell’estremo B: agisce su AB, al di sotto del carrello. $H_{CA}=-F$ è inserita allo stesso modo sull’asta CA in C.
- **Cerniere.** In D e in C tutte le aste sono incernierate. In E il cerchio appartiene al carrello a terra e l’angolo resta rigido.

Gli altri dati sono la coppia $-W$ in A, il carico $-q$ su BG e l’elongazione $\varepsilon_{CA}=-b^2F/EJ$.

## 2. Principale e servizio

Scollega la molla in F lasciando una cerniera. La scheda **Lavori virtuali** mostra lo schema di calcolo con le due coppie $X$, il diagramma $M_o$ dei carichi assegnati e $M_x$ per $X=1$. Con $\xi=x/b$ dalla prima lettera:

| Asta | $L/b$ | $M_o/(Fb)$ | $M_x$ |
| --- | ---: | --- | --- |
| AB | 1 | $2/3-2\xi/3$ | 0 |
| CA | 1 | $\xi$ | $-\xi$ |
| DE | 1 | $-5\xi/6$ | 0 |
| FD | 1 | 0 | $-1+\xi$ |
| GE | 1 | $1/6+2\xi/3$ | 0 |
| BG | 1 | $-\xi/3+\xi^2/2$ | 0 |
| AD | 2 | $4/3-2\xi/3$ | $-1+\xi/2$ |
| CF | 2 | 0 | $-\xi/2$ |

## 3. Il lavoro virtuale, compresa la molla

Sul tratto CA il servizio dà $N_x=1/(2b)$ e l’elongazione produce $N_x\varepsilon_{CA}b=-Fb^2/(2EJ)$. La molla aggiunge $1/k=b/(3EJ)$ alla flessibilità, perché nel servizio trasmette una coppia unitaria.

| Contributo | $\delta_o$ in $Fb^2/EJ$ | $f$ in $b/EJ$ |
| --- | ---: | ---: |
| CA | −1/3 | 1/3 |
| FD | 0 | 1/3 |
| AD | −8/9 | 2/3 |
| CF | 0 | 2/3 |
| CA, elongazione | −1/2 | 0 |
| FD, molla | 0 | 1/3 |
| **Totale** | **−31/18** | **7/3** |

$$
X=W_{FD}=\frac{31}{42}Fb.
$$

## 4. Diagrammi finali

| Asta | $N/F$ | $M(0)/(Fb)$ | $M(L)/(Fb)$ |
| --- | ---: | ---: | ---: |
| AB | −1/3 | 2/3 | 0 |
| CA | −53/84 | 0 | 11/42 |
| DE | −2/3 | 0 | −5/6 |
| FD | −31/84 | −31/42 | 0 |
| GE | −1/3 | 1/6 | 5/6 |
| BG | −1/3 | 0 | 1/6 |
| AD | −13/14 | 25/42 | 0 |
| CF | −31/42 | 0 | −31/42 |

Su BG il momento ha un minimo interno $-Fb/18$ a $x=b/3$ e passa per zero a $x=2b/3$.

![Diagrammi finali di normale, taglio e momento](diagrammi.svg)

## 5. Sezione E della trave DE

La sezione ha un piede di 24 × 12 mm, un’anima larga 12 mm fino a quota 35, un’ala larga 48 mm fino a quota 48 e un tratto triangolare che si chiude a quota 54. Nel profilo dell’editor il triangolo è la riga finale `54  0` dopo `48  48`.

Con $b=510$ mm e $F=5610$ N le azioni in E sono $N=-3740$ N, $T=-4675$ N e $M=-2\,384\,250$ N·mm.

| Grandezza | Valore |
| --- | ---: |
| $A$ | 1332 mm² |
| $y_g$ | 31,01 mm |
| $J_u$ | 341 004 mm⁴ |
| $S^*$ nel punto a $y=13$ mm | 7426 mm³ |
| $\sigma_m$ al lembo inferiore | −219,6 N/mm² |
| $\sigma_c$, $\tau_c$ nel punto * | −128,8 e 8,484 N/mm² |
| von Mises nel punto * | 129,6 N/mm² |

[Indice dei tutorial](../README.md)

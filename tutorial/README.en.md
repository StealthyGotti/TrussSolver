[🇮🇹 Italiano](README.md) · **🇬🇧 English**

# Worked exams

Each exam opens from the **Models** menu of the editor, or with **Open** by choosing the `modello.json` file in its folder. Press **Solve** and compare the result tabs with the values given in the guide.

| Exam | What it shows | Unknown |
| --- | --- | --- |
| [1 · Free frame with bar AB](01-telaio-con-biella/README.en.md) | Structure without supports, thermal elongation, change of the unknown | W_AE = −13/16 Fb |
| [2 · Inclined roller and rotational spring](02-telaio-con-molla/README.en.md) | Internal roller on an inclined plane, spring in the PVW, cross-section with sloping sides | W_FD = 31/42 Fb |
| [8 · Double pendulum and translational spring](08-doppio-pendolo-e-molla/README.en.md) | Double-pendulum support, elastic support, thermal curvature | W_BC = −553/264 Fb |
| [11 · Internal sliders](11-pattini-interni/README.en.md) | Sliders between members, loads on one side of the node | W_AD = 39/31 Fb |
| [13 · Imposed settlement](13-cedimento-imposto/README.en.md) | Settlement of a support, force unknown, length √5 b | V_G = −59/8 F |

## How to read schemes and results

- $F$ is the reference force, $b$ the reference length and $EJ$ the bending stiffness. $W=Fb$ is the reference couple and $q=F/b$ the reference distributed load.
- The two letters of a member give its direction of travel: on CA the abscissa $x$ starts at C and grows towards A.
- The dashed side lies on the right of someone travelling along the member and marks the fibres in tension for a **positive moment**. The bending moment diagram is drawn on the side of the fibres in tension.
- $W_{AB}$ is the couple that node A transmits to member AB, positive if anticlockwise. $H$ and $V$ are positive to the right and upwards.
- The ordinates of the diagrams are multiples of $F$ for axial and shear force and of $Fb$ for the bending moment.

In the **Virtual work** tab the virtual work table lists each member read from both ends, for example CA and AC. The two rows describe the same diagram and give the same integral.

[Back to the project](../README.en.md)

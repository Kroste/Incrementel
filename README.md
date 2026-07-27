# Singularität

Ein 2D-Incremental im Browser. Du fütterst ein schwarzes Loch mit Partikeln, es
wächst, verschluckt mehr, und irgendwann kollabiert dein Universum, damit ein
größeres entstehen kann.

Keine Installation, keine Dependencies – reines HTML/CSS/JS.

---

## Starten

**Option A — Doppelklick:** `index.html` direkt im Browser öffnen.
Moderne Browser (Chrome, Firefox, Edge) erlauben LocalStorage auch über
`file://`, dein Fortschritt wird also gespeichert.

**Option B — Lokaler Webserver** (empfohlen, falls Save-Probleme auftauchen):

```bash
python3 -m http.server 5177
```

Dann im Browser `http://127.0.0.1:5177/` öffnen.

---

## Bedienung

| Aktion               | Effekt                                              |
| -------------------- | --------------------------------------------------- |
| **Linksklick** auf's Spielfeld | Schockwelle – absorbiert alle Partikel im Radius |
| **Leertaste**        | Klick am Zentrum (Autoclicker-Ersatz)               |
| Shop-Tabs (rechts)   | Upgrades / Partikel / DM / MV / Stats               |
| 💾 in der Top-Bar    | Manuell speichern (Auto-Save alle 15 s ist an)      |
| 🔊 / 🔇              | Mute an/aus                                         |
| ☠                    | Hard-Reset (löscht alles inkl. Dark Matter/Kosmos)  |
| **KOLLAPS**-Button   | Prestige 1 – siehe unten                            |
| **BIG BANG**-Button  | Prestige 2 – siehe unten                            |

---

## Der Kern-Loop

1. **Partikel** driften vom Rand des Spielfelds zur Singularität in der Mitte.
2. Die **Gravitation** zieht sie an – je näher, desto stärker. Die farbige
   Aura um die Singularität zeigt die Reichweite.
3. Berühren sie den **Ereignis-Horizont** (die schwarze Scheibe), werden sie
   absorbiert und du erhältst **Masse**.
4. Masse ist die Basis-Währung. Damit kaufst du **Upgrades** im Shop.

Klicken beschleunigt alles: Jeder Klick löst eine **Schockwelle** aus, die
sofort alle Partikel im Radius absorbiert – mit einem separaten Multiplikator.
Klicken bleibt bis ins späte Spiel relevant, weil der Klick-Multiplikator hoch
skaliert.

---

## Upgrades (Masse)

Sieben Upgrades im Tab **Upgrades**. Jedes hat sein spezifisches Growth –
Frühkauf-Bias, wenn du klickst und knapp bei Kasse bist:

| Upgrade                | Was es tut                                          |
| ---------------------- | --------------------------------------------------- |
| **Gravitations-Feld**  | Reichweite + Kraft der Anziehung                    |
| **Ereignis-Horizont**  | Größerer Absorb-Radius                              |
| **Massen-Kondensator** | Jedes Partikel gibt mehr Masse                      |
| **Partikel-Generator** | Mehr Partikel pro Sekunde                           |
| **Klick-Impuls**       | Wave-Radius und Klick-Ertrag                        |
| **Auto-Kollektor**     | Passive Drohnen sammeln, auch wenn du weg bist      |
| **Kollektor-Kraft**    | Rate der Auto-Kollektoren                           |

Alle Upgrades werden bei einem Kollaps zurückgesetzt – aber du kaufst sie mit
jedem Zyklus dank Dark-Matter-Boni schneller wieder hoch.

---

## Partikel-Typen

Im Tab **Partikel** siehst du acht Materie-Klassen mit steigendem Wert. Jede
wird bei einer bestimmten Gesamt-Masse *entdeckbar* und muss dann einmalig
freigeschaltet werden:

| Typ              | Wert (Basis) | Freischalt-Schwelle |
| ---------------- | ------------ | -------------------- |
| Wasserstoff      | 1            | von Anfang an        |
| Ion              | 8            | 25 Masse             |
| Photon           | 55           | 500                  |
| Neutron          | 380          | 5 K                  |
| Quark            | 2,8 K        | 50 K                 |
| Antimaterie      | 22 K         | 600 K                |
| Exotische Mat.   | 180 K        | 8 M                  |
| Kosmische Energie| 1,6 M        | 120 M                |

Freischaltungen bleiben **über alle Prestiges hinweg erhalten** – einmal
entdeckte Materie ist Wissen des Multiversums.

---

## Prestige 1 — Kollaps (Dark Matter)

Sobald du **1 M Masse** erreicht hast, wird der Kollaps-Button aktiv. Ein
Kollaps

- resetet **Masse und alle Masse-Upgrades**
- gibt dir **Dark Matter** = `⌊√(Masse / 1 M) × DM-Gewinn-Mult⌋`
- schaltet permanente **DM-Upgrades** frei

Dark-Matter-Upgrades (Tab **DM**):

- **Ur-Materie** – Start jeder neuen Runde mit vorgefertigter Masse
- **Ertrag-Resonanz** – alle Erträge stärker
- **Feld-Instabilität** – höhere Spawn-Rate
- **Impuls-Katalyse** – gewaltigere Klicks
- **Kollaps-Effizienz** – mehr DM pro Kollaps
- **Seltenheits-Sog** – seltene Partikel häufiger
- **Zeit-Anker** – bessere Offline-Progression

**Tipp:** Der erste Kollaps ist ca. 10–15 min Spielzeit, danach beschleunigt
sich der Loop massiv.

---

## Prestige 2 — Big Bang (Kosmos)

Ab **100 Total-Dark-Matter** wird der zweite Prestige-Layer sichtbar: der
`MV`-Tab, der Kosmos-HUD-Block und der BIG-BANG-Button.

Ein Big Bang

- resetet **Masse, Upgrades UND Dark Matter + DM-Upgrades**
- gibt dir **Kosmos** = `⌊√(Total-DM / 10) × Sog-Mult⌋`
- schaltet permanente **Kosmos-Upgrades** frei
- **behält** Partikel-Freischaltungen und Achievements

Kosmos-Upgrades (Tab **MV**):

| Upgrade                     | Effekt                                        |
| --------------------------- | --------------------------------------------- |
| **Kosmische Konstante**     | Alle Erträge, Klicks, Auto ×(1 + Lv·0,35)     |
| **Kosmisches Echo**         | Behalte 5–50 % Dark Matter beim Big Bang      |
| **Anomalie-Frequenz**       | Chaos-Events treten häufiger auf              |
| **Anomalie-Verlängerung**   | Chaos-Events halten länger                    |
| **Multiverse-Sog**          | Mehr Kosmos pro Big Bang                      |
| **Goldene Prägung**         | Goldene Kerne sind wertvoller                 |

Der erste Big Bang lohnt sich früh (3 Kosmos für 1 Kaufkraft). Ab einigen
Multiverses stackt die Kosmische Konstante alle anderen Systeme multiplikativ
– dann geht's richtig los.

---

## Chaos-Events

Alle 90–180 s (kürzer mit Anomalie-Frequenz-Upgrade) taucht ein temporäres
Event auf. Oben mittig erscheint ein Banner mit Icon, Beschreibung und
Countdown-Bar.

| Icon | Event                | Effekt                                | Dauer |
| ---- | -------------------- | ------------------------------------- | ----- |
| ☄    | Meteoritenschauer    | Spawn ×5, seltene Partikel ×1,5       | 25 s  |
| ◉    | Wurmloch             | Klick-Kraft ×25                       | 30 s  |
| ⌛    | Zeitverzerrung       | Alles läuft 2× schneller, Ertrag ×1,5 | 20 s  |
| ✦    | Dunkle Anomalie      | Auto-Kollektoren ×5                   | 40 s  |
| ≋    | Gravitations-Sturm   | Reichweite ×3, Absorb-Radius ×1,5     | 25 s  |
| ★    | Goldener Kern        | Cookie-Clicker-Style – siehe unten    | 18 s  |

Die Events greifen multiplikativ auf die bestehenden Werte – bei aktivem Event
und gutem Setup fliegen deine Zahlen kurzfristig um Größenordnungen nach oben.

### Goldener Kern

Ein einzelnes goldenes Partikel treibt langsam quer über den Screen. Klick es
und du bekommst **10 % deiner aktuellen Masse** als Bonus (mindestens 500),
skaliert mit dem *Goldene Prägung*-Upgrade. Wenn du es verpasst, verschwindet
es nach ca. 15 s wieder – sei aufmerksam, wenn das Banner erscheint.

---

## Achievements

12 Achievements im Tab **Stats**. Sie sind reine „Trophäen" (keine
mechanischen Effekte), decken aber die wichtigsten Meilensteine ab: erste
Masse, erste Kollapse, erster Big Bang, Erwischen eines Golden Cores, etc.

---

## Automatik & Meta

- **Auto-Save** alle 15 s in LocalStorage (`singularitaet_save_v1`)
- **Beim Tab-Schließen** wird zusätzlich gesichert
- **Offline-Progression:** bei mindestens einem Auto-Kollektor kriegst du
  Masse für die Abwesenheitszeit (Cap: 12 h, Effizienz startet bei 50 % und
  steigt mit *Zeit-Anker*)
- Ein Willkommen-zurück-Dialog zeigt dir den Gewinn beim nächsten Besuch

---

## Fortschritts-Kompass (Faustregeln)

**Session 1 (0–15 min):**
Klick viel. Kauf **Yield** und **Spawn**, dann das erste **Ion** (25 Masse
Schwelle, 50 Masse Kaufpreis). Ziel: **1. Kollaps** ab 1 M Masse.

**Session 2–5 (15 min – 1 h):**
Investiere DM zuerst in **Ur-Materie** (schnellerer Restart) und
**Ertrag-Resonanz**. Freischalten von Photon → Neutron. Ab ca. 100 Total-DM
öffnet sich das Multiverse.

**Erster Big Bang:**
3 Kosmos reichen für Lv 1 **Kosmische Konstante** (–4 % effektive Beschleunigung
für 35 % *Alles*-Multi). Danach lohnt sich **Multiverse-Sog** früh.

**Late Game:**
Kombiniere ★ Goldene-Kern-Events mit hoher aktueller Masse (nicht sofort in
Upgrades verballern) – ein einziger Klick kann die nächsten Prestige-Schwellen
sprengen.

---

## Reset / Debug

- **☠-Button:** löscht Save inklusive Kosmos, DM, Achievements – für einen
  echten Neustart.
- **Manuell:** im Browser DevTools → Console:
  ```js
  localStorage.removeItem('singularitaet_save_v1'); location.reload();
  ```

---

## Datei-Struktur

```
Incrementel/
├── index.html   — Markup (HUD, Shop, Modals)
├── style.css    — komplettes Styling
├── game.js      — Spiel-Logik, Rendering, Save/Load
└── README.md    — dieses Dokument
```

Balance-Zahlen sitzen alle oben in `game.js` in den Arrays
`UPGRADES`, `DM_UPGRADES`, `MULT_UPGRADES`, `EVENTS` und `PARTICLE_TYPES` –
falls du selbst tunen willst, ist das der Einstiegspunkt.

---

## Support & Links

- **Repo:** <https://github.com/Kroste/Incrementel>
- **Bugs / Ideen:** GitHub Issues im Repo
- **Buy me a coffee:** <https://www.buymeacoffee.com/kroste>

Im Spiel findest du beides auch hinter dem **ⓘ-Button** oben rechts (Info- /
Support-Modal mit Version, GitHub- und BMC-Link).

Autor: Lars Oste · <lars-oste@gmx.de>

## Lizenz

MIT – siehe `LICENSE` (falls vorhanden).

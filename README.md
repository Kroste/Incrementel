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

Im Tab **Partikel** siehst du bis zu **28 Materie-Klassen** mit steigendem
Wert. Die Physik-Klassen sind ab Runde 1 verfügbar, 12 weitere (inklusive
Sternen, Neutronensternen und einem Mini-Schwarzen-Loch) schalten sich nach
Big Bangs auf. Jede Klasse muss pro Zyklus einmal freigeschaltet werden.

### Physik-Spektrum (Runde 1)

| Typ              | Wert (Basis) | Freischalt-Schwelle |
| ---------------- | ------------ | -------------------- |
| Wasserstoff      | 1            | von Anfang an        |
| Elektron         | 3            | 8 Masse              |
| Ion              | 8            | 25 Masse             |
| Neutrino         | 20           | 120                  |
| Photon           | 55           | 500                  |
| Proton           | 150          | 1,5 K                |
| Neutron          | 380          | 5 K                  |
| Muon             | 1 K          | 15 K                 |
| Quark            | 2,8 K        | 50 K                 |
| Tauon            | 8 K          | 150 K                |
| Antimaterie      | 22 K         | 600 K                |
| Higgs-Boson      | 60 K         | 2 M                  |
| Exotische Mat.   | 180 K        | 8 M                  |
| Gluon            | 500 K        | 30 M                 |
| Kosmische Energie| 1,6 M        | 120 M                |

### Post-Kosmos + Stellare Objekte (per Big Bang)

Neue Klassen schalten sich mit jedem Big Bang auf. Sterne, Pulsare und das
Mini-Schwarzloch haben eigene Renderer (Strahlen, rotierende Beams,
Rainbow-Pulse, Event-Horizon):

| Typ                | Wert  | Freischalt-Schwelle | Nach BB | Visual        |
| ------------------ | ----- | ------------------- | ------- | ------------- |
| Dunkelmaterie      | 12 M  | 1 B                 | 1       | Standard      |
| ☀ Weißer Zwerg     | 30 M  | 3 B                 | 1       | Stern-Strahlen|
| Void-Kristall      | 90 M  | 8 B                 | 2       | Standard      |
| ☀ Roter Riese      | 250 M | 20 B                | 2       | Stern-Strahlen|
| Chronon            | 700 M | 60 B                | 3       | Standard      |
| ✦ Neutronenstern   | 2 B   | 200 B               | 3       | Pulsar-Beams  |
| Singulon           | 5,4 B | 400 B               | 4       | Standard      |
| ✧ Quark-Stern      | 15 B  | 1 T                 | 4       | Rainbow-Pulse |
| Ur-Photon          | 42 B  | 3 T                 | 5       | Standard      |
| ✦ Magnetar         | 120 B | 8 T                 | 5       | Pulsar-Beams  |
| Meta-Boson         | 340 B | 20 T                | 6       | Standard      |
| ● Mini-Schwarzloch | 1 T   | 60 T                | 6       | Event-Horizon |

### Discovery & Re-Unlock

- Ein **Kollaps** oder **Big Bang** setzt alle Freischaltungen der aktuellen
  Runde zurück (nur Wasserstoff bleibt).
- Was du **jemals entdeckt hast**, bleibt aber „bekannt" – die Wiederentdeckung
  in späteren Runden kostet **nur 30 %** der Original-Kosten und **umgeht das
  Massen-Gate**.
- Der Panel-Header zeigt deinen Discovery-Fortschritt (`x/14 entdeckt`). Karten
  mit gelbem Balken sind Re-Discover-Kandidaten, grüne sind aktiv
  freigeschaltet, verborgene Post-Kosmos-Tiers erscheinen als `???`.

Praktisch bedeutet das: jeder Zyklus hat einen sinnvollen Partikel-Sprint als
Ziel, aber Ex-Multi-Millionäre klopfen ihre Basis-Kette in wenigen Sekunden
wieder frei.

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
- **Automat** – schaltet Auto-Buy frei (siehe Abschnitt „Automat" unten)

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

## Automat (Auto-Buy)

Freischalt-Pfad: Kauf das DM-Upgrade **Automat** (max. Lv 3, 3 Stufen à zunehmende Kosten).

| Level | Was du bekommst                                                          |
| ----- | ------------------------------------------------------------------------ |
| **1** | ⚡-Toggle in der Ecke jeder Masse-Upgrade-Card. Aktivierte Upgrades werden **alle 500 ms** gekauft, sobald sie sich leisten. |
| **2** | Zusätzlich ⚡-Toggle auf Partikel-Cards für **Auto-Rediscover** (nur bereits entdeckte Typen). |
| **3** | Intervall verkürzt auf **100 ms** + **Massen-Reserve-Slider** oben im Upgrades-Panel. |

Der Reserve-Slider (0–90 %) sagt: Auto-Buy darf nur kaufen, wenn die Kosten
unter dem konfigurierten Anteil deiner aktuellen Masse liegen. Beispiel: bei
50 % Reserve und 1 M Masse werden nur Upgrades bis 500 K Kosten gekauft –
du behältst also Puffer für Kollapse oder Big Bangs.

Toggle-Zustände und Reserve-Wert bleiben im Save. Kollaps/Big Bang deaktivieren
sie nicht — nach dem Reset läuft die Automatik direkt wieder los, sobald du
dir deine Upgrades wieder leisten kannst.

Kein Sound bei Auto-Käufen, damit's im Idle-Betrieb nicht nervt.

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

18 Achievements im Tab **Stats**. Sie sind reine „Trophäen" (keine
mechanischen Effekte), decken aber die wichtigsten Meilensteine ab: erste
Masse, erste Kollapse, erster Big Bang, Erwischen eines Golden Cores,
komplette Materie-Bibliothek, Jenseits des Kosmos etc.

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

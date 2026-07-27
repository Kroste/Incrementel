/* =========================================================================
 * SINGULARITÄT  —  ein 2D Incremental
 * Vanilla JS + Canvas. Keine Dependencies.
 * ========================================================================= */
'use strict';

// ---------------------------------------------------------------------------
// UTILS
// ---------------------------------------------------------------------------

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand  = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b));
const now   = () => performance.now();

/** Formatiert Zahlen incremental-typisch:  1234 -> "1.23K",  1e9 -> "1.00B",
 *  ab 1e15 -> Exponential-Notation (1.23e18). Kürzt und trimmt saubere Nullen.  */
function fmt(n) {
    if (!isFinite(n)) return '∞';
    if (n < 0) return '-' + fmt(-n);
    if (n < 1)  return n === 0 ? '0' : n.toFixed(2);
    if (n < 1000) return n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.floor(n).toString();
    const units = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
    const e = Math.floor(Math.log10(n));
    const tier = Math.floor(e / 3);
    if (tier < units.length) {
        const scaled = n / Math.pow(10, tier * 3);
        return scaled.toFixed(scaled < 10 ? 2 : scaled < 100 ? 1 : 0) + units[tier];
    }
    return n.toExponential(2).replace('e+', 'e');
}

function fmtTime(ms) {
    const s = Math.floor(ms / 1000);
    if (s < 60) return s + 's';
    const m = Math.floor(s / 60);
    if (m < 60) return m + 'm ' + (s % 60) + 's';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ' + (m % 60) + 'm';
    const d = Math.floor(h / 24);
    return d + 'd ' + (h % 24) + 'h';
}

// ---------------------------------------------------------------------------
// PARTIKEL-TYPEN
// ---------------------------------------------------------------------------

const PARTICLE_TYPES = [
    { id: 'basic',    name: 'Wasserstoff',   color: '#e6e9f5', glow: '#cfd6ff', value: 1,       weight: 100, radius: 3.0, unlock: 0,       unlockCost: 0     },
    { id: 'ion',      name: 'Ion',           color: '#6ee7ff', glow: '#38bdf8', value: 8,       weight: 50,  radius: 3.6, unlock: 25,      unlockCost: 50    },
    { id: 'photon',   name: 'Photon',        color: '#facc15', glow: '#eab308', value: 55,      weight: 22,  radius: 3.2, unlock: 500,     unlockCost: 1000  },
    { id: 'neutron',  name: 'Neutron',       color: '#a78bfa', glow: '#8b5cf6', value: 380,     weight: 10,  radius: 4.2, unlock: 5000,    unlockCost: 12000 },
    { id: 'quark',    name: 'Quark',         color: '#34d399', glow: '#10b981', value: 2800,    weight: 5,   radius: 4.8, unlock: 5e4,     unlockCost: 1.5e5 },
    { id: 'antimatt', name: 'Antimaterie',   color: '#f472b6', glow: '#ec4899', value: 22000,   weight: 2,   radius: 5.4, unlock: 6e5,     unlockCost: 2e6   },
    { id: 'exotic',   name: 'Exot. Materie', color: '#f87171', glow: '#ef4444', value: 180000,  weight: 0.8, radius: 6.0, unlock: 8e6,     unlockCost: 3e7   },
    { id: 'cosmic',   name: 'Kosmische E.',  color: '#ffffff', glow: '#a78bfa', value: 1.6e6,   weight: 0.3, radius: 6.8, unlock: 1.2e8,   unlockCost: 5e8   },
];

const typeById = Object.fromEntries(PARTICLE_TYPES.map(t => [t.id, t]));

// ---------------------------------------------------------------------------
// UPGRADES  —  (Masse-basiert)
// ---------------------------------------------------------------------------

const UPGRADES = [
    {
        id: 'gravity', name: 'Gravitations-Feld', icon: 'G',
        desc: 'Reichweite und Stärke der Anziehung. Partikel driften schneller ins Zentrum.',
        baseCost: 15, growth: 1.18, maxLevel: 200,
        effect: lvl => ({ label: `+${(lvl * 12)}% Reichweite / +${(lvl * 8)}% Kraft` }),
    },
    {
        id: 'absorb', name: 'Ereignis-Horizont', icon: 'H',
        desc: 'Absorptions-Radius der Singularität. Größerer Horizont schluckt Partikel früher.',
        baseCost: 40, growth: 1.22, maxLevel: 100,
        effect: lvl => ({ label: `+${(lvl * 2).toFixed(0)} px Radius` }),
    },
    {
        id: 'yield', name: 'Massen-Kondensator', icon: 'M',
        desc: 'Jedes absorbierte Partikel liefert mehr Masse.',
        baseCost: 25, growth: 1.25, maxLevel: 300,
        effect: lvl => ({ label: `Masse ×${(1 + lvl * 0.35).toFixed(2)}` }),
    },
    {
        id: 'spawn', name: 'Partikel-Generator', icon: 'S',
        desc: 'Erhöht die Rate, mit der neue Partikel im Feld erscheinen.',
        baseCost: 50, growth: 1.28, maxLevel: 100,
        effect: lvl => ({ label: `${(2 + lvl * 1.5).toFixed(1)} Spawns/s` }),
    },
    {
        id: 'click', name: 'Klick-Impuls', icon: 'C',
        desc: 'Manuelle Klicks lösen eine Schockwelle aus, die Partikel absorbiert. Vergrößert Radius & Ausbeute.',
        baseCost: 30, growth: 1.20, maxLevel: 200,
        effect: lvl => ({ label: `Wave ${60 + lvl * 12}px, ×${(1 + lvl * 0.5).toFixed(1)} Ertrag` }),
    },
    {
        id: 'auto', name: 'Auto-Kollektor', icon: 'A',
        desc: 'Passive Drohnen sammeln Partikel selbst wenn du inaktiv bist.',
        baseCost: 200, growth: 1.35, maxLevel: 60,
        effect: lvl => ({ label: `${lvl} Kollektoren aktiv` }),
    },
    {
        id: 'autoPower', name: 'Kollektor-Kraft', icon: 'K',
        desc: 'Auto-Kollektoren arbeiten schneller und finden bessere Partikel.',
        baseCost: 500, growth: 1.30, maxLevel: 150,
        effect: lvl => ({ label: `Kollektoren ×${(1 + lvl * 0.4).toFixed(2)} Rate` }),
    },
];

const upgradeById = Object.fromEntries(UPGRADES.map(u => [u.id, u]));

// ---------------------------------------------------------------------------
// DARK-MATTER UPGRADES  (Prestige)
// ---------------------------------------------------------------------------

const DM_UPGRADES = [
    { id: 'startMass',  name: 'Ur-Materie',       desc: 'Starte jeden Zyklus mit vorgefertigter Masse.',                  baseCost: 1, growth: 2.5, maxLevel: 15, effect: lvl => ({ label: `Start: ${fmt(100 * Math.pow(10, lvl))} Masse` }) },
    { id: 'gainMult',   name: 'Ertrag-Resonanz',  desc: 'Alle Masse-Erträge werden verstärkt.',                            baseCost: 2, growth: 3.0, maxLevel: 20, effect: lvl => ({ label: `Alle Erträge ×${(1 + lvl * 0.5).toFixed(2)}` }) },
    { id: 'spawnMult',  name: 'Feld-Instabilität', desc: 'Mehr Partikel spawnen von Grund auf.',                           baseCost: 3, growth: 3.0, maxLevel: 15, effect: lvl => ({ label: `Spawn ×${(1 + lvl * 0.4).toFixed(2)}` }) },
    { id: 'clickMult',  name: 'Impuls-Katalyse',  desc: 'Klick-Waves sind massiv stärker.',                                baseCost: 4, growth: 3.5, maxLevel: 15, effect: lvl => ({ label: `Klick ×${(1 + lvl * 1.0).toFixed(2)}` }) },
    { id: 'dmGain',     name: 'Kollaps-Effizienz', desc: 'Erhalte mehr Dark Matter pro Kollaps.',                          baseCost: 5, growth: 4.0, maxLevel: 15, effect: lvl => ({ label: `DM-Gewinn ×${(1 + lvl * 0.35).toFixed(2)}` }) },
    { id: 'rareBoost',  name: 'Seltenheits-Sog',  desc: 'Seltene Partikel erscheinen häufiger.',                           baseCost: 8, growth: 4.0, maxLevel: 10, effect: lvl => ({ label: `Seltenheit ×${(1 + lvl * 0.5).toFixed(2)}` }) },
    { id: 'offline',    name: 'Zeit-Anker',       desc: 'Effizienz der Offline-Progression.',                              baseCost: 10, growth: 3.5, maxLevel: 10, effect: lvl => ({ label: `Offline ${(50 + lvl * 5)}%` }) },
];

const dmUpgradeById = Object.fromEntries(DM_UPGRADES.map(u => [u.id, u]));

// ---------------------------------------------------------------------------
// MULTIVERSE UPGRADES  (2. Prestige – Currency: Kosmos)
// ---------------------------------------------------------------------------

const MULT_UPGRADES = [
    { id: 'constant',   name: 'Kosmische Konstante', desc: 'Alle Erträge, Klicks und Auto-Kollektoren skalieren.',       baseCost: 1, growth: 3.0, maxLevel: 25, effect: lvl => ({ mult: 1 + lvl * 0.35, label: `Alles ×${(1 + lvl * 0.35).toFixed(2)}` }) },
    { id: 'echo',       name: 'Kosmisches Echo',     desc: 'Behalte einen Anteil deiner Dark Matter beim Multiverse-Reset.', baseCost: 2, growth: 3.5, maxLevel: 10, effect: lvl => ({ keep: lvl * 0.05, label: `Behalte ${(lvl * 5)}% DM` }) },
    { id: 'anomFreq',   name: 'Anomalie-Frequenz',   desc: 'Chaos-Events treten häufiger auf.',                          baseCost: 3, growth: 3.0, maxLevel: 12, effect: lvl => ({ mult: 1 - lvl * 0.06, label: `Events ${(lvl * 6)}% häufiger` }) },
    { id: 'anomDur',    name: 'Anomalie-Verlängerung', desc: 'Chaos-Events halten länger an.',                           baseCost: 3, growth: 3.0, maxLevel: 12, effect: lvl => ({ mult: 1 + lvl * 0.25, label: `Events +${(lvl * 25)}% Dauer` }) },
    { id: 'sog',        name: 'Multiverse-Sog',      desc: 'Erhalte mehr Kosmos pro Multiverse-Reset.',                  baseCost: 5, growth: 4.0, maxLevel: 15, effect: lvl => ({ mult: 1 + lvl * 0.4, label: `Kosmos-Gewinn ×${(1 + lvl * 0.4).toFixed(2)}` }) },
    { id: 'golden',     name: 'Goldene Prägung',     desc: 'Goldene Kerne sind wertvoller und tauchen häufiger auf.',    baseCost: 6, growth: 4.5, maxLevel: 10, effect: lvl => ({ mult: 1 + lvl * 0.5, label: `Golden ×${(1 + lvl * 0.5).toFixed(2)}` }) },
];

const multUpgradeById = Object.fromEntries(MULT_UPGRADES.map(u => [u.id, u]));

const MULTIVERSE_UNLOCK_DM = 100;    // Total-DM benötigt bevor Tab sichtbar
const MULTIVERSE_MIN_DM    = 100;    // Minimum aktuelles DM für Reset

// ---------------------------------------------------------------------------
// CHAOS-EVENTS
// ---------------------------------------------------------------------------

const EVENTS = [
    {
        id: 'meteor', name: 'Meteoritenschauer', color: '#f87171', icon: '☄',
        desc: 'Massiver Partikel-Strom',
        duration: 25,
        modifiers: { spawnMult: 5, rareMult: 1.5 },
    },
    {
        id: 'wormhole', name: 'Wurmloch', color: '#a78bfa', icon: '◉',
        desc: 'Klick-Impulse sind gewaltig',
        duration: 30,
        modifiers: { clickMult: 25 },
    },
    {
        id: 'timewarp', name: 'Zeitverzerrung', color: '#facc15', icon: '⌛',
        desc: 'Alles läuft doppelt so schnell',
        duration: 20,
        modifiers: { timeScale: 2, yieldMult: 1.5 },
    },
    {
        id: 'darkanom', name: 'Dunkle Anomalie', color: '#f472b6', icon: '✦',
        desc: 'Auto-Kollektoren rasen',
        duration: 40,
        modifiers: { autoMult: 5 },
    },
    {
        id: 'gravstorm', name: 'Gravitations-Sturm', color: '#6ee7ff', icon: '≋',
        desc: 'Reichweite und Sog verdreifacht',
        duration: 25,
        modifiers: { gravMult: 3, absorbMult: 1.5 },
    },
    {
        id: 'golden', name: 'Goldener Kern', color: '#fbbf24', icon: '★',
        desc: 'Ein einzigartiges Partikel treibt vorbei — klick es!',
        duration: 18,
        modifiers: { spawnGolden: true },
    },
];

// ---------------------------------------------------------------------------
// ACHIEVEMENTS
// ---------------------------------------------------------------------------

const ACHIEVEMENTS = [
    { id: 'firstMass',  title: 'Erste Masse',           desc: 'Absorbiere dein erstes Partikel.',                     check: s => s.stats.totalMass >= 1 },
    { id: 'mass1k',     title: 'Kilogramm-Klasse',      desc: 'Erreiche 1.000 Masse insgesamt.',                       check: s => s.stats.totalMass >= 1e3 },
    { id: 'mass1M',     title: 'Millionär',             desc: 'Erreiche 1M Masse insgesamt.',                          check: s => s.stats.totalMass >= 1e6 },
    { id: 'mass1B',     title: 'Milliardär',            desc: 'Erreiche 1B Masse insgesamt.',                          check: s => s.stats.totalMass >= 1e9 },
    { id: 'firstColl',  title: 'Erster Kollaps',        desc: 'Führe deinen ersten Kollaps durch.',                    check: s => s.stats.collapses >= 1 },
    { id: 'coll10',     title: 'Zyklen-Meister',        desc: 'Führe 10 Kollapse durch.',                              check: s => s.stats.collapses >= 10 },
    { id: 'unlockAll',  title: 'Materie-Bibliothek',    desc: 'Schalte alle Partikel-Typen frei.',                     check: s => PARTICLE_TYPES.every(t => s.unlockedTypes[t.id]) },
    { id: 'click100',   title: 'Fleißiger Finger',      desc: 'Löse 100 Klick-Impulse aus.',                           check: s => s.stats.clicks >= 100 },
    { id: 'auto10',     title: 'Automatisiert',         desc: 'Baue 10 Auto-Kollektoren.',                             check: s => (s.upgrades.auto || 0) >= 10 },
    { id: 'gravity50',  title: 'Schwerkraft-Fanatiker', desc: 'Bringe das Gravitations-Feld auf Level 50.',            check: s => (s.upgrades.gravity || 0) >= 50 },
    { id: 'dm10',       title: 'Dunkelheit',            desc: 'Sammle 10 Dark Matter.',                                check: s => s.darkMatter >= 10 },
    { id: 'dm100',      title: 'Kosmische Präsenz',     desc: 'Sammle 100 Dark Matter.',                               check: s => s.darkMatter >= 100 },
    { id: 'firstEvent', title: 'Anomalie',              desc: 'Erlebe dein erstes Chaos-Event.',                       check: s => s.stats.eventsTriggered >= 1 },
    { id: 'goldClick',  title: 'Erwischt',              desc: 'Klick einen goldenen Kern.',                            check: s => s.stats.goldenClicked >= 1 },
    { id: 'firstMult',  title: 'Big Bang',              desc: 'Führe deinen ersten Multiverse-Reset durch.',           check: s => s.stats.multiverses >= 1 },
    { id: 'kosmos10',   title: 'Vielheit',              desc: 'Sammle 10 Kosmos.',                                     check: s => s.kosmos >= 10 },
];

// ---------------------------------------------------------------------------
// GAME STATE  (persisted subset gets saved)
// ---------------------------------------------------------------------------

const SAVE_KEY = 'singularitaet_save_v1';
const SAVE_VERSION = 2;

function makeInitialState() {
    return {
        version: SAVE_VERSION,
        mass: 0,
        darkMatter: 0,
        kosmos: 0,
        upgrades: {},                  // id -> level
        dmUpgrades: {},                // id -> level
        multUpgrades: {},              // id -> level
        unlockedTypes: { basic: true },
        achievements: {},              // id -> unlockedAt
        stats: {
            totalMass: 0,
            totalDM: 0,
            totalKosmos: 0,
            collapses: 0,
            multiverses: 0,
            clicks: 0,
            absorbedCount: 0,
            eventsTriggered: 0,
            goldenClicked: 0,
            startTime: Date.now(),
            playtime: 0,
        },
        lastSave: Date.now(),
        muted: false,
    };
}

let state = makeInitialState();

// runtime-only (not saved)
const runtime = {
    particles: [],
    absorbers: [],        // auto-collector drones (positioned around center)
    floaters: [],         // floating-number popups
    ripples: [],          // click shockwaves
    shakeMag: 0,
    shakeUntil: 0,
    center: { x: 0, y: 0 },
    lastFrame: now(),
    spawnAccum: 0,
    autoAccum: 0,
    saveAccum: 0,
    achAccum: 0,
    hueShift: 0,
    // Chaos-Events
    event: null,          // {def, endsAt, startedAt}
    nextEventAt: now() + 45_000,   // erstes Event nach ~45s
    goldenParticle: null, // spezielles Golden-Partikel wenn 'golden'-Event aktiv
};

// ---------------------------------------------------------------------------
// DERIVED / EFFECTIVE STATS  (computed each frame from upgrade levels)
// ---------------------------------------------------------------------------

function eff() {
    const u = state.upgrades;
    const d = state.dmUpgrades;
    const m = state.multUpgrades;

    const dmMult    = 1 + (d.gainMult   || 0) * 0.5;
    const dmSpawn   = 1 + (d.spawnMult  || 0) * 0.4;
    const dmClick   = 1 + (d.clickMult  || 0) * 1.0;
    const dmRare    = 1 + (d.rareBoost  || 0) * 0.5;

    // Multiverse: "kosmische Konstante" wirkt auf alles produktive
    const mvConstant = 1 + (m.constant || 0) * 0.35;
    const mvSog      = 1 + (m.sog      || 0) * 0.4;
    const mvGolden   = 1 + (m.golden   || 0) * 0.5;
    // Event-Modifier zusammensammeln (default = 1 wenn kein Event aktiv)
    const evMod = { spawnMult: 1, rareMult: 1, clickMult: 1, yieldMult: 1, autoMult: 1, gravMult: 1, absorbMult: 1, timeScale: 1, spawnGolden: false };
    if (runtime.event && runtime.event.endsAt > now()) {
        Object.assign(evMod, runtime.event.def.modifiers);
    }

    const gravLvl   = u.gravity   || 0;
    const absLvl    = u.absorb    || 0;
    const yldLvl    = u.yield     || 0;
    const spawnLvl  = u.spawn     || 0;
    const clickLvl  = u.click     || 0;
    const autoLvl   = u.auto      || 0;
    const apLvl     = u.autoPower || 0;

    return {
        gravReach : (220 + gravLvl * 26) * evMod.gravMult,
        gravForce : (34  + gravLvl * 6)  * evMod.gravMult,
        absorbRadius: (34 + absLvl * 2) * evMod.absorbMult,
        yieldMult: (1 + yldLvl * 0.35) * dmMult * mvConstant * evMod.yieldMult,
        spawnPerSec: (2 + spawnLvl * 1.5) * dmSpawn * evMod.spawnMult,
        clickRadius: 60 + clickLvl * 12,
        clickMult : (1 + clickLvl * 0.5) * dmClick * dmMult * mvConstant * evMod.clickMult,
        autoCount: autoLvl,
        autoRate : (1 + apLvl * 0.4) * mvConstant * evMod.autoMult,
        rareMult: dmRare * evMod.rareMult,
        dmGainMult: 1 + (d.dmGain || 0) * 0.35,
        offlinePct: 0.5 + (d.offline || 0) * 0.05,
        // Multiverse / Event pass-through
        mvSog,
        mvGolden,
        mvEchoKeep: (m.echo || 0) * 0.05,
        eventTimeScale: evMod.timeScale,
        eventSpawnGolden: evMod.spawnGolden,
    };
}

/** Kosmos-Gewinn beim Multiverse-Reset: sqrt(totalDM / 100) * sog-mult, mind. 3 */
function multGain() {
    if (state.stats.totalDM < MULTIVERSE_UNLOCK_DM) return 0;
    const raw = Math.sqrt(state.stats.totalDM / 10) * eff().mvSog;
    return Math.max(0, Math.floor(raw));
}
function canMultiverse() { return state.darkMatter >= MULTIVERSE_MIN_DM && multGain() > 0; }
function multiverseUnlocked() { return state.stats.totalDM >= MULTIVERSE_UNLOCK_DM || state.stats.multiverses > 0; }

/** Kollaps-Gewinn: dm = floor(sqrt(currentMass / 1e6) * dmGainMult) */
function collapseGain() {
    const e = eff();
    const raw = Math.sqrt(state.mass / 1e6) * e.dmGainMult;
    return Math.max(0, Math.floor(raw));
}

function collapseRequirement() { return 1e6; }
function canCollapse() { return state.mass >= collapseRequirement(); }

/** Kosten für nächste Stufe eines Upgrades. */
function upgradeCost(u, level) {
    return u.baseCost * Math.pow(u.growth, level);
}

// ---------------------------------------------------------------------------
// PARTICLE SIMULATION
// ---------------------------------------------------------------------------

function spawnParticle(typeOverride) {
    const canvas = els.canvas;
    // Rand-Spawn:  irgendwo außerhalb eines Radius um center, aber im Sichtfeld
    const w = canvas.width, h = canvas.height;
    let x, y;
    const edge = randi(0, 4);
    if      (edge === 0) { x = -20;     y = rand(0, h); }
    else if (edge === 1) { x = w + 20;  y = rand(0, h); }
    else if (edge === 2) { x = rand(0, w); y = -20; }
    else                 { x = rand(0, w); y = h + 20; }

    // Type auswählen (weighted, mit unlock check und rareMult für seltene)
    let type = typeOverride;
    if (!type) {
        const rareMult = eff().rareMult;
        let total = 0;
        const cands = [];
        for (const t of PARTICLE_TYPES) {
            if (!state.unlockedTypes[t.id]) continue;
            // seltene Partikel: weight ist niedrig -> mit rareMult skalieren (aber invers zur "commonness")
            const weight = t.weight * (t.weight < 20 ? rareMult : 1);
            cands.push({ t, weight });
            total += weight;
        }
        let roll = Math.random() * total;
        for (const c of cands) { roll -= c.weight; if (roll <= 0) { type = c.t; break; } }
        if (!type) type = PARTICLE_TYPES[0];
    }

    // Zufällige Ausgangs-Geschwindigkeit (leicht in Richtung Zentrum)
    const dx = runtime.center.x - x;
    const dy = runtime.center.y - y;
    const d = Math.hypot(dx, dy) || 1;
    const speed = rand(20, 55);

    runtime.particles.push({
        type,
        x, y,
        vx: (dx / d) * speed + rand(-30, 30),
        vy: (dy / d) * speed + rand(-30, 30),
        r: type.radius,
        life: 0,
    });
}

function simulateParticles(dt) {
    const e = eff();
    const cx = runtime.center.x, cy = runtime.center.y;
    const reach2 = e.gravReach * e.gravReach;
    const absR2  = e.absorbRadius * e.absorbRadius;

    const ps = runtime.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.life += dt;
        const dx = cx - p.x, dy = cy - p.y;
        const d2 = dx * dx + dy * dy;

        // absorb?
        if (d2 < absR2) {
            absorbParticle(p);
            ps.splice(i, 1);
            continue;
        }

        // gravity attraction (skaliert mit Nähe innerhalb reach)
        if (d2 < reach2) {
            const d = Math.sqrt(d2) || 1;
            const near = 1 - (d / e.gravReach);  // 0..1 (nah = 1)
            const a = e.gravForce * (0.4 + near * 1.6);  // stärker je näher
            p.vx += (dx / d) * a * dt;
            p.vy += (dy / d) * a * dt;
        }

        // leichte Reibung (verhindert Über-Beschleunigung am Zentrum)
        p.vx *= 0.995;
        p.vy *= 0.995;

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Cleanup: Partikel die zu lange leben und weit weg sind
        if (p.life > 60 && d2 > reach2 * 4) ps.splice(i, 1);
    }

    // Auto-Kollektoren rotieren um Zentrum und "schießen" ab und zu Massen-Impulse ab
    // (visuell umkreisende Punkte; Ertrag wird in tickAutoCollectors abgehandelt)
    const t = now() / 1000;
    runtime.absorbers.length = 0;
    for (let i = 0; i < e.autoCount; i++) {
        const angle = (i / e.autoCount) * Math.PI * 2 + t * (0.4 + (i % 3) * 0.1);
        const r = 80 + (i % 3) * 12;
        runtime.absorbers.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
    }
}

function absorbParticle(p) {
    const e = eff();
    const gain = p.type.value * e.yieldMult;
    state.mass += gain;
    state.stats.totalMass += gain;
    state.stats.absorbedCount++;
    spawnFloater(p.x, p.y, '+' + fmt(gain), p.type.glow);
    playPop(p.type.value);
}

function tickAutoCollectors(dt) {
    const e = eff();
    if (e.autoCount === 0) return;
    // Auto-Ertrag: skaliert mit Anzahl, autoRate und dem durchschnittlichen Partikel-Value
    // (näherungsweise: wir nehmen den mittleren Wert der aktuell verfügbaren Typen, gewichtet)
    let avg = 0, totW = 0;
    for (const t of PARTICLE_TYPES) {
        if (!state.unlockedTypes[t.id]) continue;
        avg += t.value * t.weight;
        totW += t.weight;
    }
    if (totW === 0) return;
    avg /= totW;
    const gainPerSec = e.autoCount * e.autoRate * avg * e.yieldMult * 0.7;
    const gain = gainPerSec * dt;
    state.mass += gain;
    state.stats.totalMass += gain;
}

// ---------------------------------------------------------------------------
// EFFECTS: Floaters, Ripples, Shake
// ---------------------------------------------------------------------------

function spawnFloater(x, y, text, color) {
    runtime.floaters.push({ x, y, vy: -40, text, color, life: 0, ttl: 1.2 });
    if (runtime.floaters.length > 120) runtime.floaters.shift();
}

function spawnRipple(x, y, radius, color) {
    runtime.ripples.push({ x, y, r: 8, maxR: radius, color, life: 0, ttl: 0.55 });
}

function shake(mag, ms) {
    runtime.shakeMag = Math.max(runtime.shakeMag, mag);
    runtime.shakeUntil = now() + ms;
}

function updateEffects(dt) {
    for (let i = runtime.floaters.length - 1; i >= 0; i--) {
        const f = runtime.floaters[i];
        f.life += dt;
        f.y += f.vy * dt;
        f.vy *= 0.96;
        if (f.life >= f.ttl) runtime.floaters.splice(i, 1);
    }
    for (let i = runtime.ripples.length - 1; i >= 0; i--) {
        const r = runtime.ripples[i];
        r.life += dt;
        r.r = 8 + (r.maxR - 8) * (r.life / r.ttl);
        if (r.life >= r.ttl) runtime.ripples.splice(i, 1);
    }
}

// ---------------------------------------------------------------------------
// CLICK: Schockwelle
// ---------------------------------------------------------------------------

function handleClick(x, y) {
    // Golden-Kern hat Priorität — wenn getroffen, keine reguläre Wave
    if (tryClickGolden(x, y)) return;

    const e = eff();
    const r = e.clickRadius;
    const r2 = r * r;
    let totalGain = 0, count = 0;

    for (let i = runtime.particles.length - 1; i >= 0; i--) {
        const p = runtime.particles[i];
        const dx = p.x - x, dy = p.y - y;
        if (dx * dx + dy * dy <= r2) {
            const gain = p.type.value * e.yieldMult * e.clickMult;
            state.mass += gain;
            state.stats.totalMass += gain;
            state.stats.absorbedCount++;
            totalGain += gain;
            count++;
            spawnFloater(p.x, p.y, '+' + fmt(gain), p.type.glow);
            runtime.particles.splice(i, 1);
        }
    }

    state.stats.clicks++;
    spawnRipple(x, y, r, '#6ee7ff');
    if (count > 0) {
        shake(Math.min(12, 3 + count), 180);
        playClickHit(totalGain);
    } else {
        playClickEmpty();
    }
}

// ---------------------------------------------------------------------------
// SHOP: Käufe
// ---------------------------------------------------------------------------

function buyUpgrade(id) {
    const u = upgradeById[id];
    if (!u) return;
    const lvl = state.upgrades[id] || 0;
    if (lvl >= u.maxLevel) return;
    const cost = upgradeCost(u, lvl);
    if (state.mass < cost) return;
    state.mass -= cost;
    state.upgrades[id] = lvl + 1;
    renderShop();
    playBuy();
}

function unlockParticle(id) {
    const t = typeById[id];
    if (!t || state.unlockedTypes[id]) return;
    if (state.stats.totalMass < t.unlock) return;
    if (state.mass < t.unlockCost) return;
    state.mass -= t.unlockCost;
    state.unlockedTypes[id] = true;
    toast('Partikel entdeckt', t.name, `Wert ${fmt(t.value)} pro Absorb`);
    renderShop();
    playBuy();
}

function buyDMUpgrade(id) {
    const u = dmUpgradeById[id];
    if (!u) return;
    const lvl = state.dmUpgrades[id] || 0;
    if (lvl >= u.maxLevel) return;
    const cost = u.baseCost * Math.pow(u.growth, lvl);
    if (state.darkMatter < cost) return;
    state.darkMatter -= cost;
    state.dmUpgrades[id] = lvl + 1;
    renderShop();
    playBuy();
}

function buyMultUpgrade(id) {
    const u = multUpgradeById[id];
    if (!u) return;
    const lvl = state.multUpgrades[id] || 0;
    if (lvl >= u.maxLevel) return;
    const cost = u.baseCost * Math.pow(u.growth, lvl);
    if (state.kosmos < cost) return;
    state.kosmos -= cost;
    state.multUpgrades[id] = lvl + 1;
    renderShop();
    playBuy();
}

function performMultiverse() {
    if (!canMultiverse()) return;
    const gain = multGain();
    if (gain <= 0) return;
    const echoKeep = eff().mvEchoKeep;

    state.kosmos += gain;
    state.stats.totalKosmos += gain;
    state.stats.multiverses++;

    // Reset run + darkMatter + dmUpgrades. Echo-Anteil an DM behalten.
    const keptDM = Math.floor(state.darkMatter * echoKeep);
    state.mass = 100 * Math.pow(10, 0);   // ganz frisch
    state.darkMatter = keptDM;
    state.upgrades = {};
    state.dmUpgrades = {};
    // unlockedTypes und achievements bleiben — Erinnerung des Multiversums.

    shake(60, 1500);
    for (let ring = 0; ring < 3; ring++) {
        setTimeout(() => {
            for (let i = 0; i < 40; i++) {
                const a = (i / 40) * Math.PI * 2;
                spawnRipple(
                    runtime.center.x + Math.cos(a) * (30 + ring * 15),
                    runtime.center.y + Math.sin(a) * (30 + ring * 15),
                    400 + ring * 100, ring === 0 ? '#fbbf24' : ring === 1 ? '#a78bfa' : '#6ee7ff'
                );
            }
        }, ring * 150);
    }
    runtime.particles.length = 0;
    runtime.event = null;
    runtime.nextEventAt = now() + 30_000;
    toast('BIG BANG', `+${fmt(gain)} Kosmos`, echoKeep > 0 ? `${fmt(keptDM)} DM behalten (Echo)` : 'Ein neues Multiversum entsteht.');
    playMultiverse();
    save();
    renderShop();
}

// ---------------------------------------------------------------------------
// CHAOS-EVENTS
// ---------------------------------------------------------------------------

function triggerRandomEvent() {
    const def = EVENTS[randi(0, EVENTS.length)];
    const durMult = 1 + (state.multUpgrades.anomDur || 0) * 0.25;
    const duration = def.duration * durMult * 1000;
    runtime.event = { def, endsAt: now() + duration, startedAt: now(), duration };
    state.stats.eventsTriggered++;

    // Cooldown bis zum nächsten Event
    const freqMult = 1 - (state.multUpgrades.anomFreq || 0) * 0.06;
    const baseCooldown = rand(90, 180) * 1000;
    runtime.nextEventAt = now() + duration + baseCooldown * freqMult;

    toast('ANOMALIE', `${def.icon} ${def.name}`, def.desc);
    playEvent();

    if (def.modifiers.spawnGolden) spawnGolden();
}

function spawnGolden() {
    // Golden-Partikel treibt langsam quer über den Screen.
    const c = els.canvas;
    const w = c.clientWidth, h = c.clientHeight;
    const side = randi(0, 2);
    const y = rand(h * 0.2, h * 0.8);
    const start = side === 0 ? -40 : w + 40;
    const dir = side === 0 ? 1 : -1;
    runtime.goldenParticle = {
        x: start, y,
        vx: dir * rand(60, 100),
        vy: rand(-15, 15),
        r: 14,
        life: 0,
        ttl: 15,   // wenn nicht geklickt: verschwindet
    };
}

function updateEvent(dt) {
    if (runtime.event && runtime.event.endsAt <= now()) {
        runtime.event = null;
        runtime.goldenParticle = null;
    }
    if (!runtime.event && now() >= runtime.nextEventAt) {
        triggerRandomEvent();
    }
    // Golden-Partikel bewegen
    if (runtime.goldenParticle) {
        const g = runtime.goldenParticle;
        g.life += dt;
        g.x += g.vx * dt;
        g.y += g.vy * dt;
        const c = els.canvas;
        if (g.life > g.ttl || g.x < -60 || g.x > c.clientWidth + 60) {
            runtime.goldenParticle = null;
        }
    }
}

function tryClickGolden(x, y) {
    const g = runtime.goldenParticle;
    if (!g) return false;
    const dx = g.x - x, dy = g.y - y;
    if (dx * dx + dy * dy > 40 * 40) return false;   // klick-toleranz
    // Wert: skaliert mit aktueller Masse-Skala, damit es sich lohnt
    const e = eff();
    const base = Math.max(500, state.mass * 0.10);   // 10% aktuelle Masse als Bonus, min 500
    const gain = base * e.mvGolden * e.yieldMult;
    state.mass += gain;
    state.stats.totalMass += gain;
    state.stats.goldenClicked++;
    spawnFloater(g.x, g.y, '+' + fmt(gain) + ' ★', '#fbbf24');
    for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        spawnRipple(g.x + Math.cos(a) * 8, g.y + Math.sin(a) * 8, 120, '#fbbf24');
    }
    shake(20, 400);
    playGolden();
    runtime.goldenParticle = null;
    return true;
}

function performCollapse() {
    if (!canCollapse()) return;
    const gain = collapseGain();
    if (gain <= 0) return;

    state.darkMatter += gain;
    state.stats.totalDM += gain;
    state.stats.collapses++;

    // Reset run state — aber Dark Matter, DM-Upgrades, unlockedTypes, achievements, stats bleiben
    state.mass = 100 * Math.pow(10, state.dmUpgrades.startMass || 0);
    state.upgrades = {};

    // Effekte
    shake(30, 900);
    for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2;
        spawnRipple(runtime.center.x + Math.cos(a) * 20, runtime.center.y + Math.sin(a) * 20, 300, '#f472b6');
    }
    // Alle bestehenden Partikel wegsprengen
    runtime.particles.length = 0;
    toast('Kollaps', `+${fmt(gain)} Dark Matter`, 'Ein neuer Zyklus beginnt.');
    playCollapse();
    save();
    renderShop();
}

// ---------------------------------------------------------------------------
// ACHIEVEMENTS
// ---------------------------------------------------------------------------

function checkAchievements() {
    for (const a of ACHIEVEMENTS) {
        if (state.achievements[a.id]) continue;
        if (a.check(state)) {
            state.achievements[a.id] = Date.now();
            toast('Erfolg freigeschaltet', a.title, a.desc);
            playAchievement();
        }
    }
}

// ---------------------------------------------------------------------------
// AUDIO  (WebAudio, kein Asset-Ladefluss)
// ---------------------------------------------------------------------------

let audioCtx = null;
function ensureAudio() {
    if (audioCtx) return audioCtx;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { audioCtx = null; }
    return audioCtx;
}

function beep(freq, dur, type = 'sine', vol = 0.05) {
    if (state.muted) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
}

function playPop(value) {
    // hochwertigere Partikel = höherer Ton
    const f = 400 + Math.min(1200, Math.log10(1 + value) * 200);
    beep(f, 0.08, 'triangle', 0.025);
}

function playClickHit(totalGain) {
    beep(220, 0.05, 'square', 0.04);
    beep(440 + Math.min(800, Math.log10(1 + totalGain) * 100), 0.12, 'sawtooth', 0.03);
}

function playClickEmpty() { beep(180, 0.04, 'sine', 0.015); }
function playBuy()        { beep(660, 0.1, 'triangle', 0.05); beep(880, 0.06, 'triangle', 0.03); }
function playAchievement(){ beep(523, 0.12, 'triangle', 0.06); setTimeout(() => beep(784, 0.16, 'triangle', 0.06), 90); }
function playCollapse()   {
    beep(60,  0.6, 'sawtooth', 0.08);
    setTimeout(() => beep(120, 0.4, 'square', 0.06),  200);
    setTimeout(() => beep(440, 0.3, 'triangle', 0.05), 500);
}
function playMultiverse() {
    beep(40, 1.2, 'sawtooth', 0.10);
    setTimeout(() => beep(80,  0.9, 'square',   0.08), 250);
    setTimeout(() => beep(220, 0.7, 'triangle', 0.06), 550);
    setTimeout(() => beep(660, 0.5, 'triangle', 0.05), 850);
    setTimeout(() => beep(1320, 0.4, 'sine',    0.04), 1100);
}
function playEvent() {
    beep(880, 0.15, 'triangle', 0.06);
    setTimeout(() => beep(1180, 0.15, 'triangle', 0.05), 130);
}
function playGolden() {
    beep(1046, 0.1, 'triangle', 0.08);
    setTimeout(() => beep(1318, 0.1, 'triangle', 0.08), 90);
    setTimeout(() => beep(1568, 0.2, 'triangle', 0.08), 180);
}

// ---------------------------------------------------------------------------
// RENDERING
// ---------------------------------------------------------------------------

function render() {
    const c = els.canvas;
    const ctx = els.ctx;
    const w = c.width, h = c.height;

    ctx.clearRect(0, 0, w, h);

    // shake offset
    let sx = 0, sy = 0;
    if (now() < runtime.shakeUntil) {
        const remaining = (runtime.shakeUntil - now()) / 900;
        const m = runtime.shakeMag * remaining;
        sx = rand(-m, m); sy = rand(-m, m);
    } else {
        runtime.shakeMag = 0;
    }
    ctx.save();
    ctx.translate(sx, sy);

    // background starfield (statisch-billig)
    drawStars(ctx, w, h);

    // gravity field (subtiler radial-gradient um Zentrum)
    drawGravityField(ctx);

    // ripples
    for (const r of runtime.ripples) {
        const alpha = 1 - r.life / r.ttl;
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = alpha * 0.7;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // particles
    for (const p of runtime.particles) {
        const t = p.type;
        // Glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, t.radius * 3.5);
        grad.addColorStop(0, t.glow);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.55;
        ctx.beginPath(); ctx.arc(p.x, p.y, t.radius * 3.5, 0, Math.PI * 2); ctx.fill();
        // Core
        ctx.globalAlpha = 1;
        ctx.fillStyle = t.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, t.radius, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // auto-collectors
    for (const a of runtime.absorbers) {
        const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, 12);
        grad.addColorStop(0, '#6ee7ff');
        grad.addColorStop(1, 'rgba(110,231,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(a.x, a.y, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(a.x, a.y, 2.5, 0, Math.PI * 2); ctx.fill();
    }

    // the singularity
    drawSingularity(ctx);

    // Golden particle (Chaos-Event)
    if (runtime.goldenParticle) drawGolden(ctx, runtime.goldenParticle);

    // floaters
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 13px system-ui, sans-serif';
    for (const f of runtime.floaters) {
        const alpha = 1 - f.life / f.ttl;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillText(f.text, f.x + 1, f.y + 1);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;

    ctx.restore();
}

// billiges statisches Starfield — nicht jedes Frame neu berechnen
let _stars = null;
function drawStars(ctx, w, h) {
    if (!_stars || _stars.w !== w || _stars.h !== h) {
        _stars = { w, h, pts: [] };
        for (let i = 0; i < 180; i++) {
            _stars.pts.push({ x: rand(0, w), y: rand(0, h), r: rand(0.2, 1.4), a: rand(0.15, 0.65) });
        }
    }
    for (const s of _stars.pts) {
        ctx.fillStyle = `rgba(220,225,255,${s.a})`;
        ctx.fillRect(s.x, s.y, s.r, s.r);
    }
}

function drawGravityField(ctx) {
    const e = eff();
    const cx = runtime.center.x, cy = runtime.center.y;
    const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, e.gravReach);
    grad.addColorStop(0, 'rgba(110, 231, 255, 0.10)');
    grad.addColorStop(0.6, 'rgba(110, 231, 255, 0.03)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, e.gravReach, 0, Math.PI * 2); ctx.fill();
}

function drawGolden(ctx, g) {
    const t = now() / 200;
    const pulse = 1 + Math.sin(t) * 0.15;
    const r = g.r * pulse;
    // outer halo
    const halo = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, r * 4);
    halo.addColorStop(0, 'rgba(251, 191, 36, 0.7)');
    halo.addColorStop(0.5, 'rgba(251, 191, 36, 0.2)');
    halo.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(g.x, g.y, r * 4, 0, Math.PI * 2); ctx.fill();
    // core
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath(); ctx.arc(g.x, g.y, r, 0, Math.PI * 2); ctx.fill();
    // spinning ring
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(t);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    // hint text
    ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KLICK MICH', g.x, g.y - r * 3);
}

function drawSingularity(ctx) {
    const e = eff();
    const cx = runtime.center.x, cy = runtime.center.y;
    const t = now() / 1000;
    runtime.hueShift = (runtime.hueShift + 0.15) % 360;

    // äußere accretion disk (rotiert)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.6);
    const diskR = e.absorbRadius * 2.5;
    const disk = ctx.createRadialGradient(0, 0, e.absorbRadius, 0, 0, diskR);
    disk.addColorStop(0, 'rgba(167, 139, 250, 0.4)');
    disk.addColorStop(0.5, 'rgba(110, 231, 255, 0.15)');
    disk.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = disk;
    ctx.beginPath(); ctx.arc(0, 0, diskR, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // absorption horizon (glow)
    const horizon = ctx.createRadialGradient(cx, cy, 0, cx, cy, e.absorbRadius * 1.6);
    horizon.addColorStop(0, '#000');
    horizon.addColorStop(0.55, '#000');
    horizon.addColorStop(0.7, `hsla(${240 + runtime.hueShift * 0.3}, 90%, 60%, 0.7)`);
    horizon.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = horizon;
    ctx.beginPath(); ctx.arc(cx, cy, e.absorbRadius * 1.6, 0, Math.PI * 2); ctx.fill();

    // pure black core
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(cx, cy, e.absorbRadius, 0, Math.PI * 2); ctx.fill();

    // rim highlight
    ctx.strokeStyle = `hsla(${runtime.hueShift + 200}, 100%, 75%, 0.5)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, e.absorbRadius + 1, 0, Math.PI * 2); ctx.stroke();
}

// ---------------------------------------------------------------------------
// UI  (HUD + Shop)
// ---------------------------------------------------------------------------

const els = {};
function grabElements() {
    els.canvas = document.getElementById('stage');
    els.ctx = els.canvas.getContext('2d');
    els.statMass = document.getElementById('stat-mass');
    els.statMps  = document.getElementById('stat-mps');
    els.statDm   = document.getElementById('stat-dm');
    els.statDmMult = document.getElementById('stat-dm-mult');
    els.statCollapseGain = document.getElementById('stat-collapse-gain');
    els.statCollapseReq  = document.getElementById('stat-collapse-req');
    els.btnCollapse = document.getElementById('btn-collapse');
    els.collapseBtnGain = document.getElementById('collapse-btn-gain');
    els.btnMultiverse = document.getElementById('btn-multiverse');
    els.multBtnGain = document.getElementById('mult-btn-gain');
    els.statKosmosBlock = document.getElementById('stat-kosmos-block');
    els.statKosmos = document.getElementById('stat-kosmos');
    els.statKosmosMult = document.getElementById('stat-kosmos-mult');
    els.tabMultiverse = document.getElementById('tab-multiverse');
    els.eventBanner = document.getElementById('event-banner');
    els.eventIcon = document.getElementById('event-icon');
    els.eventTitle = document.getElementById('event-title');
    els.eventDesc = document.getElementById('event-desc');
    els.eventTime = document.getElementById('event-time');
    els.eventBar = document.getElementById('event-bar');
    els.btnSave = document.getElementById('btn-save');
    els.btnReset = document.getElementById('btn-reset');
    els.btnMute = document.getElementById('btn-mute');
    els.btnInfo = document.getElementById('btn-info');
    els.btnInfoClose = document.getElementById('btn-info-close');
    els.infoModal = document.getElementById('info-modal');
    els.toastContainer = document.getElementById('toast-container');
    els.offlineModal = document.getElementById('offline-modal');
    els.offlineTime = document.getElementById('offline-time');
    els.offlineAmount = document.getElementById('offline-amount');
    els.btnOfflineOk = document.getElementById('btn-offline-ok');
    els.panels = {
        upgrades: document.getElementById('panel-upgrades'),
        particles: document.getElementById('panel-particles'),
        dark: document.getElementById('panel-dark'),
        multiverse: document.getElementById('panel-multiverse'),
        stats: document.getElementById('panel-stats'),
    };
}

function fitCanvas() {
    const c = els.canvas;
    const dpr = window.devicePixelRatio || 1;
    const cssW = c.clientWidth, cssH = c.clientHeight;
    c.width  = Math.floor(cssW * dpr);
    c.height = Math.floor(cssH * dpr);
    els.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    runtime.center.x = cssW / 2 - 170;   // Shop nimmt 340 rechts, mitte in linkem Bereich
    runtime.center.y = cssH / 2;
    _stars = null;
}

let hudAccum = 0;
let mpsWindow = { lastMass: 0, lastT: 0, rate: 0 };

function updateHUD(dt) {
    hudAccum += dt;
    if (hudAccum < 0.1) return;

    // MPS-Fenster (sample-basiert)
    const t = now() / 1000;
    if (mpsWindow.lastT === 0) { mpsWindow.lastT = t; mpsWindow.lastMass = state.stats.totalMass; }
    const dtM = t - mpsWindow.lastT;
    if (dtM >= 1.0) {
        mpsWindow.rate = (state.stats.totalMass - mpsWindow.lastMass) / dtM;
        mpsWindow.lastT = t;
        mpsWindow.lastMass = state.stats.totalMass;
    }

    els.statMass.textContent = fmt(state.mass);
    els.statMps.textContent  = '+' + fmt(mpsWindow.rate) + '/s';
    els.statDm.textContent   = fmt(state.darkMatter);
    els.statDmMult.textContent = '×' + eff().yieldMult.toFixed(2) + ' Ertrag';

    const gain = collapseGain();
    els.statCollapseGain.textContent = fmt(gain);
    els.statCollapseReq.textContent  = canCollapse()
        ? 'bereit'
        : `benötigt ${fmt(collapseRequirement())} Masse`;
    els.collapseBtnGain.textContent = fmt(gain);
    els.btnCollapse.disabled = !canCollapse() || gain <= 0;

    // Multiverse-Sichtbarkeit
    const mvOn = multiverseUnlocked();
    els.statKosmosBlock.classList.toggle('hidden', !mvOn);
    els.btnMultiverse.classList.toggle('hidden', !mvOn);
    els.tabMultiverse.classList.toggle('hidden', !mvOn);
    if (mvOn) {
        els.statKosmos.textContent = fmt(state.kosmos);
        const mvC = 1 + (state.multUpgrades.constant || 0) * 0.35;
        els.statKosmosMult.textContent = `Alles ×${mvC.toFixed(2)}`;
        const mg = multGain();
        els.multBtnGain.textContent = fmt(mg);
        els.btnMultiverse.disabled = !canMultiverse();
    }

    // Event-Banner
    if (runtime.event && runtime.event.endsAt > now()) {
        const ev = runtime.event;
        const remain = (ev.endsAt - now()) / 1000;
        const prog = ((ev.endsAt - now()) / ev.duration) * 100;
        els.eventBanner.classList.remove('hidden');
        els.eventBanner.style.borderColor = ev.def.color;
        els.eventBanner.style.boxShadow = `0 6px 32px rgba(0,0,0,0.5), 0 0 24px ${ev.def.color}55`;
        els.eventIcon.style.color = ev.def.color;
        els.eventIcon.textContent = ev.def.icon;
        els.eventTitle.textContent = ev.def.name;
        els.eventDesc.textContent = ev.def.desc;
        els.eventTime.textContent = Math.ceil(remain) + 's';
        els.eventBar.style.color = ev.def.color;
        els.eventBar.style.width = prog.toFixed(1) + '%';
    } else {
        els.eventBanner.classList.add('hidden');
    }

    hudAccum = 0;
}

function renderShop() {
    // Upgrades
    let html = '';
    for (const u of UPGRADES) {
        const lvl = state.upgrades[u.id] || 0;
        const maxed = lvl >= u.maxLevel;
        const cost = upgradeCost(u, lvl);
        const affordable = state.mass >= cost && !maxed;
        const eff = u.effect(lvl);
        const nextEff = u.effect(lvl + 1);
        html += `
            <div class="upgrade ${!affordable && !maxed ? 'disabled' : ''} ${affordable ? 'affordable' : ''}"
                 data-buy="${u.id}">
                <div class="upgrade-header">
                    <span class="upgrade-name">${u.name}</span>
                    <span class="upgrade-level">Lv ${lvl}${maxed ? ' (MAX)' : ` / ${u.maxLevel}`}</span>
                </div>
                <div class="upgrade-desc">${u.desc}</div>
                <div class="upgrade-effect">${eff.label}${!maxed ? ` → ${nextEff.label}` : ''}</div>
                ${!maxed ? `<div class="upgrade-cost ${affordable ? '' : 'unaffordable'}">${fmt(cost)} Masse</div>` : ''}
            </div>`;
    }
    els.panels.upgrades.innerHTML = html;

    // Partikel
    html = '<div class="section-heading">Entdeckte & entdeckbare Partikel</div>';
    for (const t of PARTICLE_TYPES) {
        const owned = !!state.unlockedTypes[t.id];
        const reached = state.stats.totalMass >= t.unlock;
        const affordable = state.mass >= t.unlockCost;
        const buyable = reached && affordable && !owned;
        html += `
            <div class="particle-card ${owned ? 'owned' : ''} ${!buyable && !owned ? 'disabled' : ''}"
                 data-particle="${t.id}">
                <div class="particle-swatch" style="background:${t.color};color:${t.glow}"></div>
                <div class="particle-info">
                    <div class="upgrade-header">
                        <span class="upgrade-name">${t.name}</span>
                        <span class="upgrade-level">Wert ${fmt(t.value)}</span>
                    </div>
                    ${owned
                        ? `<div class="upgrade-effect">Freigeschaltet</div>`
                        : reached
                            ? `<div class="upgrade-desc">Kann kondensiert werden.</div>
                               <div class="upgrade-cost ${affordable ? '' : 'unaffordable'}">${fmt(t.unlockCost)} Masse</div>`
                            : `<div class="upgrade-desc">Erreiche ${fmt(t.unlock)} Gesamt-Masse.</div>`
                    }
                </div>
            </div>`;
    }
    els.panels.particles.innerHTML = html;

    // Dark Matter
    html = `<div class="section-heading">Permanente Upgrades — bleiben über Kollapse hinweg</div>`;
    for (const u of DM_UPGRADES) {
        const lvl = state.dmUpgrades[u.id] || 0;
        const maxed = lvl >= u.maxLevel;
        const cost = u.baseCost * Math.pow(u.growth, lvl);
        const affordable = state.darkMatter >= cost && !maxed;
        const eff = u.effect(lvl);
        const nextEff = u.effect(lvl + 1);
        html += `
            <div class="upgrade ${!affordable && !maxed ? 'disabled' : ''} ${affordable ? 'affordable' : ''}"
                 data-buy-dm="${u.id}">
                <div class="upgrade-header">
                    <span class="upgrade-name">${u.name}</span>
                    <span class="upgrade-level">Lv ${lvl}${maxed ? ' (MAX)' : ` / ${u.maxLevel}`}</span>
                </div>
                <div class="upgrade-desc">${u.desc}</div>
                <div class="upgrade-effect">${eff.label}${!maxed ? ` → ${nextEff.label}` : ''}</div>
                ${!maxed ? `<div class="upgrade-cost dm ${affordable ? '' : 'unaffordable'}">${fmt(cost)} Dark Matter</div>` : ''}
            </div>`;
    }
    els.panels.dark.innerHTML = html;

    // Multiverse
    if (multiverseUnlocked()) {
        html = `<div class="section-heading">Kosmos-Upgrades — bleiben über Multiverse-Resets hinweg</div>`;
        for (const u of MULT_UPGRADES) {
            const lvl = state.multUpgrades[u.id] || 0;
            const maxed = lvl >= u.maxLevel;
            const cost = u.baseCost * Math.pow(u.growth, lvl);
            const affordable = state.kosmos >= cost && !maxed;
            const eff = u.effect(lvl);
            const nextEff = u.effect(lvl + 1);
            html += `
                <div class="upgrade ${!affordable && !maxed ? 'disabled' : ''} ${affordable ? 'affordable kosmos-tint' : ''}"
                     data-buy-mv="${u.id}">
                    <div class="upgrade-header">
                        <span class="upgrade-name">${u.name}</span>
                        <span class="upgrade-level">Lv ${lvl}${maxed ? ' (MAX)' : ` / ${u.maxLevel}`}</span>
                    </div>
                    <div class="upgrade-desc">${u.desc}</div>
                    <div class="upgrade-effect">${eff.label}${!maxed ? ` → ${nextEff.label}` : ''}</div>
                    ${!maxed ? `<div class="upgrade-cost kosmos ${affordable ? '' : 'unaffordable'}">${fmt(cost)} Kosmos</div>` : ''}
                </div>`;
        }
        els.panels.multiverse.innerHTML = html;
    } else {
        els.panels.multiverse.innerHTML = `
            <div class="section-heading">Multiverse — noch verborgen</div>
            <div class="upgrade disabled" style="cursor:default">
                <div class="upgrade-name">Erreiche ${MULTIVERSE_UNLOCK_DM} Dark Matter insgesamt</div>
                <div class="upgrade-desc">Danach kannst du dein Universum zerfallen lassen und ein neues Multiversum entfachen.</div>
            </div>`;
    }

    // Stats
    const playtime = Date.now() - state.stats.startTime;
    const achDone = Object.keys(state.achievements).length;
    let statsHtml = `
        <div class="section-heading">Session-Stats</div>
        <div class="stats-grid">
            <span class="k">Total Masse gesammelt</span><span class="v">${fmt(state.stats.totalMass)}</span>
            <span class="k">Total Dark Matter</span><span class="v">${fmt(state.stats.totalDM)}</span>
            <span class="k">Kollapse durchgeführt</span><span class="v">${state.stats.collapses}</span>
            <span class="k">Partikel absorbiert</span><span class="v">${state.stats.absorbedCount}</span>
            <span class="k">Klick-Impulse</span><span class="v">${state.stats.clicks}</span>
            <span class="k">Spielzeit</span><span class="v">${fmtTime(playtime)}</span>
            <span class="k">Erfolge</span><span class="v">${achDone} / ${ACHIEVEMENTS.length}</span>
        </div>
        <div class="section-heading" style="margin-top:16px">Erfolge</div>`;
    for (const a of ACHIEVEMENTS) {
        const done = !!state.achievements[a.id];
        statsHtml += `
            <div class="upgrade ${done ? '' : 'disabled'}" style="cursor:default">
                <div class="upgrade-header">
                    <span class="upgrade-name">${done ? '✓ ' : '· '}${a.title}</span>
                </div>
                <div class="upgrade-desc">${a.desc}</div>
            </div>`;
    }
    els.panels.stats.innerHTML = statsHtml;
}

function toast(label, title, desc) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<div class="t-label">${label}</div><div class="t-title">${title}</div>${desc ? `<div class="t-desc">${desc}</div>` : ''}`;
    els.toastContainer.appendChild(t);
    setTimeout(() => t.remove(), 5100);
}

// ---------------------------------------------------------------------------
// SAVE / LOAD / OFFLINE
// ---------------------------------------------------------------------------

function save() {
    try {
        state.lastSave = Date.now();
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn('Save fehlgeschlagen:', e);
    }
}

function load() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        // v1 -> v2 Migration: alte Saves bekommen die neuen Felder aus dem Initial-State
        // dazugemischt; Version wird auf aktuell gesetzt.
        if (parsed.version === 1 || parsed.version === SAVE_VERSION) {
            const init = makeInitialState();
            state = Object.assign(init, parsed);
            state.stats = Object.assign(init.stats, parsed.stats || {});
            state.multUpgrades = state.multUpgrades || {};
            state.kosmos = state.kosmos || 0;
            state.version = SAVE_VERSION;
            return true;
        }
        return false;
    } catch (e) {
        console.warn('Load fehlgeschlagen:', e);
        return false;
    }
}

function applyOfflineProgress() {
    if (!state.lastSave) return;
    const elapsed = Math.max(0, Date.now() - state.lastSave);
    if (elapsed < 60_000) return;  // <1min => uninteressant
    const capped = Math.min(elapsed, 12 * 3600 * 1000);  // max 12h
    const e = eff();
    if (e.autoCount === 0) return;  // ohne Kollektoren keine offline-progression

    // Näherung: durchschnittliche autoRate * seconds * offlinePct
    let avg = 0, totW = 0;
    for (const t of PARTICLE_TYPES) {
        if (!state.unlockedTypes[t.id]) continue;
        avg += t.value * t.weight;
        totW += t.weight;
    }
    if (totW === 0) return;
    avg /= totW;
    const gainPerSec = e.autoCount * e.autoRate * avg * e.yieldMult * 0.7 * e.offlinePct;
    const gain = gainPerSec * (capped / 1000);
    if (gain < 1) return;

    state.mass += gain;
    state.stats.totalMass += gain;

    els.offlineTime.textContent = fmtTime(elapsed);
    els.offlineAmount.textContent = '+' + fmt(gain) + ' Masse';
    els.offlineModal.classList.remove('hidden');
}

function hardReset() {
    if (!confirm('WIRKLICH alles zurücksetzen? Auch Dark Matter, Upgrades und Erfolge gehen verloren.')) return;
    localStorage.removeItem(SAVE_KEY);
    state = makeInitialState();
    mpsWindow = { lastMass: 0, lastT: 0, rate: 0 };
    runtime.particles.length = 0;
    renderShop();
}

// ---------------------------------------------------------------------------
// INPUT
// ---------------------------------------------------------------------------

function bindInput() {
    // Canvas: Klick auf freier Fläche -> Schockwelle
    els.canvas.addEventListener('pointerdown', (e) => {
        ensureAudio();
        const rect = els.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        handleClick(x, y);
    });

    // Shop tabs
    document.querySelectorAll('.tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
            renderShop();
        });
    });

    // Shop: delegated buy handlers
    document.getElementById('shop').addEventListener('click', (e) => {
        const t = e.target.closest('[data-buy]');
        if (t) { buyUpgrade(t.dataset.buy); return; }
        const tp = e.target.closest('[data-particle]');
        if (tp) { unlockParticle(tp.dataset.particle); return; }
        const td = e.target.closest('[data-buy-dm]');
        if (td) { buyDMUpgrade(td.dataset.buyDm); return; }
        const tm = e.target.closest('[data-buy-mv]');
        if (tm) { buyMultUpgrade(tm.dataset.buyMv); return; }
    });

    // Toolbar
    els.btnCollapse.addEventListener('click', performCollapse);
    els.btnMultiverse.addEventListener('click', performMultiverse);
    els.btnSave.addEventListener('click', () => { save(); toast('Gespeichert', 'Fortschritt gesichert', ''); });
    els.btnReset.addEventListener('click', hardReset);
    els.btnMute.addEventListener('click', () => {
        state.muted = !state.muted;
        els.btnMute.textContent = state.muted ? '🔇' : '🔊';
    });
    els.btnOfflineOk.addEventListener('click', () => els.offlineModal.classList.add('hidden'));
    els.btnInfo.addEventListener('click', () => els.infoModal.classList.remove('hidden'));
    els.btnInfoClose.addEventListener('click', () => els.infoModal.classList.add('hidden'));
    els.infoModal.addEventListener('click', (e) => {
        if (e.target === els.infoModal) els.infoModal.classList.add('hidden');
    });

    // Keyboard shortcut: Leertaste = Klick am Zentrum
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            handleClick(runtime.center.x, runtime.center.y);
        }
    });

    // Resize
    window.addEventListener('resize', fitCanvas);

    // Save vor unload
    window.addEventListener('beforeunload', save);
}

// ---------------------------------------------------------------------------
// MAIN LOOP
// ---------------------------------------------------------------------------

function loop() {
    const t = now();
    let dtRaw = (t - runtime.lastFrame) / 1000;
    runtime.lastFrame = t;
    if (dtRaw > 0.1) dtRaw = 0.1;  // clamp bei Tab-Wechsel

    updateEvent(dtRaw);

    const e = eff();
    // Zeit-Skalierung nur für Simulation/Ökonomie, nicht für Rendering/Effekte
    const dtSim = dtRaw * e.eventTimeScale;

    // spawn
    runtime.spawnAccum += dtSim * e.spawnPerSec;
    while (runtime.spawnAccum >= 1) {
        spawnParticle();
        runtime.spawnAccum -= 1;
    }
    while (runtime.particles.length > 500) runtime.particles.shift();

    simulateParticles(dtSim);
    tickAutoCollectors(dtSim);
    updateEffects(dtRaw);
    render();
    updateHUD(dtRaw);

    // Autosave alle 15s
    runtime.saveAccum += dtRaw;
    if (runtime.saveAccum >= 15) { save(); runtime.saveAccum = 0; }

    // Achievements alle 0.5s
    runtime.achAccum += dtRaw;
    if (runtime.achAccum >= 0.5) { checkAchievements(); runtime.achAccum = 0; }

    // Playtime
    state.stats.playtime += dtRaw * 1000;

    requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// BOOT
// ---------------------------------------------------------------------------

function boot() {
    grabElements();
    const loaded = load();
    fitCanvas();
    bindInput();
    if (loaded) applyOfflineProgress();
    if (state.muted) els.btnMute.textContent = '🔇';
    renderShop();
    // Startzustand: ein paar Partikel damit direkt was los ist
    for (let i = 0; i < 6; i++) spawnParticle(typeById.basic);
    runtime.lastFrame = now();
    requestAnimationFrame(loop);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}

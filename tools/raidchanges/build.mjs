import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const dataFile = (f) => path.join(here, 'data', f);
const read = (f) => JSON.parse(fs.readFileSync(dataFile(f), 'utf8'));

const entries = read('entries.json');
const lexicon = read('lexicon.json');
const NAMES = read('names_es.json').sort((a, b) => b[0].length - a[0].length);
const cache = read('abil-cache.json');
const NMAP = new Map(NAMES);

const GEN = { es: 'Cambios generales', en: 'General changes' };
const AREAS = [
  ['va', 'raid', 'El Abismo Venenoso', 'The Venomous Abyss', ['b', 3492]],
  ['tg', 'raid', 'La Gruta Mareal', 'The Tidebound Grotto', ['b', 3379]],
  ['kx', 'raid', "La liberación de Kith'ix", "The Unbinding of Kith'ix", ['b', 3513]],
  ['Altar of Fangs', 'dungeon', 'Altar de los Colmillos', 'Altar of Fangs', ['b', 12993]],
  ['Den of Nalorakk', 'dungeon', 'Guarida de Nalorakk', 'Den of Nalorakk', ['b', 12825]],
  ['Murder Row', 'dungeon', 'Frontal de la muerte', 'Murder Row', ['b', 12813]],
  ['The Blinding Vale', 'dungeon', 'El Valle Cegador', 'The Blinding Vale', ['b', 12859]],
  ['Voidscar Arena', 'dungeon', 'Arena Lacravacua', 'Voidscar Arena', ['b', 12923]],
  ["Kings' Rest", 'dungeon', 'Reposo de los Reyes', "Kings' Rest", ['a', 'achievement_dungeon_kingsrest']],
  ['Temple of Sethraliss', 'dungeon', 'Templo de Sethraliss', 'Temple of Sethraliss', ['a', 'achievement_dungeon_templeofsethraliss']],
  ['Ruby Life Pools', 'dungeon', 'Estanques de Vida Rubí', 'Ruby Life Pools', ['a', 'achievement_dungeon_lifepools']],
];
const ORDER_VA = ["Nek'zali the Soulcoiler", 'Entombed Sentinels', 'Vashnik the Malignant', 'The Lost Explorers', 'Sszorak', 'The Twin Fangs', 'The Coiled Altar', "Ula'tek"];
const BOSSICON = { "Nek'zali the Soulcoiler": 3470, 'Entombed Sentinels': 3445, 'Vashnik the Malignant': 3455, 'The Lost Explorers': 3497, Sszorak: 3420, 'The Twin Fangs': 3421, 'The Coiled Altar': 3429, "Ula'tek": 3492, 'Nymrissa Wavecaller': 3379, "Kith'ix": 3513 };
const UNIT_ES = { "Nek'zali the Soulcoiler": "Nek'zali la Volutadora de Almas", 'Entombed Sentinels': 'Centinelas sepultados', 'Vashnik the Malignant': 'Vashnik el Maligno', 'The Lost Explorers': 'Los Exploradores perdidos', 'The Twin Fangs': 'Los colmillos gemelos', 'The Coiled Altar': 'El Altar en Espiral' };
const BOSS_UNITS = new Set(["Zul'jan", "Rav'i", 'Lithiel Cinderfury', 'Zaen Bladesorrow', 'Xathuux the Annihilator', 'Defier Draghar', 'High Channeler Ryvati', 'Kokia Blazehoof', 'Melidrussa Chillworn', 'Kyrakka and Erkhart Stormvein', 'Thunderhead', 'Thunderhead and Flamegullet', 'Ikuzz the Light Hunter', 'Lightwarden Ruia', 'Potatoad Matriarch', 'Ziekket', "Taz'Rah", 'Atroxus', 'Chitigoth', 'Charonus', 'Avatar of Sethraliss', 'The Council of Tribes']);

const EJ = { "Zul'jan": 'zuljan', 'Lithiel Cinderfury': 'lithiel-cinderfury', 'Zaen Bladesorrow': 'zaen-bladesorrow', 'Xathuux the Annihilator': 'xathuux-the-annihilator', 'Kokia Blazehoof': 'kokia-blazehoof', 'Melidrussa Chillworn': 'melidrussa-chillworn', 'Kyrakka and Erkhart Stormvein': 'kyrakka', 'Lightwarden Ruia': 'lightwardenruia', Ziekket: 'ziekket', "Taz'Rah": 'tazrah', Atroxus: 'atroxus', Charonus: 'charonus' };
const norm = (s) => s.replace(/[’‘]/g, "'");
const escRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const esNames = (s) => { let out = s; for (const [e, x] of NAMES) out = out.replace(new RegExp(`(?<![\\w'{])${escRe(e)}(?![\\w'}])`, 'g'), () => x); return out; };
const maskOf = (t) => {
  const s = t.toLowerCase();
  if (/all difficulties/.test(s)) return '';
  if (/non-mythic/.test(s)) return 'RNH';
  let m = '';
  if (/raid finder/.test(s)) m += 'R';
  if (/\bnormal\b/.test(s)) m += 'N';
  if (/heroic/.test(s)) m += 'H';
  if (/mythic/.test(s)) m += 'M';
  return m.length === 4 ? '' : m;
};

const ids = new Set(Object.values(lexicon));
const info = { ...cache };
const fetchSpell = async (id, locale) => {
  const r = await fetch(`https://nether.wowhead.com/tooltip/spell/${id}?dataEnv=1&locale=${locale}`);
  return r.json();
};
for (const id of ids) {
  if (info[id]) continue;
  try {
    const es = await fetchSpell(id, 6);
    const en = await fetchSpell(id, 0);
    info[id] = [es.icon || 'inv_misc_questionmark', es.name || '', en.name || ''];
  } catch { info[id] = null; }
}
const keys = Object.keys(lexicon).filter((k) => info[lexicon[k]] && info[lexicon[k]][1]);
const sortedKeys = [...keys].sort((a, b) => b.length - a.length);
const tokEN = (s) => {
  let out = norm(s);
  for (const k of sortedKeys) out = out.replace(new RegExp(`(?<![\\w{}])${escRe(k)}(?![\\w}])`, 'g'), () => `{${lexicon[k]}}`);
  return out;
};
const tokES = (s) => s.replace(/\{([^}]+)\}/g, (m, k) => (lexicon[k] && info[lexicon[k]] ? `{${lexicon[k]}}` : k));

const areas = {};
for (const [id, kind, es, en, icon] of AREAS) areas[id] = { id, kind, es, en, icon, units: {} };
const unitOf = (area, name) => {
  const a = areas[area];
  if (!a) throw new Error(`Área desconocida: ${area}`);
  if (!a.units[name]) a.units[name] = { en: name === '*General' ? GEN.en : name, es: name === '*General' ? GEN.es : (UNIT_ES[name] || NMAP.get(name) || name), icon: BOSSICON[name] || null, rows: [] };
  return a.units[name];
};
const used = new Set();
const mark = (s) => { for (const m of s.matchAll(/\{(\d+)\}/g)) used.add(m[1]); };
for (const e of entries) {
  const en = tokEN(e.en.replace(/^\[ With weekly restarts \]/, '[With weekly restarts]'));
  const es = esNames(tokES(e.es));
  mark(en);
  mark(es);
  unitOf(e.a, e.u).rows.push([e.d, e.t, es, en, e.a === 'va' || e.a === 'tg' ? maskOf(e.en) : '']);
}
for (const a of Object.values(areas)) if (a.kind === 'dungeon') for (const u of Object.values(a.units)) { u.k = u.en === GEN.en ? 'g' : BOSS_UNITS.has(u.en) ? 'b' : 'm'; if (EJ[u.en]) u.ej = EJ[u.en]; }
const out = [];
for (const [k, a] of Object.entries(areas)) {
  const units = Object.values(a.units);
  if (k === 'va') units.sort((x, y) => { const ix = ORDER_VA.indexOf(x.en); const iy = ORDER_VA.indexOf(y.en); return (ix < 0 ? -1 : ix) - (iy < 0 ? -1 : iy); });
  else units.sort((x, y) => (x.en === GEN.en ? -1 : y.en === GEN.en ? 1 : x.en.localeCompare(y.en)));
  for (const u of units) u.rows.sort((x, y) => (x[0] < y[0] ? 1 : x[0] > y[0] ? -1 : 0));
  out.push({ id: k, kind: a.kind, es: a.es, en: a.en, icon: a.icon, units });
}
const abil = {};
for (const id of used) if (info[id]) abil[id] = info[id];
fs.writeFileSync(dataFile('abil-cache.json'), JSON.stringify(info));

const latest = entries.map((e) => e.d).sort().pop();
let tpl = fs.readFileSync(path.join(here, 'raidchanges.tpl.js'), 'utf8');
tpl = tpl.replace("const UPDATED = '2026-11-06';", () => `const UPDATED = '${latest}';`);
tpl = tpl.replace('/*ABIL*/{}', () => JSON.stringify(abil)).replace('/*AREAS*/[]', () => JSON.stringify(out));
fs.writeFileSync(path.join(root, 'src', 'raidchanges.js'), tpl);
console.log(`raidchanges.js: ${entries.length} cambios, ${Object.keys(abil).length} habilidades, hasta ${latest}`);

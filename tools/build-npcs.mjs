// Genera src/npcs.js (nombre en español e icono de cada enemigo de las bandas) y src/npcicons/*
// con datos públicos de Wowhead: las páginas de zona listan sus NPC (con tipo y si son jefe).
// Icono: los jefes llevan el suyo del Diario de Mazmorras (ui-ej-boss-*); el resto, un icono de WoW según su tipo.
// Uso:  node tools/build-npcs.mjs
import fs from 'fs';
import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(here, '..', 'src');
const ICONS = path.join(SRC, 'npcicons');
const UA = 'Mozilla/5.0';
// Venomous Abyss, Tidebound Grotto, Unbinding of Kith'ix, Voidspire, Dreamrift, Sporefall
const ZONES = [16915, 16671, 17059, 16340, 16531, 16279];
// Tipo de criatura de Wowhead -> icono de WoW
const TYPE_ICON = {
  1: 'ability_hunter_beasttraining', 2: 'inv_misc_head_dragon_01', 3: 'spell_shadow_summonfelhunter', 4: 'spell_nature_elementalabsorption',
  5: 'spell_nature_earthquake', 6: 'spell_shadow_raisedead', 7: 'inv_misc_head_human_01', 9: 'inv_gizmo_01', 11: 'spell_nature_manaregentotem',
};
const DEFAULT_ICON = 'inv_misc_bone_humanskull_01';

const pause = (ms) => new Promise((res) => setTimeout(res, ms));
let blocked = false;
const get = async (url, bin) => {
  for (let i = 0; i < 3; i++) {
    const r = await new Promise((res) => execFile('curl', ['-s', '-L', '--max-redirs', '5', '-A', UA, '-w', '\n%{http_code}', url], { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 }, (e, out) => res(out || Buffer.alloc(0))));
    const nl = r.lastIndexOf(10);
    const code = Number(r.slice(nl + 1).toString());
    const body = r.slice(0, nl);
    if (code === 200) return bin ? body : body.toString('utf8');
    if (code === 404) return null;
    if (code === 403) { blocked = true; return null; } // Wowhead limita las peticiones: se para en vez de insistir
    await pause(800 * (i + 1));
  }
  return null;
};

function zoneNpcs(html) {
  const i = html.indexOf("id: 'npcs'");
  if (i < 0) return [];
  const d = html.indexOf('data: [', i) + 6;
  let depth = 0, j = d;
  for (; j < html.length; j++) {
    const c = html[j];
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (!depth) break; }
    else if (c === '"') { j++; while (html[j] !== '"') { if (html[j] === '\\') j++; j++; } }
  }
  return JSON.parse(html.slice(d, j + 1));
}

const npcs = new Map(); // id -> { en, es, type, boss }
for (const z of ZONES) {
  const en = await get(`https://www.wowhead.com/zone=${z}`); await pause(500);
  const es = await get(`https://www.wowhead.com/es/zone=${z}`); await pause(500);
  if (!en || !es) { console.log('Wowhead no responde (zona', z, ')'); process.exit(2); }
  const enL = zoneNpcs(en), esById = new Map(zoneNpcs(es).map((n) => [n.id, n.name]));
  for (const n of enL) {
    if (n.type === 8 || n.type === 12) continue; // críticas y mascotas que no son enemigos
    const es0 = (esById.get(n.id) || n.name).replace(/^\[|\]$/g, ''); // Wowhead pone [..] a lo que no está traducido
    npcs.set(n.id, { en: n.name, es: es0, type: n.type, boss: !!n.boss });
  }
  console.log('zona', z, enL.length);
}

fs.rmSync(ICONS, { recursive: true, force: true });
fs.mkdirSync(ICONS, { recursive: true });
const saved = new Set();
async function save(name, url) {
  if (saved.has(name)) return true;
  const img = await get(url, true);
  if (!img || img.length < 200) return false;
  fs.writeFileSync(path.join(ICONS, name), img);
  saved.add(name);
  return true;
}
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

// El Diario de Mazmorras tiene icono para jefes y algunos adds: se prueba con el nombre completo y con cada palabra
const ejName = (en) => { const w = en.replace(/['’]/g, '').split(/[s-]+/).map(slug).filter(Boolean); return [slug(en), ...w.slice().reverse().filter((x) => x.length > 4)]; };
const out = {};
const entries = [...npcs];
let q = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (q < entries.length) {
    const [id, n] = entries[q++];
    let icon = '';
    for (const sl of ejName(n.en)) {
      if (await save(`boss-${sl}.png`, `https://wow.zamimg.com/images/wow/journal/ui-ej-boss-${sl}.png`)) { icon = `boss-${sl}.png`; break; }
    }
    if (!icon) {
      const ic = TYPE_ICON[n.type] || DEFAULT_ICON;
      if (await save(`${ic}.jpg`, `https://wow.zamimg.com/images/wow/icons/large/${ic}.jpg`)) icon = `${ic}.jpg`;
    }
    out[id] = [n.en, n.es, icon];
  }
}));
if (blocked) { console.log('Wowhead ha cortado (403): vuelve a ejecutarlo más tarde'); process.exit(2); }

const clean = Object.fromEntries(Object.entries(out).sort((a, b) => a[0] - b[0]));
fs.writeFileSync(path.join(SRC, 'npcs.js'),
  `'use strict';\n// Generado por tools/build-npcs.mjs — id de NPC: [nombre en inglés, nombre en español, archivo del icono en npcicons/]\nconst NPC_DATA = ${JSON.stringify(clean)};\n`);
console.log('NPC', npcs.size, 'iconos', saved.size, 'jefes', [...saved].filter((s) => s.startsWith('boss-')).length);

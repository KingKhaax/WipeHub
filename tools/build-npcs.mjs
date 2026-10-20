// Genera src/npcs.js (nombre en español de cada enemigo de las bandas) con datos públicos de Wowhead:
// las páginas de zona listan sus NPC en inglés y en español. Lo que Wowhead no tiene traducido se completa en OVERRIDES.
// Uso:  node tools/build-npcs.mjs
import fs from 'fs';
import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(here, '..', 'src');
const UA = 'Mozilla/5.0';
// Venomous Abyss, Tidebound Grotto, Unbinding of Kith'ix, Voidspire, Dreamrift, Sporefall
const ZONES = [16915, 16671, 17059, 16340, 16531, 16279];
// Nombres que Wowhead aún no trae en español (traducción propia, con el vocabulario del juego)
const OVERRIDES = {
  'Latent Cultist': 'Cultista latente', 'First Mate Nama': 'Primer oficial Nama', 'Scrollsage Iku': 'Sabio de pergaminos Iku',
  'Trader Gebbo': 'Comerciante Gebbo', 'Blightscale Wretch': 'Desdichado escamañublo', 'Venomous Hulk': 'Mole venenosa',
  'Voidweaver': 'Tejedor del Vacío', 'Mindstinger Egg': 'Huevo de aguijón mental', 'Solidified Snake Venom': 'Veneno de serpiente solidificado',
  'Barbed Bulwark': 'Baluarte espinoso', 'Mindstinger': 'Aguijón mental', 'Malignant Totem': 'Tótem maligno',
  'Broodling of Ithraz': 'Cría de Ithraz', 'Slithering Clutch': 'Nidada reptante', 'Echo of Jawae': 'Eco de Jawae',
  'Virulent Mutation': 'Mutación virulenta', "Shadowspeaker Ip'thosh": "Hablasombras Ip'thosh", 'Venomspeaker Shrix': 'Hablaveneno Shrix',
  'Shadewarder': 'Guardasombras', 'Doomscale Warden': 'Guardián escamaperdición', 'Colossal Earthbreaker': 'Rompetierras colosal',
  'Dark Skitterer': 'Correteador oscuro', 'Heartstinger': 'Aguijoneador de corazones', 'Burster Beetle': 'Escarabajo reventón',
};

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
    npcs.set(n.id, { en: n.name, es: es0 });
  }
  console.log('zona', z, enL.length);
}

const out = {};
for (const [id, n] of npcs) out[id] = [n.en, OVERRIDES[n.en] || n.es];
if (blocked) { console.log('Wowhead ha cortado (403): vuelve a ejecutarlo más tarde'); process.exit(2); }

const clean = Object.fromEntries(Object.entries(out).sort((a, b) => a[0] - b[0]));
fs.writeFileSync(path.join(SRC, 'npcs.js'),
  `'use strict';\n// Generado por tools/build-npcs.mjs — id de NPC: [nombre en inglés, nombre en español]\nconst NPC_DATA = ${JSON.stringify(clean)};\n`);
console.log('NPC', npcs.size, 'sin traducir', Object.values(clean).filter((v) => v[0] === v[1]).length);

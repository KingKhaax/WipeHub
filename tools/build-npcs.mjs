// Genera src/npcs.js (nombre en español e icono de cada enemigo de las bandas) y src/npcicons/*.webp
// con datos públicos de Wowhead: las páginas de zona listan sus NPC y cada NPC trae su id de modelo,
// del que sale la miniatura. Uso:  node tools/build-npcs.mjs
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

let blocked = false;
const pause = (ms) => new Promise((res) => setTimeout(res, ms));
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

// Caché para poder reanudar si Wowhead corta (limita las peticiones): NPC_CACHE=ruta.json
const CACHE = process.env.NPC_CACHE || path.join(here, '.npcs-cache.json');
const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : { zones: {}, disp: {} };
const npcs = new Map(); // id -> { en, es }
for (const z of ZONES) {
  if (!cache.zones[z]) {
    const en = await get(`https://www.wowhead.com/zone=${z}`); await pause(500);
    const es = await get(`https://www.wowhead.com/es/zone=${z}`); await pause(500);
    if (en && es) cache.zones[z] = { en: zoneNpcs(en), es: zoneNpcs(es) };
  }
  const enL = cache.zones[z]?.en || [], esL = cache.zones[z]?.es || [];
  const esById = new Map(esL.map((n) => [n.id, n.name]));
  for (const n of enL) {
    const es0 = esById.get(n.id); if (n.type === 8 || n.type === 12) continue; // críticas y objetos que no son enemigos
    npcs.set(n.id, { en: n.name, es: (es0 || n.name).replace(/^\[|\]$/g, '') });
  }
  console.log('zona', z, enL.length);
}

fs.mkdirSync(ICONS, { recursive: true });
const ids = [...npcs.keys()];
const out = {};
let k = 0;
async function work() {
  while (k < ids.length) {
    const id = ids[k++];
    if (blocked) return;
    if (cache.disp[id] === undefined) {
      const html = await get(`https://www.wowhead.com/npc=${id}`);
      await pause(400);
      if (!html) continue;
      const m = html.match(/displayId = (\d+)/);
      cache.disp[id] = m ? Number(m[1]) : 0;
      if (k % 25 === 0) fs.writeFileSync(CACHE, JSON.stringify(cache));
    }
    const disp = cache.disp[id];
    let icon = 0;
    if (disp) {
      const file = path.join(ICONS, `${disp}.webp`);
      if (fs.existsSync(file)) icon = disp;
      else {
        const img = await get(`https://wow.zamimg.com/modelviewer/live/webthumbs/npc/${disp % 256}/${disp}.webp`, true);
        if (img && img.length > 200) { fs.writeFileSync(file, img); icon = disp; }
      }
    }
    const n = npcs.get(id);
    out[id] = [n.en, n.es, icon];
  }
}
await Promise.all(Array.from({ length: 2 }, work));

fs.writeFileSync(CACHE, JSON.stringify(cache));
if (blocked) { console.log('Wowhead ha cortado (403): vuelve a ejecutarlo más tarde, continúa donde se quedó'); process.exit(2); }
const clean = Object.fromEntries(Object.entries(out).sort((a, b) => a[0] - b[0]));
const withIcon = Object.values(clean).filter((v) => v[2]).length;
fs.writeFileSync(path.join(SRC, 'npcs.js'),
  `'use strict';
// Generado por tools/build-npcs.mjs — id de NPC: [nombre en inglés, nombre en español, id de modelo para el icono]\nconst NPC_DATA = ${JSON.stringify(clean)};\n`);
console.log('NPC', ids.length, 'con icono', withIcon);

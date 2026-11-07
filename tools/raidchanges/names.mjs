import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const pendingFile = path.join(here, 'data', 'pending-names.json');
const namesFile = path.join(here, 'data', 'names_es.json');
const write = process.argv.includes('--write');
const headers = { 'user-agent': 'Mozilla/5.0' };

const pending = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
const names = JSON.parse(fs.readFileSync(namesFile, 'utf8'));
const singular = (s) => s.replace(/^(Fragments|Totems|Soulcoilers|Tenders)\b/, (m) => m.slice(0, -1));

const findNpc = async (en) => {
  const r = await fetch(`https://www.wowhead.com/search/suggestions-template?q=${encodeURIComponent(singular(en))}`, { headers });
  const j = await r.json();
  const hit = (j.results || []).find((x) => x.type === 1 && x.name.toLowerCase() === singular(en).toLowerCase());
  return hit ? hit.id : 0;
};
const spanishName = async (id) => {
  const r = await fetch(`https://nether.wowhead.com/tooltip/npc/${id}?dataEnv=1&locale=6`);
  const j = await r.json();
  return j.name || '';
};

const stillPending = [];
const translated = [];
for (const p of pending) {
  if (p.keep) { stillPending.push(p); continue; }
  try {
    const id = p.npc || await findNpc(p.en);
    const es = id ? await spanishName(id) : '';
    if (es && !es.startsWith('[') && es.toLowerCase() !== p.en.toLowerCase()) {
      translated.push({ en: p.en, es, npc: id });
      if (write) { const i = names.findIndex((x) => x[0] === p.en); if (i >= 0) names.splice(i, 1); names.push([p.en, es]); }
    } else stillPending.push({ ...p, npc: id || p.npc });
  } catch { stillPending.push(p); }
}
if (write) {
  fs.writeFileSync(namesFile, JSON.stringify(names));
  fs.writeFileSync(pendingFile, JSON.stringify(stillPending, null, 1));
}
console.log(JSON.stringify({ translated, pending: stillPending.map((p) => p.en) }, null, 1));

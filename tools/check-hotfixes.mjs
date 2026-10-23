// Comprueba si el artículo de hotfixes de Blizzard tiene fechas más nuevas que la última fecha de src/classchanges.js.
// Uso: node tools/check-hotfixes.mjs  -> imprime JSON { latestData, newDates, text }; sale con código 0 siempre (el aviso lo da el workflow).
import fs from 'node:fs';

const ARTICLE = 'https://news.blizzard.com/en-us/article/24296142';
const MONTHS = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };
const iso = (m, d, y) => `${y}-${String(MONTHS[m]).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const src = fs.readFileSync(new URL('../src/classchanges.js', import.meta.url), 'utf8');
const dates = [...src.matchAll(/\['(\d{4}-\d{2}-\d{2})'/g)].map((m) => m[1]).sort();
const latestData = dates[dates.length - 1] || '';

const res = await fetch(ARTICLE, { headers: { 'user-agent': 'Mozilla/5.0 (WipeHub hotfix check)' }, redirect: 'follow' });
if (!res.ok) { console.log(JSON.stringify({ latestData, error: `HTTP ${res.status}` })); process.exit(0); }
const html = await res.text();
const body = html.slice(html.indexOf('<body'));
const text = body.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<\/(p|li|h[1-6]|div|section|ul|ol)>/gi, '\n').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n');
const re = /^\s*(January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2}), (20\d\d)\s*$/gm;
const heads = [...text.matchAll(re)].map((m) => ({ date: iso(m[1], m[2], m[3]), at: m.index, end: m.index + m[0].length }));
const newer = heads.filter((h) => h.date > latestData);
const blocks = newer.map((h) => {
  const next = heads.find((x) => x.at > h.at);
  return `${h.date}\n${text.slice(h.end, next ? next.at : h.end + 4000).trim().slice(0, 4000)}`;
});
console.log(JSON.stringify({ latestData, articleDates: heads.map((h) => h.date).slice(0, 5), newDates: newer.map((h) => h.date), text: blocks.join('\n\n---\n\n') }, null, 2));

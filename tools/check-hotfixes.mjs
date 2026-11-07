import fs from 'node:fs';

const MONTHS = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };
const iso = (m, d, y) => `${y}-${String(MONTHS[m]).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');

const articles = JSON.parse(read('./raidchanges/data/articles.json'));
const classDates = [...read('../src/classchanges.js').matchAll(/\['(\d{4}-\d{2}-\d{2})'/g)].map((m) => m[1]).sort();
const raidDates = JSON.parse(read('./raidchanges/data/entries.json')).map((e) => e.d).sort();
const latestClasses = classDates[classDates.length - 1] || '';
const latestRaids = raidDates[raidDates.length - 1] || '';

const toText = (html) => html.slice(html.indexOf('<body'))
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<\/(p|li|h[1-6]|div|section|ul|ol)>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'")
  .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n');

const blocks = new Map();
const failed = [];
for (const url of articles) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (WipeHub hotfix check)' }, redirect: 'follow' });
    if (!res.ok) { failed.push(`${url} HTTP ${res.status}`); continue; }
    const text = toText(await res.text());
    const re = /^\s*(January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2}), (20\d\d)\s*$/gm;
    const heads = [...text.matchAll(re)].map((m) => ({ date: iso(m[1], m[2], m[3]), at: m.index, end: m.index + m[0].length }));
    heads.forEach((h, i) => {
      const body = text.slice(h.end, heads[i + 1] ? heads[i + 1].at : h.end + 6000).trim();
      if (!blocks.has(h.date)) blocks.set(h.date, body.slice(0, 6000));
    });
  } catch (e) { failed.push(`${url} ${String(e.message || e)}`); }
}

const section = (body, name) => new RegExp(`(^|\\n)\\s*${name}\\s*(\\n|$)`).test(body);
const newClass = [...blocks].filter(([d, b]) => d > latestClasses && section(b, 'Classes')).sort((a, b) => (a[0] < b[0] ? -1 : 1));
const newRaid = [...blocks].filter(([d, b]) => d > latestRaids && section(b, 'Dungeons and Raids')).sort((a, b) => (a[0] < b[0] ? -1 : 1));
const pack = (list) => list.map(([d, b]) => `${d}\n${b}`).join('\n\n---\n\n');

console.log(JSON.stringify({
  latestClasses,
  latestRaids,
  newClassDates: newClass.map(([d]) => d),
  newRaidDates: newRaid.map(([d]) => d),
  newDates: [...new Set([...newClass, ...newRaid].map(([d]) => d))].sort(),
  failed,
  classText: pack(newClass),
  raidText: pack(newRaid),
}, null, 2));

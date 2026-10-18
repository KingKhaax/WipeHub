import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// mergeRankings vive en app.js (script de navegador): se extrae y se evalúa solo esa función
const src = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const start = src.indexOf('function mergeRankings(');
const end = src.indexOf('\nfunction rankings(', start);
const mergeRankings = new Function(`${src.slice(start, end)}; return mergeRankings;`)();

const mk = (chars) => ({ data: [{ roles: { dps: { characters: chars } } }] });

test('Parse % e Ilvl % salen del modo por defecto, como la web de Warcraft Logs', () => {
  // valores reales del log Kw3cy29J8t6gA7bG: por defecto 95 (la web enseña 95); el modo Parses daba 85
  const a = mk([{ name: 'Natristare', rank: '~1527', totalParses: 30552, rankPercent: 95, bracketPercent: 96 }]);
  const b = mk([{ name: 'Natristare', rank: '~3000', totalParses: 90000, rankPercent: 85, bracketPercent: 80 }]);
  const c = mergeRankings(a, b).data[0].roles.dps.characters[0];
  assert.equal(c.rankPercent, 95);
  assert.equal(c.bracketPercent, 96);
  assert.equal(c.fromParses, undefined);
});

test('si el modo por defecto no trae valor, se rellena con el del modo Parses', () => {
  const a = mk([{ name: 'X', rank: '~5', totalParses: 100, rankPercent: 0, bracketPercent: 0 }]);
  const b = mk([{ name: 'X', rank: '~5', totalParses: 80, rankPercent: 70, bracketPercent: 66 }]);
  const c = mergeRankings(a, b).data[0].roles.dps.characters[0];
  assert.equal(c.rankPercent, 70);
  assert.equal(c.bracketPercent, 66);
  assert.equal(c.fromParses, true);
});

test('si los dos modos dan 0, se queda en 0', () => {
  const a = mk([{ name: 'X', rank: 5, totalParses: 100, rankPercent: 0, bracketPercent: 0 }]);
  const b = mk([{ name: 'X', rank: '~5', totalParses: 80, rankPercent: 0, bracketPercent: 0 }]);
  assert.equal(mergeRankings(a, b).data[0].roles.dps.characters[0].rankPercent, 0);
});

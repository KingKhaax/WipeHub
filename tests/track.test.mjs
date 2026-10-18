import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// trackOf vive en profile.js (script de navegador): se extrae solo ese bloque y se evalúa
const src = fs.readFileSync(new URL('../src/profile.js', import.meta.url), 'utf8');
const a = src.indexOf('  const TRACK_BONUS');
const b = src.indexOf('  // «Crafteado» + icono de su pista');
const trackOf = new Function(`${src.slice(a, b)}; return trackOf;`)();
const item = (text, ilvl, extra = {}) => ({ ilvl, tip: { nameDesc: text ? { t: text } : null }, simc: { bonus: [], crafted: [], ...extra } });

test('lo que pone el objeto manda: Mítico, Heroico, Normal, Buscador de bandas', () => {
  assert.equal(trackOf(item('Mythic', 334)).key, 'myth');
  assert.equal(trackOf(item('Mítico', 300)).key, 'myth');
  assert.equal(trackOf(item('Mythic+', 321)).key, 'myth');
  assert.equal(trackOf(item('Mítica+', 321)).key, 'myth');
  assert.equal(trackOf(item('Heroic', 334)).key, 'hero');
  assert.equal(trackOf(item('Heroico', 280)).key, 'hero');
  assert.equal(trackOf(item('Heroic Venomcursed', 318)).key, 'hero');
  assert.equal(trackOf(item('Heroico Maldito por el veneno', 318)).key, 'hero');
  assert.equal(trackOf(item('Normal', 300)).key, 'champion');
  assert.equal(trackOf(item('Raid Finder', 300)).key, 'veteran');
  assert.equal(trackOf(item('Buscador de bandas', 300)).key, 'veteran');
});

test('sin texto de dificultad: ids de bonus y, si no, nivel de objeto', () => {
  assert.equal(trackOf(item('Venomcursed', 308, { bonus: [6652, 13333] })).key, 'champion');
  assert.equal(trackOf(item(null, 334)).key, 'myth');
  assert.equal(trackOf(item(null, 325)).key, 'hero');
  assert.equal(trackOf(item(null, 310)).key, 'champion');
  assert.equal(trackOf(item(null, 100)).key, null);
});

test('las piezas creadas llevan «Crafteado» y su pista sale por nivel de objeto', () => {
  const c = trackOf(item('Tidal Crafted', 331, { crafted: [36, 40] }));
  assert.equal(c.crafted, true);
  assert.equal(c.key, 'hero');
  assert.equal(trackOf(item('Creado por las mareas', 331)).crafted, true);
  assert.equal(trackOf(item('Mythic', 334, { crafted: [36] })).key, 'myth');
});

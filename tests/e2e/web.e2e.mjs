// Pruebas de navegador de la web de WipeTime (se lanzan en el CI antes de publicar). Uso: node tests/e2e/web.e2e.mjs
// Requisitos: haber ejecutado «node tools/build-web.mjs» (carpeta web-dist) y tener Chromium para Playwright (o E2E_BROWSER).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { serve, launch, newPage, contexts, test, runAll } from './lib.mjs';

const pkg = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const DIST = new URL('../../web-dist/', import.meta.url);
const { srv, url } = await serve(DIST);
const browser = await launch();
// después de cada prueba se cierran sus páginas (cerrar con peticiones en vuelo al final daba errores sueltos del runner)
test.afterEach(async () => { for (const c of contexts.splice(0)) await c.close().catch(() => {}); });
test.after(async () => { await browser.close(); srv.close(); });

const open = async (hash = '', opts) => { const p = await newPage(browser, opts); await p.goto(url + hash, { waitUntil: 'load' }); await p.waitForTimeout(900); return p; };
const noErrors = (p) => assert.deepEqual(p.errors, [], 'errores de página: ' + p.errors.join(' | '));

test('la web compilada está completa y es de la versión del package.json', () => {
  assert.equal(JSON.parse(fs.readFileSync(new URL('version.json', DIST), 'utf8')).version, pkg.version);
  const html = fs.readFileSync(new URL('index.html', DIST), 'utf8');
  let n = 0;
  for (const m of html.matchAll(/(?:src|href)="([^"#?]+\.(?:js|css|png|webp|woff2|json))(?:\?[^"]*)?"/g)) {
    if (/^(https?:)?\/\//.test(m[1])) continue;
    assert.ok(fs.existsSync(new URL(m[1], DIST)), 'falta ' + m[1]);
    n++;
  }
  assert.ok(n > 3, 'el index.html debe enlazar sus archivos');
});

test('la portada carga sin errores y con su logo de parche', async () => {
  const p = await open();
  assert.ok(await p.$('.welcome'), 'portada');
  assert.match(await p.title(), /WipeTime/);
  await p.waitForFunction(() => document.querySelector('#expImg')?.classList.contains('art'), null, { timeout: 8000 });
  noErrors(p);
});

test('el logo del parche sigue el idioma (español / inglés)', async () => {
  const p = await open();
  // la página tiene una CSP estricta: se sondea desde Node (waitForFunction necesita eval)
  const srcIs = async (re) => { let v = ''; for (let i = 0; i < 40; i++) { v = (await p.$eval('#expImg', (e) => e.getAttribute('src')).catch(() => '')) || ''; if (new RegExp(re).test(v)) return; await p.waitForTimeout(200); } assert.match(v, new RegExp(re)); };
  await p.evaluate(() => setLang('es'));
  await srcIs('12\\.1\\.es\\.webp$');
  await p.evaluate(() => setLang('en'));
  await srcIs('12\\.1\\.webp$');
  noErrors(p);
});

test('las pantallas tienen su propia dirección y Atrás funciona', async () => {
  const p = await open();
  const hash = () => p.evaluate(() => location.hash);
  await p.click('#guildBtn'); await p.waitForTimeout(500);
  assert.equal(await hash(), '#/guilds');
  await p.click('#profBtn'); await p.waitForTimeout(500);
  assert.equal(await hash(), '#/characters');
  await p.click('#cmpBtn'); await p.waitForTimeout(500);
  assert.equal(await hash(), '#/compare');
  await p.goBack(); await p.waitForTimeout(600);
  assert.equal(await hash(), '#/characters');
  await p.goBack(); await p.waitForTimeout(600);
  assert.equal(await hash(), '#/guilds');
  noErrors(p);
});

test('los enlaces directos de guild y de comparación se respetan', async () => {
  const g = await open('#/guilds/eu/zuljin/Skill%20Issue/roster');
  assert.equal(await g.evaluate(() => location.hash), '#/guilds/eu/zuljin/Skill%20Issue/roster');
  const v = await open('#/guilds/vs/eu/zuljin/Skill%20Issue/eu/tarren-mill/Method');
  assert.match(await v.evaluate(() => location.hash), /^#\/guilds\/vs\/eu\/zuljin\/Skill%20Issue\/eu\/tarren-mill\/Method/);
});

test('Ajustes: pestañas, restablecer con confirmación, historial recortado y «Acerca de» dentro de Versión', async () => {
  const p = await open();
  await p.evaluate(() => openSettings());
  const tabs = await p.$$eval('.set-tab', (e) => e.map((x) => x.dataset.setTab));
  assert.deepEqual(tabs, ['general', 'look', 'replay', 'data', 'version']);
  assert.ok(!(await p.$('#settings [data-seg="lang"]')), 'el idioma ya no está en Ajustes (se cambia desde la barra de arriba)');
  // en la web no salen las opciones de escritorio
  await p.click('[data-set-tab="data"]'); await p.waitForTimeout(250);
  const acts = await p.$$eval('#settings [data-set-act]', (e) => e.map((x) => x.dataset.setAct));
  assert.ok(!acts.includes('open-data') && !acts.includes('clear-icons'));
  // restablecer pide confirmar
  await p.evaluate(() => WCSettings.set('zoom', 130));
  await p.click('#resetAll'); await p.waitForTimeout(200);
  assert.equal(await p.evaluate(() => WCSettings.get('zoom')), 130);
  await p.click('#resetAll'); await p.waitForTimeout(400);
  assert.equal(await p.evaluate(() => WCSettings.get('zoom')), 100);
  // historial: 10 entradas y «Ver más»
  await p.click('[data-set-tab="version"]'); await p.waitForTimeout(250);
  assert.equal(await p.$$eval('.cl-card', (e) => e.length), 10);
  assert.ok((await p.$$eval('.cl-card .cl-sic', (e) => e.length)) >= 6, 'secciones con iconos de WoW');
  assert.ok(await p.$('.cl-card.latest .cl-tag'), 'la última versión lleva su etiqueta');
  await p.click('[data-set-act="toggle-log"]'); await p.waitForTimeout(250);
  assert.ok((await p.$$eval('.cl-card', (e) => e.length)) > 10);
  // la bandera de España va sin texto
  assert.ok(!/España/.test(await p.$eval('.about-es', (e) => e.innerText)));
  noErrors(p);
});

test('Ajustes: región y dificultad por defecto, colores propios, exportar e importar', async () => {
  const p = await open();
  await p.evaluate(() => openSettings('general'));
  await p.selectOption('[data-set-sel="region"]', 'us');
  await p.selectOption('[data-set-sel="diff"]', '4');
  assert.equal(await p.evaluate(() => WCSettings.get('region')), 'us');
  assert.equal(await p.evaluate(() => WCSettings.get('diff')), 4);
  await p.click('[data-set-tab="look"]'); await p.waitForTimeout(200);
  await p.$eval('[data-color="bg"]', (e) => { e.value = '#202020'; e.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(200);
  assert.equal(await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()), '#202020');
  await p.click('[data-set-act="reset-colors"]'); await p.waitForTimeout(200);
  assert.notEqual(await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()), '#202020');
  // rueda de color de los botones: el color elegido se aplica en vivo y se guarda
  await p.$eval('[data-accent-custom]', (e) => { e.value = '#12ab34'; e.dispatchEvent(new Event('input', { bubbles: true })); }); await p.waitForTimeout(200);
  assert.equal(await p.evaluate(() => WCSettings.get('accent')), 'custom');
  assert.equal(await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()), '#12ab34');
  assert.ok(await p.$('#settings .swatch.custom.on'), 'la rueda sale marcada');
  assert.ok((await p.$$eval('#settings .swatch[data-set="accent"]', (e) => e.length)) >= 15, 'hay más colores');
  await p.evaluate(() => WCSettings.set('accent', 'pink'));
  await p.click('[data-set-tab="data"]'); await p.waitForTimeout(200);
  // se captura el archivo que se descargaría (una descarga real deja un objetivo sin navegar que hace caer a Playwright al cerrar)
  await p.evaluate(() => { URL.createObjectURL = (b) => { window.__dl = b; return 'blob:test'; }; HTMLAnchorElement.prototype.click = function () { window.__dlName = this.download; }; });
  await p.click('[data-set-act="export-settings"]'); await p.waitForTimeout(200);
  const exported = await p.evaluate(() => window.__dl.text());
  assert.equal(await p.evaluate(() => window.__dlName), 'wipetime-ajustes.json');
  assert.match(exported, /"accent": "pink"/);
  const file = new URL('../../.e2e-settings.json', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  fs.writeFileSync(file, exported);
  await p.evaluate(() => WCSettings.set('accent', 'teal'));
  await p.setInputFiles('#setImport', file); await p.waitForTimeout(400);
  assert.equal(await p.evaluate(() => WCSettings.get('accent')), 'pink');
  // un archivo que no es de ajustes no se acepta
  fs.writeFileSync(file, '{"hola":1}');
  await p.setInputFiles('#setImport', file); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => WCSettings.get('accent')), 'pink');
  fs.rmSync(file, { force: true });
  noErrors(p);
});

test('pulsar el nombre de Discord o Battle.net lo copia y avisa en medio de la pantalla', async () => {
  const p = await open();
  await p.evaluate(() => openSettings('version'));
  for (const [k, name] of [['discord', 'sr.kitkat'], ['battlenet', 'KitKat#21202']]) {
    await p.click(`.about-friend[data-friend="${k}"]`); await p.waitForSelector('#copyPop'); 
    assert.equal(await p.evaluate(() => navigator.clipboard.readText()), name);
    assert.match(await p.$eval('#copyPop', (e) => e.innerText), /copiado al portapapeles/i);
    assert.match(await p.$eval('#copyPop', (e) => e.innerText), new RegExp(name.replace('.', '\.')));
    const box = await p.$eval('#copyPop', (e) => { const r = e.getBoundingClientRect(); return { cx: r.x + r.width / 2, cy: r.y + r.height / 2, w: innerWidth, h: innerHeight }; });
    assert.ok(Math.abs(box.cx - box.w / 2) < 40 && Math.abs(box.cy - box.h / 2) < 40, 'el aviso está en el centro');
    await p.waitForSelector('#copyPop', { state: 'detached', timeout: 5000 });
  }
  noErrors(p);
});

test('avisa cuando hay una versión nueva de la web', async () => {
  let v = pkg.version;
  const p = await newPage(browser);
  await p.route('**/version.json*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ version: v }) }).catch(() => {}));
  const asked = p.waitForResponse((r) => /version\.json/.test(r.url()), { timeout: 15000 }); // la web lo pide a los ~4 s de abrirse
  await p.goto(url); await asked; await p.waitForTimeout(500);
  assert.ok(!(await p.$('#newVer')), 'misma versión: sin aviso');
  v = '99.0.0';
  await p.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await p.waitForSelector('#newVer', { timeout: 8000 });
});

test('ordenar tablas por columna (TableSort): números, texto y cabecera suelta con filas en un contenedor', async () => {
  const p = await open();
  await p.evaluate(() => {
    const m = document.getElementById('main');
    m.innerHTML = `<table id="t1"><thead><tr><th>Nombre</th><th>Puntos</th></tr></thead><tbody>
      <tr><td>Beta</td><td>1.250,5</td></tr><tr><td>Alfa</td><td>30</td></tr><tr><td>Gamma</td><td>400</td></tr></tbody></table>
      <div class="gc-head gt-head"><span>Jefe</span><span>Trys</span></div><div class="gt-tbl"><div class="gt-row"><span>B</span><b>5</b></div><div class="gt-row"><span>A</span><b>20</b></div><div class="gt-row"><span>C</span><b>1</b></div></div>`;
    TableSort.enhance(m);
  });
  await p.click('#t1 th:nth-child(2)'); await p.waitForTimeout(100);
  assert.deepEqual(await p.$$eval('#t1 tbody td:nth-child(2)', (e) => e.map((x) => x.textContent)), ['1.250,5', '400', '30'], 'números de mayor a menor');
  await p.click('#t1 th:nth-child(1)'); await p.waitForTimeout(100);
  assert.deepEqual(await p.$$eval('#t1 tbody td:nth-child(1)', (e) => e.map((x) => x.textContent)), ['Alfa', 'Beta', 'Gamma'], 'texto de A a Z');
  await p.click('.gt-head span:nth-child(2)'); await p.waitForTimeout(100);
  assert.deepEqual(await p.$$eval('.gt-tbl .gt-row b', (e) => e.map((x) => x.textContent)), ['20', '5', '1'], 'cabecera suelta + contenedor');
  noErrors(p);
});


test('todos los avisos de copiar usan el mismo mensaje en medio de la pantalla', async () => {
  const p = await open();
  await p.evaluate(() => showCopiedPop('Talentos: pégalos en el juego'));
  const box = await p.$eval('#copyPop', (e) => { const r = e.getBoundingClientRect(); return { cx: r.x + r.width / 2, cy: r.y + r.height / 2, w: innerWidth, h: innerHeight, t: e.innerText }; });
  assert.match(box.t, /copiado al portapapeles/i);
  assert.ok(Math.abs(box.cx - box.w / 2) < 40 && Math.abs(box.cy - box.h / 2) < 40, 'centrado');
  await p.evaluate(() => showCopiedPop('x', false));
  assert.ok(await p.$('#copyPop.err'), 'el fallo sale en rojo');
  noErrors(p);
});

await runAll();

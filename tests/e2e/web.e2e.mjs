// Pruebas de navegador de la web de WipeHub (se lanzan en el CI antes de publicar). Uso: node tests/e2e/web.e2e.mjs
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
  assert.match(await p.title(), /WipeHub/);
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
  assert.ok(await p.$('.cl-card.latest .cl-tag'), 'la última versión lleva su etiqueta');
  await p.click('[data-set-act="toggle-log"]'); await p.waitForTimeout(250);
  assert.ok((await p.$$eval('.cl-card', (e) => e.length)) > 10);
  assert.ok((await p.$$eval('.cl-card .cl-sic', (e) => e.length)) >= 6, 'secciones con iconos de WoW');
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
  assert.equal(await p.evaluate(() => window.__dlName), 'wipehub-ajustes.json');
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

test('si Warcraft Logs no da acceso (auth 503) sale «Warcraft Logs no responde» y no «Servidor saturado»', async () => {
  const p = await newPage(browser);
  await p.route(/wipehub-proxy/, (r) => r.fulfill({ status: 502, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ error: 'auth 503' }) }));
  await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(900);
  await p.evaluate(() => { S.hasCreds = true; });
  await p.fill('#urlInput', 'https://www.warcraftlogs.com/reports/aBcDeFgHiJkLmNoP');
  await p.click('#loadBtn');
  await p.waitForSelector('.error.srv', { timeout: 20000 });
  const txt = await p.$eval('.error.srv', (e) => e.textContent);
  assert.match(txt, /Warcraft Logs en mantenimiento/, 'título correcto: ' + txt);
  assert.ok(!/Servidor saturado/.test(txt), 'no dice servidor saturado');
  assert.ok(await p.$('[data-action="retry"]'), 'hay botón Reintentar');
  assert.match(await p.$eval('#wclBanner', (e) => e.textContent), /mantenimiento.*solucionando lo antes posible/s, 'franja de aviso visible');
});

test('al abrir WipeHub con Warcraft Logs en mantenimiento sale el aviso y desaparece solo cuando vuelve', async () => {
  const p = await newPage(browser);
  let down = true;
  await p.route(/wipehub-proxy/, (r) => (down
    ? r.fulfill({ status: 502, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ error: 'auth 503' }) })
    : r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ data: { rateLimitData: { limitPerHour: 18000 } } }) })));
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForSelector('#wclBanner', { timeout: 20000 });
  assert.ok(await p.isVisible('#wclBanner'));
  down = false;
  await p.evaluate(() => gql('query { rateLimitData { limitPerHour } }', {}, true));
  assert.equal(await p.$('#wclBanner'), null, 'la franja se quita cuando Warcraft Logs responde');
});

test('la etiqueta de la portada: en la web sin «en local» y en GitHub con «vía GitHub»', async () => {
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' };
  const tag = async (host) => {
    const p = await newPage(browser);
    await p.route('**/*', (r) => {
      const u = new URL(r.request().url());
      if (u.hostname !== host) return r.abort().catch(() => {});
      let f = new URL('.' + (u.pathname.endsWith('/') ? u.pathname + 'index.html' : u.pathname), DIST);
      if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return r.fulfill({ status: 404, body: '404' }).catch(() => {});
      return r.fulfill({ status: 200, contentType: MIME[f.pathname.slice(f.pathname.lastIndexOf('.'))] || 'application/octet-stream', body: fs.readFileSync(f) }).catch(() => {});
    });
    await p.goto(`https://${host}/`, { waitUntil: 'load' });
    await p.waitForSelector('.hero .eyebrow');
    return p.$eval('.hero .eyebrow', (e) => e.textContent.trim());
  };
  const local = await (async () => { const p = await open(); return p.$eval('.hero .eyebrow', (e) => e.textContent.trim()); })();
  assert.ok(!/LOCAL/i.test(local), 'en la web no pone «en local»: ' + local);
  assert.match(local, /ANÁLISIS DE LOGS$/);
  const vercel = await tag('wipehub.vercel.app');
  assert.ok(!/LOCAL|GITHUB/i.test(vercel), 'en Vercel solo «Análisis de logs»: ' + vercel);
  const gh = await tag('kingkhaax.github.io');
  assert.match(gh, /ANÁLISIS DE LOGS · VÍA GITHUB$/, 'en GitHub: ' + gh);
});

test('Móvil (390 px): viewport correcto, navegación abajo y ninguna pantalla se sale por los lados', async () => {
  const p = await newPage(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  for (const h of ['', '#/compare', '#/guilds', '#/characters']) {
    await p.goto(url + h, { waitUntil: 'load' }); await p.waitForTimeout(700);
    const m = await p.evaluate(() => { const b = document.querySelector('.navtabs').getBoundingClientRect(); return { sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth, nav: [Math.round(b.bottom), innerHeight, getComputedStyle(document.querySelector('.navtabs')).position] }; });
    assert.equal(m.vw, 390, 'la página usa el ancho real del teléfono');
    assert.equal(m.sw, m.vw, `la pantalla ${h || 'inicio'} no debe desbordar: ${m.sw} > ${m.vw}`);
    assert.deepEqual(m.nav, [844, 844, 'fixed'], 'la barra de pestañas está pegada abajo');
  }
  noErrors(p);
});

test('Parche 12.2: apartados a la izquierda que muestran solo sus cambios, con enlaces de Blizzard y Wowhead', async () => {
  const p = await open();
  await p.click('[data-p22="open"]'); await p.waitForSelector('#patch122Dlg .p22-tab');
  const tabs = await p.$$eval('#patch122Dlg .p22-tab', (e) => e.map((x) => x.dataset.p22Tab));
  for (const k of ['overview', 'raids', 'mplus', 'delves', 'pvp', 'housing', 'roadmap', 'sources']) assert.ok(tabs.includes(k), 'falta el apartado ' + k);
  const shown = () => p.$$eval('#patch122Dlg [data-p22-pane]:not([hidden])', (e) => e.map((x) => x.dataset.p22Pane));
  assert.deepEqual(await shown(), ['overview']);
  await p.click('[data-p22-tab="pvp"]');
  assert.deepEqual(await shown(), ['pvp']);
  assert.match(await p.$eval('[data-p22-pane="pvp"]', (e) => e.textContent), /JcJ/);
  await p.click('[data-p22-tab="housing"]');
  assert.match(await p.$eval('[data-p22-pane="housing"]', (e) => e.textContent), /maniquíes/);
  const links = await p.$$eval('#patch122Dlg [data-p22-link]', (e) => e.map((a) => a.dataset.p22Link));
  assert.ok(links.some((u) => u.startsWith('https://news.blizzard.com/')), 'enlace oficial de Blizzard');
  assert.ok(links.filter((u) => u.startsWith('https://www.wowhead.com/')).length >= 4, 'enlaces de Wowhead');
  noErrors(p);
});

await runAll();

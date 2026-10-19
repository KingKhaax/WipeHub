'use strict';

// Panel de ajustes: general, apariencia, replay, datos y versión (con «acerca de» dentro).
async function openSettings(tab) {
  const cfg = await window.api.getConfig();
  const info = (await window.api.appInfo?.()) || {};
  const dlg = $('#settings');
  dlg.classList.add('wide', 'settings-dlg');
  const cur = tab === 'about' ? 'version' : (tab || dlg.dataset.tab || 'general');
  dlg.dataset.tab = cur;
  const G = (k) => WCSettings.get(k);
  const seg = (key, opts) => `<div class="segs" data-seg="${key}">${opts.map(([v, label]) =>
    `<button type="button" data-set="${key}" data-v="${esc(String(v))}" class="${String(G(key)) === String(v) ? 'on' : ''}">${label}</button>`).join('')}</div>`;
  const toggle = (key, label, hint = '') => `<label class="set-toggle"><input type="checkbox" data-set-bool="${key}" ${G(key) ? 'checked' : ''}><span class="sw"></span><span>${label}${hint ? `<small>${hint}</small>` : ''}</span></label>`;
  const row = (label, body, hint = '') => `<div class="set-row"><div class="set-l"><b>${label}</b>${hint ? `<small>${hint}</small>` : ''}</div><div class="set-c">${body}</div></div>`;
  const swatches = Object.keys(WCSettings.ACCENTS).map((k) =>
    `<button type="button" class="swatch ${G('accent') === k ? 'on' : ''}" data-set="accent" data-v="${k}" style="--sw:${WCSettings.ACCENTS[k][0]}" aria-label="${k}"></button>`).join('')
    + `<label class="swatch custom ${G('accent') === 'custom' ? 'on' : ''}" style="--sw:${esc(G('accentCustom') || '#2aa7b5')}" title="${LL('Elige tu propio color', 'Pick your own color')}"><input type="color" data-accent-custom value="${esc(G('accentCustom') || '#2aa7b5')}" aria-label="${LL('Color propio', 'Custom color')}"></label>`;
  const colorVal = (k) => { const c = G('colors'); if (c && c[k]) return c[k]; const v = getComputedStyle(document.documentElement).getPropertyValue('--' + k).trim(); return /^#[0-9a-f]{6}$/i.test(v) ? v : (k === 'text' ? '#e8eef8' : '#111c34'); };
  const fonts = Object.entries(WCSettings.FONTS).map(([k, f]) => `<option value="${k}" ${G('font') === k ? 'selected' : ''}>${f.label}</option>`).join('');

  const aboutHTML = `
      <div class="about big"><img src="logo.png" alt="" width="120" height="120">
        <div><h2>WipeTime <span class="v">v${esc(info.version || '')}</span></h2>
          <p class="about-desc">${LL('Plataforma de análisis de combate para World of Warcraft: informes, repeticiones y comparativas de rendimiento a partir de Warcraft Logs.', 'Combat analysis platform for World of Warcraft: reports, replays and performance comparisons built on Warcraft Logs.')} <span class="about-es"><svg viewBox="0 0 3 2" width="30" height="20" role="img" aria-label="${LL('España', 'Spain')}" style="border-radius:3px"><title>${LL('España', 'Spain')}</title><rect width="3" height="2" fill="#c60b1e"/><rect y=".5" width="3" height="1" fill="#ffc400"/></svg></span></p>
          <p>${t('madeBy')} <b>Drakko</b> <span class="heart-s">♥</span></p>
          <p class="about-dc" style="margin-top:30px"><svg viewBox="0 0 127.14 96.36" width="26" height="20" aria-hidden="true"><path fill="#5865F2" d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0 105.89 105.89 0 0 0 19.39 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69Z"/></svg> <a href="#" class="about-friend" data-friend="discord" data-name="sr.kitkat" title="${LL('Clic: copiar el nombre', 'Click: copy the name')}"><b>sr.kitkat</b></a> <span class="muted">${LL('dudas y preguntas', 'questions')}</span></p>
          <p class="about-dc"><img src="battlenet.png" width="26" height="26" alt="" style="border-radius:6px"> <a href="#" class="about-friend" data-friend="battlenet" data-name="KitKat#21202" title="${LL('Clic: copiar el BattleTag', 'Click: copy the BattleTag')}"><b>KitKat#21202</b></a> <span class="muted">${LL('dudas y preguntas', 'questions')}</span></p></div></div>`;
  const panels = {
    general: `
      ${row(LL('Hora del servidor', 'Server time'), ServerClock.selectHTML(), LL('Reloj de arriba a la izquierda; al pasar el ratón ves cuánto falta para el reinicio semanal', 'Clock at the top left; hover it to see the time left until the weekly reset'))}
      ${row(LL('Región por defecto', 'Default region'), `<select data-set-sel="region">${[['', LL('Automática', 'Automatic')], ['eu', 'EU'], ['us', 'US'], ['kr', 'KR'], ['tw', 'TW']].map(([v, l]) => `<option value="${v}" ${String(G('region')) === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`, LL('La que sale al buscar personajes y guilds (si no has elegido otra antes)', 'The one shown when searching characters and guilds (unless you picked another before)'))}
      ${row(LL('Dificultad por defecto', 'Default difficulty'), `<select data-set-sel="diff">${[[0, LL('La más alta con datos', 'Highest with data')], [5, LL('Mítico', 'Mythic')], [4, LL('Heroico', 'Heroic')], [3, LL('Normal', 'Normal')]].map(([v, l]) => `<option value="${v}" ${Number(G('diff')) === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`, LL('Para las fichas de personaje y la clasificación de guilds', 'For character pages and guild rankings'))}
      ${toggle('spellTips', LL('Tooltips de habilidades', 'Ability tooltips'), LL('Al pasar el ratón por una habilidad o pasiva, muestra qué hace', 'Hover an ability or passive to see what it does'))}`,
    look: `
      ${row(LL('Tema', 'Theme'), seg('theme', [['dark', LL('Oscuro', 'Dark')], ['light', LL('Claro', 'Light')], ['system', LL('Sistema', 'System')]]), LL('«Sistema» sigue el modo de Windows', '“System” follows Windows mode'))}
      ${row(LL('Color de botones', 'Button color'), `<div class="swatches">${swatches}</div>`)}
      ${row(LL('Colores propios', 'Custom colors'), `<div class="colors-row">${[['bg', LL('Fondo', 'Background')], ['panel', LL('Paneles', 'Panels')], ['text', LL('Texto', 'Text')]].map(([k, l]) => `<label class="color-pick">${l}<input type="color" data-color="${k}" value="${esc(colorVal(k))}"></label>`).join('')}<button type="button" class="btn ghost sm" data-set-act="reset-colors">${LL('Restablecer colores', 'Reset colors')}</button></div>`, LL('Sustituyen los colores del tema; «Restablecer» vuelve a los de siempre', 'They replace the theme colors; “Reset” goes back to the default ones'))}
      ${row(LL('Tamaño de la interfaz', 'Interface size'), `<div class="zoomrow"><input type="range" min="70" max="160" step="5" value="${G('zoom')}" data-zoom><b id="zoomVal">${G('zoom')} %</b><button type="button" class="btn ghost sm" data-set-act="zoom-reset">${LL('Restablecer', 'Reset')}</button></div>`)}
      ${row(LL('Fuente', 'Font'), `<select data-font>${fonts}</select><div class="font-prev" id="fontPrev">${LL('Así se ve el texto: Zul’jan 261,2 k · Cénit', 'This is how text looks: Zul’jan 261.2 k · Zenith')}</div>`, LL('Expressway y Bahnschrift usan la fuente instalada en tu PC; si no la tienes, se usa una parecida.', 'Expressway and Bahnschrift use the font installed on your PC; if you do not have it, a similar one is used.'))}
      ${row(LL('Densidad', 'Density'), seg('density', [['comfortable', LL('Cómoda', 'Comfortable')], ['compact', LL('Compacta', 'Compact')]]), LL('Compacta muestra más datos en pantalla', 'Compact shows more data on screen'))}
      ${row(LL('Animaciones', 'Animations'), seg('motion', [['full', LL('Normales', 'Normal')], ['reduced', LL('Reducidas', 'Reduced')]]))}`,
    replay: `
      ${row(LL('Velocidad por defecto', 'Default speed'), seg('rpSpeed', [[0.5, '0,5×'], [1, '1×'], [2, '2×'], [4, '4×']]))}
      ${toggle('rpNames', LL('Mostrar nombres de jugadores', 'Show player names'))}
      ${toggle('rpTrails', LL('Mostrar estelas de movimiento', 'Show movement trails'))}
      ${toggle('rpPets', LL('Mostrar mascotas', 'Show pets'))}
      ${toggle('bossMaps', LL('Usar los mapas de cada jefe (RaidPlan.io)', 'Use each boss map (RaidPlan.io)'), LL('Se descargan solo al abrir el replay de ese jefe y se guardan en tu equipo', 'Downloaded only when you open that boss replay and kept on your PC'))}
      <p class="foot">${LL('Estos valores se aplican al abrir un replay; dentro del replay puedes cambiarlos.', 'These apply when a replay opens; you can change them inside the replay.')}</p>`,
    data: `
      ${IS_WEB ? '' : toggle('hdIcons', LL('Iconos en alta definición', 'High-definition icons'), LL('Descarga solo los iconos que se usan y los guarda en tu equipo', 'Only downloads the icons that are used and keeps them on your PC'))}
      <h3 class="set-grp">${LL('Cachés', 'Caches')}</h3>
      <p class="foot">${LL('Datos temporales que se vuelven a descargar solos cuando hacen falta.', 'Temporary data that is downloaded again by itself when needed.')}</p>
      <div class="set-actions">
        ${IS_WEB ? '' : `<button type="button" class="btn" data-set-act="clear-icons">${LL('Borrar caché de iconos', 'Clear icon cache')}</button>`}
        <button type="button" class="btn" data-set-act="clear-spells">${LL('Borrar descripciones de habilidades', 'Clear ability descriptions')}</button>
        <button type="button" class="btn" data-set-act="clear-qcache">${LL('Vaciar caché de logs (más rápida la carga)', 'Clear log cache (faster loading)')}</button>
        <button type="button" class="btn" data-set-act="clear-bossmaps">${LL('Borrar mapas de jefes descargados (RaidPlan.io)', 'Clear downloaded boss maps (RaidPlan.io)')}</button>
      </div>
      <h3 class="set-grp">${LL('Mis datos', 'My data')}</h3>
      <p class="foot">${LL('Lo que has generado tú; los mapas y las imágenes que hayas cargado a mano no se borran con estos botones.', 'What you generated yourself; maps and images you loaded by hand are not removed by these buttons.')}</p>
      <div class="set-actions">
        <button type="button" class="btn" data-set-act="clear-recent">${LL('Borrar reportes recientes', 'Clear recent reports')}</button>
        <button type="button" class="btn" data-set-act="clear-arena">${LL('Borrar mapas de arena y comparativas guardadas', 'Clear saved arena maps and benchmarks')}</button>
        <button type="button" class="btn" data-set-act="export-settings">${LL('Exportar ajustes', 'Export settings')}</button>
        <button type="button" class="btn" data-set-act="import-settings">${LL('Importar ajustes', 'Import settings')}</button>
        ${IS_WEB ? '' : `<button type="button" class="btn" data-set-act="open-data">${LL('Abrir carpeta de datos', 'Open data folder')}</button>`}
        <input type="file" id="setImport" accept="application/json,.json" hidden>
      </div>
      <h3 class="set-grp danger">${LL('Restablecer', 'Reset')}</h3>
      <div class="set-actions">
        <button type="button" class="btn danger" data-set-act="reset-all" id="resetAll">${LL('Restablecer todos los ajustes', 'Reset all settings')}</button>
      </div>`,
    version: `
      <div class="ver-card" id="verCard">
        <div class="ver-now"><small class="muted">${LL('Tu versión', 'Your version')}</small><b class="ver-num ${WCUpdate.cls()}">v${esc(info.version || '?')}</b></div>
        <div class="ver-state" id="verState">${WCUpdate.stateHTML()}</div>
      </div>
      <div class="set-actions">
        <button type="button" class="btn primary" data-set-act="update-now" id="doUpdate">${WCUpdate.buttonLabel()}</button>
      </div>
      <div class="ver-prog" id="verProg" hidden><i></i></div>
      ${toggle('autoUpdateCheck', LL('Buscar actualizaciones al abrir', 'Check for updates on startup'))}
      ${aboutHTML}
      <h3>${LL('Historial de versiones', 'Version history')}</h3>
      ${(() => { const all = dlg.dataset.log === 'all'; const list = all ? WCUpdate.CHANGELOG : WCUpdate.CHANGELOG.slice(0, 10); return `<div class="changelog">${list.map(([v, es, en]) => `<div><b>v${v}</b><span>${S.lang === 'es' ? es : en}</span></div>`).join('')}</div>${WCUpdate.CHANGELOG.length > 10 ? `<div class="set-actions"><button type="button" class="btn ghost" data-set-act="toggle-log">${all ? LL('Ver menos', 'Show less') : LL(`Ver más (${WCUpdate.CHANGELOG.length - 10} versiones anteriores)`, `Show more (${WCUpdate.CHANGELOG.length - 10} older versions)`)}</button></div>` : ''}`; })()}`,
  };
  const tabs = [['general', LL('General', 'General')], ['look', LL('Apariencia', 'Appearance')], ['replay', 'Replay'], ['data', LL('Datos', 'Data')], ['version', LL('Versión y acerca de', 'Version & about')]];
  dlg.innerHTML = `<form method="dialog" id="settingsForm" class="set-wrap">
    <div class="set-nav"><h2>${t('settings')}</h2>${tabs.map(([k, l]) => `<button type="button" class="set-tab ${k === cur ? 'on' : ''}" data-set-tab="${k}">${l}</button>`).join('')}
      <span class="grow"></span><button type="button" class="btn ghost" data-action="close">${LL('Cerrar', 'Close')}</button></div>
    <div class="set-body">${panels[cur]}</div></form>`;
  const fp = $('#fontPrev');
  if (fp) fp.style.fontFamily = WCSettings.FONTS[G('font')].css;
  if (!dlg.open) dlg.showModal();
}

function toastSet(msg) { toast(msg); }

document.addEventListener('click', async (ev) => {
  const el = ev.target.closest('[data-set], [data-set-tab], [data-set-act]');
  if (!el || !el.closest('#settings')) return;
  if (el.dataset.setTab) { openSettings(el.dataset.setTab); return; }
  if (el.dataset.set) {
    const key = el.dataset.set;
    let v = el.dataset.v;
    if (key === 'rpSpeed') v = Number(v);
    WCSettings.set(key, v);
    openSettings();
    return;
  }
  const act = el.dataset.setAct;
  if (act === 'zoom-reset') { WCSettings.set('zoom', 100); openSettings(); }
  else if (act === 'clear-icons') { const n = await window.api.clearIcons(); toastSet(LL(`Caché de iconos borrada (${n} archivos)`, `Icon cache cleared (${n} files)`)); }
  else if (act === 'update-now') WCUpdate.updateNow();
  else if (act === 'clear-spells') { const n = await window.api.clearSpells(); toastSet(LL(`Descripciones borradas (${n})`, `Descriptions cleared (${n})`)); }
  else if (act === 'clear-qcache') { const n = await window.api.clearQueryCache(); toastSet(LL(`Caché de logs vaciada (${n} archivos)`, `Log cache cleared (${n} files)`)); }
  else if (act === 'clear-bossmaps') { const n = await window.api.clearBossMaps(); toastSet(LL(`Mapas de jefes borrados (${n})`, `Boss maps cleared (${n})`)); }
  else if (act === 'clear-recent') { try { localStorage.removeItem('recent'); } catch { /* nada */ } toastSet(LL('Reportes recientes borrados', 'Recent reports cleared')); if (S.home && !S.cmpOpen) renderWelcome(); }
  else if (act === 'clear-arena') {
    let n = 0;
    try { for (const k of Object.keys(localStorage)) if (k.startsWith('arena:') || k.startsWith('bench:') || k.startsWith('dist:')) { localStorage.removeItem(k); n++; } } catch { /* nada */ }
    toastSet(LL(`Mapas generados y comparativas borrados (${n})`, `Generated maps and benchmarks cleared (${n})`));
  } else if (act === 'open-data') window.api.openDataFolder();
  else if (act === 'reset-all') {
    // dos pasos: el primer clic pide confirmar y se anula solo a los 5 s
    if (!el.dataset.sure) {
      el.dataset.sure = '1';
      el.textContent = LL('¿Seguro? Pulsa otra vez para borrar todos los ajustes', 'Sure? Click again to erase all settings');
      setTimeout(() => { if (el.isConnected) { delete el.dataset.sure; el.textContent = LL('Restablecer todos los ajustes', 'Reset all settings'); } }, 5000);
      return;
    }
    WCSettings.reset();
    await window.api.setPref('hdIcons', true);
    toastSet(LL('Ajustes restablecidos', 'Settings reset'));
    openSettings();
  }
  else if (act === 'reset-colors') { WCSettings.set('colors', null); openSettings(); }
  else if (act === 'toggle-log') { const dl = $('#settings'); dl.dataset.log = dl.dataset.log === 'all' ? '' : 'all'; openSettings('version'); }
  else if (act === 'export-settings') {
    const blob = new Blob([WCSettings.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'wipetime-ajustes.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toastSet(LL('Ajustes exportados', 'Settings exported'));
  }
  else if (act === 'import-settings') $('#setImport')?.click();
});

document.addEventListener('input', (ev) => {
  const t0 = ev.target;
  if (!t0.closest || !t0.closest('#settings')) return;
  if (t0.dataset.accentCustom !== undefined) {
    WCSettings.set('accentCustom', t0.value);
    WCSettings.set('accent', 'custom');
    const lab = t0.closest('.swatch');
    if (lab) { lab.style.setProperty('--sw', t0.value); lab.classList.add('on'); }
    document.querySelectorAll('#settings .swatch[data-set="accent"]').forEach((x) => x.classList.remove('on'));
    return;
  }
  if (t0.dataset.zoom !== undefined) { WCSettings.set('zoom', Number(t0.value)); const z = $('#zoomVal'); if (z) z.textContent = `${t0.value} %`; }
});

document.addEventListener('change', async (ev) => {
  const t0 = ev.target;
  if (!t0.closest || !t0.closest('#settings')) return;
  if (t0.dataset.font !== undefined) {
    WCSettings.set('font', t0.value);
    const fp = $('#fontPrev');
    if (fp) fp.style.fontFamily = WCSettings.FONTS[t0.value].css;
  } else if (t0.id === 'setImport' && t0.files?.[0]) {
    try {
      const n = WCSettings.importJSON(await t0.files[0].text());
      toastSet(LL(`Ajustes importados (${n})`, `Settings imported (${n})`));
      openSettings();
    } catch { toastSet(LL('Ese archivo no es un archivo de ajustes de WipeTime', 'That is not a WipeTime settings file')); }
    t0.value = '';
  } else if (t0.dataset.setSel) {
    const k = t0.dataset.setSel;
    WCSettings.set(k, k === 'diff' ? Number(t0.value) : t0.value);
  } else if (t0.dataset.color) {
    const cs = { ...(WCSettings.get('colors') || {}) };
    cs[t0.dataset.color] = t0.value;
    WCSettings.set('colors', cs);
  } else if (t0.dataset.setBool) {
    const k = t0.dataset.setBool;
    WCSettings.set(k, t0.checked);
    if (k === 'hdIcons') await window.api.setPref('hdIcons', t0.checked);
  }
});

// Zoom con teclado (Ctrl +, Ctrl -, Ctrl 0)
document.addEventListener('keydown', (ev) => {
  if (!ev.ctrlKey || ev.altKey) return;
  const cur = WCSettings.get('zoom');
  let next = null;
  if (ev.key === '+' || ev.key === '=') next = Math.min(160, cur + 10);
  else if (ev.key === '-' || ev.key === '_') next = Math.max(70, cur - 10);
  else if (ev.key === '0') next = 100;
  if (next == null) return;
  ev.preventDefault();
  WCSettings.set('zoom', next);
  toast(`${LL('Tamaño de la interfaz', 'Interface size')}: ${next} %`);
});

// Aviso en medio de la pantalla: confirma que el texto se ha copiado (desaparece solo)
function showCopiedPop(text, ok) {
  document.getElementById('copyPop')?.remove();
  const el = document.createElement('div');
  el.id = 'copyPop'; el.className = 'copy-pop' + (ok ? '' : ' err'); el.setAttribute('role', 'status');
  const ic = document.createElement('span'); ic.className = 'cp-ic'; ic.textContent = ok ? '✓' : '!';
  const tx = document.createElement('div'); tx.className = 'cp-tx';
  const b = document.createElement('b'); b.textContent = ok ? LL('Se ha copiado al portapapeles', 'Copied to the clipboard') : LL('No se pudo copiar', 'Could not copy');
  const sm = document.createElement('small'); sm.textContent = text;
  tx.append(b, sm); el.append(ic, tx);
  document.body.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 250); }, 1700);
}

// Pulsar el nombre de Discord o de Battle.net: se copia al portapapeles y sale un aviso en medio de la pantalla
document.addEventListener('click', async (ev) => {
  const a = ev.target.closest('[data-friend]');
  if (!a) return;
  ev.preventDefault();
  const name = a.dataset.name;
  let copied = false;
  try { await navigator.clipboard.writeText(name); copied = true; } catch {
    try { const t = document.createElement('textarea'); t.value = name; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); copied = document.execCommand('copy'); t.remove(); } catch { /* sin portapapeles */ }
  }
  showCopiedPop(name, copied);
});

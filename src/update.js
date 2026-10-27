'use strict';

// Estado de versión: número en la barra superior y en Ajustes > Versión (rojo si estás atrasado, verde si es la última).
const WCUpdate = (() => {
  let res = null; // último resultado de update:check
  let version = '';
  let lastCheck = 0;

  // El historial se escribe en changelog.js (RELEASES): una entrada por versión agrupada, con su resumen y sus cambios por secciones.
  // CHANGELOG conserva el formato [versión, resumen en español, resumen en inglés] para el resto de la aplicación.
  const CHANGELOG = RELEASES.map((r) => [r.v, r.es.intro, r.en.intro]);

  // Icono según de qué habla un texto (para las versiones sin sección propia)
  const LOG_ICONS = [
    [/ajustes|settings|tema|color|fuente|densidad/i, 'inv_gizmo_02'], [/guild|banda|roster/i, 'inv_shirt_guildtabard_01'], [/replay|repetici/i, 'inv_misc_spyglass_02'],
    [/mec[aá]nic|mechanic|jefe|boss/i, 'inv_misc_book_11'], [/talento|talent|equipo|gear|objeto|item|gema|simc/i, 'inv_chest_plate04'],
    [/ficha|personaje|character|all star|parse|ranking|clasificaci/i, 'achievement_bg_winwsg'], [/rotaci|rotation|buff|debuff|defensiv/i, 'ability_warrior_innerrage'],
    [/discord|battle\.net|contacto/i, 'inv_misc_horn_02'], [/reloj|clock|servidor|server|hora/i, 'inv_misc_gear_01'], [/arreglo|fix|error|corrig/i, 'inv_hammer_20'],
    [/seguridad|security|prueba|test/i, 'inv_shield_04'], [/web|navegador|browser|direcci|address|enlace|link/i, 'inv_misc_net_01'], [/copi/i, 'inv_scroll_03'],
    [/muerte|death|poci[oó]n|pot/i, 'inv_misc_bone_humanskull_01'], [/comparar|compar|mapa|map/i, 'inv_misc_map_01'],
  ];
  const logIcon = (t) => (LOG_ICONS.find(([re]) => re.test(t)) || [0, 'inv_scroll_02'])[1];
  const logEsc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // Frases de un texto plano (sin partir «2.5.13» ni «v2.0»)
  const sentences = (t) => String(t).split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ«¿¡“‘(])/).map((x) => x.trim()).filter(Boolean);
  function logCard(ent, lang, latest, iconUrl) {
    const [v] = ent;
    const rel = RELEASES.find((r) => r.v === v);
    const es = lang === 'es';
    const rich = rel && rel[es ? 'es' : 'en'];
    const intro = rich ? rich.intro : ent[es ? 1 : 2];
    const sections = rich ? rich.sections : [];
    const main = sections[0] ? sections[0][0] : logIcon(intro);
    const date = rel && rel.date ? new Date(`${rel.date}T12:00:00`).toLocaleDateString(es ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const open = latest;
    return `<article class="cl-card${latest ? ' latest' : ''}${open ? ' open' : ''}"><header class="cl-head" data-cl-toggle role="button" tabindex="0" aria-expanded="${open}"><img class="cl-ic" src="${iconUrl(main)}" width="40" height="40" alt="" loading="lazy">`
      + `<div class="cl-ht"><b class="cl-ver">v${logEsc(v)} · ${es ? 'Novedades' : 'What’s new'}</b>${latest ? `<span class="cl-tag">${es ? 'Última versión' : 'Latest version'}</span>` : ''}${date ? `<small class="cl-date">${logEsc(date)}</small>` : ''}</div><span class="cl-chev" aria-hidden="true"></span></header>`
      + `<p class="cl-intro">${logEsc(intro)}</p>`
      + `<div class="cl-body">` + sections.map(([ic, title, items]) => `<section class="cl-sec">${ic ? `<img class="cl-sic" src="${iconUrl(ic)}" width="26" height="26" alt="" loading="lazy">` : ''}<div class="cl-sb">${title ? `<h4>${logEsc(title)}</h4>` : ''}<ul>${items.map((i) => `<li>${logEsc(i)}</li>`).join('')}</ul></div></section>`).join('') + '</div>'
      + '</article>';
  }
  // Al pulsar la cabecera de una versión se despliegan o se pliegan sus cambios
  const toggleCard = (head) => { const card = head.closest('.cl-card'); const on = !card.classList.contains('open'); card.classList.toggle('open', on); head.setAttribute('aria-expanded', String(on)); };
  document.addEventListener('click', (ev) => { const h = ev.target.closest('[data-cl-toggle]'); if (h) toggleCard(h); });
  document.addEventListener('keydown', (ev) => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches?.('[data-cl-toggle]')) { ev.preventDefault(); toggleCard(ev.target); } });
  // Todo el historial (o solo las últimas 10 versiones)
  function logHTML(lang, all) {
    const list = all ? CHANGELOG : CHANGELOG.slice(0, 10);
    return `<div class="cl-list">${list.map((e, i) => logCard(e, lang, i === 0, (n) => `wcicon://i/${n}`)).join('')}</div>`;
  }

  const cls = () => (!res || res.error ? '' : res.outdated ? 'bad' : 'ok');
  const canInstall = () => !!(res && res.outdated && res.canInstall);

  function stateHTML() {
    if (!res) return `<span class="muted">${tr('Aún no se ha comprobado.', 'Not checked yet.')}</span>`;
    if (res.error === 'NO_SOURCE') return `<span class="muted">${tr('Configura abajo la fuente de actualizaciones para poder comprobar la última versión.', 'Set the update source below to check for the latest version.')}</span>`;
    if (res.error) return `<span class="bad">${tr('No se pudo comprobar', 'Could not check')}: ${esc(res.error)}</span>`;
    if (res.outdated) return `<span class="bad">${tr(`Versión atrasada · la última es v${esc(res.latest)}`, `Outdated · latest is v${esc(res.latest)}`)}</span>${res.notes ? `<pre class="ver-notes">${esc(res.notes.slice(0, 600))}</pre>` : ''}`;
    return `<span class="ok">${tr('Tienes la versión más reciente', 'You have the latest version')}</span>`;
  }

  function paintBadge() {
    const b = document.getElementById('verBadge');
    if (!b) return;
    b.textContent = `v${version}`;
    b.className = `ver-badge ${cls()}`;
    b.title = !res ? '' : res.error ? '' : res.outdated ? (tr(`Hay una versión nueva: v${res.latest}`, `New version available: v${res.latest}`)) : (tr('Última versión', 'Latest version'));
  }

  async function check(manual) {
    if (!version) version = ((await window.api.appInfo?.()) || {}).version || '';
    const next = await window.api.updateCheck();
    // un fallo puntual de red no borra el último estado conocido (verde o rojo)
    res = next.error && res && !res.error ? res : next;
    lastCheck = Date.now();
    paintBadge();
    refreshOpenPanel();
    if (manual && res.outdated) toast(tr(`Hay una versión nueva: v${res.latest}`, `New version available: v${res.latest}`));
    return res;
  }

  async function install() {
    const btn = document.getElementById('doUpdate');
    const prog = document.getElementById('verProg');
    if (btn) { btn.disabled = true; btn.textContent = tr('Descargando…', 'Downloading…'); }
    if (prog) prog.hidden = false;
    window.api.onUpdateProgress?.((f) => { const i = document.querySelector('#verProg i'); if (i) i.style.width = `${Math.round(f * 100)}%`; });
    const r = await window.api.updateInstall();
    if (r.error) {
      toast((tr('Error al actualizar: ', 'Update failed: ')) + r.error);
      if (btn) { btn.disabled = false; btn.textContent = buttonLabel(); }
    }
  }

  // Un solo botón: comprueba si hay versión nueva y, si la hay, la descarga e instala
  async function updateNow() {
    const btn = document.getElementById('doUpdate');
    if (btn) { btn.disabled = true; btn.textContent = tr('Buscando…', 'Checking…'); }
    const r = await check(false);
    const st = document.getElementById('verState');
    if (st) st.innerHTML = stateHTML();
    if (r.error) { toast(tr('No se pudo comprobar', 'Could not check') + `: ${r.error}`); if (btn) { btn.disabled = false; btn.textContent = buttonLabel(); } return; }
    if (!r.outdated) { toast(tr('Tienes la versión más reciente', 'You have the latest version')); if (btn) { btn.disabled = false; btn.textContent = buttonLabel(); } return; }
    if (!r.canInstall) { toast(tr('Hay una versión nueva, pero no se puede instalar sola', 'A new version exists, but it cannot be installed automatically')); if (btn) { btn.disabled = false; btn.textContent = buttonLabel(); } return; }
    await install();
  }

  const buttonLabel = () => (res?.outdated
    ? tr(`Actualizar a v${res.latest}`, `Update to v${res.latest}`)
    : tr('Buscar e instalar actualización', 'Check and install update'));

  // Si Ajustes → Versión está abierto, repinta el estado y el botón con el resultado más reciente
  function refreshOpenPanel() {
    const st = document.getElementById('verState');
    if (st) st.innerHTML = stateHTML();
    const num = document.querySelector('.ver-num');
    if (num) num.className = `ver-num ${cls()}`;
    const btn = document.getElementById('doUpdate');
    if (btn && !btn.disabled) btn.textContent = buttonLabel();
  }

  async function init() {
    version = ((await window.api.appInfo?.()) || {}).version || '';
    paintBadge();
    if (WCSettings.get('autoUpdateCheck') !== false) check(false);
  }

  // Seguimiento en tiempo real: cada 3 minutos y al volver a la ventana (si han pasado más de 60 s)
  const recheck = () => { if (WCSettings.get('autoUpdateCheck') !== false && Date.now() - lastCheck > 60000) check(false); };
  setInterval(() => { if (WCSettings.get('autoUpdateCheck') !== false) check(false); }, 3 * 60 * 1000);
  window.addEventListener('focus', recheck);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) recheck(); });

  const reset = () => { res = null; paintBadge(); };
  document.addEventListener('DOMContentLoaded', init);
  return { check, install, updateNow, buttonLabel, init, reset, cls, canInstall, stateHTML, CHANGELOG, logHTML };
})();

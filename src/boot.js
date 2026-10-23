'use strict';

// Ajustes de la aplicación: se leen antes de pintar para aplicar tema, acento, fuente y densidad sin parpadeo.
var WCSettings = (function () {
  var KEY = 'settings:v1';
  var DEFAULTS = {
    theme: 'dark', accent: 'teal', zoom: 100, font: 'default', density: 'comfortable', motion: 'full',
    rpSpeed: 1, rpNames: true, rpTrails: false, rpPets: false, hdIcons: true, bossMaps: true, spellTips: true, updateSource: '', autoUpdateCheck: true, region: '', diff: 0, colors: null, accentCustom: '#2aa7b5',
  };
  var ACCENTS = {
    teal: ['#2aa7b5', '#17779f'], gold: ['#e7b84a', '#a9741a'], blue: ['#5b8def', '#3a6fe0'], violet: ['#8b7bff', '#6a56e8'], cyan: ['#2fc4e8', '#0f93b5'], green: ['#3fc08a', '#1f9d6b'],
    orange: ['#f0a23b', '#d17f12'], pink: ['#ef5f9a', '#d03a78'], red: ['#ef5f6b', '#d6384a'],
    lime: ['#9bd33c', '#6e9f1e'], mint: ['#5fe0c1', '#25a58a'], indigo: ['#6c7bff', '#4350d8'], magenta: ['#d65bd8', '#a83aab'],
    coral: ['#ff7f6b', '#e0523d'], sand: ['#d8c08a', '#a98c4a'], slate: ['#8fa3b8', '#5f7690'], silver: ['#e8eef8', '#3a4660'],
  };
  var CJK = ', "Microsoft YaHei", "Microsoft JhengHei", "Malgun Gothic", "Yu Gothic", "Segoe UI", sans-serif';
  var FONTS = {
    default: { label: 'Noto Sans (estilo Battle.net)', css: '"Noto Sans", "Segoe UI Variable Text", "Segoe UI", system-ui, "Microsoft YaHei", "Microsoft JhengHei", "Malgun Gothic", "Yu Gothic", sans-serif' },
    inter: { label: 'Inter', css: 'Inter, "Segoe UI Variable Text", "Segoe UI", system-ui, "Microsoft YaHei", "Microsoft JhengHei", "Malgun Gothic", "Yu Gothic", sans-serif' },
    segoe: { label: 'Segoe UI', css: '"Segoe UI", system-ui, "Microsoft YaHei", "Microsoft JhengHei", "Malgun Gothic", "Yu Gothic", sans-serif' },
    arial: { label: 'Arial', css: 'Arial, Helvetica, "Microsoft YaHei", "Microsoft JhengHei", "Malgun Gothic", "Yu Gothic", sans-serif' },
    verdana: { label: 'Verdana', css: 'Verdana, Geneva, "Microsoft YaHei", "Microsoft JhengHei", "Malgun Gothic", "Yu Gothic", sans-serif' },
    tahoma: { label: 'Tahoma', css: 'Tahoma, Verdana, "Microsoft YaHei", "Microsoft JhengHei", "Malgun Gothic", "Yu Gothic", sans-serif' },
    calibri: { label: 'Calibri', css: 'Calibri, "Segoe UI", "Microsoft YaHei", "Microsoft JhengHei", "Malgun Gothic", "Yu Gothic", sans-serif' },
    georgia: { label: 'Georgia', css: 'Georgia, "Times New Roman", "Microsoft YaHei", "Microsoft JhengHei", "Malgun Gothic", "Yu Gothic", serif' },
    consolas: { label: 'Consolas', css: 'Consolas, "Cascadia Mono", "Microsoft YaHei", "Microsoft JhengHei", "Malgun Gothic", "Yu Gothic", monospace' },
    comic: { label: 'Comic Sans', css: '"Comic Sans MS", "Chalkboard SE", "Microsoft YaHei", "Microsoft JhengHei", "Malgun Gothic", "Yu Gothic", cursive' },
    roboto: { label: 'Roboto', css: 'Roboto' + CJK },
    opensans: { label: 'Open Sans', css: '"Open Sans"' + CJK },
    sourcesans: { label: 'Source Sans 3', css: '"Source Sans 3"' + CJK },
    lato: { label: 'Lato', css: 'Lato' + CJK },
    montserrat: { label: 'Montserrat', css: 'Montserrat' + CJK },
    poppins: { label: 'Poppins', css: 'Poppins' + CJK },
    barlow: { label: 'Barlow', css: 'Barlow' + CJK },
    exo2: { label: 'Exo 2 (gaming)', css: '"Exo 2"' + CJK },
    rajdhani: { label: 'Rajdhani (gaming)', css: 'Rajdhani' + CJK },
    bahnschrift: { label: 'Bahnschrift (Windows)', css: 'Bahnschrift, "Noto Sans"' + CJK },
    expressway: { label: 'Expressway (si la tienes instalada)', css: 'Expressway, "Expressway Free", Bahnschrift, "Noto Sans"' + CJK },
  };
  var data = {};
  try { data = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { data = {}; }

  if (data.accent && data.accent !== 'custom' && !ACCENTS[data.accent]) delete data.accent; // acento que ya no existe (nombre antiguo del turquesa): vuelve al predeterminado
  // Rediseño de la interfaz (v2.6): el acento azul antiguo pasa al dorado una sola vez
  if (data.ui !== 3) {
    if (data.accent === 'blue' || data.accent === 'gold') delete data.accent;
    data.ui = 3;
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* sin almacenamiento */ }
  }

  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function get(k) { return data[k] !== undefined ? data[k] : DEFAULTS[k]; }
  function resolvedTheme() {
    var t = get('theme');
    if (t === 'system') return mq && mq.matches ? 'dark' : 'light';
    return t === 'light' ? 'light' : 'dark';
  }

  function apply() {
    var root = document.documentElement;
    var theme = resolvedTheme();
    root.dataset.theme = theme;
    // «custom»: el color que cada uno elige en la rueda; en el tema claro se oscurece un poco para que el texto del botón se lea
    var acc = ACCENTS[get('accent')] || ACCENTS.blue;
    if (get('accent') === 'custom') {
      var hx = /^#[0-9a-f]{6}$/i.test(get('accentCustom')) ? get('accentCustom') : '#2aa7b5', k = parseInt(hx.slice(1), 16);
      var dk = function (v) { return Math.round(v * 0.78).toString(16).padStart(2, '0'); };
      acc = [hx, '#' + dk(k >> 16) + dk((k >> 8) & 255) + dk(k & 255)];
    }
    var accent = theme === 'light' ? acc[1] : acc[0];
    root.style.setProperty('--accent', accent);
    var n = parseInt(accent.slice(1), 16);
    var lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    root.style.setProperty('--on-accent', lum > 0.55 ? '#1b1306' : '#ffffff');
    // el acento turquesa usa el degradado del logo (teal -> azul -> índigo); el resto, un degradado suave de su color
    root.style.setProperty('--accent-grad', get('accent') === 'teal'
      ? 'linear-gradient(135deg, #19aaa8, #2c76b8 58%, #3e42c6)'
      : 'linear-gradient(180deg, color-mix(in srgb, ' + accent + ' 82%, #fff 18%), ' + accent + ')');
    var font = (FONTS[get('font')] || FONTS.default).css;
    root.style.setProperty('--font', font);
    window.UI_FONT = font;
    // precarga los pesos para que también salgan bien los textos pintados en canvas (replay, gráficas)
    try { if (document.fonts) ['400', '500', '600', '700'].forEach(function (w) { document.fonts.load(w + ' 14px "Noto Sans"'); }); } catch (e) { /* sin precarga */ }
    // colores propios (fondo, paneles y texto); sin ellos se usan los del tema
    var cs = get('colors');
    ['bg', 'panel', 'text'].forEach(function (k) {
      if (cs && cs[k]) root.style.setProperty('--' + k, cs[k]); else root.style.removeProperty('--' + k);
    });
    if (cs && cs.bg) root.style.setProperty('--bg-deep', 'color-mix(in srgb, ' + cs.bg + ' 82%, #000)'); else root.style.removeProperty('--bg-deep');
    if (cs && cs.panel) root.style.setProperty('--panel-2', 'color-mix(in srgb, ' + cs.panel + ' 90%, ' + (cs.text || '#fff') + ' 10%)'); else root.style.removeProperty('--panel-2');
    root.dataset.density = get('density');
    root.dataset.motion = get('motion');
  }

  function applyZoom() {
    try { if (window.api && window.api.setZoom) window.api.setZoom(get('zoom') / 100); } catch (e) { /* sin zoom */ }
  }

  function set(k, v) {
    data[k] = v;
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* sin almacenamiento */ }
    apply();
    if (k === 'zoom') applyZoom();
    if (window.R_REDRAW) window.R_REDRAW();
  }

  function reset() {
    data = {};
    try { localStorage.removeItem(KEY); } catch (e) { /* sin almacenamiento */ }
    apply();
    applyZoom();
  }

  // Exportar / importar: solo las claves que existen en los ajustes (un archivo ajeno no puede meter otras)
  function exportJSON() { return JSON.stringify({ app: 'WipeHub', settings: data }, null, 2); }
  function importJSON(text) {
    var o = JSON.parse(text);
    var src = o && o.settings && typeof o.settings === 'object' ? o.settings : null;
    if (!src) throw new Error('BAD_FILE');
    var next = {};
    Object.keys(src).forEach(function (k) { if (k in DEFAULTS && k !== 'updateSource') next[k] = src[k]; });
    if (next.accent && next.accent !== 'custom' && !ACCENTS[next.accent]) delete next.accent;
    if (next.accentCustom && !/^#[0-9a-f]{6}$/i.test(next.accentCustom)) delete next.accentCustom;
    if (next.font && !FONTS[next.font]) delete next.font;
    next.ui = 3;
    data = next;
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* sin almacenamiento */ }
    apply();
    applyZoom();
    return Object.keys(next).length;
  }

  if (mq && mq.addEventListener) mq.addEventListener('change', function () { if (get('theme') === 'system') apply(); });
  apply();
  document.addEventListener('DOMContentLoaded', applyZoom);

  return { get: get, set: set, reset: reset, exportJSON: exportJSON, importJSON: importJSON, apply: apply, applyZoom: applyZoom, ACCENTS: ACCENTS, FONTS: FONTS, DEFAULTS: DEFAULTS, resolvedTheme: resolvedTheme };
}());

'use strict';

// Orden por columnas en todas las tablas de la web, como en Warcraft Logs: se pulsa el nombre de la columna y se ordena de mejor a peor
// (los textos de A a Z); al pulsar otra vez se invierte. La columna ordenada lleva una flecha y se recuerda mientras la pantalla se repinta.
// Las listas con barras de Daño/Sanación/etc. se ordenan por su cuenta (rankedList en app.js) y aquí se dejan en paz.
const TableSort = (() => {
  const memo = new Map(); // clave de la tabla -> { col, dir }
  const HEAD_SEL = '[class~="th"], .dbf-head, .gc-head, .gd-head, .gt-head, .gr-head, thead tr';
  const EMPTY = /^[\s\-–—·•]*$/;
  // columnas en las que lo «mejor» es lo más bajo o lo más corto: rangos, puestos y tiempos
  const ASC_FIRST = /r[aá]pid|fastest|tiempo|time|duraci|hora|clock|rank|rango|puesto|pos\b|mundo|world|europa|europe|regi[oó]n|reino|realm|servidor|server|#/i;
  let timer = 0;
  let busy = false;

  const lang = () => (typeof S !== 'undefined' && S.lang) || 'es';
  const tx = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim();

  // ---- valores: número, tiempo o texto
  function toNumber(raw) {
    let s = String(raw).replace(/ /g, ' ').trim();
    if (!s || EMPTY.test(s)) return null;
    const t = s.match(/^[#~]?\s*(\d+):(\d{2})(?::(\d{2}))?(?:[.,](\d+))?/); // 9:35 · 1:05.3 · 1:02:03
    if (t) return t[3] != null ? (+t[1]) * 3600 + (+t[2]) * 60 + (+t[3]) : (+t[1]) * 60 + (+t[2]) + (t[4] ? +('0.' + t[4]) : 0);
    const m = s.match(/-?\d[\d.,]*/);
    if (!m) return null;
    let n = m[0];
    const dot = n.lastIndexOf('.'), com = n.lastIndexOf(',');
    if (dot >= 0 && com >= 0) n = dot > com ? n.replace(/,/g, '') : n.replace(/\./g, '').replace(',', '.'); // el último separador es el decimal
    else if (com >= 0) n = /^-?\d{1,3}(,\d{3})+$/.test(n) && lang() !== 'es' ? n.replace(/,/g, '') : n.replace(',', '.');
    else if (dot >= 0) n = /^-?\d{1,3}(\.\d{3})+$/.test(n) && (lang() === 'es' || n.split('.').length > 2) ? n.replace(/\./g, '') : n;
    let v = parseFloat(n);
    if (!Number.isFinite(v)) return null;
    const suf = s.slice(m.index + m[0].length).trim().charAt(0).toLowerCase();
    if (suf === 'k') v *= 1e3; else if (suf === 'm') v *= 1e6; else if (suf === 'b') v *= 1e9;
    return v;
  }
  const cellText = (cell) => (cell ? (cell.dataset?.sort != null ? cell.dataset.sort : tx(cell)) : '');

  // ---- estructura de cada tabla
  // Devuelve { head, cols: [{ el, idx }], rows: [{ el, attached: [] }], parent } o null si no es una tabla ordenable
  function describe(h) {
    if (h.closest('.ranked, [data-no-sort]')) return null;
    if (h.tagName === 'TR') {
      const table = h.closest('table');
      if (!table || !table.tHead || h.parentElement !== table.tHead) return null;
      // índice real de cada columna teniendo en cuenta colspan y rowspan (cabeceras de dos filas)
      const occ = [];
      const cols = [];
      [...table.tHead.rows].forEach((r, ri) => {
        let c = 0;
        for (const th of r.cells) {
          while (occ[c] && occ[c] > ri) c++;
          const cs = th.colSpan || 1, rs = th.rowSpan || 1;
          for (let k = 0; k < cs; k++) occ[c + k] = ri + rs;
          if (cs === 1 && tx(th)) cols.push({ el: th, idx: c });
          c += cs;
        }
      });
      const rows = [];
      for (const tb of table.tBodies) for (const tr of tb.rows) {
        if (tr.cells.length === 1 && tr.cells[0].colSpan > 1 && rows.length) rows[rows.length - 1].attached.push(tr); // fila de detalle: va con la anterior
        else rows.push({ el: tr, attached: [] });
      }
      if (rows.length < 2 || !cols.length) return null;
      return { head: h, cols, rows, parent: rows[0].el.parentElement, table };
    }
    const p = h.parentElement;
    if (!p) return null;
    const first = p.firstElementChild === h;
    const n = h.children.length;
    if (n < 2) return null;
    const rows = [];
    for (let el = h.nextElementSibling; el; el = el.nextElementSibling) {
      if (el.tagName === h.tagName && el.children.length === n && !el.matches('[class~="th"], [class$="-head"]')) rows.push({ el, attached: [] });
      else if (rows.length) rows[rows.length - 1].attached.push(el); // elementos intercalados (detalles desplegados) van con su fila
    }
    // cabecera suelta y filas dentro de un contenedor que viene justo detrás (tabla de progreso de la guild)
    let parent = p;
    if ((rows.length < 2 || !first) && h.nextElementSibling && h.nextElementSibling.children.length >= 2) {
      const box = h.nextElementSibling;
      const inner = [...box.children].filter((el) => el.children.length === n);
      if (inner.length >= 2) { rows.length = 0; inner.forEach((el) => rows.push({ el, attached: [] })); parent = box; }
    }
    if (rows.length < 2 || (!first && parent === p)) return null;
    const cols = [...h.children].map((el, idx) => ({ el, idx })).filter((c) => tx(c.el));
    return cols.length ? { head: h, cols, rows, parent } : null;
  }

  const tableKey = (d, ordinal) => `${location.hash.split('/').slice(0, 3).join('/')}|${d.cols.map((c) => tx(c.el)).join('|')}|${ordinal}`;

  function sortTable(d, col, dir) {
    if (!d.rows[0]?.el.isConnected) { // las filas se repintaron desde que se preparó la tabla: se vuelven a leer
      const nd = describe(d.head);
      if (!nd) return false;
      d.rows = nd.rows; d.parent = nd.parent; d.table = nd.table;
    }
    const vals = d.rows.map((r) => {
      const cell = d.table ? r.el.cells[col] : r.el.children[col];
      return cellText(cell);
    });
    const nums = vals.map(toNumber);
    const filled = vals.filter((v) => !EMPTY.test(v)).length || 1;
    const numeric = nums.filter((v) => v != null).length / filled >= 0.6;
    const mul = dir === 'asc' ? 1 : -1;
    const order = d.rows.map((r, i) => i);
    order.sort((a, b) => {
      const ea = EMPTY.test(vals[a]), eb = EMPTY.test(vals[b]);
      if (ea || eb) return ea === eb ? a - b : ea ? 1 : -1; // los vacíos van siempre al final
      if (numeric) {
        const x = nums[a], y = nums[b];
        if (x == null || y == null) return x == null && y == null ? a - b : x == null ? 1 : -1;
        return mul * (x - y) || a - b;
      }
      return mul * vals[a].localeCompare(vals[b], lang() === 'es' ? 'es' : 'en', { numeric: true, sensitivity: 'base' }) || a - b;
    });
    const dest = d.table ? d.rows[0].el.parentElement : d.parent; // antes de mover las filas (dentro del fragmento no tienen padre)
    const frag = document.createDocumentFragment();
    for (const i of order) { frag.appendChild(d.rows[i].el); for (const a of d.rows[i].attached) frag.appendChild(a); }
    busy = true;
    // las filas se vuelven a colocar justo detrás de la cabecera (o al final del cuerpo de la tabla)
    dest.appendChild(frag);
    busy = false;
    return numeric;
  }

  function firstDir(d, col, headText) {
    const vals = d.rows.slice(0, 40).map((r) => cellText(d.table ? r.el.cells[col] : r.el.children[col])).filter((v) => !EMPTY.test(v));
    const numeric = vals.length && vals.filter((v) => toNumber(v) != null).length / vals.length >= 0.6;
    if (!numeric) return 'asc'; // texto: de A a Z
    if (ASC_FIRST.test(headText) || vals.filter((v) => /^#/.test(v.trim())).length / vals.length >= 0.6) return 'asc';
    return 'desc';
  }

  function setArrow(d, col, dir) {
    for (const c of d.cols) { if (c.idx === col && dir) c.el.dataset.dir = dir; else delete c.el.dataset.dir; }
  }

  function init(h, ordinalMap) {
    const d = describe(h);
    h.dataset.tsInit = '1';
    if (!d) return;
    const key0 = tableKey(d, 0);
    const ord = ordinalMap.get(key0) || 0;
    ordinalMap.set(key0, ord + 1);
    const key = tableKey(d, ord);
    for (const c of d.cols) {
      c.el.dataset.ts = String(c.idx);
      c.el.setAttribute('role', 'button');
      c.el.tabIndex = 0;
      if (!c.el.title) c.el.title = typeof LL === 'function' ? LL('Pulsa para ordenar por esta columna', 'Click to sort by this column') : '';
      c.el._ts = { d, key };
    }
    const m = memo.get(key);
    if (m && d.cols.some((c) => c.idx === m.col)) { sortTable(d, m.col, m.dir); setArrow(d, m.col, m.dir); }
  }

  function enhance(root) {
    if (busy) return;
    const ordinalMap = new Map();
    for (const h of (root || document).querySelectorAll(HEAD_SEL)) if (!h.dataset.tsInit) init(h, ordinalMap);
  }

  function activate(cell) {
    const info = cell._ts;
    if (!info) return;
    const { d, key } = info;
    const col = Number(cell.dataset.ts);
    const cur = memo.get(key);
    const dir = cur && cur.col === col ? (cur.dir === 'asc' ? 'desc' : 'asc') : firstDir(d, col, tx(cell));
    memo.set(key, { col, dir });
    sortTable(d, col, dir);
    setArrow(d, col, dir);
  }

  document.addEventListener('click', (ev) => {
    const cell = ev.target.closest?.('[data-ts]');
    if (!cell || ev.target.closest('a, input, select, textarea')) return;
    ev.stopPropagation();
    activate(cell);
  }, true);
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    const cell = ev.target.closest?.('[data-ts]');
    if (!cell) return;
    ev.preventDefault();
    activate(cell);
  });

  // Las pantallas se repintan enteras: tras cada repintado se preparan las tablas nuevas y se les vuelve a aplicar su orden
  const root = document.getElementById('main') || document.body;
  new MutationObserver(() => { if (busy) return; clearTimeout(timer); timer = setTimeout(() => enhance(), 60); }).observe(root, { childList: true, subtree: true });
  new MutationObserver(() => { if (busy) return; clearTimeout(timer); timer = setTimeout(() => enhance(), 60); }).observe(document.body, { childList: true });

  return { enhance, toNumber };
})();

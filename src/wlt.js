'use strict';
// Daño recibido por una habilidad concreta, con el aspecto de la tabla de Warcraft Logs:
// Nombre, Cantidad (barra), Golpes (ticks), Golpe medio, Tiempo activo %, Fallos %, Mitigado, DTPS y un «+» con el desglose.
// Los datos salen de la misma tabla de Warcraft Logs pedida jugador a jugador (golpes, ticks, fallos, tiempo activo y detalle de golpes).

function wltAgg(entries) {
  const a = { mit: 0, total: 0, red: 0, hasRed: false, hit: 0, tick: 0, miss: 0, tmiss: 0, uptime: 0, hasUp: false, absorbed: 0, hd: new Map() };
  for (const e of entries) {
    a.total += e.total || 0;
    a.mit += e.overheal || 0; // en el daño recibido Warcraft Logs guarda ahí lo mitigado (armadura, resistencias...)
    if (e.totalReduced != null) { a.red += e.totalReduced; a.hasRed = true; } else a.red += e.total || 0;
    a.hit += e.hitCount || 0; a.tick += e.tickCount || 0;
    a.miss += e.missCount || 0; a.tmiss += e.tickMissCount || 0;
    if (e.uptime != null) { a.uptime += e.uptime; a.hasUp = true; }
    for (const h of e.hitdetails || []) {
      const x = a.hd.get(h.type) || { type: h.type, count: 0, total: 0, min: Infinity, max: 0, absorbed: 0 };
      x.count += h.count || 0; x.total += h.total || 0; x.absorbed += h.absorbOrOverheal || 0;
      if (h.min != null) x.min = Math.min(x.min, h.min);
      if (h.max != null) x.max = Math.max(x.max, h.max);
      a.hd.set(h.type, x);
      a.absorbed += h.absorbOrOverheal || 0;
    }
  }
  return a;
}

const wltIsTick = (type) => /tick/i.test(type);

function takenAbilityDetail(f, ids, name) {
  return cached(`wlt:${f.key}:${name}`, async () => {
    // Misma habilidad con varios identificadores (rangos, dificultades): se piden todos y se suman por jugador
    const guids = [...new Set([...S.abilities.values()].filter((x) => x.name === name).map((x) => x.gameID))];
    if (!guids.length) return new Map();
    const q = guids.map((g) => `g${g}:table(fightIDs:$f,dataType:DamageTaken,abilityID:${g},startTime:$s,endTime:$e)`).join(' ');
    const d = await gql(`query($code:String!,$f:[Int],$s:Float,$e:Float){reportData{report(code:$code){ ${q} }}}`, { code: S.code, f: fightIds(f), s: f.startTime, e: f.endTime });
    const r = d.reportData.report;
    const per = new Map();
    for (const g of guids) for (const e of entriesOf(r[`g${g}`])) {
      if (!ids.includes(e.id)) continue;
      if (!per.has(e.id)) per.set(e.id, []);
      per.get(e.id).push(e);
    }
    return new Map([...per].map(([id, list]) => [id, wltAgg(list)]));
  });
}

const WLT_TYPES = {
  hit: ['Golpe', 'Hit'], crit: ['Crítico', 'Crit'], tick: ['Tick', 'Tick'], 'crit tick': ['Tick crítico', 'Critical tick'], 'critical tick': ['Tick crítico', 'Critical tick'], absorbed: ['Absorbido', 'Absorbed'],
  miss: ['Fallo', 'Miss'], dodge: ['Esquivado', 'Dodge'], parry: ['Parado', 'Parry'], block: ['Bloqueado', 'Block'], resist: ['Resistido', 'Resist'],
  immune: ['Inmune', 'Immune'], 'immune (tick)': ['Inmune (tick)', 'Immune (tick)'], evade: ['Evadido', 'Evade'], reflect: ['Reflejado', 'Reflect'],
};
const wltTypeName = (type) => { const v = WLT_TYPES[String(type).toLowerCase()]; return v ? LL(v[0], v[1]) : type; };

function wltShort(v, withUnit = true) {
  if (v == null || !isFinite(v)) return '-';
  const a = Math.abs(v);
  if (a >= 1e6) return `${num(v / 1e6, 2)}${withUnit ? 'm' : ''}`;
  if (a >= 1e3) return `${num(v / 1e3, 1)}${withUnit ? 'k' : ''}`;
  return num(v, 0);
}
const wltPct = (v) => (v == null || !isFinite(v) ? '-' : `${num(v, 2)}%`);
const wltPair = (a, b, show) => (show ? `${a} <span class="wlt-par">(${b})</span>` : a);

function wltRows(f, detail, dur) {
  const rows = [];
  for (const [id, a] of detail) {
    const p = playerInfo(id, S.actors.get(id));
    const hitD = [...a.hd.values()].filter((x) => !wltIsTick(x.type));
    const tickD = [...a.hd.values()].filter((x) => wltIsTick(x.type));
    const hn = hitD.reduce((s, x) => s + x.count, 0), tn = tickD.reduce((s, x) => s + x.count, 0);
    rows.push({
      id, ...p, a,
      total: a.total,
      hits: a.hit || hn, ticks: a.tick || tn,
      avgHit: hn ? hitD.reduce((s, x) => s + x.total, 0) / hn : null,
      avgTick: tn ? tickD.reduce((s, x) => s + x.total, 0) / tn : null,
      uptime: a.hasUp ? (a.uptime / (dur * 1000)) * 100 : null,
      missP: a.miss ? (a.miss / ((a.hit || hn) + a.miss)) * 100 : null,
      tmissP: a.tmiss ? (a.tmiss / ((a.tick || tn) + a.tmiss)) * 100 : null,
      mitig: a.total + a.mit > 0 && a.mit >= 0 ? (a.mit / (a.total + a.mit)) * 100 : null,
      dtps: a.total / dur,
    });
  }
  return rows.filter((r) => r.total > 0).sort((x, y) => y.total - x.total);
}

function wltTable(f, abilityName, detail, dur) {
  const rows = wltRows(f, detail, dur);
  if (!rows.length) return `<div class="empty">${t('noData')}</div>`;
  S.wltCsv = { name: abilityName, rows };
  const sum = rows.reduce((s, r) => s + r.total, 0) || 1;
  const max = Math.max(...rows.map((r) => r.total), 1);
  const anyTick = rows.some((r) => r.ticks > 0);
  const anyMiss = rows.some((r) => r.missP != null || r.tmissP != null);
  const missCell = (r) => (r.missP == null && r.tmissP == null ? '-' : wltPair(r.missP == null ? '-' : wltPct(r.missP), r.tmissP == null ? '-' : wltPct(r.tmissP), r.tmissP != null));
  const cols = ['minmax(150px, 200px)', 'minmax(260px, 1fr)', '64px', '112px', '108px', anyMiss ? '96px' : '', '76px', '84px', '24px'].filter(Boolean).join(' ');
  const detailHTML = (r) => {
    const list = [...r.a.hd.values()].sort((x, y) => y.total - x.total);
    return `<div class="wlt-det" hidden><table><thead><tr><th>${LL('Tipo', 'Type')}</th><th>${LL('Cantidad', 'Count')}</th><th>${LL('Mín.', 'Min')}</th><th>${LL('Máx.', 'Max')}</th><th>${LL('Medio', 'Avg')}</th><th>${LL('Total', 'Total')}</th></tr></thead><tbody>${
      list.map((x) => `<tr><td>${esc(wltTypeName(x.type))}</td><td>${num(x.count, 0)}</td><td>${wltShort(x.min === Infinity ? null : x.min)}</td><td>${wltShort(x.max)}</td><td>${wltShort(x.count ? x.total / x.count : null)}</td><td>${wltShort(x.total)}</td></tr>`).join('')
    }</tbody></table></div>`;
  };
  const head = `<div class="row head"><span class="c-name">${LL('Nombre', 'Name')}</span><span class="c-amt">${LL('Cantidad', 'Amount')}</span><span>${LL('Golpes', 'Hits')}</span><span>${LL('Golpe medio', 'Avg hit')}</span><span>${LL('Tiempo activo %', 'Uptime %')}</span>${anyMiss ? `<span>${LL('Fallos %', 'Miss %')}</span>` : ''}<span>${LL('Mitigado', 'Mitigated')}</span><span>DTPS</span><span></span></div>`;
  S.wltTips = [];
  const body = rows.map((r) => {
    const cc = classColor(r.cls);
    const dark = Math.min(1, Math.max(0, (r.total - r.a.red) / (r.total || 1)));
    const w = (r.total / max).toFixed(4);
    const hits = [...r.a.hd.values()].sort((x, y) => y.total - x.total);
    S.wltTips.push(`<div class="wtt-t wtt-t6"><span>${LL('Tipo', 'Type')}</span><span>${LL('Cantidad', 'Amount')}</span><span>${LL('Absorbido', 'Absorbed')}</span><span>${LL('Mín.', 'Min')}</span><span>${LL('Máx.', 'Max')}</span><span>${LL('Medio', 'Average')}</span></div>${hits.map((x) => {
      const ab = Math.min(1, x.absorbed / (x.total || 1)), pc = x.total / (r.total || 1);
      return `<div class="wtt-r wtt-r6"><b>${esc(wltTypeName(x.type))}</b><span class="wtt-am"><span class="wtt-p">${wltPct(pc * 100)}</span><span class="wtt-b"><i style="width:${pc * 100 * (1 - ab)}%;background:${cc}"></i><i style="width:${pc * 100 * ab}%;background:${cc};opacity:.45"></i></span><span class="wtt-a">${wltShort(x.total)}</span></span><span>${num(x.absorbed, 0)}</span><span>${x.min === Infinity ? '-' : num(x.min, 0)}</span><span>${num(x.max, 0)}</span><span>${num(x.count ? x.total / x.count : 0, 1)}</span></div>`;
    }).join('')}`);
    return `<div class="row ${isMe(r.name) ? 'me' : ''}" data-wtip="${S.wltTips.length - 1}">
      <div class="r-name">${r.icon ? `<img class="spec-ic-sm" src="${specIconUrl(esc(r.icon))}" width="22" height="22" alt="" style="--cc:${cc}">` : `<span class="dot" style="background:${cc}"></span>`}<span class="name" style="color:${cc}">${esc(r.name)}</span></div>
      <div class="r-bar"><span class="r-pct">${wltPct((r.total / sum) * 100)}</span><div class="bar-wrap"><div class="bar"><div class="bar-in" style="width:calc((100% - 74px) * ${w})"><span class="seg" style="flex:${1 - dark} 1 0;background:${cc};--c:${cc}"></span><span class="seg" style="flex:${dark} 1 0;background:${cc};opacity:.4;--c:${cc}"></span></div><span class="r-amt">${wltShort(r.total)}</span></div></div></div>
      <span class="c-n">${wltPair(r.hits ? num(r.hits, 0) : '-', r.ticks ? num(r.ticks, 0) : '-', anyTick)}</span>
      <span class="c-n">${wltPair(wltShort(r.avgHit), wltShort(r.avgTick), anyTick)}</span>
      <span class="c-n">${wltPct(r.uptime)}</span>
      ${anyMiss ? `<span class="c-n">${missCell(r)}</span>` : ''}
      <span class="c-n">${wltPct(r.mitig)}</span>
      <span class="c-rate">${num(r.dtps, 1)}</span>
      <button type="button" class="wlt-plus" data-action="wlt-exp" title="${esc(LL('Ver desglose', 'Show breakdown'))}">+</button>
    </div>${detailHTML(r)}`;
  }).join('');
  const T = rows.reduce((s, r) => { s.hit += r.hits; s.tick += r.ticks; s.mit += r.a.mit; s.hv += (r.avgHit || 0) * r.hits; s.tv += (r.avgTick || 0) * r.ticks; return s; }, { hit: 0, tick: 0, mit: 0, hv: 0, tv: 0 });
  const totMit = (sum + T.mit) > 0 ? (T.mit / (sum + T.mit)) * 100 : null;
  const foot = `<div class="row wlt-total"><div class="r-name"><span class="name">${LL('Total', 'Total')}</span></div><div class="r-bar"><span class="r-pct">100%</span><div class="bar-wrap"><div class="bar"><span class="r-amt">${wltShort(sum)}</span></div></div></div>
      <span class="c-n">${wltPair(num(T.hit, 0), num(T.tick, 0), anyTick)}</span><span class="c-n">${wltPair(wltShort(T.hit ? T.hv / T.hit : null), wltShort(T.tick ? T.tv / T.tick : null), anyTick)}</span><span class="c-n">-</span>${anyMiss ? '<span class="c-n">-</span>' : ''}
      <span class="c-n">${wltPct(totMit)}</span><span class="c-rate">${num(sum / dur, 1)}</span><span></span></div>`;
  const bar = `<div class="sortbar" data-no-shot><span class="grow"></span><button type="button" class="chip" data-action="wlt-csv" title="${esc(LL('Descargar la tabla en CSV', 'Download the table as CSV'))}">CSV</button><button type="button" class="chip" data-action="shot" data-m="copy" title="${esc(LL('Copiar esta pantalla como imagen', 'Copy this screen as an image'))}">📋 ${LL('Copiar imagen', 'Copy image')}</button><button type="button" class="chip" data-action="shot" data-m="save" title="${esc(LL('Guardar esta pantalla como imagen PNG', 'Save this screen as a PNG image'))}">💾 ${LL('Guardar PNG', 'Save PNG')}</button></div>`;
  return `${bar}<div class="ranked wlt-r" style="--cols:${cols}">${head}${body}${foot}</div>`;
}

function wltCsv() {
  const d = S.wltCsv;
  if (!d) return;
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = [LL('Nombre', 'Name'), LL('Cantidad', 'Amount'), LL('Golpes', 'Hits'), LL('Ticks', 'Ticks'), LL('Golpe medio', 'Avg hit'), LL('Tick medio', 'Avg tick'),
    LL('Tiempo activo %', 'Uptime %'), LL('Fallos %', 'Miss %'), LL('Mitigado %', 'Mitigated %'), 'DTPS'];
  const n = (v, d2 = 2) => (v == null ? '' : (Math.round(v * 10 ** d2) / 10 ** d2).toString());
  const lines = [head.map(q).join(',')].concat(d.rows.map((r) => [r.name, Math.round(r.total), r.hits, r.ticks, n(r.avgHit, 0), n(r.avgTick, 0), n(r.uptime), n(r.missP), n(r.mitig), n(r.dtps, 1)].map(q).join(',')));
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${LL('dano-recibido', 'damage-taken')}-${String(d.name).replace(/[^\w-]+/g, '_')}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-action="wlt-exp"],[data-action="wlt-csv"]');
  if (!el) return;
  if (el.dataset.action === 'wlt-csv') { wltCsv(); return; }
  const det = el.closest('.row')?.nextElementSibling;
  if (det?.classList.contains('wlt-det')) { det.hidden = !det.hidden; el.textContent = det.hidden ? '+' : '–'; }
});

// ---------------------------------------------------------------- Daño recibido en general (todas las habilidades)
// Como la tabla de Warcraft Logs: Nombre, Cantidad (barra), Mitigado, Ilvl, Activo y DTPS, con «+» para ver las habilidades.
function takenTable(f, players, dur) {
  const rows = players.map((e) => {
    const p = playerInfo(e.id, e);
    const total = e.total || 0;
    const red = e.totalReduced != null ? e.totalReduced : total;
    const mit = e.overheal || 0;
    return {
      ...p, mit, total, red, blocked: e.blocked || 0, abil: abilList(e.abilities || []),
      mitig: total + mit > 0 ? (mit / (total + mit)) * 100 : null,
      ilvl: exactIlvl(e), active: activeOf(e, dur * 1000), dtps: total / dur,
    };
  }).filter((r) => r.total > 0).sort((x, y) => y.total - x.total);
  if (!rows.length) return `<div class="empty">${t('noData')}</div>`;
  const sum = rows.reduce((s, r) => s + r.total, 0) || 1;
  const max = Math.max(...rows.map((r) => r.total), 1);
  const cols = ['minmax(150px, 200px)', 'minmax(260px, 1fr)', '84px', '84px', '84px', '108px', '24px'].join(' ');
  const head = `<div class="row head"><span class="c-name">${LL('Nombre', 'Name')}</span><span class="c-amt">${LL('Cantidad', 'Amount')}</span><span>${LL('Mitigado', 'Mitigated')}</span><span>Ilvl</span><span>${LL('Activo', 'Active')}</span><span>DTPS</span><span></span></div>`;
  S.wltTips = [];
  const body = rows.map((r) => {
    const cc = classColor(r.cls);
    const normal = Math.max(0, r.red), absorbed = Math.max(0, r.total - r.red);
    const dark = Math.min(1, absorbed / (r.total || 1));
    const tipLines = [[LL('Normal', 'Normal'), normal, r.total, '#c41e3a'], [LL('Absorbido', 'Absorbed'), absorbed, r.total, '#7a1626']];
    if (r.blocked > 0) tipLines.push([LL('Bloqueado/Aturdido', 'Blocked/Staggered'), r.blocked, r.total + r.blocked, '#3b3a14']);
    S.wltTips.push(`<div class="wtt-t"><span>${LL('Tipo', 'Type')}</span><span>${LL('Cantidad', 'Amount')}</span></div>${tipLines.map(([n, v, tot, col]) =>
      `<div class="wtt-r wtt-r2"><b>${n}</b><span class="wtt-p">${wltPct((v / (tot || 1)) * 100)}</span><span class="wtt-b"><i style="width:${(v / (tot || 1)) * 100}%;background:${col}"></i></span><span class="wtt-a">${wltShort(v)}</span></div>`).join('')}`);
    const w = (r.total / max).toFixed(4);
    const abTotal = r.abil.reduce((s, a) => s + a.total, 0) || 1;
    return `<div class="row ${isMe(r.name) ? 'me' : ''}" data-wtip="${S.wltTips.length - 1}">
      <div class="r-name">${r.icon ? `<img class="spec-ic-sm" src="${specIconUrl(esc(r.icon))}" width="22" height="22" alt="" style="--cc:${cc}">` : `<span class="dot" style="background:${cc}"></span>`}<span class="name" style="color:${cc}">${esc(r.name)}</span></div>
      <div class="r-bar"><span class="r-pct">${wltPct((r.total / sum) * 100)}</span><div class="bar-wrap"><div class="bar"><div class="bar-in" style="width:calc((100% - 74px) * ${w})"><span class="seg" style="flex:${1 - dark} 1 0;background:${cc};--c:${cc}"></span><span class="seg" style="flex:${dark} 1 0;background:${cc};opacity:.4;--c:${cc}"></span></div><span class="r-amt">${wltShort(r.total)}</span></div></div></div>
      <span class="c-n">${wltPct(r.mitig)}</span>
      <span class="c-n">${fmtIlvl(r.ilvl)}</span>
      <span class="c-n">${wltPct(r.active)}</span>
      <span class="c-rate">${num(r.dtps, 1)}</span>
      <button type="button" class="wlt-plus" data-action="wlt-exp" title="${esc(LL('Ver habilidades', 'Show abilities'))}">+</button>
    </div><div class="wlt-det" hidden><table><thead><tr><th>${LL('Habilidad', 'Ability')}</th><th>${LL('Cantidad', 'Amount')}</th><th>%</th></tr></thead><tbody>${
      r.abil.slice(0, 30).map((a) => `<tr><td>${esc(a.name)}</td><td>${wltShort(a.total)}</td><td>${wltPct((a.total / abTotal) * 100)}</td></tr>`).join('')
    }</tbody></table></div>`;
  }).join('');
  const sumMit = rows.reduce((s, r) => s + r.mit, 0);
  const totMit = sum + sumMit > 0 ? (sumMit / (sum + sumMit)) * 100 : null;
  const foot = `<div class="row wlt-total"><div class="r-name"><span class="name">${LL('Total', 'Total')}</span></div><div class="r-bar"><span class="r-pct">100%</span><div class="bar-wrap"><div class="bar"><span class="r-amt">${wltShort(sum)}</span></div></div></div>
      <span class="c-n">${wltPct(totMit)}</span><span class="c-n">-</span><span class="c-n">${num(dur, 1)}s</span><span class="c-rate">${num(sum / dur, 1)}</span><span></span></div>`;
  const bar = `<div class="sortbar" data-no-shot><span class="grow"></span><button type="button" class="chip" data-action="shot" data-m="copy" title="${esc(LL('Copiar esta pantalla como imagen', 'Copy this screen as an image'))}">📋 ${LL('Copiar imagen', 'Copy image')}</button><button type="button" class="chip" data-action="shot" data-m="save" title="${esc(LL('Guardar esta pantalla como imagen PNG', 'Save this screen as a PNG image'))}">💾 ${LL('Guardar PNG', 'Save PNG')}</button></div>`;
  return `${bar}<div class="ranked wlt-r" style="--cols:${cols}">${head}${body}${foot}</div>`;
}

// Tooltip de cada jugador en las tablas de daño recibido (tipo de golpe o de daño, como en Warcraft Logs)
(() => {
  let tip = null;
  const hide = () => { if (tip) tip.hidden = true; };
  document.addEventListener('mouseover', (ev) => {
    const row = ev.target.closest?.('.wlt-r .row[data-wtip]');
    const html = row && S.wltTips?.[Number(row.dataset.wtip)];
    if (!html) return hide();
    if (!tip) { tip = document.createElement('div'); tip.className = 'bartip surface-dark wtt'; document.body.appendChild(tip); }
    tip.innerHTML = html;
    tip.hidden = false;
  });
  document.addEventListener('mousemove', (ev) => {
    if (!tip || tip.hidden) return;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let x = ev.clientX + 16, y = ev.clientY + 16;
    if (x + w > window.innerWidth - 8) x = Math.max(8, ev.clientX - w - 16);
    if (y + h > window.innerHeight - 8) y = Math.max(8, window.innerHeight - h - 8);
    tip.style.left = `${x}px`; tip.style.top = `${y}px`;
  });
  document.addEventListener('mouseout', (ev) => { if (!ev.relatedTarget || !ev.relatedTarget.closest?.('.wlt-r')) hide(); });
  document.addEventListener('scroll', hide, true);
})();

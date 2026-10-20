'use strict';
// Daño recibido por una habilidad concreta, con el aspecto de la tabla de Warcraft Logs:
// Nombre, Cantidad (barra), Golpes (pulsos), Golpe medio, Tiempo activo %, Fallos %, Mitigado, DTPS y un «+» con el desglose.
// Los datos salen de la misma tabla de Warcraft Logs pedida jugador a jugador (golpes, pulsos, fallos, tiempo activo y detalle de golpes).

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
  hit: ['Golpe', 'Hit'], crit: ['Crítico', 'Crit'], tick: ['Pulso', 'Tick'], 'crit tick': ['Pulso crítico', 'Critical tick'], absorbed: ['Absorbido', 'Absorbed'],
  miss: ['Fallo', 'Miss'], dodge: ['Esquivado', 'Dodge'], parry: ['Parado', 'Parry'], block: ['Bloqueado', 'Block'], resist: ['Resistido', 'Resist'],
  immune: ['Inmune', 'Immune'], 'immune (tick)': ['Inmune (pulso)', 'Immune (tick)'], evade: ['Evadido', 'Evade'], reflect: ['Reflejado', 'Reflect'],
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
  const detailHTML = (r) => {
    const list = [...r.a.hd.values()].sort((x, y) => y.total - x.total);
    return `<div class="wlt-det"><table><thead><tr><th>${LL('Tipo', 'Type')}</th><th>${LL('Cantidad', 'Count')}</th><th>${LL('Mín.', 'Min')}</th><th>${LL('Máx.', 'Max')}</th><th>${LL('Medio', 'Avg')}</th><th>${LL('Total', 'Total')}</th></tr></thead><tbody>${
      list.map((x) => `<tr><td>${esc(wltTypeName(x.type))}</td><td>${num(x.count, 0)}</td><td>${wltShort(x.min === Infinity ? null : x.min)}</td><td>${wltShort(x.max)}</td><td>${wltShort(x.count ? x.total / x.count : null)}</td><td>${wltShort(x.total)}</td></tr>`).join('')
    }</tbody></table></div>`;
  };
  const body = rows.map((r) => {
    const cc = classColor(r.cls);
    const dark = Math.min(1, Math.max(0, (r.total - r.a.red) / (r.total || 1)));
    const w = (r.total / max) * 100;
    return `<tr class="wlt-row ${isMe(r.name) ? 'me' : ''}">
      <td class="wlt-name"><div class="wlt-n">${r.icon ? `<img class="spec-ic-sm" src="${specIconUrl(esc(r.icon))}" width="22" height="22" alt="" style="--cc:${cc}">` : ''}<b style="color:${cc}">${esc(r.name)}</b></div></td>
      <td class="wlt-amt"><div class="wlt-a"><span class="wlt-pct">${wltPct((r.total / sum) * 100)}</span><span class="wlt-bar"><i style="width:${w * (1 - dark)}%;background:${cc}"></i><i style="width:${w * dark}%;background:${cc};opacity:.4"></i></span><b style="color:${cc}">${wltShort(r.total)}</b></div></td>
      <td class="r">${wltPair(r.hits ? num(r.hits, 0) : '-', r.ticks ? num(r.ticks, 0) : '-', anyTick)}</td>
      <td class="r">${wltPair(wltShort(r.avgHit), wltShort(r.avgTick), anyTick)}</td>
      <td class="r">${wltPct(r.uptime)}</td>
      ${anyMiss ? `<td class="r">${missCell(r)}</td>` : ''}
      <td class="r">${wltPct(r.mitig)}</td>
      <td class="r wlt-dtps">${num(r.dtps, 1)}</td>
      <td class="wlt-x"><button type="button" class="wlt-plus" data-action="wlt-exp" title="${esc(LL('Ver desglose', 'Show breakdown'))}">+</button></td>
    </tr><tr class="wlt-detrow" hidden><td colspan="${anyMiss ? 9 : 8}">${detailHTML(r)}</td></tr>`;
  }).join('');
  const T = rows.reduce((s, r) => { s.hit += r.hits; s.tick += r.ticks; s.mit += r.a.mit; s.hv += (r.avgHit || 0) * r.hits; s.tv += (r.avgTick || 0) * r.ticks; return s; }, { hit: 0, tick: 0, mit: 0, hv: 0, tv: 0 });
  const totMit = (sum + T.mit) > 0 ? (T.mit / (sum + T.mit)) * 100 : null;
  return `<div class="wlt-wrap"><table class="wlt"><thead><tr>
      <th class="l">${LL('Nombre', 'Name')}</th><th class="l">${LL('Cantidad', 'Amount')}</th><th class="r">${LL('Golpes', 'Hits')}</th><th class="r">${LL('Golpe medio', 'Avg hit')}</th>
      <th class="r">${LL('Tiempo activo %', 'Uptime %')}</th>${anyMiss ? `<th class="r">${LL('Fallos %', 'Miss %')}</th>` : ''}<th class="r">${LL('Mitigado', 'Mitigated')}</th><th class="r">DTPS</th><th></th></tr></thead>
    <tbody>${body}</tbody>
    <tfoot><tr><td class="l">${LL('Total', 'Total')}</td><td class="wlt-amt"><div class="wlt-a"><span class="wlt-pct">100%</span><span class="wlt-bar wlt-bar-t"></span><b>${wltShort(sum)}</b></div></td>
      <td class="r">${wltPair(num(T.hit, 0), num(T.tick, 0), anyTick)}</td><td class="r">${wltPair(wltShort(T.hit ? T.hv / T.hit : null), wltShort(T.tick ? T.tv / T.tick : null), anyTick)}</td><td class="r">-</td>${anyMiss ? '<td class="r">-</td>' : ''}
      <td class="r">${wltPct(totMit)}</td><td class="r wlt-dtps">${num(sum / dur, 1)}</td><td></td></tr></tfoot></table>
    <div class="wlt-foot"><button type="button" class="btn small" data-action="wlt-csv">CSV</button></div></div>`;
}

function wltCsv() {
  const d = S.wltCsv;
  if (!d) return;
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = [LL('Nombre', 'Name'), LL('Cantidad', 'Amount'), LL('Golpes', 'Hits'), LL('Pulsos', 'Ticks'), LL('Golpe medio', 'Avg hit'), LL('Pulso medio', 'Avg tick'),
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
  const tr = el.closest('tr')?.nextElementSibling;
  if (tr) { tr.hidden = !tr.hidden; el.textContent = tr.hidden ? '+' : '–'; }
});

'use strict';

const RaidChanges = (() => {
  const L = tr;
  const UPDATED = '2026-11-06';
  const LINKS = [
    ['https://worldofwarcraft.blizzard.com/en-us/news/24296142', 'Hotfixes de agosto a octubre', 'Hotfixes August to October'],
    ['https://worldofwarcraft.blizzard.com/en-us/news/24307310/hotfixes-november-5-2026', 'Hotfixes de octubre y noviembre', 'Hotfixes October and November'],
    ['https://www.icy-veins.com/wow/news/big-ulatek-nerfs-venomous-abyss-raid-tuning-october-6th/', 'Ajuste de Ula\'tek del 6 de octubre', 'Ula\'tek tuning of October 6'],
  ];
  const ABIL = /*ABIL*/{};
  const AREAS = /*AREAS*/[];
  const BOSS = (id) => `raidicons/b${id}.webp`;
  const iconSrc = (ic) => (ic[0] === 'b' ? BOSS(ic[1]) : `raidicons/z_${ic[1]}.webp`);
  const SIGNS = { g: ['Nerf', 'Nerf', 'up'], r: ['Buff', 'Buff', 'down'], a: ['Cambio', 'Change', 'mid'], f: ['Corrección', 'Fix', 'fix'], v: ['Visual', 'Visual', 'vis'] };
  const TYPES = [['all', 'Todo', 'All'], ['g', 'Nerfs', 'Nerfs'], ['r', 'Buffs', 'Buffs'], ['a', 'Cambios', 'Changes'], ['v', 'Visual', 'Visual'], ['f', 'Correcciones', 'Fixes']];
  const DIFFS = [['all', 'Todas', 'All'], ['R', 'Buscador de bandas', 'Raid Finder'], ['N', 'Normal', 'Normal'], ['H', 'Heroica', 'Heroic'], ['M', 'Mítica', 'Mythic']];
  const MODES = {
    raid: { color: '#ff8a4c', es: 'Bandas', en: 'Raids', subEs: 'Cada jefe, con sus ajustes y correcciones por dificultad', subEn: 'Every boss, with its tuning and fixes per difficulty', icons: [3492, 3513, 3429] },
    dungeon: { color: '#5cc8ff', es: 'Míticas+', en: 'Mythic+', subEs: 'Cada mazmorra, con sus jefes y enemigos', subEn: 'Every dungeon, with its bosses and enemies', icons: [12993, 12859, 12923] },
  };
  let mode = null;
  let cur = 'va';
  let fType = 'all';
  let fDiff = 'all';

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const spanish = () => L('es', 'en') === 'es';
  const fmtDate = (d) => new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
  const name = (o) => L(o.es, o.en);
  const diffName = (k) => { const d = DIFFS.find((x) => x[0] === k); return d ? L(d[1], d[2]) : ''; };
  const text = (row) => esc(L(row[2], row[3])).replace(/\{(\d+)\}/g, (m, id) => {
    const a = ABIL[id];
    if (!a) return '';
    const label = esc(spanish() ? a[1] || a[2] : a[2] || a[1]);
    return `<span class="cc-sp" data-spell="${id}"><img class="cc-ic" src="${abilityIconUrl(a[0])}" width="16" height="16" alt="" loading="lazy">${label}</span>`;
  });
  const areasOf = (m) => AREAS.filter((a) => a.kind === m);
  const okType = (row, t) => t === 'all' || row[1] === t;
  const okDiff = (row, d) => d === 'all' || !row[4] || row[4].includes(d);
  const tally = (rows) => { const t = { g: 0, r: 0 }; for (const r of rows) if (t[r[1]] !== undefined) t[r[1]]++; return t; };
  const allRows = (a) => a.units.flatMap((u) => u.rows);
  const total = (m) => { const t = { g: 0, r: 0, n: 0 }; for (const a of areasOf(m)) { const rows = allRows(a); const x = tally(rows); t.g += x.g; t.r += x.r; t.n += rows.length; } return t; };
  const stack = (ids) => ids.map((i) => `<img src="${BOSS(i)}" alt="">`).join('');
  const badges = (t) => `${t.g ? `<i class="rc-n g">${t.g} Nerfs</i>` : ''}${t.r ? `<i class="rc-n r">${t.r} Buffs</i>` : ''}`;
  const mini = (t) => `${t.g ? `<i class="rc-n g" title="Nerfs">${t.g}</i>` : ''}${t.r ? `<i class="rc-n r" title="Buffs">${t.r}</i>` : ''}`;

  function homeHTML() {
    return `<button type="button" class="pn-btn cc-btn rc-btn" data-rc="open"><span class="cc-btn-ic rc-btn-ic">${stack([3492, 3429, 3513])}</span><span class="cc-btn-t">${L('Cambios de Raids / Míticas', 'Raid / Mythic+ changes')}<small>${L('Jefes y mazmorras · 12.1.0 a 12.1.5', 'Bosses and dungeons · 12.1.0 to 12.1.5')}</small></span></button>`;
  }

  function unitBlock(u, color, area) {
    const rows = u.rows.filter((r) => okType(r, fType) && (mode === 'dungeon' || okDiff(r, fDiff)));
    if (!rows.length) return '';
    let body = '';
    let last = null;
    for (const row of rows) {
      if (row[0] !== last) { body += `<li class="cc-day"><b>${esc(fmtDate(row[0]))}</b></li>`; last = row[0]; }
      const s = SIGNS[row[1]];
      const tags = row[4] ? `<span class="rc-ds">${[...row[4]].map((k) => `<i class="rc-d d-${k}">${esc(diffName(k))}</i>`).join('')}</span>` : '';
      body += `<li class="cc-row s-${s[2]}"><span class="cc-type">${L(s[0], s[1])}</span><span class="cc-txt">${text(row)}</span>${tags}</li>`;
    }
    const pic = u.icon ? BOSS(u.icon) : u.ej ? `raidicons/ej_${u.ej}.webp` : u.k === 'b' || u.en === 'General changes' ? iconSrc(area.icon) : u.k === 'm' ? 'hd/inv_misc_bone_humanskull_01.webp' : '';
    const icon = pic ? `<img${u.ej ? ' class="ej"' : ''} src="${pic}" width="34" height="34" alt="" loading="lazy">` : '<span class="rc-gen"></span>';
    const dtag = mode === 'raid' && fDiff !== 'all' ? `<em class="rc-dt d-${fDiff}">${esc(diffName(fDiff))}</em>` : '';
    return `<article class="cc-spec rc-unit" style="--cc:${color}"><button type="button" class="cc-spec-h" data-rc-toggle aria-expanded="false">${icon}<span class="cc-spec-n">${esc(name(u))}${dtag}</span><span class="rc-counts">${mini(tally(rows))}</span><small>${rows.length}</small><i class="cc-chev"></i></button><ul class="cc-list" hidden>${body}</ul></article>`;
  }

  function filters(a) {
    const rows = allRows(a);
    const byType = rows.filter((r) => mode === 'dungeon' || okDiff(r, fDiff));
    const byDiff = rows.filter((r) => okType(r, fType));
    const tcount = (k) => byType.filter((r) => okType(r, k)).length;
    const dcount = (k) => byDiff.filter((r) => okDiff(r, k)).length;
    const tchips = TYPES.map((t) => `<button type="button" class="rc-chip t-${t[0]}${fType === t[0] ? ' on' : ''}" data-rc-type="${t[0]}">${L(t[1], t[2])}<em>${tcount(t[0])}</em></button>`).join('');
    const dchips = DIFFS.map((d) => `<button type="button" class="rc-chip d-${d[0]}${fDiff === d[0] ? ' on' : ''}" data-rc-diff="${d[0]}">${L(d[1], d[2])}<em>${dcount(d[0])}</em></button>`).join('');
    return `<div class="rc-filters"><div class="rc-fg"><span class="rc-fl">${L('Tipo', 'Type')}</span>${tchips}</div>${mode === 'raid' ? `<div class="rc-fg"><span class="rc-fl">${L('Dificultad', 'Difficulty')}</span>${dchips}</div>` : ''}</div>`;
  }

  function picker() {
    const card = (m) => {
      const o = MODES[m];
      const t = total(m);
      return `<button type="button" class="rc-pick" style="--cc:${o.color}" data-rc-mode="${m}"><span class="rc-pick-ic">${stack(o.icons)}</span><b>${L(o.es, o.en)}</b><small>${L(o.subEs, o.subEn)}</small><span class="rc-pick-n">${badges(t)}<em>${t.n} ${L('cambios', 'changes')}</em></span></button>`;
    };
    return `<div class="rc-pick-wrap"><div class="rc-pick-top"><div><h2>${L('Cambios de Raids / Míticas', 'Raid / Mythic+ changes')}</h2><small>${L('Parches 12.1.0 a 12.1.5 · hasta el', 'Patches 12.1.0 to 12.1.5 · up to')} ${esc(fmtDate(UPDATED))}</small></div><button type="button" class="btn ghost" data-rc-close>${L('Cerrar', 'Close')}</button></div><div class="rc-pick-grid">${card('raid')}${card('dungeon')}</div></div>`;
  }

  function view() {
    const list = areasOf(mode);
    if (!list.some((a) => a.id === cur)) cur = list[0].id;
    const a = list.find((x) => x.id === cur);
    const o = MODES[mode];
    const nav = list.map((x) => `<button type="button" class="cc-nav ${x.id === cur ? 'on' : ''}" style="--cc:${o.color}" data-rc-nav="${esc(x.id)}" title="${esc(name(x))}"><img src="${iconSrc(x.icon)}" width="30" height="30" alt=""><span>${esc(name(x))}</span></button>`).join('');
    const blocks = a.units.map((u) => unitBlock(u, o.color, a)).join('');
    const sub = mode === 'raid' ? L('Ajustes, mejoras y correcciones por jefe y dificultad', 'Tuning, buffs and fixes per boss and difficulty') : L('Ajustes, mejoras y correcciones por jefe y enemigo', 'Tuning, buffs and fixes per boss and enemy');
    return `<div class="cc-wrap"><aside class="cc-side"><button type="button" class="rc-back" data-rc-mode="">‹ ${L('Raids / Míticas', 'Raids / Mythic+')}</button><h2>${L(o.es, o.en)}</h2>${nav}</aside>
      <div class="cc-main"><div class="cc-top"><img src="${iconSrc(a.icon)}" width="48" height="48" alt="" class="rc-top-ic"><div><h3 style="color:${o.color}">${esc(name(a))}</h3><small>${sub} · ${allRows(a).length} ${L('cambios', 'changes')}</small></div><span class="grow"></span>
        <button type="button" class="btn ghost" data-rc-all>${L('Desplegar todo', 'Expand all')}</button><button type="button" class="btn ghost" data-rc-close>${L('Cerrar', 'Close')}</button></div>
        <div class="cc-body">${filters(a)}${blocks || `<p class="cc-none">${L('No hay cambios con estos filtros.', 'No changes match these filters.')}</p>`}
          <p class="foot">${L('Solo cambios sobre los enemigos y las mecánicas; los ajustes de clases están en «Cambios de clase». Los cambios sin etiqueta de dificultad afectan a todas.', 'Only changes to enemies and mechanics; class tuning is under "Class changes". Changes without a difficulty tag apply to all of them.')}</p>
          <p class="foot">${LINKS.map((l) => `<a href="#" data-rc-link="${l[0]}">${L(l[1], l[2])}</a>`).join(' · ')}</p></div></div></div>`;
  }

  function render(dlg) {
    dlg.classList.toggle('rc-small', !mode);
    dlg.innerHTML = mode ? view() : picker();
    dlg.querySelector('.cc-body')?.scrollTo(0, 0);
  }

  function open(m) {
    mode = m || null;
    let dlg = document.getElementById('raidChangesDlg');
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.id = 'raidChangesDlg';
      dlg.className = 'modal wide cc-dlg rc-dlg';
      document.body.appendChild(dlg);
      dlg.addEventListener('click', (ev) => {
        const md = ev.target.closest('[data-rc-mode]');
        if (md) { mode = md.dataset.rcMode || null; if (mode) { cur = areasOf(mode)[0].id; fType = 'all'; fDiff = 'all'; } render(dlg); return; }
        const nav = ev.target.closest('[data-rc-nav]');
        if (nav) { cur = nav.dataset.rcNav; render(dlg); return; }
        const ty = ev.target.closest('[data-rc-type]');
        if (ty) { fType = ty.dataset.rcType; render(dlg); return; }
        const df = ev.target.closest('[data-rc-diff]');
        if (df) { fDiff = df.dataset.rcDiff; render(dlg); return; }
        const tg = ev.target.closest('[data-rc-toggle]');
        if (tg) {
          const art = tg.closest('.cc-spec');
          const on = !art.classList.contains('open');
          art.classList.toggle('open', on);
          tg.setAttribute('aria-expanded', String(on));
          art.querySelector('.cc-list').hidden = !on;
          if (on) art.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          return;
        }
        if (ev.target.closest('[data-rc-all]')) {
          const arts = [...dlg.querySelectorAll('.rc-unit')];
          const on = arts.some((x) => !x.classList.contains('open'));
          arts.forEach((x) => { x.classList.toggle('open', on); x.querySelector('[data-rc-toggle]').setAttribute('aria-expanded', String(on)); x.querySelector('.cc-list').hidden = !on; });
          ev.target.closest('[data-rc-all]').textContent = on ? L('Plegar todo', 'Collapse all') : L('Desplegar todo', 'Expand all');
          return;
        }
        const link = ev.target.closest('[data-rc-link]');
        if (link) { ev.preventDefault(); window.api.openExternal(link.dataset.rcLink); return; }
        if (ev.target.closest('[data-rc-close]') || ev.target === dlg) dlg.close();
      });
    }
    render(dlg);
    if (!dlg.open) dlg.showModal();
  }

  document.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-rc="open"]')) open(null);
  });

  return { homeHTML, open };
})();

'use strict';

// Ficha de personaje al estilo WoWProgress / Warcraft Logs: posiciones (mundial, región y reino), tabla por jefe,
// puntuación de Mítica+, equipo y modelo del personaje. Todo se pide en el momento, sin caché.
const Profile = (() => {
  const REGIONS = ['eu', 'us', 'kr', 'tw'];
  const METRICS = [['dps', 'DPS'], ['hps', 'HPS'], ['bossdps', null]];
  // Especializaciones de cada clase (nombres de Warcraft Logs, sin espacios) para el desplegable de specs
  const CLASS_SPECS = { DeathKnight: ['Blood', 'Frost', 'Unholy'], DemonHunter: ['Havoc', 'Vengeance', 'Devourer'], Druid: ['Balance', 'Feral', 'Guardian', 'Restoration'],
    Evoker: ['Devastation', 'Preservation', 'Augmentation'], Hunter: ['BeastMastery', 'Marksmanship', 'Survival'], Mage: ['Arcane', 'Fire', 'Frost'],
    Monk: ['Brewmaster', 'Mistweaver', 'Windwalker'], Paladin: ['Holy', 'Protection', 'Retribution'], Priest: ['Discipline', 'Holy', 'Shadow'],
    Rogue: ['Assassination', 'Outlaw', 'Subtlety'], Shaman: ['Elemental', 'Enhancement', 'Restoration'], Warlock: ['Affliction', 'Demonology', 'Destruction'], Warrior: ['Arms', 'Fury', 'Protection'] };
  // Warcraft Logs numera las clases distinto que Blizzard (Monje = 5 en WCL, 10 en Blizzard)
  const WCL_CLASS = { 1: 'DeathKnight', 2: 'Druid', 3: 'Hunter', 4: 'Mage', 5: 'Monk', 6: 'Paladin', 7: 'Priest', 8: 'Rogue', 9: 'Shaman', 10: 'Warlock', 11: 'Warrior', 12: 'DemonHunter', 13: 'Evoker' };
  const ASSETS = 'https://assets.rpglogs.com/img/warcraft';
  const SLOT_ORDER = ['HEAD', 'NECK', 'SHOULDER', 'BACK', 'CHEST', 'SHIRT', 'TABARD', 'WRIST', 'HANDS', 'WAIST', 'LEGS', 'FEET', 'FINGER_1', 'FINGER_2', 'TRINKET_1', 'TRINKET_2', 'MAIN_HAND', 'OFF_HAND'];
  const QCOLOR = { POOR: '#9d9d9d', COMMON: '#ffffff', UNCOMMON: '#1eff00', RARE: '#0070dd', EPIC: '#a335ee', LEGENDARY: '#ff8000', ARTIFACT: '#e6cc80', HEIRLOOM: '#00ccff' };
  const st = { q: null, zones: null, zone: null, diff: 0, partition: -1, boss: 0, spec: '', metric: 'dps', arm: null, rio: null, wcl: null, wclErr: '', armErr: '', busy: false, at: 0, timer: null, xpExp: 0, xp: null };

  const regionName = (r) => ({ eu: LL('Europa', 'Europe'), us: LL('América', 'America'), kr: LL('Corea', 'Korea'), tw: LL('Taiwán', 'Taiwan') }[r] || r.toUpperCase());
  const cleanLine = (x) => String(x ?? '').replace(/\|A:[^|]*\|a/g, '').replace(/\|c[0-9a-fA-F]{8}|\|cn[^:]*:|\|r/g, '').replace(/^Enchanted: /i, '').replace(/\s+/g, ' ').trim();
  const num0 = (v) => num(v || 0, 0);
  // Vista incrustada (ventana de armería de Guilds): usa el mismo estado, tabla y logs que la ficha, repintando en la ventana que la aloja
  const repaint = () => { if (S.profileOpen) render(); else if (S.guildOpen && st.embed && typeof Guilds !== 'undefined') Guilds.render(); };
  const recent = () => { try { return JSON.parse(lsGet('prof:recent') || '[]'); } catch { return []; } };

  function ago(ms) {
    if (!ms) return '—';
    const mins = Math.max(0, Math.round((Date.now() - ms) / 60000));
    if (mins < 2) return LL('hace un momento', 'just now');
    if (mins < 60) return LL(`hace ${mins} min`, `${mins} min ago`);
    const h = Math.round(mins / 60);
    if (h < 24) return LL(`hace ${h} h`, `${h} h ago`);
    const d = Math.floor(h / 24);
    return d === 1 ? LL('hace 1 día', '1 day ago') : LL(`hace ${d} días`, `${d} days ago`);
  }
  const daysSince = (ms) => (ms ? Math.floor((Date.now() - ms) / 86400000) : null);

  // ------------------------------------------------------------ datos
  async function zonesList() {
    if (st.zones) return st.zones;
    // Bandas de todas las expansiones (no solo la actual), de la más antigua a la más nueva
    const d = await gql(`{worldData{expansions{id name zones{id name difficulties{id name} partitions{id name compactName default} encounters{id name}}}}}`);
    const bad = /ptr|complete|dummy|mythic\+|beta|torghast|delves|challenge|mage tower|season|dungeons/i;
    st.zones = (d.worldData?.expansions || []).flatMap((ex) => (ex.zones || []).map((z) => ({ ...z, expId: ex.id, expName: ex.name })))
      .filter((z) => z.encounters?.length >= 1 && !bad.test(z.name) && z.difficulties?.some((x) => [1, 2, 3, 4, 5].includes(x.id)))
      .sort((a, b) => a.expId - b.expId || a.id - b.id);
    st.mpZones = (d.worldData?.expansions || []).flatMap((ex) => (ex.zones || []).map((z) => ({ ...z, expId: ex.id, expName: ex.name }))).filter((z) => /^mythic\+ season/i.test(z.name)).sort((a, b) => a.id - b.id);
    if (!st.zones.some((z) => z.id === st.zone)) st.zone = st.zones[st.zones.length - 1]?.id;
    return st.zones;
  }

  // Todos los logs del personaje en un jefe (como el desplegable de Warcraft Logs), con caché por parche/dificultad/métrica
  st.encLogs = {};
  const encPending = new Set();
  const effDiff = () => st.diff || st.wcl?.zoneRankings?.difficulty || 5;
  const specArg = () => (st.spec ? `,specName:${JSON.stringify(st.spec)}` : '');
  const encKey = (id) => `${st.zone}:${st.diff}:${st.partition}:${st.spec}:${st.metric}:${id}`;
  async function fetchEncLogs(id) {
    const q = st.q, key = encKey(id);
    try {
      const metric = METRICS.some(([m]) => m === st.metric) ? st.metric : 'dps';
      const d = await gql(`{characterData{character(name:${JSON.stringify(q.name)},serverSlug:${JSON.stringify(q.slug)},serverRegion:${JSON.stringify(q.region.toUpperCase())}){encounterRankings(encounterID:${Number(id)},difficulty:${Number(effDiff())},metric:${metric},partition:${Number(st.partition)}${specArg()})}}}`, undefined, true);
      const ranks = d.characterData?.character?.encounterRankings?.ranks || [];
      st.encLogs[key] = ranks.filter((r) => r.report?.code).sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
    } catch (e) { st.encLogs[key] = { error: friendlyError(e) }; }
  }
  function encLogsHTML(id, clsKey) {
    const data = st.encLogs[encKey(id)];
    let body;
    if (!data && !encPending.has(encKey(id))) { const k = encKey(id); encPending.add(k); fetchEncLogs(id).finally(() => { encPending.delete(k); repaint(); }); }
    if (!data) body = `<div class="loading"><span class="spinner"></span>${t('loading')}</div>`;
    else if (data.error) body = `<div class="empty sm">${esc(data.error)}</div>`;
    else if (!data.length) body = `<div class="empty sm">${LL('No hay logs públicos de este jefe.', 'No public logs for this boss.')}</div>`;
    else body = `<table class="pf-logs"><thead><tr><th>${LL('Fecha', 'Date')}</th><th>%</th><th>${esc(st.metric === 'hps' ? 'HPS' : 'DPS')}</th><th>${LL('Duración', 'Duration')}</th><th>${LL('Nivel obj.', 'Item lvl')}</th><th></th></tr></thead><tbody>`
      + data.map((r) => `<tr data-pf="log" data-code="${esc(r.report.code)}" data-fight="${Number(r.report.fightID) || ''}" title="${esc(LL('Abrir este log', 'Open this log'))}">`
        + `<td>${esc(new Date(r.startTime || r.report.startTime).toLocaleString(locale(), { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }))}</td>`
        + `<td><span class="pf-pct"><b style="color:${parseColor(r.rankPercent)}">${r.rankPercent != null ? Math.floor(r.rankPercent) : '-'}</b>${clsKey && r.spec ? `<img class="pf-spec" src="${specIconUrl(`${clsKey}-${String(r.spec).split(' ').join('')}`)}" width="18" height="18" alt="">` : ''}</span></td>`
        + `<td>${r.amount != null ? num(r.amount, 1) : '-'}</td><td>${r.duration ? clock(r.duration) : '-'}</td><td>${r.bracketData != null ? esc(r.bracketData) : '-'}</td>`
        + `<td class="pf-logs-go">${LL('Ver log', 'View log')} →</td></tr>`).join('') + `</tbody></table>`;
    const busy = encPending.has(encKey(id));
    const bar = `<div class="pf-logs-bar"><button type="button" class="btn ghost sm" data-pf="refresh-logs" data-e="${id}" ${busy ? 'disabled' : ''}>↻ ${LL('Actualizar', 'Refresh')}</button></div>`;
    return `<tr class="pf-logs-row"><td colspan="10">${bar}${body}</td></tr>`;
  }

  async function fetchWcl() {
    const q = st.q;
    st.wclErr = '';
    try {
      const zones = await zonesList();
      const zone = zones.find((z) => z.id === st.zone) || zones[zones.length - 1];
      if (!zone) { st.wcl = null; return; }
      if (st.diff && !zone.difficulties?.some((x) => x.id === st.diff)) st.diff = 0;
      const metric = METRICS.some(([m]) => m === st.metric) ? st.metric : 'dps';
      const d = await gql(`{characterData{character(name:${JSON.stringify(q.name)},serverSlug:${JSON.stringify(q.slug)},serverRegion:${JSON.stringify(q.region.toUpperCase())}){name classID level faction{name} guildRank hidden zoneRankings(zoneID:${Number(zone.id)},${st.diff ? `difficulty:${Number(st.diff)},` : ''}metric:${metric},partition:${Number(st.partition)}${specArg()})}}}`, undefined, true);
      st.wcl = d.characterData?.character || null;
      if (!st.wcl) st.wclErr = LL('Warcraft Logs no tiene a este personaje (o no tiene logs públicos).', 'Warcraft Logs does not have this character (or it has no public logs).');
    } catch (e) { st.wcl = null; st.wclErr = friendlyError(e); }
  }

  async function fetchGear() {
    const q = st.q;
    const [a, r] = await Promise.all([window.api.bnetArmory(q.slug, q.name, S.lang, q.region), window.api.rioChar(q.region, q.slug, q.name)]);
    st.armErr = a.error ? a.error : '';
    if (!a.error) st.arm = a;
    st.rio = r.error ? null : r;
  }

  // Vuelve a pedir solo los rankings/logs del personaje (por si ha subido un log nuevo), sin recargar el equipo.
  // Los logs de cada jefe que estaban desplegados se piden otra vez al repintar.
  async function refreshWcl() {
    if (st.wclBusy || st.busy) return;
    st.wclBusy = true;
    repaint();
    try { await fetchWcl(); } finally {
      st.encLogs = {};
      st.wclBusy = false;
      st.at = Date.now();
    }
    repaint();
    toast(st.wclErr ? st.wclErr : LL('Logs actualizados', 'Logs updated'));
  }

  async function load() {
    clearInterval(st.timer);
    st.busy = true;
    render();
    await Promise.all([fetchWcl(), fetchGear()]);
    st.busy = false;
    fetchXp().then(() => { if (S.profileOpen) repaint(); });
    resolveLocale();
    st.at = Date.now();
    if (S.profileOpen) render();
    // el equipo se vuelve a pedir cada minuto mientras la ficha está abierta
    st.timer = setInterval(async () => {
      if (!S.profileOpen) { clearInterval(st.timer); return; }
      await fetchGear();
      st.at = Date.now();
      if (S.profileOpen && !st.busy) render();
    }, 60000);
  }


  // ------------------------------------------------------------ banderas y búsqueda por nombre
  const COUNTRY = { es_ES: 'es', es_MX: 'mx', es_AR: 'ar', es_CL: 'cl', de_DE: 'de', fr_FR: 'fr', en_GB: 'gb', it_IT: 'it', pt_PT: 'pt', pt_BR: 'br', ru_RU: 'ru', pl_PL: 'pl', en_US: 'us', en_AU: 'au', ko_KR: 'kr', zh_TW: 'tw', zh_CN: 'cn' };
  const REGION_FLAG = { eu: 'gb', us: 'us', kr: 'kr', tw: 'tw' };
  const flagCode = (locale, region) => COUNTRY[locale] || REGION_FLAG[region] || '';
  const flagHTML = (locale, region, title = '') => { const c = flagCode(locale, region); return c ? `<img class="flag" src="flags/${c}.svg" alt="${esc(c.toUpperCase())}" title="${esc(title || c.toUpperCase())}" width="22" height="16">` : ''; };
  const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  const sr = { term: '', realm: '', region: 'all', list: [], hidden: 0, loading: false, error: '' };
  const CLASS_KEY_BY_ID = () => Cards.CLASS_KEY;

  // Comprobación directa en Blizzard cuando se escribe un reino (por si Raider.IO no conoce al personaje)
  async function directLookup(name, realm, region) {
    const slug = Cards.slugOf(realm);
    for (const rg of region === 'all' ? REGIONS : [region]) {
      try {
        const c = await Cards.char(name, slug, rg);
        return { name: c.name, realmSlug: c.realmSlug || slug, realmName: c.realmName || realm, altName: '', region: rg, regionShort: rg.toUpperCase(), locale: '', faction: String(c.faction || '').toLowerCase(), classId: c.classId || 0, thumb: c.avatar || '' };
      } catch { /* no existe en esa región */ }
    }
    return null;
  }

  // Al entrar por un enlace directo no se sabe el idioma del reino: se averigua con la búsqueda para poner su bandera (Zul'jin es español, no inglés)
  async function resolveLocale() {
    const q = st.q;
    if (!q || q.locale) return;
    try {
      const r = await window.api.rioSearch(q.name);
      const m = (r.list || []).find((x) => x.region === q.region && x.realmSlug === q.slug && x.locale);
      if (m && st.q === q) {
        q.locale = m.locale;
        const l = recent().map((x) => (x.slug === q.slug && x.region === q.region && x.name.toLowerCase() === q.name.toLowerCase() ? { ...x, locale: m.locale } : x));
        lsSet('prof:recent', JSON.stringify(l));
        repaint();
      }
    } catch (e) { /* sin bandera exacta: se queda la de la región */ }
  }

  async function search(name, realm, region) {
    sr.term = name; sr.realm = realm; sr.region = region; sr.list = []; sr.hidden = 0; sr.error = ''; sr.loading = true;
    renderSearch();
    const [r, direct] = await Promise.all([window.api.rioSearch(name), realm ? directLookup(name, realm, region) : Promise.resolve(null)]);
    sr.loading = false;
    if (r.error && !direct) sr.error = friendlyError(r.error);
    let list = r.list || [];
    if (region !== 'all') list = list.filter((x) => x.region === region);
    if (realm) {
      const k = norm(realm);
      list = list.filter((x) => norm(x.realmName).includes(k) || norm(x.realmSlug).includes(k) || norm(x.altName).includes(k));
    }
    if (direct && !list.some((x) => x.region === direct.region && x.realmSlug === direct.realmSlug && norm(x.name) === norm(direct.name))) list.unshift(direct);
    sr.list = list;
    sr.hidden = r.hidden || 0;
    renderSearch();
    fillSpecs(sr.term);
  }

  // Spec que lleva ahora cada personaje encontrado (Raider.IO), para poner su icono junto al nombre
  async function fillSpecs(term) {
    const todo = sr.list.map((x, i) => [x, i]).filter(([x]) => !x.specIcon && x.realmSlug).slice(0, 20);
    let k = 0;
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (k < todo.length) {
        const [x, i] = todo[k++];
        const r = await window.api.rioSpec?.(x.region, x.realmSlug, x.name);
        if (sr.term !== term || !r || r.error || !r.spec) continue;
        const cls = Cards.CLASS_KEY[x.classId] || String(r.cls || '').split(' ').join('');
        x.specIcon = `${cls}-${r.spec.split(' ').join('')}`;
        const img = document.querySelector(`#pfSearch .pf-row-spec[data-i="${i}"]`);
        if (img) { img.src = specIconUrl(x.specIcon); img.hidden = false; }
      }
    }));
  }

  function renderSearch() {
    const dlg = $('#pfSearch');
    if (!dlg) return;
    const key = Cards.CLASS_KEY;
    let body;
    if (sr.loading) body = `<div class="loading"><span class="spinner"></span>${t('loading')}</div>`;
    else if (sr.error) body = `<div class="error"><p>${esc(sr.error)}</p></div>`;
    else if (!sr.list.length) body = `<div class="empty sm">${LL('No he encontrado ningún personaje con ese nombre. Prueba a escribir el reino o a cambiar la región.', 'No character found with that name. Try entering the realm or changing the region.')}</div>`;
    else body = `<div class="pf-res">${sr.list.map((x, i) => {
      const cls = key[x.classId] || '';
      const faction = x.faction === 'horde' ? '#ff4a4a' : x.faction === 'alliance' ? '#4a8dff' : 'var(--muted)';
      const flag = flagHTML(x.locale, x.region, [x.realmName, x.regionShort].filter(Boolean).join(' · '));
      return `<button type="button" class="pf-row" data-pf="pick" data-i="${i}"><span class="pf-row-pic" style="--c:${classColor(cls)}">${x.thumb ? `<img src="${Cards.media(x.thumb)}" alt="" loading="lazy">` : ''}</span>
        <span class="pf-row-n"><b style="color:${classColor(cls)}"><img class="pf-row-spec" data-i="${i}" ${x.specIcon ? `src="${specIconUrl(x.specIcon)}"` : 'hidden'} width="20" height="20" alt="">${esc(x.name)}</b><small>${esc(cls ? className(cls) : '')} <i class="pf-fac" style="background:${faction}"></i></small></span>
        <span class="pf-row-s">${flag}<span>${esc(x.realmName)}${x.altName && x.altName !== x.realmName ? ` <small class="muted">${esc(x.altName)}</small>` : ''}<small>${esc(x.regionShort || x.region.toUpperCase())}</small></span></span></button>`;
    }).join('')}</div>${sr.hidden ? `<small class="muted">${LL(`${sr.hidden} resultados de reinos de China ocultos (no se pueden consultar).`, `${sr.hidden} results from China realms hidden (they cannot be queried).`)}</small>` : ''}`;
    dlg.innerHTML = `<div class="pf-dlg"><div class="pf-dlg-h"><div><h2>${LL('Personajes', 'Characters')}: «${esc(sr.term)}»</h2>
      <small class="muted">${sr.loading ? '' : LL(`${sr.list.length} encontrados`, `${sr.list.length} found`)}${sr.realm ? ` · ${esc(sr.realm)}` : ''}</small></div>
      <button type="button" class="btn ghost" data-pf="closesearch">${LL('Cerrar', 'Close')}</button></div>${body}</div>`;
    if (!dlg.open) dlg.showModal();
  }

  // ------------------------------------------------------------ vista
  function open(q) {
    if (typeof Replay !== 'undefined') Replay.stop();
    S.seq++;
    S.home = true;
    S.cmpOpen = true;
    S.guildOpen = false;
    S.profileOpen = true;
    sidebar.hidden = true;
    st.q = { name: q.name, slug: q.slug, realm: q.realm || q.slug, region: REGIONS.includes(q.region) ? q.region : 'eu', locale: q.locale || '' };
    st.arm = null; st.rio = null; st.wcl = null; st.wclErr = ''; st.armErr = '';
    st.xp = null; st.xpExp = 0; st.embed = null; st.encLogs = {}; st.openEnc = null; st.boss = 0; st.spec = '';
    const l = recent().filter((x) => !(x.slug === st.q.slug && x.name.toLowerCase() === st.q.name.toLowerCase() && x.region === st.q.region));
    l.unshift({ name: st.q.name, realm: st.q.realm, slug: st.q.slug, region: st.q.region, locale: st.q.locale });
    lsSet('prof:recent', JSON.stringify(l.slice(0, 8)));
    main.scrollTop = 0;
    load();
  }

  const rankColor = (p) => (p == null ? 'var(--muted)' : parseColor(p));

  const tilesHTML = () => xpHTML();

  // Enlaces a las mismas fichas en otras webs
  function linksHTML() {
    const q = st.q;
    const slug = encodeURIComponent(q.slug);
    const nm = encodeURIComponent(q.name);
    const lang = { es: 'es-es', en: 'en-gb' }[S.lang] || 'en-gb';
    const links = [
      ['Warcraft Logs', `https://www.warcraftlogs.com/character/${q.region}/${slug}/${nm}`],
      ['Raider.IO', st.rio?.url || `https://raider.io/characters/${q.region}/${slug}/${nm}`],
      [LL('Armería', 'Armory'), `https://worldofwarcraft.blizzard.com/${lang}/character/${q.region}/${slug}/${nm}`],
      ['Droptimizer', 'https://www.raidbots.com/simbot/droptimizer'],
    ];
    return links.map(([l, u]) => `<a href="#" class="link" data-pf="ext" data-u="${esc(u)}">${esc(l)} ↗</a>`).join(' · ');
  }

  function headerHTML() {
    const a = st.arm;
    const w = st.wcl;
    const q = st.q;
    const classId = a?.classId || w?.classID;
    const cls = Cards.CLASS_KEY[classId] || '';
    const days = daysSince(a?.lastLogin);
    const stale = days != null && days >= 7;
    const avatar = a?.avatar ? `<img src="${Cards.media(a.avatar)}" alt="">` : '';
    const guild = a?.guild ? `<span style="color:${a.faction === 'HORDE' ? '#ff4a4a' : '#4a8dff'}">${esc(a.guild)}</span> - ` : '';
    return `<div class="pf-head">
      <span class="pf-ava">${avatar}<b>${esc(a?.level || w?.level || '')}</b></span>
      <div class="pf-id"><h1>${esc(a?.name || q.name)}</h1>
        <div class="pf-sub">${guild}${flagHTML(q.locale, q.region)} <span>${esc(a?.realmName || q.realm)} (${esc(q.region.toUpperCase())})</span></div>
        <div class="pf-cls" style="color:${classColor(cls)}">${esc([a?.race, a?.cls].filter(Boolean).join(' '))}${a?.spec ? ` · ${esc(a.spec)}` : ''}</div>
        <div class="pf-links">${linksHTML()}</div></div>
      <div class="pf-tiles">${tilesHTML()}</div>
      <div class="pf-upd"><button type="button" class="btn ghost" data-pf="update" ${st.busy ? 'disabled' : ''}>↻ ${LL('Actualizar', 'Update')}</button>
        <small>${LL('Equipo actualizado', 'Gear updated')}: <b class="${stale ? 'bad' : ''}">${esc(ago(a?.lastLogin))}</b>${days != null && days > 0 ? ` <span class="muted">(${LL(`${days} d sin actualizar`, `${days} d without update`)})</span>` : ''}</small>
        <small class="muted">${LL('Consultado', 'Fetched')}: ${esc(ago(st.at))}</small></div></div>`;
  }

  // Desplegable propio (con iconos) igual que los de Warcraft Logs; items: [{ v, label, icon?, on? }]
  const ddHTML = (key, cur, items) => `<div class="abdd pf-dd"><button type="button" class="abdd-btn" data-pf="dd-toggle">${cur.icon ? `<img class="pf-ddi" src="${cur.icon}" width="20" height="20" alt="">` : ''}<span class="abdd-t">${esc(cur.label)}</span><span class="abdd-car">▾</span></button>
    <div class="abdd-list surface-dark" hidden>${items.map((it) => `<div class="abdd-i ${it.on ? 'on' : ''}" data-pf="dd-pick" data-dd="${key}" data-v="${esc(String(it.v))}">${it.icon ? `<img class="pf-ddi" src="${it.icon}" width="22" height="22" alt="" loading="lazy">` : ''}<span class="abdd-t">${esc(it.label)}</span></div>`).join('')}</div></div>`;
  const partName = (id) => { const p = (((st.zones || []).find((z) => z.id === st.zone) || {}).partitions || []).find((x) => x.id === id); return p ? (p.compactName || p.name) : ''; };
  function controlsHTML() {
    const zones = st.zones || [];
    const zone = zones.find((z) => z.id === st.zone);
    if (!zone) return '';
    const exps = [...new Map(zones.map((z) => [z.expId, z.expName])).entries()].sort((a, b) => b[0] - a[0]);
    const expDD = ddHTML('exp', { label: zone.expName }, exps.map(([id, name]) => ({ v: id, label: name, on: id === zone.expId })));
    const zoneDD = ddHTML('zone', { label: zone.name, icon: `${ASSETS}/zones/zone-${zone.id}.png` },
      [...zones].filter((z) => z.expId === zone.expId).sort((a, b) => b.id - a.id).map((z) => ({ v: z.id, label: z.name, icon: `${ASSETS}/zones/zone-${z.id}.png`, on: z.id === zone.id })));
    const mLabel = { dps: LL('Daño', 'Damage'), hps: LL('Sanación', 'Healing'), bossdps: LL('Daño a jefe', 'Boss Damage') };
    const metDD = ddHTML('metric', { label: mLabel[st.metric] || mLabel.dps }, METRICS.map(([m]) => ({ v: m, label: mLabel[m], on: st.metric === m })));
    const bosses = (zone.encounters || []).filter((e) => e.name);
    const allBoss = LL('Todos los jefes', 'All Bosses');
    const curBoss = bosses.find((e) => e.id === st.boss);
    const bossDD = ddHTML('boss', curBoss ? { label: curBoss.name, icon: `${ASSETS}/bosses/${curBoss.id}-icon.jpg` } : { label: allBoss },
      [{ v: 0, label: allBoss, on: !st.boss }, ...bosses.map((e) => ({ v: e.id, label: e.name, icon: `${ASSETS}/bosses/${e.id}-icon.jpg`, on: e.id === st.boss }))]);
    const clsKey = WCL_CLASS[st.wcl?.classID] || '';
    const specs = CLASS_SPECS[clsKey] || [];
    const allSpec = LL('Todas las especializaciones', 'All Specs');
    const specIc = (sp) => specIconUrl(`${clsKey}-${sp}`);
    const specDD = ddHTML('spec', st.spec && clsKey ? { label: specName(st.spec), icon: specIc(st.spec) } : { label: allSpec },
      [{ v: '', label: allSpec, on: !st.spec }, ...specs.map((sp) => ({ v: sp, label: specName(sp), icon: specIc(sp), on: sp === st.spec }))]);
    const dIds = [5, 4, 3, 2, 1].filter((id) => (zone.difficulties || []).some((d) => d.id === id));
    const dLabel = (id) => diffName(id) || (zone.difficulties.find((d) => d.id === id)?.name || '');
    const highest = LL('Dificultad máxima', 'Highest Difficulty');
    const diffDD = ddHTML('diff', { label: st.diff ? dLabel(st.diff) : highest }, [{ v: 0, label: highest, on: !st.diff }, ...dIds.map((id) => ({ v: id, label: dLabel(id), on: id === st.diff }))]);
    // Botones de parche dentro de la season (como en Warcraft Logs): Todos + uno por cada parche de la banda
    const parts = (zone.partitions || []).filter((p) => p.name !== 'default');
    const ptabs = parts.length > 1 ? `<div class="pf-ptabs"><button type="button" class="pf-ptab ${st.partition === -1 ? 'on' : ''}" data-pf="part" data-v="-1">${LL('Todos', 'All')}</button>${parts.map((p) => `<button type="button" class="pf-ptab ${st.partition === p.id ? 'on' : ''}" data-pf="part" data-v="${p.id}" title="${esc(p.name)}">${esc(p.compactName || p.name)}</button>`).join('')}</div>` : '';
    const refresh = `<button type="button" class="btn ghost sm pf-refresh" data-pf="refresh-wcl" title="${LL('Vuelve a pedir tus logs a Warcraft Logs por si has subido uno nuevo', 'Fetch your logs from Warcraft Logs again in case you uploaded a new one')}" ${st.wclBusy || st.busy ? 'disabled' : ''}>↻ ${st.wclBusy ? LL('Actualizando…', 'Updating…') : LL('Actualizar logs', 'Refresh logs')}</button>`;
    return `<div class="pf-fbar">${expDD}${zoneDD}${refresh}</div><div class="pf-fbar">${metDD}${bossDD}${specDD}${diffDD}</div>${ptabs}`;
  }

  function tableHTML() {
    if (st.wclErr) return `<div class="empty sm">${esc(st.wclErr)}</div>`;
    const w = st.wcl;
    if (!w) return `<div class="loading"><span class="spinner"></span>${t('loading')}</div>`;
    const zr = w.zoneRankings;
    const zone = (st.zones || []).find((z) => z.id === st.zone);
    if (!zr || !zone) return `<div class="empty sm">${LL('Sin datos para este parche y dificultad.', 'No data for this patch and difficulty.')}</div>`;
    const byEnc = new Map((zr.rankings || []).map((r) => [r.encounter?.id, r]));
    const kills = (zr.rankings || []).reduce((s, r) => s + (r.totalKills || 0), 0);
    const as = [...(zr.allStars || [])].sort((a, b) => b.points - a.points)[0];
    const unit = zr.metric === 'hps' ? 'HPS' : 'DPS';
    // est = parse aún no confirmado en los rankings de Warcraft Logs: el porcentaje es una estimación y va con «~»
    const pct = (v, est) => (v == null ? '-' : `<b style="color:${parseColor(v)}">${est ? '~' : ''}${Math.floor(v)}</b>`);
    // Icono de la spec con la que se hizo el mejor parse (como en Warcraft Logs)
    const clsKey = WCL_CLASS[w.classID] || Cards.CLASS_KEY[st.arm?.classId] || '';
    const specImg = (r) => { const sp = r.bestSpec || r.spec; return clsKey && sp ? `<img class="pf-spec" src="${specIconUrl(`${clsKey}-${String(sp).split(' ').join('')}`)}" width="20" height="20" alt="" title="${esc(sp)}">` : ''; };
    const rows = zone.encounters.filter((e) => e.name && (!st.boss || e.id === st.boss)).map((e) => { // sin nombre = jefe aún sin traducir en Warcraft Logs
      const r = byEnc.get(e.id);
      const has = r && r.totalKills > 0;
      const a2 = r?.allStars;
      return `<tr class="${has ? `pf-enc${st.openEnc === e.id ? ' open' : ''}` : 'none'}"${has ? ` data-pf="enc" data-e="${e.id}"` : ''}><td class="pf-boss"><div class="pf-bw"><span class="pf-bic"><img src="https://assets.rpglogs.com/img/warcraft/bosses/${e.id}-icon.jpg" width="28" height="28" loading="lazy" alt=""></span><span>${esc(e.name)}</span>${has && r.lockedIn === false ? `<small class="pf-nolock" title="${esc(LL('Este parse todavía no está confirmado en los rankings de Warcraft Logs: el porcentaje es una estimación y puede cambiar.', 'This parse is not locked into the Warcraft Logs rankings yet: the percentile is an estimate and may change.'))}">Not locked in</small>` : ''}</div></td>
        <td${has && r.lockedIn === false ? ' class="pf-lockcell"' : ''}>${has ? `<span class="pf-pct">${pct(r.rankPercent, r.lockedIn === false)}${specImg(r)}</span>` : '-'}</td><td class="n pf-dps">${has ? num(r.bestAmount, 1) : '-'}</td><td class="n">${has ? num0(r.totalKills) : 0}</td>
        <td class="n">${has && r.fastestKill ? clock(r.fastestKill) : '-'}</td><td>${has ? pct(r.medianPercent) : '-'}</td>
        <td class="n">${has && a2 ? num(a2.points, 2) : '-'}</td>
        <td class="n" title="${a2 ? esc(`${num0(a2.total)} ${LL('jugadores', 'players')}`) : ''}">${has && a2 ? `<b style="color:${parseColor(a2.rankPercent)}">${num0(a2.rank)}</b>` : '-'}</td></tr>`
        + (has && st.openEnc === e.id ? encLogsHTML(e.id, clsKey) : '');
    }).join('');
    // Resumen con la misma disposición que Warcraft Logs: dificultad arriba, mejor media a la izquierda,
    // mediana y kills a la derecha, y los puntos All Star (con parche y spec) abajo en el centro
    const asSpec = as?.spec && clsKey ? `<img class="pf-spec" src="${specIconUrl(`${clsKey}-${String(as.spec).split(' ').join('')}`)}" width="20" height="20" alt="" title="${esc(as.spec)}">` : '';
    return `<div class="pf-sum2"><div class="pf-sum2-t">${esc(diffName(effDiff()) || '')}</div>
      <div class="pf-sum2-l"><small>${LL('Mejor media', 'Best Perf. Avg')}</small><b style="color:${rankColor(zr.bestPerformanceAverage)}">${zr.bestPerformanceAverage != null ? num(zr.bestPerformanceAverage, 1) : '—'}</b></div>
      <div class="pf-sum2-r"><span>${LL('Media mediana', 'Median Perf. Avg')}: <b style="color:${rankColor(zr.medianPerformanceAverage)}">${zr.medianPerformanceAverage != null ? num(zr.medianPerformanceAverage, 1) : '—'}</b></span>
        <span>${LL('Kills registradas', 'Kills Logged')}: <b>${num0(kills)}</b></span></div>
      <div class="pf-sum2-b">${LL('Puntos All Star', 'All Star Points')}: <b class="pf-as">${as ? num(as.points, 2) : '—'}</b>${as ? ` (<b style="color:${rankColor(as.rankPercent)}">${num0(as.rank)}</b>)` : ''}${partName(as?.partition) ? ` <span class="muted">(${esc(partName(as.partition))})</span>` : ''}${asSpec}</div></div>
      <div class="pf-tbl-w"><table class="pf-table"><thead><tr><th rowspan="2">${LL('Jefe', 'Boss')}</th><th rowspan="2">${LL('Mejor %', 'Best %')}</th><th rowspan="2">${LL(`${unit} máximo`, `Highest ${unit}`)}</th><th rowspan="2">Kills</th><th rowspan="2">${LL('Más rápida', 'Fastest')}</th><th rowspan="2">${LL('Med.', 'Med')}</th><th colspan="2">All Stars</th></tr>
        <tr><th>${LL('Puntos', 'Points')}</th><th>${LL('Mundo', 'World')}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }


  // ------------------------------------------------------------ Expansion All Stars (como Warcraft Logs)
  // Una tarjeta por banda de la expansión elegida: dificultad más alta con kills, puntos All Star, jefes derrotados y puesto mundial
  const XP_DIFFS = [5, 4, 3, 1];
  async function fetchXp() {
    const q = st.q;
    try {
      const zones = await zonesList();
      const cur = zones.find((z) => z.id === st.zone) || zones[zones.length - 1];
      const expId = st.xpExp || cur?.expId;
      if (!expId) return;
      const key = `${q.region}/${q.slug}/${q.name}|${expId}|${st.metric}|${st.partition}`;
      if (st.xp && st.xp.key === key) return;
      st.xp = { key, expId, rows: null };
      const raids = zones.filter((z) => z.expId === expId);
      const mps = (st.mpZones || []).filter((z) => z.expId === expId);
      const metric = METRICS.some(([m]) => m === st.metric) ? st.metric : 'dps';
      const part = `,partition:${Number(st.partition)}`;
      const fields = [];
      raids.forEach((z) => (z.difficulties || []).filter((d) => XP_DIFFS.includes(d.id)).forEach((d) => fields.push(`z${z.id}d${d.id}: zoneRankings(zoneID:${z.id},difficulty:${d.id},metric:${metric}${part})`)));
      mps.forEach((z) => fields.push(`z${z.id}d0: zoneRankings(zoneID:${z.id},metric:${metric})`));
      if (!fields.length) { st.xp.rows = []; return; }
      const d = await gql(`{characterData{character(name:${JSON.stringify(q.name)},serverSlug:${JSON.stringify(q.slug)},serverRegion:${JSON.stringify(q.region.toUpperCase())}){${fields.join(' ')}}}}`, undefined, true);
      const ch = d.characterData?.character || {};
      const topAs = (zr) => [...(zr?.allStars || [])].sort((a, b) => b.points - a.points)[0];
      const rows = raids.map((z) => {
        for (const dd of XP_DIFFS) {
          const zr = ch[`z${z.id}d${dd}`];
          const killed = (zr?.rankings || []).filter((r) => r.totalKills > 0).length;
          if (killed) return { zone: z, mp: false, diff: dd, killed, total: z.encounters.length, as: topAs(zr) };
        }
        return { zone: z, mp: false, diff: 0, killed: 0, total: z.encounters.length, as: null };
      });
      for (const z of mps) rows.push({ zone: z, mp: true, diff: 0, as: topAs(ch[`z${z.id}d0`]) });
      const seen = new Map(); // dos zonas con el mismo nombre de temporada: se queda la que tiene datos
      for (const r of rows) { const k = r.mp ? mpNum(r.zone.name) : `r${r.zone.id}`; if (!seen.has(k) || (!seen.get(k).as && r.as)) seen.set(k, r); }
      st.xp.rows = [...seen.values()].sort((a, b) => b.zone.id - a.zone.id);
    } catch (e) { if (st.xp) st.xp.rows = []; }
  }
  const mpNum = (n) => (/season\s*(\d+)/i.exec(n) || [])[1] || '';
  const mpName = (n) => (mpNum(n) ? LL(`Mítica+ Temporada ${mpNum(n)}`, `Mythic+ Season ${mpNum(n)}`) : n);
  function xpHTML() {
    const zones = st.zones || [];
    const cur = zones.find((z) => z.id === st.zone);
    const expId = st.xpExp || cur?.expId;
    if (!expId) return '';
    const exps = [...new Map(zones.map((z) => [z.expId, z.expName])).entries()].sort((a, b) => b[0] - a[0]);
    const dd = ddHTML('xpexp', { label: exps.find((e) => e[0] === expId)?.[1] || '' }, exps.map(([id, name]) => ({ v: id, label: name, on: id === expId })));
    const clsKey = WCL_CLASS[st.wcl?.classID] || Cards.CLASS_KEY[st.arm?.classId] || '';
    const rows = st.xp && st.xp.expId === expId ? st.xp.rows : null;
    let body;
    if (!rows) body = `<div class="loading"><span class="spinner"></span>${t('loading')}</div>`;
    else {
      body = `<div class="pf-xp-grid">${rows.map((r) => {
        const a = r.as;
        const title = r.mp ? mpName(r.zone.name) : `${r.zone.name}${r.diff ? ` ${diffName(r.diff)}` : ''}`;
        const spec = a?.spec && clsKey ? specIconUrl(`${clsKey}-${String(a.spec).split(' ').join('')}`) : (clsKey ? classIconUrl(clsKey) : '');
        const lab = r.mp ? LL(`Temporada ${mpNum(r.zone.name)}`, `Season ${mpNum(r.zone.name)}`) : 'All Stars';
        return `<div class="pf-xpc${a ? '' : ' none'}"><div class="pf-xpc-h" title="${esc(title)}">${esc(title)}</div>
          <div class="pf-xpc-b"><span class="pf-xpc-z"><img src="${ASSETS}/zones/zone-${r.zone.id}.png" width="46" height="46" alt="" loading="lazy">${r.mp ? '' : `<b style="color:${parseColor(r.total ? (r.killed / r.total) * 100 : 0)}">${r.killed} / ${r.total}</b>`}</span>
            ${spec ? `<img class="pf-xpc-s" src="${spec}" width="40" height="40" alt="">` : ''}
            <span class="pf-xpc-c"><small>${esc(lab)}</small><b style="color:${rankColor(a?.rankPercent)}">${a ? num(a.points, 0) : '—'}</b></span>
            <span class="pf-xpc-c"><small>${LL('Puesto', 'Rank')}</small><b style="color:${rankColor(a?.rankPercent)}">${a ? num0(a.rank) : '—'}</b></span></div></div>`;
      }).join('')}</div>`;
    }
    return `<div class="pf-xp"><div class="pf-xp-h"><h4>${LL('All Stars de la expansión', 'Expansion All Stars')}</h4>${dd}</div>${body}</div>`;
  }

  // ------------------------------------------------------------ exportar a SimC
  // Texto en el formato del addon SimulationCraft (el que Warcraft Logs genera con «Export to SimC»): personaje, talentos y los 16 objetos
  const SIMC_SLOT = { HEAD: 'head', NECK: 'neck', SHOULDER: 'shoulder', BACK: 'back', CHEST: 'chest', WRIST: 'wrist', HANDS: 'hands', WAIST: 'waist', LEGS: 'legs', FEET: 'feet', FINGER_1: 'finger1', FINGER_2: 'finger2', TRINKET_1: 'trinket1', TRINKET_2: 'trinket2', MAIN_HAND: 'main_hand', OFF_HAND: 'off_hand' };
  const SIMC_RACE = { 1: 'human', 2: 'orc', 3: 'dwarf', 4: 'night_elf', 5: 'undead', 6: 'tauren', 7: 'gnome', 8: 'troll', 9: 'goblin', 10: 'blood_elf', 11: 'draenei', 22: 'worgen', 24: 'pandaren', 25: 'pandaren', 26: 'pandaren', 27: 'nightborne', 28: 'highmountain_tauren', 29: 'void_elf', 30: 'lightforged_draenei', 31: 'zandalari_troll', 32: 'kul_tiran', 34: 'dark_iron_dwarf', 35: 'vulpera', 36: "mag'har_orc", 37: 'mechagnome', 52: 'dracthyr', 70: 'dracthyr', 84: 'earthen', 85: 'earthen' };
  const SIMC_TANK = new Set(['blood', 'brewmaster', 'guardian', 'protection', 'vengeance']);
  const SIMC_HEAL = new Set(['holy', 'discipline', 'restoration', 'mistweaver', 'preservation']);
  const SIMC_SPELL = new Set(['shadow', 'balance', 'elemental', 'devastation', 'augmentation', 'devourer']);
  // rol que usa SimC: tank, heal, spell (a distancia con hechizos) o attack
  const simcRole = (cls, spec) => (SIMC_TANK.has(spec) ? 'tank' : SIMC_HEAL.has(spec) ? 'heal' : cls === 'mage' || cls === 'warlock' || SIMC_SPELL.has(spec) ? 'spell' : 'attack');
  function simcText() {
    const a = st.arm;
    if (!a?.items?.length) return '';
    const cls = (Cards.CLASS_KEY[a.classId] || '').toLowerCase();
    const spec = (Cards.SPEC_KEY[a.specId] || '').split('-')[1] || '';
    const race = SIMC_RACE[a.raceId] || String(a.race || '').toLowerCase().replace(/[^a-z']+/g, '_');
    const d = new Date();
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const lines = [`# ${a.name} - ${spec ? spec[0].toUpperCase() + spec.slice(1) : a.spec} - ${stamp} - ${st.q.region.toUpperCase()}/${a.realmName || st.q.realm}`, '# Exportado por WipeTime', '',
      `${cls}="${a.name}"`, `level=${a.level}`, `race=${race}`, `region=${st.q.region}`, `server=${st.q.slug}`, `role=${simcRole(cls, spec)}`];
    if (st.rio?.talents?.text) lines.push(`talents=${st.rio.talents.text}`);
    if (spec) lines.push(`spec=${spec}`);
    lines.push('');
    for (const sl of Object.keys(SIMC_SLOT)) {
      const it = a.items.find((x) => x.slot === sl);
      if (!it) continue;
      const s = it.simc || {};
      const parts = [`id=${it.id}`];
      if (s.bonus?.length) parts.push(`bonus_id=${s.bonus.join('/')}`);
      if (s.gems?.length) parts.push(`gem_id=${s.gems.join('/')}`);
      if (s.enchant?.length) parts.push(`enchant_id=${s.enchant.join('/')}`);
      if (s.crafted?.length) parts.push(`crafted_stats=${s.crafted.join('/')}`);
      lines.push(`${SIMC_SLOT[sl]}=,${parts.join(',')}`);
    }
    return lines.join('\n') + '\n';
  }
  // Copia el texto y avisa en el propio botón: tick verde y texto en verde unos segundos
  let simcTimer = 0;
  async function copySimc(btn) {
    const txt = simcText();
    if (!txt) return toast(LL('Todavía no hay equipo para exportar', 'There is no gear to export yet'));
    try { await navigator.clipboard.writeText(txt); } catch {
      const ta = document.createElement('textarea'); ta.value = txt; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
      let okc = false; try { okc = document.execCommand('copy'); } catch { /* sin permiso */ } ta.remove();
      if (!okc) return toast(LL('No se pudo copiar al portapapeles', 'Could not copy to the clipboard'));
    }
    clearTimeout(simcTimer);
    btn.classList.add('done');
    btn.innerHTML = `<span class="pf-simc-tick">✓</span> ${LL('Copiado para SimC', 'Copied for SimC')}`;
    simcTimer = setTimeout(() => { btn.classList.remove('done'); btn.innerHTML = simcLabel(); }, 2600);
  }
  const simcLabel = () => `<img class="wi" src="icons/inv_letter_15.jpg" width="14" height="14" alt="">${LL('Exportar a SimC', 'Export to SimC')}`;


  // ------------------------------------------------------------ pista de mejora de cada pieza (iconos de Peterodox)
  // Pista de cada pieza, por este orden:
  // 1) lo que pone el propio objeto (el texto de dificultad que manda Blizzard): Mítico/Mito -> Mito, Heroico/Héroe -> Héroe, Normal -> Campeón,
  //    Buscador de bandas -> Veterano (y los nombres de pista tal cual: Campeón, Veterano, Aventurero, Explorador). «Mítico+» cuenta como Mito.
  // 2) si no pone nada, los ids de bonus del objeto (13333 = Normal, 13334 = Heroico, 13335 = Mítico)
  // 3) y si tampoco, el nivel de objeto con los tramos de esta temporada (cada pista abarca 13 niveles; al cambiar de temporada solo hay que tocar TRACK_BY_ILVL).
  const TRACK_BONUS = { 13333: 'champion', 13334: 'hero', 13335: 'myth' };
  const TRACK_BY_ILVL = [[334, 'myth'], [321, 'hero'], [308, 'champion'], [295, 'veteran'], [282, 'adventurer'], [269, 'explorer']];
  const TRACK_TEXT = [[/m[ií]tic|mythic|\bmito\b|\bmyth\b/i, 'myth'], [/heroic|her[oó]ic|h[eé]roe?\b|\bhero\b/i, 'hero'], [/\bnormal\b|campe[oó]n|champion/i, 'champion'],
    [/raid finder|buscador de bandas|\blfr\b|veterano|veteran/i, 'veteran'], [/aventurero|adventurer/i, 'adventurer'], [/explorador|explorer/i, 'explorer']];
  const TRACK_NAME = { explorer: ['Explorador', 'Explorer'], adventurer: ['Aventurero', 'Adventurer'], veteran: ['Veterano', 'Veteran'], champion: ['Campeón', 'Champion'], hero: ['Héroe', 'Hero'], myth: ['Mito', 'Myth'] };
  // Piezas creadas: la pista es la de la crest (blasón) que exige crearlas. Cada crest deja su id de bonus en la pieza
  // (13836 = Mito, 13835 = Héroe, 13834 = Campeón); si la pieza no lo trae, por nivel de objeto (una pieza creada de 331 pide crests de Mito).
  const CRAFT_CREST = { 13836: 'myth', 13835: 'hero', 13834: 'champion' };
  const CRAFT_BY_ILVL = [[331, 'myth'], [315, 'hero'], [298, 'champion'], [285, 'veteran'], [270, 'adventurer'], [255, 'explorer']];
  function trackOf(it) {
    const text = it.tip?.nameDesc?.t || '';
    const crafted = !!it.simc?.crafted?.length || /crafted|creado|fabricad|artesan/i.test(text);
    if (crafted) {
      for (const b of it.simc?.bonus || []) if (CRAFT_CREST[b]) return { key: CRAFT_CREST[b], crafted };
      const w = CRAFT_BY_ILVL.find(([min]) => it.ilvl >= min);
      return { key: TRACK_TEXT.find(([re]) => re.test(text))?.[1] || (w ? w[1] : null), crafted };
    }
    let key = TRACK_TEXT.find(([re]) => re.test(text))?.[1] || null;
    if (!key) for (const b of it.simc?.bonus || []) if (TRACK_BONUS[b]) { key = TRACK_BONUS[b]; break; }
    if (!key) { const w = TRACK_BY_ILVL.find(([min]) => it.ilvl >= min); key = w ? w[1] : null; }
    return { key, crafted };
  }
  // «Crafteado» + icono de su pista + nivel de objeto, o solo el icono y el nivel; el icono va a la izquierda del número
  function ilvlHTML(it) {
    const { key, crafted } = trackOf(it);
    const nm = key ? LL(TRACK_NAME[key][0], TRACK_NAME[key][1]) : '';
    const icon = key ? `<img class="pf-trk" src="tracks/${key}.png" alt="" title="${esc(crafted ? `${LL('Crafteado', 'Crafted')} · ${nm}` : nm)}">` : '';
    return `<em class="pf-il">${crafted ? `<span class="pf-crafted">${LL('Crafteado', 'Crafted')}</span>` : ''}${icon}<span class="pf-iln">${esc(it.ilvl || '')}</span></em>`;
  }


  // ------------------------------------------------------------ tooltip de las gemas (tooltip de objeto de Wowhead, en el idioma de la app)
  const GEM_OK = new Set(['B', 'I', 'SPAN', 'BR', 'DIV', 'TABLE', 'TBODY', 'TR', 'TD', 'TH', 'P', 'SMALL', 'STRONG', 'EM']);
  function gemTipHTML(d) {
    const doc = new DOMParser().parseFromString(`<div id="r">${d?.tip || ''}</div>`, 'text/html');
    const root = doc.getElementById('r');
    root.querySelectorAll('[id^="useText"]').forEach((n) => n.remove()); // «Uso:» de un efecto que Wowhead no detalla: el juego no lo enseña
    const clean = (n) => {
      for (const c of [...n.childNodes]) {
        if (c.nodeType === 8) c.remove();
        else if (c.nodeType === 1) {
          if (['SCRIPT', 'STYLE', 'IMG', 'IFRAME'].includes(c.tagName)) { c.remove(); continue; }
          if (!GEM_OK.has(c.tagName)) { clean(c); c.replaceWith(...c.childNodes); continue; }
          const col = /^color:\s*(#[0-9a-f]{3,8});?$/i.exec(c.getAttribute('style') || ''); // se conserva el color del tipo de gema (p. ej. Amatista)
          for (const at of [...c.attributes]) if (at.name !== 'class') c.removeAttribute(at.name);
          if (col) c.style.color = col[1];
          clean(c);
        }
      }
    };
    clean(root);
    return root.innerHTML;
  }
  let gemEl = null;
  function gemTipEl() {
    if (!gemEl) { gemEl = document.createElement('div'); gemEl.className = 'gemtip surface-dark'; gemEl.hidden = true; document.body.appendChild(gemEl); }
    return gemEl;
  }
  document.addEventListener('mouseover', (ev) => {
    const g = ev.target.closest?.('.pf-gem[data-gem]');
    if (!g) return;
    const d = st.arm?.gemTips?.[g.dataset.gem];
    if (!d) return;
    const el = gemTipEl();
    el.innerHTML = `<div class="gt-head"><img src="wcicon://i/${encodeURIComponent(d.icon || '')}" width="36" height="36" alt=""><div class="gt-body">${gemTipHTML(d)}</div></div>`;
    el.hidden = false;
  });
  document.addEventListener('mousemove', (ev) => {
    if (!gemEl || gemEl.hidden) return;
    const w = gemEl.offsetWidth, h = gemEl.offsetHeight;
    let x = ev.clientX + 16, y = ev.clientY + 16;
    if (x + w > window.innerWidth - 8) x = ev.clientX - w - 16;
    if (y + h > window.innerHeight - 8) y = Math.max(8, window.innerHeight - h - 8);
    gemEl.style.left = `${x}px`;
    gemEl.style.top = `${y}px`;
  });
  document.addEventListener('mouseout', (ev) => { if (gemEl && ev.target.closest?.('.pf-gem') && !ev.relatedTarget?.closest?.('.pf-gem')) gemEl.hidden = true; });

  function gearHTML() {
    const a = st.arm;
    if (!a) return st.armErr ? `<div class="empty sm">${esc(st.armErr)}</div>` : `<div class="loading"><span class="spinner"></span>${t('loading')}</div>`;
    const items = [...a.items].filter((i) => !['SHIRT', 'TABARD'].includes(i.slot)).sort((x, y) => SLOT_ORDER.indexOf(x.slot) - SLOT_ORDER.indexOf(y.slot));
    // media de los 16 huecos con dos decimales (un arma a dos manos cuenta en las dos manos); si no viniera calculada, se calcula aquí con las piezas
    const exact = a.ilvlExact || (() => {
      const lv = (t) => a.items.find((x) => x.slot === t)?.ilvl || 0;
      const slots = ['HEAD', 'NECK', 'SHOULDER', 'BACK', 'CHEST', 'WRIST', 'HANDS', 'WAIST', 'LEGS', 'FEET', 'FINGER_1', 'FINGER_2', 'TRINKET_1', 'TRINKET_2', 'MAIN_HAND', 'OFF_HAND'];
      const twoH = !a.items.some((x) => x.slot === 'OFF_HAND');
      return a.items.length ? Math.floor((slots.reduce((sum, sl) => sum + (sl === 'OFF_HAND' && twoH ? lv('MAIN_HAND') : lv(sl)), 0) / 16) * 100 + 1e-9) / 100 : 0;
    })();
    const ilvl = exact ? num(exact, 2) : (st.rio?.ilvl || a.ilvlEquipped);
    const rows = items.map((it) => {
      const gems = it.gems.filter((g) => g.id).map((g) => {
        const d = st.arm?.gemTips?.[g.id];
        return `<span class="pf-gem" data-gem="${g.id}" aria-label="${esc(d?.name || g.name)}">${d?.icon ? `<img src="wcicon://i/${encodeURIComponent(d.icon)}" width="18" height="18" alt="">` : '<i></i>'}</span>`;
      }).join('');
      const extra = [...it.enchant.map((e) => `<i class="ench">${esc(cleanLine(e))}</i>`), gems ? `<span class="pf-gems">${gems}</span>` : ''].join('');
      // mejora al final del nombre: 1/6, 6/6...
      const upg = it.upg ? `<small class="pf-upg${/^(\d+)\/\1$/.test(it.upg) ? ' full' : ''}">${esc(it.upg)}</small>` : '';
      return `<div class="pf-it" style="--q:${QCOLOR[it.quality] || '#fff'}" data-itip="${Cards.itemTipKey(it)}"><span class="arm-ic">${it.icon ? `<img src="${Cards.media(it.icon)}" alt="" loading="lazy">` : ''}</span>
        <span class="pf-itx"><span class="pf-itn"><b title="${esc(it.name)}">${esc(it.name)}</b>${upg}</span>${extra}</span>${ilvlHTML(it)}</div>`;
    }).join('');
    return `<div class="pf-gear-h"><b>${LL('Equipo', 'Gear')}</b><button type="button" class="pf-simc" data-pf="simc" title="${esc(LL('Copia tu equipo y talentos en el formato de SimulationCraft', 'Copies your gear and talents in the SimulationCraft format'))}">${simcLabel()}</button><span>${LL('Nivel de objeto', 'Item Level')}: <b>${esc(ilvl || '—')}</b></span></div>${rows}`;
  }

  // Talentos que lleva ahora (Raider.IO): héroe y clase/especialización, con tooltip y botón para copiarlos al juego
  function talentsHTML() {
    const tl = st.rio?.talents;
    if (!tl || !tl.nodes?.length) return '';
    const icon = (n) => `<span class="pf-tal-i${n.rank < n.max ? ' part' : ''}" data-spell="${n.spell}" aria-label="${esc(n.name)}"><img src="wcicon://i/${encodeURIComponent(n.icon)}" alt="" loading="lazy">${n.max > 1 ? `<i>${n.rank}</i>` : ''}</span>`;
    const hero = tl.nodes.filter((n) => n.hero), rest = tl.nodes.filter((n) => !n.hero);
    return `<div class="pf-tal"><div class="pf-gear-h"><b>${LL('Talentos', 'Talents')}</b>${tl.text ? `<button type="button" class="btn ghost sm" data-pf="copytal">${LL('Copiar talentos', 'Copy talents')}</button>` : ''}</div>`
      + (hero.length ? `<small class="pf-tal-h">${LL('Héroe', 'Hero')}</small><div class="pf-tal-g">${hero.map(icon).join('')}</div>` : '')
      + `<small class="pf-tal-h">${LL('Clase y especialización', 'Class and specialization')}</small><div class="pf-tal-g">${rest.map(icon).join('')}</div></div>`;
  }

  function render() {
    if (!S.profileOpen || !st.q) return;
    const a = st.arm;
    // Modelo 3D en su propia columna, con el nombre de la especialización arriba y un fondo según la clase (como en Warcraft Logs)
    const clsKey = Cards.CLASS_KEY[a?.classId] || WCL_CLASS[st.wcl?.classID] || '';
    // Fondo de la armería de Blizzard según la clase (render.worldofwarcraft.com/profile-backgrounds/v2/armory_bg_class_<clase>.jpg)
    const bgName = { DeathKnight: 'death_knight', DemonHunter: 'demon_hunter' }[clsKey] || clsKey.toLowerCase();
    const classBg = clsKey ? Cards.media(`https://render.worldofwarcraft.com/profile-backgrounds/v2/armory_bg_class_${bgName}.jpg`) : '';
    const q = st.q;
    const nmLow = encodeURIComponent(q.name.toLowerCase());
    const slugEnc = encodeURIComponent(q.slug);
    const lk = (u, title, img) => `<a href="#" class="pf-lnk" data-pf="ext" data-u="${esc(u)}" title="${esc(title)}" aria-label="${esc(title)}"><img src="linkicons/${img}.png" width="22" height="22" alt=""></a>`;
    const specKey = Cards.SPEC_KEY[a?.specId];
    const model = a?.render ? `<div class="pf-mpanel" data-cls="${esc(clsKey)}"${classBg ? ` style="--cbg:url('${classBg}')"` : ''}>
      <div class="pf-mhead"><span></span><span class="pf-mname" style="color:${classColor(clsKey)}">${specKey ? `<img class="pf-mspec" src="${specIconUrl(specKey)}" width="22" height="22" alt="">` : ''}${esc(a.spec || a.cls || '')}</span>
        <span class="pf-mlinks">${lk(`https://worldofwarcraft.blizzard.com/${S.lang === 'es' ? 'es_es' : 'en_gb'}/character/${q.region}/${slugEnc}/${nmLow}`, LL('Armería de World of Warcraft', 'World of Warcraft Armory'), 'wow')}${lk(`https://www.raider.io/characters/${q.region}/${slugEnc}/${nmLow}`, 'Raider.IO', 'raiderio')}${lk(`https://www.raidbots.com/simbot/quick?region=${q.region}&realm=${slugEnc}&name=${nmLow}`, LL('Simular en Raidbots', 'Sim on Raidbots'), 'raidbots')}</span></div>
      <div class="pf-model" data-tilt><img src="${Cards.media(a.render)}" alt="${esc(a.name)}" draggable="false" crossorigin="anonymous"></div></div>` : '';
    main.innerHTML = `<div class="pf">
      <div class="pf-back"><button type="button" class="btn ghost sm" data-pf="home">${LL('← Inicio', '← Home')}</button></div>
      ${headerHTML()}
      <div class="pf-grid"><section class="pf-left">${controlsHTML()}${tableHTML()}</section>
        <aside class="pf-mid"><div class="pf-gear">${gearHTML()}</div>${talentsHTML()}</aside>
        <aside class="pf-modelcol">${model}</aside></div></div>`;
  }

  // ------------------------------------------------------------ buscador (portada)
  function formHTML() {
    const last = lsGet('prof:region') || 'all';
    const rec = recent();
    const reg = [['all', LL('Todas las regiones', 'All regions')], ['eu', 'EU'], ['us', 'US'], ['kr', 'KR'], ['tw', 'TW']];
    return `<form id="pfForm" class="pf-search" autocomplete="off">
      <input name="name" class="pf-in-name" placeholder="${esc(LL('Nombre del personaje', 'Character name'))}" spellcheck="false" required>
      <input name="realm" class="pf-in-realm" placeholder="${esc(LL('Reino (opcional)', 'Realm (optional)'))}" spellcheck="false">
      <select name="region">${reg.map(([v, l]) => `<option value="${v}" ${v === last ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <button class="btn primary" type="submit">${LL('Buscar', 'Search')}</button></form>
      ${rec.length ? `<div class="chips pf-rec">${rec.map((x, i) => `<span class="pf-rec-i"><button type="button" class="chip" data-pf="recent" data-i="${i}">${flagHTML(x.locale, x.region)} ${esc(x.name)} <span class="muted">${esc(x.realm)} · ${esc(x.region.toUpperCase())}</span></button><button type="button" class="pf-rec-x" data-pf="recent-del" data-i="${i}" title="${esc(LL('Quitar de recientes', 'Remove from recent'))}" aria-label="${esc(LL('Quitar', 'Remove'))}">✕</button></span>`).join('')}<button type="button" class="mini-btn" data-pf="recent-clear">${LL('Borrar todos', 'Clear all')}</button></div>` : ''}`;
  }

  function sectionHTML() {
    return `<section class="pf-find"><h3 class="sec" data-pf="focus">${LL('Buscar personaje', 'Find a character')}</h3>
      <p class="muted">${LL('Escribe el nombre y pulsa Intro: verás los personajes que existen con ese nombre, su reino y su país. El reino es opcional. Al elegir uno, se abre su ficha con posiciones, logs por jefe, equipo y modelo en vivo.', 'Type the name and press Enter: you will see the characters that exist with that name, their realm and country. The realm is optional. Pick one to open its page with rankings, logs per boss, gear and model, live.')}</p>
      ${formHTML()}</section>`;
  }

  document.addEventListener('submit', (ev) => {
    if (ev.target.id !== 'pfForm') return;
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const name = String(fd.get('name') || '').trim();
    const realm = String(fd.get('realm') || '').trim();
    const region = String(fd.get('region') || 'eu');
    lsSet('prof:region', region);
    if (name) search(name, realm, region);
  });

  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-pf]');
    if (!el) return;
    const a = el.dataset.pf;
    if (a === 'recent') { const x = recent()[Number(el.dataset.i)]; if (x) open(x); }
    else if (a === 'recent-del' || a === 'recent-clear') {
      const l = a === 'recent-clear' ? [] : recent().filter((_, i) => i !== Number(el.dataset.i));
      lsSet('prof:recent', JSON.stringify(l));
      if (main.querySelector('.charsearch') && typeof openCharSearch === 'function') openCharSearch(); else if (!S.profileOpen) renderWelcome();
    }
    else if (a === 'pick') { const x = sr.list[Number(el.dataset.i)]; if (x) { $('#pfSearch').close(); open({ name: x.name, realm: x.realmName, slug: x.realmSlug, region: x.region, locale: x.locale }); } }
    else if (a === 'closesearch') $('#pfSearch').close();
    else if (a === 'ext') { ev.preventDefault(); window.api.openExternal(el.dataset.u); }
    else if (a === 'focus') { const i = document.querySelector('#pfForm input[name="name"]'); if (i) i.focus(); }
    else if (!S.profileOpen && !(S.guildOpen && st.embed)) return;
    else if (a === 'update') load();
    else if (a === 'simc') copySimc(el);
    else if (a === 'refresh-wcl') refreshWcl();
    else if (a === 'enc') { const id = Number(el.dataset.e); st.openEnc = st.openEnc === id ? null : id; repaint(); }
    else if (a === 'refresh-logs') {
      const id = Number(el.dataset.e), k = encKey(id);
      if (encPending.has(k)) return;
      encPending.add(k);
      repaint();
      fetchEncLogs(id).finally(() => { encPending.delete(k); repaint(); });
    }
    else if (a === 'log') loadReport(`https://www.warcraftlogs.com/reports/${el.dataset.code}${el.dataset.fight ? `#fight=${el.dataset.fight}` : ''}`);
    else if (a === 'copytal') { const txt = st.rio?.talents?.text; if (txt) navigator.clipboard.writeText(txt).then(() => toast(LL('Talentos copiados: pégalos en el juego con «Importar»', 'Talents copied: paste them in game with «Import»'))); }
    else if (a === 'home') goHome();
    else if (a === 'dd-toggle') {
      const list = el.nextElementSibling;
      document.querySelectorAll('.abdd-list:not([hidden])').forEach((l) => { if (l !== list) l.hidden = true; });
      list.hidden = !list.hidden;
    }
    else if (a === 'dd-pick') {
      const k = el.dataset.dd, v = el.dataset.v;
      const reload = () => { st.wcl = null; repaint(); fetchWcl().then(repaint); fetchXp().then(repaint); };
      const zoneReset = () => { st.partition = -1; st.boss = 0; st.openEnc = null; };
      if (k === 'exp') { const z = (st.zones || []).filter((x) => x.expId === Number(v)).sort((a, b) => b.id - a.id)[0]; if (z) { st.zone = z.id; zoneReset(); reload(); } }
      else if (k === 'zone') { st.zone = Number(v); zoneReset(); reload(); }
      else if (k === 'xpexp') { st.xpExp = Number(v); st.xp = null; repaint(); fetchXp().then(repaint); }
      else if (k === 'metric') { st.metric = v; reload(); }
      else if (k === 'diff') { st.diff = Number(v); st.openEnc = null; reload(); }
      else if (k === 'spec') { st.spec = v; st.openEnc = null; reload(); }
      else if (k === 'boss') { st.boss = Number(v); st.openEnc = st.boss || null; repaint(); }
    }
    else if (a === 'part') { st.partition = Number(el.dataset.v); st.openEnc = null; st.wcl = null; repaint(); fetchWcl().then(repaint); }
    else if (a === 'diff') { st.diff = Number(el.dataset.v); st.wcl = null; repaint(); fetchWcl().then(repaint); }
    else if (a === 'metric') { st.metric = el.dataset.v; st.wcl = null; repaint(); fetchWcl().then(repaint); }
  });
  document.addEventListener('change', (ev) => {
    if ((!S.profileOpen && !(S.guildOpen && st.embed)) || !ev.target.matches?.('[data-pf-zone]')) return;
    st.zone = Number(ev.target.value);
    st.partition = -1;
    st.openEnc = null;
    st.wcl = null;
    repaint();
    fetchWcl().then(repaint);
  });

  // Carga los parses de un personaje para mostrarlos dentro de otra ventana (no cambia de página)
  function embed(c) {
    const region = String(c.region || 'eu').toLowerCase();
    const key = `${region}/${c.realmSlug}/${String(c.name).toLowerCase()}`;
    if (st.embed === key) return;
    st.embed = key;
    st.q = { name: c.name, slug: c.realmSlug, realm: c.realmName || c.realmSlug, region: REGIONS.includes(region) ? region : 'eu', locale: '' };
    st.arm = null; st.rio = null; st.wcl = null; st.wclErr = ''; st.openEnc = null; st.encLogs = {}; st.boss = 0; st.spec = '';
    fetchWcl().then(() => { if (st.embed === key) repaint(); });
  }
  const embedHTML = () => (st.embed ? `<div class="pf pf-embed"><div class="pf-tiles">${tilesHTML()}</div>${controlsHTML()}${tableHTML()}</div>` : '');

  // Enlace directo: …/WipeTime/#char=eu/zuljin/okita abre directamente la ficha de ese personaje
  setTimeout(() => {
    const m = /#char=([a-z]{2})\/([^/]+)\/(.+)$/i.exec(location.hash || '');
    if (!m) return;
    try { history.replaceState(null, '', location.pathname + location.search); } catch { /* sin historial */ }
    const slug = decodeURIComponent(m[2]), name = decodeURIComponent(m[3]);
    open({ name, slug, realm: slug, region: m[1].toLowerCase() });
  }, 900);

  // Ruta de la ficha abierta (#/char/eu/zuljin/okita), para la URL de la pantalla
  const route = () => (S.profileOpen && st.q ? `#/char/${st.q.region}/${encodeURIComponent(st.q.slug)}/${encodeURIComponent(st.q.name)}` : null);

  return { open, render, formHTML, sectionHTML, search, load, embed, embedHTML, route };
})();

'use strict';

// Parches 12.1.5 y 12.1.7 de Midnight: cuenta atrás del 12.1.5 y paneles con el contenido que Blizzard ha hecho público.
// El botón del inicio abre un desplegable (hacia arriba) para elegir el parche.
// Fuentes oficiales: artículo del 29 de septiembre y notas de actualización 12.1.5 (enlaces al final del panel).
// Los nombres están en castellano como en las notas oficiales de Blizzard y Wowhead; los subrayados llevan tooltip (data-wh="tipo:id").
const Patch115 = (() => {
  const L = tr;
  // Miércoles 14 de octubre de 2026: día del mantenimiento semanal en Europa (en EE. UU. es el martes 13).
  // Blizzard no ha publicado la hora exacta: la cuenta atrás llega a las 00:00 de ese miércoles, hora local.
  const TARGET = new Date(2026, 9, 14, 0, 0, 0);
  const LINK_NEWS = 'https://worldofwarcraft.blizzard.com/en-us/news/24307306';
  const LINK_NOTES = 'https://worldofwarcraft.blizzard.com/en-us/news/24304162';
  // Tráiler oficial «12.1.5 Content Update» en cada idioma de la web (canales oficiales de World of Warcraft en YouTube)
  const VIDEOS = { es: 'p2mAOys5pAU', en: 'phxy5Gat_Gs' };
  // El panel se abre desde file://, donde YouTube rechaza la incrustación: se usa la misma página de la web publicada (https)
  const videoSrc = (id) => `${location.protocol === 'file:' ? 'https://kingkhaax.github.io/WipeHub/' : ''}video.html?v=${id}`;
  let timer = null;

  const pad = (n) => String(n).padStart(2, '0');
  const live = () => currentPatch() === '12.1.5';

  function homeHTML() {
    const count = live() ? '' : `<div class="pn-count"><small>${L('Parche 12.1.5 en', 'Patch 12.1.5 in')}</small><div id="pnTimer" class="pn-boxes"></div><small>${L('miércoles 14 de octubre · Kith\'ix', 'Wednesday, October 14 · Kith\'ix')}</small></div>`;
    return `${count}<button type="button" class="pn-btn pn-menu-btn" data-pn="menu" aria-haspopup="menu" aria-expanded="false"><span class="pn-fx" aria-hidden="true"><i></i><i></i></span><span class="pn-lbl">${L('Contenido del 12.1.5 / 12.1.7', '12.1.5 / 12.1.7 content')}</span><i class="pn-chev" aria-hidden="true">▸</i></button>`;
  }

  function tick() {
    const el = document.getElementById('pnTimer');
    if (!el) { clearInterval(timer); timer = null; return; }
    const ms = TARGET - Date.now();
    if (ms <= 0) {
      // Llega a 0: el parche pasa a ser el 12.1.5 sin reiniciar la app y desaparece la cuenta atrás
      clearInterval(timer);
      timer = null;
      const num = document.querySelector('#expCard .patch');
      if (num) num.lastChild.textContent = currentPatch();
      el.closest('.pn-count')?.remove();
      return;
    }
    const s = Math.floor(ms / 1000);
    const parts = [[Math.floor(s / 86400), L('días', 'days')], [Math.floor((s % 86400) / 3600), L('horas', 'hours')], [Math.floor((s % 3600) / 60), L('min', 'min')], [s % 60, L('seg', 'sec')]];
    el.innerHTML = parts.map(([v, l]) => `<div class="pn-box"><b>${pad(v)}</b><small>${l}</small></div>`).join('');
  }

  function startTimer() {
    clearInterval(timer);
    timer = null;
    if (!document.getElementById('pnTimer')) return;
    tick();
    timer = setInterval(tick, 1000);
  }

  // ------------------------------------------------------------ contenido
  const ul = (items) => `<ul class="pn-list">${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;
  const h = (t) => `<h3 class="pn-h">${t}</h3>`;
  const p = (t) => `<p>${t}</p>`;
  const tag = (t) => `<span class="pn-tag">${t}</span>`;
  const h4 = (t) => `<h4>${t}</h4>`;

  function kithixMechanics() {
    const boss = typeof MECH_DATA !== 'undefined' ? MECH_DATA.bosses.find((b) => b.slug === 'kithix') : null;
    if (!boss) return '';
    return h(L('Mecánicas de Kith\'ix', 'Kith\'ix mechanics'))
      + p(L('Resumen de WipeHub a partir de las guías de Method, wow.gg y Skycoach. Cada habilidad tiene su icono y las dificultades en las que aparece en la pestaña Mecánicas del jefe. Las marcadas «sin verificar» solo las cuenta una guía y pueden cambiar.', 'WipeHub summary built from the Method, wow.gg and Skycoach guides. Each ability has its icon and the difficulties it appears in on the boss\'s Mechanics tab. Those marked «unverified» are only reported by one guide and may change.'))
      + boss.phases.map((ph) => `<h4>${esc(ph.phase)}</h4>${ul(ph.mechanics.map((m) => `<b>${esc(m.name)}</b> — ${esc(m.note)}`))}`).join('');
  }

  const wh = (kind, id, es, en) => `<span class="cc-sp" data-wh="${kind}:${id}">${L(es, en)}</span>`;
  const T = {
    voidcore: () => wh('currency', 3418, 'núcleo de Vacío nebuloso', 'Nebulous Voidcore'),
    voidcores: () => wh('currency', 3418, 'núcleos de Vacío nebulosos', 'Nebulous Voidcores'),
    marl: () => wh('currency', 3316, 'marga de luz del Vacío', 'Voidlight Marl'),
    mistcrest: () => wh('currency', 3438, 'blasones de bruma de veterano', 'Veteran Mistcrests'),
    venomstone: () => wh('item', 280562, 'piedravenenos ascendentes', 'Ascendant Venomstones'),
    saddle: () => wh('item', 279396, 'silla de montar perdida en el tiempo', 'Timelost Saddle'),
    keystone: () => wh('achievement', 63690, '«Mito de la piedra angular de Midnight: temporada 2»', '"Midnight Keystone Myth: Season 2"'),
    snakeEyes: () => wh('achievement', 12503, 'Ojos de serpiente', 'Snake Eyes'),
    snakeEater: () => wh('achievement', 12507, 'Comeserpientes', 'Snake Eater'),
    goodNight: () => wh('achievement', 12508, 'Descansa, dulce príncipe', 'Good Night, Sweet Prince'),
    glory: () => wh('achievement', 12812, 'Gloria del héroe de guerra', 'Glory of the Wartorn Hero'),
    promise: () => wh('achievement', 63519, '«La promesa del mañana»', '"The Promise of Tomorrow"'),
    qShadow: () => wh('quest', 97945, '«A la sombra del catalizador»', '"In the Catalyst\'s Shadow"'),
    qPrismatic: () => wh('quest', 97978, '«Potencial prismático»', '"Prismatic Potential"'),
    qUmbral: () => wh('quest', 97981, '«Bendiciones umbrías del catalizador»', '"Umbral Blessings of the Catalyst"'),
    qAncient: () => wh('quest', 98379, '«Profundidades antiguas, veneno antiguo»', '"Ancient Depths, Ancient Venom"'),
    qAscending: () => wh('quest', 98390, '«Ascender con piedravenenos»', '"Ascending with Venomstones"'),
    orin: () => wh('npc', 269987, 'Orin Luzperdida', 'Orin Straylight'),
    kithix: () => wh('npc', 267861, 'Kith\'ix', 'Kith\'ix'),
  };

  const SECTIONS = () => [
    ['video', L('Vídeo', 'Video'), () => {
      const id = VIDEOS[L('es', 'en')] || VIDEOS.en;
      return `<div class="pn-video"><iframe src="${videoSrc(id)}" title="${L('Tráiler de la actualización 12.1.5', '12.1.5 Content Update trailer')}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`
        + p(L('Tráiler oficial de la actualización de contenido 12.1.5 · Midnight (en español).', 'Official 12.1.5 content update trailer · Midnight (in English).'))
        + p(`<a href="#" data-pn-link="https://www.youtube.com/watch?v=${id}">${L('Abrir en YouTube', 'Open on YouTube')}</a>`);
    }],
    ['resumen', L('Resumen', 'Overview'), () =>
      h(L('Fecha de salida', 'Release date'))
      + ul([
        L('<b>EE. UU.:</b> martes 13 de octubre de 2026, con el mantenimiento semanal (fecha oficial de Blizzard).', '<b>US:</b> Tuesday, October 13, 2026, with weekly maintenance (Blizzard\'s official date).'),
        L('<b>Europa:</b> miércoles 14 de octubre, según la prensa especializada; Blizzard solo indica el 13 con el mantenimiento semanal y no da horas.', '<b>Europe:</b> Wednesday, October 14, according to the specialist press; Blizzard only says the 13th with weekly maintenance and gives no times.'),
      ])
      + h(L('Qué trae', 'What it brings'))
      + ul([
        L('<b>Banda de un jefe:</b> La liberación de Kith\'ix.', '<b>Single-boss raid:</b> The Unbinding of Kith\'ix.'),
        L('<b>Laberinto de Kindo\'jan:</b> reto de nueve cámaras al estilo de las Profundidades, una mazmorra gigante.', '<b>Labyrinth of Kindo\'jan:</b> a nine-chamber Delve-style mega-dungeon.'),
        L('<b>Invasiones aqir:</b> eventos públicos en el Bosque Canción Eterna y Zul\'Aman.', '<b>Aqir Invasions:</b> public events in Eversong Woods and Zul\'Aman.'),
        L(`<b>Refresco de mitad de la temporada 2:</b> más ${T.voidcores()} y ${T.venomstone()}.`, `<b>Season 2 mid-season refresh:</b> extra ${T.voidcores()} and ${T.venomstone()}.`),
        L('<b>Mito de la piedra angular</b> de la temporada 2 y ajustes de mazmorras.', '<b>Keystone Myth</b> for Season 2 and dungeon tuning.'),
        L(`<b>Campaña:</b> ${T.promise()}.`, `<b>Campaign:</b> ${T.promise()}.`),
        L('Vivienda, JcJ, Presa, interfaz y reputación de banda guerrera.', 'Housing, PvP, Prey, UI and warband reputation.'),
      ])],
    ['raid', L('Banda: Kith\'ix', 'Raid: Kith\'ix'), () =>
      h(L('La liberación de Kith\'ix', 'The Unbinding of Kith\'ix'))
      + p(L(`${T.kithix()}, general C'Thraxxi, está atado en una guarida bajo el Abismo Venenoso. Sus ataduras se debilitaron tras la derrota de Ula'tek. Lady Liadrin te acompaña en el combate.`, `${T.kithix()}, a C'Thraxxi general, is bound in a lair beneath the Venomous Abyss. His restraints weakened after Ula'tek's defeat. Lady Liadrin joins you in the fight.`))
      + h(L('Dificultades', 'Difficulties'))
      + ul([
        L('Modo historia, Buscador de bandas, Normal y Heroico.', 'Story Mode, Raid Finder, Normal and Heroic.'),
        L('<b>Mítico:</b> grupo flexible de <b>15 a 25 jugadores</b>.', '<b>Mythic:</b> a flexible group of <b>15 to 25 players</b>.'),
      ])
      + p(L('Blizzard no ha publicado todavía los detalles de las mecánicas del combate.', 'Blizzard has not yet published the encounter\'s mechanics.'))
      + kithixMechanics()],
    ['labyrinth', L('Laberinto de Kindo\'jan', 'Labyrinth of Kindo\'jan'), () =>
      h(L('Laberinto de Kindo\'jan', 'Labyrinth of Kindo\'jan'))
      + p(L('Un desafío de gran tamaño al estilo de las Profundidades (una mazmorra gigante) en un complejo funerario amani sellado. Saqueadores y trols Vilebranch lo registran y los espíritus lo defienden.', 'A large Delve-style challenge (mega-dungeon) in a sealed Amani funeral complex. Looters and the Vilebranch search it while spirits defend it.'))
      + ul([
        L('<b>Nueve cámaras</b>; puedes hacerlo de una sentada o un ala cada vez.', '<b>Nine chambers</b>; run it in one session or one wing at a time.'),
        L('Una sola ala ya da recompensas; cada sala extra añade más tesoro y más riesgo.', 'A single wing still earns rewards; each extra room adds more treasure and more risk.'),
        L('<b>Valeera Sanguinar</b> es tu compañera.', '<b>Valeera Sanguinar</b> is your companion.'),
        L('Progresión y desbloqueos propios; recompensas con <b>equipo Mítico</b>, cosméticos y títulos.', 'Dedicated progression and unlocks; rewards include <b>Mythic gear</b>, cosmetics and titles.'),
        L('Incluye un reto en solitario de <b>nivel 11</b>.', 'Includes a <b>Tier 11</b> solo challenge.'),
      ])],
    ['aqir', L('Invasiones aqir', 'Aqir Invasions'), () =>
      h(L('Invasiones aqir', 'Aqir Invasions'))
      + p(L('Eventos públicos de toda la zona en el <b>Bosque Canción Eterna</b> o <b>Zul\'Aman</b>. Cada hora hay una ventana de <b>10 minutos</b> para completar una serie de eventos y luchar contra un jefe. Las recompensas dependen de los objetivos que cumpla tu grupo antes de que se cierre la ventana.', 'Zone-wide public events in <b>Eversong Woods</b> or <b>Zul\'Aman</b>. Every hour there is a <b>10-minute</b> window to complete a series of events and fight a boss. Rewards depend on the objectives your group completes before the window closes.'))
      + ul([L('Seis tipos de escenario: tres de combate y tres sin combate.', 'Six scenario types: three combat and three non-combat.')])
      + h(L('Ocho afijos de combate', 'Eight combat affixes'))
      + ul([
        L('<b>Protección del Vacío:</b> un tejevacío aqir crea una barrera protectora sobre los demás aqir.', '<b>Void Protection:</b> an Aqir Voidweaver shields the other aqir.'),
        L('<b>Perforador aqir:</b> los aqir se entierran y lanzan a los jugadores por los aires.', '<b>Aqir Burrower:</b> aqir burrow and launch players into the air.'),
        L('<b>Esfera de Vacío:</b> esferas que se mueven para atrapar a los jugadores.', '<b>Void Sphere:</b> spheres move around to trap players.'),
        L('<b>Angustia de Astalor:</b> cristales de angustia dañan a los aqir y a los aventureros cercanos.', '<b>Astalor\'s Anguish:</b> Anguish Crystals damage aqir and nearby adventurers.'),
        L('<b>¡Enjambres!:</b> los aqir se sustituyen por enjambres de aqir más pequeños.', '<b>Swarms!:</b> aqir are replaced by swarms of smaller aqir.'),
        L('<b>Aqir de élite:</b> menos aqir pero más fuertes.', '<b>Aqir Elites:</b> fewer but stronger aqir.'),
        L('<b>Infestación del Vacío:</b> los aqir infestados explotan a los pocos segundos y propagan la infección.', '<b>Void Infestation:</b> infested aqir explode after a few seconds and spread infection.'),
        L('<b>Tejerredes:</b> un tejerredes aqir puede enredar a un jugador si no se interrumpe su canalización.', '<b>Web Weavers:</b> an Aqir Webweaver may web a player if its channel is not interrupted.'),
      ])],
    ['season', L('Mitad de temporada', 'Mid-season'), () =>
      h(L('Refresco de la temporada 2', 'Season 2 refresh'))
      + p(L(`${T.orin()} (Lunargenta) ofrece <b>un ${T.voidcore()} extra por semana</b> para tiradas de bonificación.`, `${T.orin()} (Silvermoon City) offers <b>one extra ${T.voidcore()} per week</b> for bonus rolls.`))
      + h(L('Cómo se desbloquea', 'How it unlocks'))
      + ul([
        L(`Acepta <b>${T.qShadow()}</b> de Decimus en la Tormenta del Vacío y después <b>${T.qPrismatic()}</b> de Orin.`, `Accept <b>${T.qShadow()}</b> from Decimus in Voidstorm, then <b>${T.qPrismatic()}</b> from Orin.`),
        L(`<b>Semana del 6 de octubre</b> (mantenimiento): Orin completa su investigación y ofrece <b>${T.qUmbral()}</b>: intercambia oro, ${T.marl()} o ${T.mistcrest()} por un ${T.voidcore()} extra a la semana.`, `<b>Week of October 6</b> (maintenance): Orin completes his research and offers <b>${T.qUmbral()}</b>: trade gold, ${T.marl()} or ${T.mistcrest()} for one extra Voidcore per week.`),
        L(`<b>Semana del 13 de octubre:</b> <b>${T.qAncient()}</b> inicia la investigación de las ${T.venomstone()}.`, `<b>Week of October 13:</b> <b>${T.qAncient()}</b> starts the ${T.venomstone()} research.`),
        L(`<b>Semana del 20 de octubre:</b> termina la investigación y se ofrece <b>${T.qAscending()}</b>. Ese día se <b>levanta el límite de blasones</b>.`, `<b>Week of October 20:</b> the research completes and <b>${T.qAscending()}</b> is offered. The <b>crest cap is lifted</b> that week.`),
      ])
      + h(L('Piedravenenos ascendentes', 'Ascendant Venomstones'))
      + ul([
        L('Caen de: jefes de banda Heroicos o Míticos, mazmorras de piedra angular mítica+ de <b>+10 o más</b>, profundidades pródigas de <b>nivel 11</b> y cofres de equipo de campeón de la cacería de Presa en dificultad pesadilla.', 'Drop from: Heroic or Mythic raid bosses, Mythic+ keystone dungeons at <b>+10 and above</b>, <b>Tier 11</b> Bountiful Delves and Nightmare Prey Hunt Champion gear chests.'),
        L('Con <b>10</b> piedras, junto al Catalizador de Lunargenta, subes el nivel de objeto de una pieza de Héroe o Mito de la temporada 2 totalmente mejorada, o de un arma, abalorio o collar «Tidal Crafted» de calidad máxima.', 'With <b>10</b> stones, near the Catalyst in Silvermoon City, you raise the item level of a fully upgraded Season 2 Hero or Myth item, or a max-quality Tidal Crafted weapon, trinket or necklace.'),
      ])],
    ['keystone', L('Mito de la piedra angular y logros', 'Keystone Myth & achievements'), () =>
      h(L('Mito de la piedra angular', 'Keystone Myth'))
      + ul([
        L(`Vuelve en la temporada 2: logro <b>${T.keystone()}</b> al llegar a <b>3600</b> de índice de mítica+. Da el título <b>«el Contendiente Venenoso»</b> y la <b>${T.saddle()}</b>.`, `Returns for Season 2: <b>${T.keystone()}</b> achievement at a Mythic+ rating of <b>3600</b>. Rewards the <b>"Venomous Contender"</b> title and the <b>${T.saddle()}</b>.`),
        L('Ajustes de dificultad en las mazmorras que se salen de la media.', 'Targeted tuning for dungeons that are difficulty outliers.'),
        L('<b>Frontal de la muerte:</b> corregido que «Murder in a Row» de Zaen Hojapena asignara a veces la zona segura a un barril tras el que no te escondías.', '<b>Murder Row:</b> fixed Zaen Bladesorrow\'s Murder in a Row sometimes assigning a safe spot to a barrel you were not hiding behind.'),
      ])
      + h(L('Logros', 'Achievements'))
      + ul([L(`<i>${T.snakeEyes()}</i>, <i>${T.snakeEater()}</i> y <i>${T.goodNight()}</i> ya no son necesarios para <i>${T.glory()}</i>.`, `<i>${T.snakeEyes()}</i>, <i>${T.snakeEater()}</i> and <i>${T.goodNight()}</i> are no longer required for <i>${T.glory()}</i>.`)])
      + h(L('Campaña', 'Campaign'))
      + p(L(`<b>${T.promise()}:</b> la derrota de Ula'tek despierta un terror ancestral. Mantén la paz entre Quel'Thalas y Zul'Aman, desciende a la Isla Serpenteante y planta cara a Kith'ix.`, `<b>${T.promise()}:</b> Ula'tek's defeat awakens an ancient terror. Keep the peace between Quel'Thalas and Zul'Aman, descend to the Coiled Isle and make a final stand against Kith'ix.`))],
    ['otros', L('Otros cambios', 'Other changes'), () =>
      h(L('JcJ', 'PvP'))
      + ul([L('Evocador de Preservación: Bendición de Merithra ahora es un hechizo Arcano y puede lanzarse con la Naturaleza bloqueada.', 'Preservation Evoker: Merithra\'s Blessing is now an Arcane spell and can be cast while locked out of Nature.')])
      + h(L('Presa', 'Prey'))
      + ul([
        L('Por debajo del rango 4: <b>4000</b> de progreso de aventura (Journey), un rango completo, por cacería, en lugar del progreso de las cuatro primeras cacerías semanales.', 'Below rank 4: <b>4000</b> Journey progress (a full rank) per hunt, replacing the progress from the first four hunts each week.'),
        L('Rangos 4 a 9: <b>2000</b> de progreso en cada una de las cuatro primeras cacerías de la semana.', 'Ranks 4–9: <b>2000</b> Journey progress from each of the first four hunts each week.'),
        L('Las almas afligidas y las almas atormentadas ya no se pueden usar durante una cacería activa; hay que usarlas entre cacerías.', 'Afflicted and Tormented Souls can no longer be used during an active hunt; use them between hunts.'),
      ])
      + h(L('Interfaz y accesibilidad', 'Interface and accessibility'))
      + ul([
        L('Coordenadas del jugador bajo el minimapa (se pueden desactivar y mostrar como enteros o decimales).', 'Player coordinates below the minimap (can be disabled and shown as integers or decimals).'),
        L('Opción para mostrar «hormigas» (borde animado) en los marcos de banda de las unidades que puedes disipar, y para hacer pulsar la opacidad de la superposición de disipación.', 'Option to show "ants" (animated border) on raid frames of units you can dispel, and to pulse the dispel overlay\'s opacity.'),
        L('Al hacer ping a una macro se muestra la información de #showtooltip.', 'Pinging a macro shows #showtooltip information.'),
        L('Nuevo ajuste «Aviso de salud» en Alertas de sonido en combate: un sonido en bucle bajo un porcentaje de vida que se intensifica al bajar.', 'New "Pulse Your Health" setting under Combat Audio Alerts: a looping sound below a health percentage that intensifies as health drops.'),
        L('Los ajustes de vista previa del Puesto comercial (como «Animación de combate») se conservan al cambiar de objeto.', 'Trading Post preview settings (such as "Combat Animation") persist when switching items.'),
      ])
      + h(L('Vivienda', 'Housing'))
      + ul([
        L('Modo de edición de plano: teclas para subir/bajar de planta (Re Pág / Av Pág por defecto) y acceso directo a la colección de planos.', 'Floorplan edit mode: floor up/down keybinds (Page Up/Page Down by default) and a shortcut to the Blueprint Collection.'),
        L('Los vecindarios públicos ya no reciben la misma iniciativa (Endeavor) dos veces seguidas.', 'Public Neighborhoods no longer receive the same Endeavor back-to-back.'),
        L('Planos: las escaleras exportan todas las salas conectadas en vertical; la lista de contenido excluye tintes ya incluidos en la decoración; descripciones y textos nuevos.', 'Blueprints: stairwells export all vertically connected rooms; the contents list excludes dyes already provided by decor; new tooltips and text.'),
        L('Se reduce el coste de artesanía de la decoración de las profesiones anteriores a Midnight.', 'Crafting costs for pre-Midnight profession decor are reduced.'),
      ])
      + h(L('Reputación de banda guerrera', 'Warband reputation'))
      + ul([L('Las reputaciones de Legion y Battle for Azeroth ahora se comparten con toda la banda guerrera.', 'Legion and Battle for Azeroth reputations are now shared across the warband.')])],
    ['ajustes', L('Ajustes y hotfixes', 'Tuning and hotfixes'), () =>
      h(L('Ajustes de clases · 27 de octubre', 'Class tuning · October 27'))
      + ul([
        L('<b>Feral:</b> todo el daño +5 %. <b>Restauración:</b> Verdancy +60 %, Regrowth +10 %, Improved Swiftmend +40 % (antes 30 %). Pensado para la sanación en mazmorras.', '<b>Feral:</b> all damage +5%. <b>Restoration:</b> Verdancy +60%, Regrowth +10%, Improved Swiftmend +40% (was 30%). Aimed at dungeon healing.'),
        L('<b>Puntería:</b> Trick Shots 85 % (antes 75 %), Explosive Shot +10 %, Volley +10 %.', '<b>Marksmanship:</b> Trick Shots 85% (was 75%), Explosive Shot +10%, Volley +10%.'),
        L('<b>Fuego:</b> todo el daño +5 %. <b>Aflicción:</b> Unstable Affliction +20 %. <b>Destrucción:</b> Rain of Fire +20 %.', '<b>Fire:</b> all damage +5%. <b>Affliction:</b> Unstable Affliction +20%. <b>Destruction:</b> Rain of Fire +20%.'),
        L('<b>Sutileza:</b> daño de habilidades −8 % y Trickster — Fazed 5 % (antes 7 %): Blizzard recorta gran parte de la compensación que recibió en el 12.1.5.', '<b>Subtlety:</b> ability damage −8% and Trickster — Fazed 5% (was 7%): Blizzard rolls back much of the compensation buff it received in 12.1.5.'),
        L(`<b>Tejedor de niebla:</b> corregido que ${sp(1280297, 'ability_monk_surgingmist', 'Línea de bruma')} no sanara a veces al objetivo con menos vida.`, `<b>Mistweaver:</b> fixed ${sp(1280297, 'ability_monk_surgingmist', 'Mistline')} sometimes not healing the lowest-health target.`),
      ])
      + h(L('JcJ · 27 de octubre', 'PvP · October 27'))
      + ul([
        L('<b>Caballero de la Muerte Profano:</b> San\'layn, Vampiric Strike −20 %. <b>Cazador de demonios Devorador:</b> Collapsing Star +20 %.', '<b>Unholy Death Knight:</b> San\'layn, Vampiric Strike −20%. <b>Devourer Demon Hunter:</b> Collapsing Star +20%.'),
        L('<b>Evocador de Preservación:</b> Chronal Dynamo +80 % a Living Flame sin lanzamiento instantáneo (antes 50 %); Reverberations: Verdant Embrace +80 % en 8 s (antes 40 %).', '<b>Preservation Evoker:</b> Chronal Dynamo +80% to non-instant Living Flame (was 50%); Reverberations: Verdant Embrace +80% over 8 s (was 40%).'),
        L('<b>Puntería:</b> Kill Shot +40 %; Deathblow con Aimed Shot 25 %; Dark Ranger: Black Arrow +40 %. <b>Fuego:</b> todo el daño −5 %. <b>Escarcha:</b> Frostfire, Isothermic Core (Meteor) +20 % y Duality (Pyroblast) +20 %.', '<b>Marksmanship:</b> Kill Shot +40%; Deathblow from Aimed Shot 25%; Dark Ranger: Black Arrow +40%. <b>Fire:</b> all damage −5%. <b>Frost:</b> Frostfire, Isothermic Core (Meteor) +20% and Duality (Pyroblast) +20%.'),
        L('<b>Tejedor de niebla:</b> Conduit of the Celestials, Celestial Conduit +35 % y Strength of the Black Ox +25 %. <b>Paladín Sagrado:</b> toda la sanación +5 % y Divine Favor −50 % de coste de Holy Light (antes 30 %).', '<b>Mistweaver:</b> Conduit of the Celestials, Celestial Conduit +35% and Strength of the Black Ox +25%. <b>Holy Paladin:</b> all healing +5% and Divine Favor −50% Holy Light cost (was 30%).'),
        L('<b>Sacerdote Sagrado:</b> Prayer of Healing +30 %, Prayerful Litany 75 % (antes 125 %); Archon: Resonant Energy 4 % por acumulación (antes 2 %), Empowered Surges 10 % (antes 5 %), Realized Potential 25 % (antes 20 %).', '<b>Holy Priest:</b> Prayer of Healing +30%, Prayerful Litany 75% (was 125%); Archon: Resonant Energy 4% per stack (was 2%), Empowered Surges 10% (was 5%), Realized Potential 25% (was 20%).'),
        L('<b>Asesinato:</b> Deathstalker, Deathstalker\'s Mark +20 %, Hunt Them Down +20 % y Darkest Night +15 % (antes 8 %). <b>Chamán de Restauración:</b> Healing Stream Totem y Stormstream Totem +20 %.', '<b>Assassination:</b> Deathstalker, Deathstalker\'s Mark +20%, Hunt Them Down +20% and Darkest Night +15% (was 8%). <b>Restoration Shaman:</b> Healing Stream Totem and Stormstream Totem +20%.'),
      ])
      + h(L('Banda: Abismo Venenoso (5 y 6 de noviembre)', 'Raid: Venomous Abyss (November 5 and 6)'))
      + ul([
        L('<b>Centinelas sepultados:</b> los charcos de Blood Venom son más pequeños en Heroica y Mítica y duran 2 minutos en Mítica (antes 5).', '<b>Entombed Sentinels:</b> Blood Venom pools are smaller on Heroic and Mythic and last 2 minutes on Mythic (was 5).'),
        L('<b>Los colmillos gemelos:</b> Visceral Burst −40 % en Mítica.', '<b>The Twin Fangs:</b> Visceral Burst −40% on Mythic.'),
        L('<b>El Altar en Espiral:</b> Axegrinder −20 % de velocidad (todas) y −20 % de daño (Mítica), Gloombomb −20 %, Venom Rupture −15 %, Malevolent Resonance −60 %, un Spiteful Soulcoiler menos con Spiritcackle en Mítica.', '<b>The Coiled Altar:</b> Axegrinder −20% speed (all) and −20% damage (Mythic), Gloombomb −20%, Venom Rupture −15%, Malevolent Resonance −60%, one fewer Spiteful Soulcoiler from Spiritcackle on Mythic.'),
        L('<b>Vashnik el Maligno:</b> Malignance −37 % de daño y 16 s de daño periódico en Mítica.', '<b>Vashnik the Malignant:</b> Malignance −37% damage and 16 s of periodic damage on Mythic.'),
        L('<b>Ula\'tek:</b> vida −15 % en Heroica; Unchecked Rage −61 %; Caustic Waves −32 % de impacto y hasta −89 % de daño periódico; Malice −63 % / −45 %; Virulent Spit y Falling Debris reducidos; menos huevos y objetivos; Noxious Splash y Putrid Membrane suavizados en Mítica.', '<b>Ula\'tek:</b> health −15% on Heroic; Unchecked Rage −61%; Caustic Waves −32% impact and up to −89% periodic damage; Malice −63% / −45%; Virulent Spit and Falling Debris reduced; fewer eggs and targets; Noxious Splash and Putrid Membrane softened on Mythic.'),
        L('Todo el detalle, jefe a jefe y desde el 12.1.0, está en <b>Cambios de Raids / Míticas</b> (botón del inicio).', 'The full boss-by-boss detail since 12.1.0 is in <b>Raid / Mythic+ changes</b> (home button).'),
      ])
      + h(L('Correcciones y otros cambios', 'Fixes and other changes'))
      + ul([
        L('<b>27 de octubre:</b> los escenarios del Laberinto que no daban crédito para la Gran Cámara ya lo dan; los tabardos ya no ocultan el conjunto de Rexxar.', '<b>October 27:</b> Labyrinth scenarios that were not granting Great Vault credit now do; tabards no longer hide the Rexxar armor set.'),
        L('<b>30 de octubre:</b> el origen del adorno de plantas de Nagrand que vende la botánica Gril\'ka ya lleva a su ubicación; ajustadas las capas Darkscale y Deepscale de Azshara (línea visible con ciertas luces); corregidos el objetivo adicional «Voices of Stone» del escenario «Bear\'s Burden» y los iconos de ligadura parpadeantes de «The Wandering».', '<b>October 30:</b> tracking the Nagrand plant decor sold by Botanist Gril\'ka now leads to her location; Azshara\'s Darkscale and Deepscale Cloaks adjusted (a line was visible under some lighting); fixed the «Voices of Stone» bonus objective in «Bear\'s Burden» and flickering Tether icons in «The Wandering».'),
        L('<b>5 de noviembre:</b> actualizados los nombres de varios PNJ tortollan; corregido que, en la variante «Basilisk Blitz» de Shadowguard Point, salir de la profundidad entre portales cambiara tu apariencia y te hiciera hostil a unidades amigas.', '<b>November 5:</b> updated the names of several Tortollan NPCs; fixed an issue in the «Basilisk Blitz» variant of Shadowguard Point where leaving the delve between waygates could change your appearance and make you hostile to friendly units.'),
      ])
      + h(L('Próximamente', 'Coming soon'))
      + ul([
        L('<b>Puesto comercial:</b> Blizzard ha anunciado correcciones para las monturas Hot Motocross Bunmover (ruedas que no giraban, solapamientos y problemas de asiento) antes del próximo mantenimiento semanal.', '<b>Trading Post:</b> Blizzard has announced fixes for the Hot Motocross Bunmover mounts (wheels not spinning, clipping and seating issues) before next week\'s maintenance.'),
        L('<b>Crossover Dungeons &amp; Dragons × Warcraft (17 de noviembre):</b> el paquete digital + físico da en el WoW Retail la montura <b>Black Malice</b>, la mascota <b>Eyestalker</b> y el juguete y adorno <b>Shifty Chest</b>. No llegan a WoW Classic ni a WoW: Forever.', '<b>Dungeons &amp; Dragons × Warcraft crossover (November 17):</b> the Digital + Physical bundle grants Retail WoW the <b>Black Malice</b> mount, the <b>Eyestalker</b> battle pet and the <b>Shifty Chest</b> toy and decor. They do not appear in WoW Classic or WoW: Forever.'),
      ])],
    ['fuentes', L('Fuentes', 'Sources'), () =>
      h(L('Fuentes oficiales de Blizzard', 'Official Blizzard sources'))
      + ul([
        `<a href="#" data-pn-link="${L(LINK_NEWS.replace('/en-us/', '/es-es/'), LINK_NEWS)}">${L('Anuncio: «Midnight\'s 12.1.5 Content Update Arrives October 13» (título original en inglés)', 'Announcement: "Midnight\'s 12.1.5 Content Update Arrives October 13"')}</a>`,
        `<a href="#" data-pn-link="${L(LINK_NOTES.replace('/en-us/', '/es-es/'), LINK_NOTES)}">${L('Notas de la actualización de contenido 12.1.5 (Midnight)', '12.1.5 Content Update Notes (Midnight)')}</a>`,
        `<a href="#" data-pn-link="https://worldofwarcraft.blizzard.com/en-us/news/24307310/hotfixes-november-5-2026">${L('Registro oficial de hotfixes de Blizzard (octubre y noviembre)', 'Official Blizzard hotfix log (October and November)')}</a>`,
        `<a href="#" data-pn-link="https://worldofwarcraft.blizzard.com/en-us/news/24296142">${L('Registro oficial de hotfixes de Blizzard (agosto a octubre)', 'Official Blizzard hotfix log (August to October)')}</a>`,
      ])
      + p(L('Los textos están resumidos y traducidos por WipeHub con los nombres oficiales en castellano de las notas de Blizzard y de Wowhead; los que no tienen traducción oficial confirmada se dejan en inglés. Pasa el ratón por los nombres subrayados para ver su descripción. La fecha del miércoles 14 en Europa viene de la prensa especializada. Si Blizzard cambia algo, manda su web.', 'Texts are summarised and translated by WipeHub; names without a confirmed official translation are kept in English. Hover the underlined names to see their description. The Wednesday 14 European date comes from the specialist press. If Blizzard changes anything, its website prevails.'))],
  ];


  // ------------------------------------------------------------ parche 12.1.7 «Ecos del Núcleo del Mundo» (en el RPP)
  // Fuentes: resumen oficial de Blizzard del 15 de octubre, guía de Wowhead, Warcraft Wiki, notas de desarrollo del RPP e Icy Veins.
  // Los nombres se traducen como en el artículo oficial en castellano; los que no tienen traducción confirmada llevan el original entre paréntesis.
  const LINK117 = {
    blizz: 'https://worldofwarcraft.blizzard.com/en-us/news/24310659/midnight-echoes-of-the-worldcore-overview',
    blizzEs: 'https://worldofwarcraft.blizzard.com/es-es/news/24310659/midnight-echoes-of-the-worldcore-overview',
    wowhead: 'https://www.wowhead.com/guide/midnight/patch-12-1-7-overview-features-activities-rewards',
    wowheadEs: 'https://www.wowhead.com/es/guide/midnight/patch-12-1-7-overview-features-activities-rewards',
    wiki: 'https://warcraft.wiki.gg/wiki/Patch_12.1.7',
    api: 'https://warcraft.wiki.gg/wiki/Patch_12.1.7/API_changes',
    icy: 'https://www.icy-veins.com/wow/news/patch-12-1-7-echoes-of-the-worldcore-ptr-development-notes/',
    mounts: 'https://www.wowsaga.com/news/all-new-mounts-coming-in-patch-1217-echoes-of-the-worldcore',
  };
  const note = (t) => `<p class="pn-note">${t}</p>`;
  // Habilidad con su icono oficial y tooltip (data-spell, igual que en Cambios de clase); si el hechizo solo existe en el RPP no tiene un tooltip útil y se muestra solo el icono
  const icn = (icon) => `<img class="cc-ic" src="${abilityIconUrl(icon)}" width="16" height="16" alt="" loading="lazy">`;
  const sp = (id, icon, name) => `<span class="cc-sp" data-spell="${id}">${icn(icon)}${name}</span>`;
  const ic = (icon, name) => `<span class="cc-nm">${icn(icon)}${name}</span>`;
  const lk = (u, t) => `<a href="#" data-pn-link="${u}">${t}</a>`;

  const SECTIONS117 = () => [
    ['resumen', L('Resumen', 'Overview'), () =>
      h(L('Ecos del Núcleo del Mundo', 'Echoes of the Worldcore'))
      + p(L('Próxima actualización de contenido de tamaño medio de Midnight. Devuelve a los jugadores a <b>Dornogal</b> para encontrar la forma de entrar en la <b>Vía del Núcleo</b> (Coreway) y, más allá, en el <b>Núcleo del Mundo</b> (Worldcore).', 'The next medium content update for Midnight. It sends players back to <b>Dornogal</b> to find a way into the <b>Coreway</b> and, beyond it, the <b>Worldcore</b>.'))
      + h(L('Estado y fecha', 'Status and date'))
      + ul([
        L('<b>En el RPP</b> desde el <b>15 de octubre de 2026</b>. Todo lo que se cuenta aquí es el contenido del RPP y puede cambiar antes de salir.', '<b>On the PTR</b> since <b>October 15, 2026</b>. Everything here is PTR content and may change before release.'),
        L('Blizzard <b>no ha anunciado fecha de salida</b>. La prensa especializada calcula diciembre de 2026, pero es solo una estimación.', 'Blizzard has <b>not announced a release date</b>. The specialist press estimates December 2026, but that is only a guess.'),
        L('Última actualización del RPP: <b>build 70668</b> (29 de octubre de 2026), tras la 70424 y la 70493. Han ido apareciendo escenarios, logros, monturas y adornos nuevos.', 'Latest PTR update: <b>build 70668</b> (October 29, 2026), after builds 70424 and 70493. New scenarios, achievements, mounts and decor keep appearing.'),
        L('Fin de semana de pruebas de <b>Historias de leyenda</b>: del <b>30 de octubre a las 10:00 PDT al 2 de noviembre a las 10:00 PDT</b> (hora del Pacífico de EE. UU.). Ya ha terminado.', 'Talebound test weekend: from <b>October 30 at 10:00 AM PDT to November 2 at 10:00 AM PDT</b>. It has now ended.'),
        L('Un parche ligero: el resumen oficial no incluye ninguna banda ni mazmorra nueva.', 'A light patch: the official overview lists no new raid or dungeon.'),
      ])
      + h(L('Qué trae', 'What it brings'))
      + ul([
        L('<b>Campaña «Regreso a Dornogal»</b> con Arator, Brinthe, Dagran y Brann.', '<b>"The Return to Dornogal" campaign</b> with Arator, Brinthe, Dagran and Brann.'),
        L('<b>Historias de leyenda</b> (Talebound): nuevo modo JcE de rol y acción con su propia moneda, la plata vinculada.', '<b>Talebound</b>: a new PvE action RPG mode with its own currency, Bound Silver.'),
        L('<b>Paseo por la historia</b> (Lorewalking): cuatro relatos sobre Jaina, Thrall, los titanes y Tyr.', '<b>Lorewalking</b>: four stories about Jaina, Thrall, the Titans and Tyr.'),
        L('<b>Líneas temporales turbulentas</b> (Turbulent Timeways): evento de ocho semanas con la montura Markeet del Infinito.', '<b>Turbulent Timeways</b>: an eight-week event with the Markeet of the Infinite mount.'),
        L('<b>Folio del Omnium</b>: dos motas más y dos runas nuevas.', '<b>Omnium Folio</b>: two more motes and two new runes.'),
        L('Mejoras de profesiones, hogares, interfaz y monturas nuevas (datos del RPP).', 'Profession, Housing and interface changes, and new mounts (PTR data).'),
      ])],
    ['campana', L('Campaña', 'Campaign'), () =>
      h(L('«Regreso a Dornogal»', '"The Return to Dornogal"'))
      + p(L('<b>Xal\'atath</b> ha entrado en el Núcleo del Mundo, y la única vía para llegar hasta él es la <b>Vía del Núcleo</b> dañada de Dornogal.', '<b>Xal\'atath</b> has breached the Worldcore, and the only route to it is the damaged <b>Coreway</b> in Dornogal.'))
      + ul([
        L('Ayudas a <b>Arator</b>, <b>Brinthe</b>, <b>Dagran</b> y <b>Brann</b> a averiguar cómo acceder a la Vía del Núcleo y al Núcleo del Mundo que hay más allá.', 'You help <b>Arator</b>, <b>Brinthe</b>, <b>Dagran</b> and <b>Brann</b> work out how to reach the Coreway and the Worldcore beyond it.'),
      ])
      + note(L('Blizzard no ha publicado más detalles de la historia.', 'Blizzard has not published further story details.'))],
    ['talebound', 'Talebound', () =>
      h(L('Historias de leyenda (Talebound)', 'Talebound'))
      + p(L('Nuevo <b>modo JcE de rol y acción</b>: sumérgete, solo o con amigos, en los relatos macabros de un misterioso <b>Narrador</b>. Hay enemigos y jefes temibles, acertijos, tesoros y reliquias.', 'A new <b>PvE action RPG mode</b>: dive into the dark tales of a mysterious <b>Storyteller</b>, solo or with friends. Expect fearsome enemies and bosses, puzzles, treasure and relics.'))
      + h(L('Monedas y recompensas', 'Currencies and rewards'))
      + ul([
        L('<b>Plata vinculada</b> (Bound Silver): moneda <b>de banda de guerra</b> que se consigue con misiones, logros y el progreso en los relatos del Narrador. Se gasta en cosméticos.', '<b>Bound Silver</b>: a <b>Warband-bound</b> currency earned from quests, achievements and progress in the Tales of the Storyteller. It is spent on cosmetics.'),
        L('<b>Ducados</b> (Ducats): se recogen durante las partidas y se convierten en los recursos necesarios para avanzar en el modo.', '<b>Ducats</b>: collected during runs and converted into the resources needed to progress through the mode.'),
        L('Al terminar un relato, vuelve a <b>Tumbaspina</b> (Quillgrave) para recibir plata vinculada y otras recompensas.', 'After finishing a tale, return to <b>Quillgrave</b> to claim Bound Silver and other rewards.'),
      ])
      + h(L('La tienda de Talebound', 'The Talebound store'))
      + ul([
        L('Se abre desde la <b>pantalla de selección de personaje</b>, desde el <b>menú del juego</b> o hablando con <b>Nib</b> en Tumbaspina.', 'Open it from the <b>character selection screen</b>, the <b>Game Menu</b>, or by talking to <b>Nib</b> in Quillgrave.'),
        L('Vende conjuntos de transfiguración, piezas sueltas y otros cosméticos.', 'It sells transmog sets, individual pieces and other cosmetics.'),
      ])
      + h(L('Recompensas mostradas por Blizzard', 'Rewards shown by Blizzard'))
      + ul([
        L('Conjunto de transfiguración <b>Witch Hunter\'s Shadow Attire</b>.', '<b>Witch Hunter\'s Shadow Attire</b> transmog set.'),
        L('Adorno de hogar <b>Quillgrave Storyteller\'s Lectern</b>.', '<b>Quillgrave Storyteller\'s Lectern</b> housing decor.'),
        L('Montura <b>Shadowbound Storybook</b>.', '<b>Shadowbound Storybook</b> mount.'),
        L('Adorno de hogar <b>Quillgrave Talebound Shadowtome</b>.', '<b>Quillgrave Talebound Shadowtome</b> housing decor.'),
      ])
      + h(L('Relatos y escenarios', 'Tales and scenarios'))
      + ul([
        L('Cuatro relatos: <b>Darkhaven</b>, <b>Greenthistle Wood</b>, <b>Greywake’s Expedition</b> y <b>Court of Night</b>.', 'Four tales: <b>Darkhaven</b>, <b>Greenthistle Wood</b>, <b>Greywake’s Expedition</b> and <b>Court of Night</b>.'),
        L('Escenarios de la build 70493: <b>01 · Torrential Power</b> (limpiar los santuarios de los naga), <b>01 · Wilderness Reclaimed</b> (las brujas y el gigante), <b>02 · Defy the Abyss</b> (termina con el <b>Hadal Tyrant</b>), <b>03 · Sinister Forces</b> (limpiar santuarios arcanos para invocar al <b>Heraldo</b>) y <b>04 · Oppose the Unknown</b> (el <b>Herald from Beyond</b>).', 'Scenarios in build 70493: <b>01: Torrential Power</b> (clear the naga sanctums), <b>01: Wilderness Reclaimed</b> (the Witches and the Giant), <b>02: Defy the Abyss</b> (ends with the <b>Hadal Tyrant</b>), <b>03: Sinister Forces</b> (clear eldritch sanctums to summon the <b>Herald</b>) and <b>04: Oppose the Unknown</b> (the <b>Herald from Beyond</b>).'),
        L('Jefes: Tilywth (la reina de las hadas), Mobog, Zzyg’th, Chathoa, Konrad von Sonnesheim, Maernok, Alexandre Dozsenc, Ylska Vilefang y Granny Greenthumb.', 'Bosses: Tilywth (the Fairy Queen), Mobog, Zzyg’th, Chathoa, Konrad von Sonnesheim, Maernok, Alexandre Dozsenc, Ylska Vilefang and Granny Greenthumb.'),
      ])
      + h(L('Novedades de la build 70668', 'New in build 70668'))
      + ul([
        L('Nuevo escenario <b>03 · Sanguine Onslaught</b>; el que era el 03 pasa a ser el <b>04 · Unholy Abomination</b>.', 'New scenario <b>03 · Sanguine Onslaught</b>; the former 03 becomes <b>04 · Unholy Abomination</b>.'),
        L('Cada <b>Enfrentamiento final</b> suma logros por dificultad (<b>Veterano</b>, <b>Heroica</b> y <b>Mítica</b>) en tres versiones: la general, <b>«Conclusion»</b> y <b>«Comprehensive»</b>; y <b>The Final Confrontation</b> como logro de jefe de Talebound.', 'Each <b>Final Confrontation</b> adds achievements per difficulty (<b>Veteran</b>, <b>Heroic</b> and <b>Mythic</b>) in three versions: the base one, <b>Conclusion</b> and <b>Comprehensive</b>; and <b>The Final Confrontation</b> as a Talebound boss achievement.'),
        L('Un logro por empezar cada nivel de relato: <b>It\'s Just a Normal Tale</b>, <b>Starting Down a Veteran\'s Tale</b>, <b>Stepping up to a Heroic Tale</b> y <b>Confronting a Mythic Tale</b>; además de <b>Delving into a Tale</b>.', 'An achievement for starting each tale level: <b>It\'s Just a Normal Tale</b>, <b>Starting Down a Veteran\'s Tale</b>, <b>Stepping up to a Heroic Tale</b> and <b>Confronting a Mythic Tale</b>; plus <b>Delving into a Tale</b>.'),
        L('Cinco logros «Traveler\'s» (<b>Cache</b>, <b>Coin</b>, <b>Fortune</b>, <b>Purse</b> y <b>Trove</b>) con sus versiones «Exchanged», y <b>Tapping at the Trader\'s Door</b>.', 'Five “Traveler\'s” achievements (<b>Cache</b>, <b>Coin</b>, <b>Fortune</b>, <b>Purse</b> and <b>Trove</b>) with their “Exchanged” versions, and <b>Tapping at the Trader\'s Door</b>.'),
        L('Logros de los acertijos: <b>The Sanguine Puzzlemaster\'s Reward</b>, <b>The Hexed Puzzlemaster\'s Reward</b>, <b>The Fae Puzzlemaster\'s Reward</b>, <b>The Eldrich Puzzlemaster\'s Reward</b>, <b>The Tale of the Puzzle Master Rewarded</b> y <b>A Puzzling Tale Reward</b>.', 'Puzzle achievements: <b>The Sanguine Puzzlemaster\'s Reward</b>, <b>The Hexed Puzzlemaster\'s Reward</b>, <b>The Fae Puzzlemaster\'s Reward</b>, <b>The Eldrich Puzzlemaster\'s Reward</b>, <b>The Tale of the Puzzle Master Rewarded</b> and <b>A Puzzling Tale Reward</b>.'),
        L('Logros por completar cada capítulo: <b>The Antiquarian\'s Chapter Complete</b>, <b>The Arcanist\'s Account Complete</b>, <b>The Outfitter\'s Story Complete</b> y los de <b>The Inquisitor / Slayer / Witch and the Scribe Complete</b>; además <b>Stories Shared</b> y <b>The Tale Complete</b>.', 'Achievements for completing each chapter: <b>The Antiquarian\'s Chapter Complete</b>, <b>The Arcanist\'s Account Complete</b>, <b>The Outfitter\'s Story Complete</b> and the <b>The Inquisitor / Slayer / Witch and the Scribe Complete</b> ones; plus <b>Stories Shared</b> and <b>The Tale Complete</b>.'),
      ])
      + note(L('Blizzard todavía no ha traducido estos logros: los nombres se muestran en inglés para que puedas buscarlos en el juego.', 'These achievements are listed under their PTR names.'))
      + h(L('Personajes', 'Characters'))
      + ul([
        L('Los datos del RPP incluyen la clase <b>Traveler</b> con tres especializaciones, <b>Inquisitor</b>, <b>Slayer</b> y <b>Witch</b>, con habilidades propias como Brewing Storm, Explosive Shot, Purify, Shrapnel Round y Slash.', 'PTR data includes the <b>Traveler</b> class with three specializations, <b>Inquisitor</b>, <b>Slayer</b> and <b>Witch</b>, with their own abilities such as Brewing Storm, Explosive Shot, Purify, Shrapnel Round and Slash.'),
        L('Un texto indica que hay que <b>crear un personaje</b> de Talebound para ver sus recompensas, y que el progreso de los relatos se guarda y se retoma en el <b>Libro de las Sombras</b> (Book of Shadows).', 'A text says you must <b>create a Talebound character</b> to see its rewards, and that tale progress is saved and can be resumed at the <b>Book of Shadows</b>.'),
      ])
      + h(L('Logros y títulos', 'Achievements and titles'))
      + ul([
        L('Logros por cada jefe en dificultad <b>Heroica</b>, <b>Mítica</b>, <b>Veterano</b> y cualquiera. Cada Enfrentamiento final tiene versiones <b>Inquisitor</b>, <b>Slayer</b> y <b>Witch</b>.', 'Achievements for each boss on <b>Heroic</b>, <b>Mythic</b>, <b>Veteran</b> and any difficulty. Each Final Confrontation has <b>Inquisitor</b>, <b>Slayer</b> and <b>Witch</b> versions.'),
        L('Logros por completar cada relato y «The Complete Tale» (los cuatro relatos y el Enfrentamiento final), por acertijos, por historias oídas, por reliquias y fórmulas, y cinco de <b>1.000 a 5.000 ducados</b>.', 'Achievements for completing each tale and “The Complete Tale” (all four tales plus the Final Confrontation), for puzzles, for stories heard, for relics and formulas, and five for earning <b>1,000 to 5,000 Ducats</b>.'),
        L('La mayoría da <b>20 de plata vinculada</b>, que se cambia con <b>Nib</b> en Tumbaspina por cosméticos válidos para toda la cuenta.', 'Most grant <b>20 Bound Silver</b>, which can be traded to <b>Nib</b> in Quillgrave for account-wide cosmetics.'),
        L('Títulos con los Enfrentamientos finales Míticos: <b>of the Sacred Flame</b> (Inquisitor), <b>Monster Hunter</b> (Slayer) y <b>of the Crooked Path</b> (Witch). El título <b>Listener</b> llega con «Stories to Share».', 'Titles from the Mythic Final Confrontations: <b>of the Sacred Flame</b> (Inquisitor), <b>Monster Hunter</b> (Slayer) and <b>of the Crooked Path</b> (Witch). The <b>Listener</b> title comes from “Stories to Share”.'),
      ])
      + note(L('Todo son datos de las builds 70424, 70493 y 70668 del RPP: nombres y logros pueden cambiar antes de salir.', 'Everything comes from PTR builds 70424, 70493 and 70668: names and achievements may change before release.'))],
    ['paseo', L('Paseo por la historia', 'Lorewalking'), () =>
      h(L('Paseo por la historia (Lorewalking)', 'Lorewalking'))
      + p(L('Habla con <b>Li Li Cerveza de Trueno</b> (Apprentice Lorewalker Li Li Stormstout) en <b>Ventormenta</b> u <b>Orgrimmar</b>. Disponible desde el <b>nivel 10</b>.', 'Speak with <b>Apprentice Lorewalker Li Li Stormstout</b> in <b>Stormwind</b> or <b>Orgrimmar</b>. Available from <b>level 10</b>.'))
      + h(L('Cuatro relatos', 'Four storylines'))
      + ul(['<b>Jaina</b>', '<b>Thrall</b>', L('<b>Los titanes</b> (Titans)', '<b>The Titans</b>'), '<b>Tyr</b>'])
      + h(L('Cómo funciona', 'How it works'))
      + ul([
        L('Los relatos son <b>repetibles</b>.', 'The stories are <b>repeatable</b>.'),
        L('Mientras haces Paseo por la historia no puedes aceptar ni avanzar otras misiones, pero puedes <b>pausar y reanudar</b>.', 'While Lorewalking you cannot take or progress other quests, but you can <b>pause and resume</b>.'),
        L('Si empiezas otro relato sin terminar el actual, <b>se pierde el progreso</b> del primero.', 'If you start a different story before finishing the current one, <b>its progress is reset</b>.'),
        L('El botón <b>«Hacer una pregunta»</b> está bajo el minimapa; la <b>X</b> sirve para salir en cualquier momento.', 'The <b>"Ask a Question"</b> button is below the minimap; use the <b>X</b> to exit at any time.'),
        L('Cada relato (Jaina, Thrall, Titans y Tyr) tiene su logro, con un <b>adorno de hogar</b> de recompensa.', 'Each story (Jaina, Thrall, Titans and Tyr) has its own achievement, with a <b>housing decor</b> reward.'),
      ])],
    ['timeways', L('Líneas temporales', 'Timeways'), () =>
      h(L('Líneas temporales turbulentas (Turbulent Timeways)', 'Turbulent Timeways'))
      + p(L('Vuelve el evento: el Vuelo Bronce informa de perturbaciones en las líneas temporales. Dura <b>ocho semanas</b> desde la salida del parche.', 'The event returns: the Bronze Dragonflight reports disturbances in the Timeways. It lasts <b>eight weeks</b> from the patch\'s launch.'))
      + h(L('Recompensa principal', 'Main reward'))
      + ul([
        L('Logro <b>«Master of the Turbulent Timeways VI»</b>: mantén <b>Mastery of the Timeways</b> durante cuatro semanas cualesquiera del evento y consigue la montura de vuelo dinámico <b>Markeet del Infinito</b> (Markeet of the Infinite).', 'Achievement <b>"Master of the Turbulent Timeways VI"</b>: keep <b>Mastery of the Timeways</b> for any four weeks of the event to earn the <b>Markeet of the Infinite</b> Skyriding mount.'),
      ])
      + h(L('Bonificaciones de Paseo en el tiempo', 'Timewalking bonuses'))
      + ul([
        L('Cada mazmorra de Paseo en el tiempo completada da <b>Knowledge of the Timeways</b>: un beneficio acumulable de <b>+5 %</b>.', 'Each Timewalking dungeon completed grants <b>Knowledge of the Timeways</b>: a stacking <b>5%</b> buff.'),
        L('Tras <b>cuatro mazmorras</b> se convierte en <b>Mastery of the Timeways</b>: <b>+30 % de experiencia</b> mientras dure.', 'After <b>four dungeons</b> it upgrades to <b>Mastery of the Timeways</b>: <b>30% experience gain</b> for its duration.'),
        L('Nuevos <b>adornos de hogar</b> en los vendedores de Paseo en el tiempo.', 'New <b>housing decor</b> items at the Timewalking vendors.'),
        L('Por tiempo limitado, las misiones de Paseo en el tiempo del <b>archimago Aethas Sunreaver</b> en Ciudad de Lunargenta dan más recompensas, entre ellas un nuevo <b>Cache of Quel\'Thalas Treasures</b> de nivel Heroico.', 'For a limited time, <b>Archmage Aethas Sunreaver</b>\'s Timewalking quests in Silvermoon City give increased rewards, including a new Heroic-level <b>Cache of Quel\'Thalas Treasures</b>.'),
      ])],
    ['omnium', L('Folio del Omnium', 'Omnium Folio'), () =>
      h(L('El Folio del Omnium se amplía', 'The Omnium Folio expands'))
      + ul([L('Puedes conseguir <b>dos Motas de investigación omnial</b> más (Motes of Omnial Inquiry).', 'You can earn <b>two additional Motes of Omnial Inquiry</b>.')])
      + h(L('Dos runas nuevas', 'Two new runes'))
      + h4(L('Runa de Potenciación (Rune of Empowerment)', 'Rune of Empowerment'))
      + ul([L('Tu runa de <b>Critical Power</b>, <b>Burning Haste</b>, <b>Masterful Cunning</b> o <b>Versatile Warrior</b> otorga un <b>20 % más</b> de su característica.', 'Your Rune of <b>Critical Power</b>, <b>Burning Haste</b>, <b>Masterful Cunning</b> or <b>Versatile Warrior</b> grants <b>20% more</b> of its stat.')])
      + h4(L('Runa de Masa crítica (Rune of Critical Mass)', 'Rune of Critical Mass'))
      + ul([
        L('Con la <b>Rune of Void-Touched Orbs</b> como runa central: un golpe de daño o sanación puede invocar <b>3 orbes del Vacío</b> que dañan a los enemigos o curan a los aliados en <b>5 m</b>.', 'With the <b>Rune of Void-Touched Orbs</b> as your Core Rune: a damage or healing hit can call down <b>3 Void orbs</b> that damage enemies or heal allies within <b>5 yards</b>.'),
        L('Con la <b>Rune of Unleashed Fire</b> como runa central: un golpe puede provocar una explosión de <b>daño de Fuego</b> repartido entre los enemigos, o de sanación repartida entre los aliados, en <b>10 m</b>.', 'With the <b>Rune of Unleashed Fire</b> as your Core Rune: a hit can blast the area with <b>Fire</b> damage split among enemies, or healing split among allies, within <b>10 yards</b>.'),
      ])
      + h(L('Más información', 'Learn more'))
      + p(L('El lore del Omnium Sunstrider lo cuentan el <b>magister Umbric</b>, el <b>sumo magister Rommath</b> y el <b>custodio Veldharin</b> en el Lycaneum de la <b>Isla de Quel\'Danas</b>.', 'Learn about the Sunstrider Omnium from <b>Magister Umbric</b>, <b>Grand Magister Rommath</b> or <b>Custodian Veldharin</b> in the Lycaneum on the <b>Isle of Quel\'Danas</b>.'))],
    ['monturas', L('Monturas', 'Mounts'), () =>
      h(L('Monturas nuevas', 'New mounts'))
      + p(L('Datos del RPP: se han encontrado <b>17 monturas</b> en los archivos del juego. Pueden cambiar antes de salir.', 'PTR data: <b>17 mounts</b> have been found in the game files. They may change before release.'))
      + ul([
        L('<b>Markeet of the Infinite</b> — logro «Master of the Turbulent Timeways VI» (Líneas temporales turbulentas).', '<b>Markeet of the Infinite</b> — "Master of the Turbulent Timeways VI" achievement (Turbulent Timeways).'),
        L('<b>Shadowbound Storybook</b> — recompensa de Talebound.', '<b>Shadowbound Storybook</b> — Talebound reward.'),
        L('<b>Winterrrgl\'s Pine-Powered Candy Cane Contraption</b> — la suelta el Greench durante el Festival de Invierno; no se vende.', '<b>Winterrrgl\'s Pine-Powered Candy Cane Contraption</b> — dropped by the Greench during Feast of Winter Veil; not sold by a vendor.'),
        L('<b>Stone-Carved Crusher</b> y <b>Autumn Dream Jumper</b> — recompensas de Talebound.', '<b>Stone-Carved Crusher</b> and <b>Autumn Dream Jumper</b> — Talebound rewards.'),
        L('<b>Ashen Dreadglider</b> — montura de vuelo dinámico (nivel 30).', '<b>Ashen Dreadglider</b> — a skyriding mount (level 30).'),
        L('<b>The Watcher in the Waves</b> — Puesto comercial (Trading Post); todavía no se sabe de qué tipo es.', '<b>The Watcher in the Waves</b> — Trading Post; its type is not known yet.'),
        L('Cuatro stegodontes del Puesto comercial: <b>Attuned Ancient</b>, <b>Crackling Ancient</b>, <b>Rumbling Jungle</b> y <b>Thundering Primal</b>.', 'Four Trading Post stegodons: <b>Attuned Ancient</b>, <b>Crackling Ancient</b>, <b>Rumbling Jungle</b> and <b>Thundering Primal</b>.'),
      ])
      + h(L('Novedades de la build 70668', 'New in build 70668'))
      + ul([
        L(`${ic('inv_gilneashorsemount', 'Ambermill Traveler\'s Rouncey')}: montura terrestre que cambia de nombre; antes <b>«Destrero cobrizo gilneano»</b> (Gilnean Copper Charger).`, `${ic('inv_gilneashorsemount', 'Ambermill Traveler\'s Rouncey')}: ground mount renamed from <b>Gilnean Copper Charger</b>.`),
        L(`${ic('inv_darkmoonhorsemount_black', 'Lost Mare of the Maddening Faire')}: montura terrestre que cambia de nombre; antes <b>«Destrero de la Luna Negra de medianoche»</b> (Midnight Darkmoon Charger).`, `${ic('inv_darkmoonhorsemount_black', 'Lost Mare of the Maddening Faire')}: ground mount renamed from <b>Midnight Darkmoon Charger</b>.`),
        L(`${ic('8519836', 'Autumn Dream Jumper')}: montura terrestre.`, `${ic('8519836', 'Autumn Dream Jumper')}: ground mount.`),
        L(`${ic('inv_fox2_black', 'Shadowpaw Wood Watcher')}: montura de vuelo dinámico (Skyriding).`, `${ic('inv_fox2_black', 'Shadowpaw Wood Watcher')}: skyriding mount.`),
        L(`${sp(1305612, '7933423', 'Grrloc gigante')} (montura terrestre) y ${sp(1314189, '7958551', 'Planeapavor de ceniza')} (vuelo dinámico): aparecen entre los cambios del RPP con origen <b>Tienda del juego</b>.`, `${sp(1305612, '7933423', 'Giant Grrloc')} (ground mount) and ${sp(1314189, '7958551', 'Ashen Dreadglider')} (skyriding): listed in the PTR changes with the <b>In-Game Shop</b> as their source.`),
      ])
      + h(L('Otras monturas encontradas', 'Other mounts found'))
      + p('Woodland Wanderer · Faith-Cursed · Gilnean Charger · Lost Mare · Night Court · Shadowpaw Wood Watcher · Giant Grrloc · Reanimated Skeletal Raptor')
      + note(L('De estas últimas todavía no se sabe cómo se consiguen.', 'How to obtain these is not known yet.'))
      + h(L('Mascotas', 'Pets'))
      + p('Bump · Lump · Grump · Frump (' + L('crías de stegodonte', 'Stegodon pets') + ') · Petite Snow Buddy · Slayer’s Faithful Tracker · Inquisitor’s Messenger · Hex-Cursed Manifestation · Zyg’ee')
      + h(L('Equipo y objetos', 'Gear and items'))
      + ul([
        L('<b>Slayer’s Top Hat</b> (cabeza) y tres objetos de mano izquierda: <b>Lost Wood-Witch’s Focus</b>, <b>Vestel’s Thurible</b> y <b>Ancient Bone Fetish</b>.', '<b>Slayer’s Top Hat</b> (head) and three off-hand items: <b>Lost Wood-Witch’s Focus</b>, <b>Vestel’s Thurible</b> and <b>Ancient Bone Fetish</b>.'),
        L('<b>Throw Bow</b>: objeto de basura del Festival de Invierno.', '<b>Throw Bow</b>: a Feast of Winter Veil junk item.'),
      ])],
    ['otros', L('Otros cambios', 'Other changes'), () =>
      h(L('Profesiones', 'Professions'))
      + ul([
        L('<b>Herboristería de Midnight:</b> la especialización <b>Bountiful Harvests</b> da más <b>Destreza</b> (Deftness).', '<b>Midnight Herbalism:</b> the <b>Bountiful Harvests</b> specialization grants more <b>Deftness</b>.'),
        L('<b>Minería de Midnight:</b> la especialización <b>Plentiful Ores</b> da más <b>Destreza</b> (Deftness).', '<b>Midnight Mining:</b> the <b>Plentiful Ores</b> specialization grants more <b>Deftness</b>.'),
        L('Nuevos objetos colocables en casa: <b>Arcanist’s Research Board</b> (Inscripción) y <b>Round Nomad’s Cushion</b> (Sastrería). En <b>Pesca</b>, el tótem <b>Tokka’s Multi-Ward</b> da caminar sobre el agua y otros beneficios.', 'New placeable house items: <b>Arcanist’s Research Board</b> (Inscription) and <b>Round Nomad’s Cushion</b> (Tailoring). In <b>Fishing</b>, the <b>Tokka’s Multi-Ward</b> totem grants water walking and other boons.'),
      ])
      + h('Housing')
      + ul([
        L('Corregido que los adornos giraran al convertir los datos de una casa al formato nuevo.', 'Fixed decor rotating when house data is converted to the new format.'),
        L('Se han encontrado <b>163 adornos</b> nuevos en la build 70424 (algunos podrían no llegar al 12.1.7) y <b>8 más</b> en la 70493 (datos del RPP).', '<b>163 new decor items</b> were found in build 70424 (some may not reach 12.1.7) and <b>8 more</b> in build 70493 (PTR data).'),
        L('Nuevos adornos de hogar en los vendedores de Paseo en el tiempo y en la tienda de Talebound (ver las secciones correspondientes).', 'New housing decor at the Timewalking vendors and in the Talebound store (see the matching sections).'),
        L('Un nuevo <b>campamento de banda de guerra</b> aparece en los archivos del juego.', 'A new <b>Warband campsite</b> shows up in the game files.'),
        L(`Dos objetos nuevos ligados a la banda de guerra: ${ic('8262637', 'Cozy Cabin Burrow')} e ${ic('8262637', 'Icy Cabin Burrow')} (build 70668).`, `Two new Warband-bound items: ${ic('8262637', 'Cozy Cabin Burrow')} and ${ic('8262637', 'Icy Cabin Burrow')} (build 70668).`),
        L('Nuevo conjunto de adornos <b>Grimtide</b> (más de veinte piezas): librería, candelabro, lámpara de araña, mesa de centro, sofá, silla de comedor, ancla de exhibición, velas encantadas (pequeña, normal y alta), trampilla, piano de cola, mesa grande, alfombras, aplique, mesa auxiliar, tentáculo y ventanas de día y de noche.', 'New <b>Grimtide</b> decor set (over twenty pieces): bookcase, candelabra, chandelier, coffee table, couch, dining chair, display anchor, enchanted candles (small, regular and tall), floor hatch, grand piano, grand table, rugs, sconce, side table, tentacle and daytime and nighttime windows.'),
        L('<b>Adornos de la Liga de Exploradores</b> (Explorers\' League): recompensa de renombre de nivel <b>22</b> de la Expedición Dragonscale, con cantimplora, cuerda enrollada, globo terráqueo, lente de inspección y cajas de suministros.', '<b>Explorers\' League decor</b>: a level <b>22</b> Dragonscale Expedition renown reward, with a canteen, coiled rope, globe, inspection lens and supply crates.'),
        L('Nuevos conjuntos de transfiguración: <b>Ambermill Traveler Attire</b>, <b>Faith-Cursed Vestments</b>, <b>Dockside / Drustvar / Seabound Smuggler\'s Attire</b>, <b>Village Patrolman\'s Regalia</b>, seis chalecos <b>Outfitter\'s</b> (otoño, gris rosado, formal, azul marino, roble y vino quemado) y los de ropa común <b>Traveler\'s</b> y <b>Villager\'s</b>.', 'New transmog ensembles: <b>Ambermill Traveler Attire</b>, <b>Faith-Cursed Vestments</b>, <b>Dockside / Drustvar / Seabound Smuggler\'s Attire</b>, <b>Village Patrolman\'s Regalia</b>, six <b>Outfitter\'s</b> vests (Autumn, Blush-Grey, Formal, Navy, Oak and Wine-Charred) and the <b>Traveler\'s</b> and <b>Villager\'s</b> commonwear sets.'),
      ])
      + h(L('Festival de Invierno', 'Feast of Winter Veil'))
      + ul([
        L('El Festival de Invierno dura del <b>15 de diciembre de 2026 al 2 de enero de 2027</b>.', 'The Feast of Winter Veil runs from <b>December 15, 2026 to January 2, 2027</b>.'),
        L('<b>24 adornos</b> navideños en los vendedores (Jolli Maxiboom, Holly Twinklebright y los de Orgrimmar y Forjaz) y otros 19 que podrían llegar por eventos promocionales o la tienda, sin confirmar.', '<b>24 Winter Veil decor items</b> at vendors (Jolli Maxiboom, Holly Twinklebright and those in Orgrimmar and Ironforge) and another 19 that may come from promotional events or the shop, unconfirmed.'),
        L('Seis logros nuevos de 10 puntos: <b>Bells Will Be Ringing</b>, <b>Candy Cane Brigade</b> (entregar 12 regalos en los barrios de hogar), <b>Season’s Beatings</b>, <b>Sockin’ Around the Winter Veil Tree</b> (empujar a 100 atacantes del árbol), <b>That’s Not For You</b> y <b>Tree-fense</b> (completar la defensa del árbol del barrio).', 'Six new 10-point achievements: <b>Bells Will Be Ringing</b>, <b>Candy Cane Brigade</b> (deliver 12 gifts in housing neighborhoods), <b>Season’s Beatings</b>, <b>Sockin’ Around the Winter Veil Tree</b> (punt 100 tree attackers), <b>That’s Not For You</b> and <b>Tree-fense</b> (complete the neighborhood tree defense).'),
        L('La montura de Winterrrgl (ver Monturas) y el <b>Throw Bow</b>, que un logro pide usar cinco veces.', 'Winterrrgl’s mount (see Mounts) and the <b>Throw Bow</b>, which an achievement asks you to use five times.'),
      ])
      + h(L('Logros y desafíos', 'Achievements and feats'))
      + ul([
        L('<b>Madrigueras:</b> derrotar a <b>Kindo’jan</b> en nivel 11 sin otros jugadores en el grupo durante la Temporada 2 de Midnight da «Loa-Blessed Wayfarer»; la versión «Fabled» da un título.', '<b>Delves:</b> defeating <b>Kindo’jan</b> on Tier 11 with no other party members during Midnight Season 2 grants “Loa-Blessed Wayfarer”; a Fabled version grants a title.'),
        L('<b>Through the Looking Glass:</b> completar las Visiones horribles revisitadas en una sola visita en solitario con las 8 Máscaras sin rostro activas da el título «The Mad». Hay que haberlo hecho antes de Midnight.', '<b>Through the Looking Glass:</b> completing the Revisited Horrific Visions in a single solo visit with all 8 Faceless Masks active grants the title “The Mad”. It must have been completed before Midnight.'),
        L('Campaña: logro <b>Coreway Advance</b> (10 puntos, recompensa por confirmar). Asaltos del Vacío: <b>Core Logic</b> y <b>The Power of Stories</b>.', 'Campaign: <b>Coreway Advance</b> achievement (10 points, reward to be confirmed). Void Assaults: <b>Core Logic</b> and <b>The Power of Stories</b>.'),
      ])
      + h(L('Interfaz', 'Interface'))
      + ul([
        L('Aparecen textos para elegir el servicio de <b>chat de voz</b> (Discord o el clásico), el <b>modo de edición de la HUD</b> y los atajos de la <b>barra en cruz</b> del mando.', 'Texts appear for choosing the <b>voice chat</b> service (Discord or the legacy one), the <b>HUD edit mode</b> and the gamepad <b>crossbar</b> bindings.'),
        L('Un grupo solo puede entrar en una localización si el <b>líder del grupo</b> ya está dentro.', 'A party can enter a location only if the <b>party leader</b> is already inside.'),
        L('<b>Modo de edición:</b> nueva opción para poder hacer clic a través de la <b>Pantalla de recursos personales</b> (Personal Resource Display).', '<b>Edit Mode:</b> new option to click through the <b>Personal Resource Display</b>.'),
        L('<b>Transfiguración:</b> un texto aclara que el <b>Conjunto 1</b> (Outfit 1) es el que se muestra en la web de la Armería de WoW.', '<b>Transmog:</b> a tooltip clarifies that <b>Outfit 1</b> is the one shown on the WoW Armory website.'),
      ])
      + h(L('Objetos y consumibles', 'Items and consumables'))
      + ul([
        L('Se han encontrado <b>cuatro pociones nuevas</b> que dan un <b>30 % de experiencia adicional</b> (datos del RPP; todavía no se sabe cómo se consiguen).', '<b>Four new potions</b> granting <b>30% bonus experience</b> have been found (PTR data; how to obtain them is not known yet).'),
        L('Nuevos <b>modelos de capa y de arma</b> en los archivos del RPP, además del conjunto <b>Witch Hunter</b> (ver Talebound).', 'New <b>cape and weapon models</b> in the PTR files, along with the <b>Witch Hunter</b> set (see Talebound).'),
      ])
      + h(L('Habilidades de jefes', 'Boss abilities'))
      + p(L('La build 70668 toca habilidades de la <b>sabia de pergaminos Iku</b> y del <b>contramaestre Nama</b>; Blizzard no ha explicado qué cambia:', 'Build 70668 touches abilities of <b>Scrollsage Iku</b> and <b>Boatswain Nama</b>; Blizzard has not said what changes:'))
      + ul([
        `${sp(1294334, 'spell_arcane_blink', 'Nova de traslación')} · ${sp(1295893, 'spell_fire_firebolt02', 'Salva de Pirofrío')} · ${sp(1286922, 'ability_mage_frostfirebolt', 'Llamas ligadas al hielo')} · ${sp(1310616, 'spell_frost_iceshard', 'Fragmentos trituradores')}`,
        `${sp(1296133, 'spell_sandexplosion', 'Batacazo potente')} · ${sp(1297644, 'spell_winston_bubble', 'Frente unido')} · ${ic('spell_holy_blessingofprotection', 'Fervid Onslaught')} · ${ic('inv_ability_holyfire_wave', 'Righteous Path')}`,
      ])
      + h(L('Para creadores de addons', 'For addon authors'))
      + ul([
        L('Los GUID dejan de exponer el ID del servidor y el de aparición (se ofuscan).', 'GUIDs no longer expose the server ID and spawn ID (they are obfuscated).'),
        L('Las directivas del .toc ya no expanden variables como <code>[Game]</code> o <code>[Family]</code>.', 'TOC directives no longer expand variables such as <code>[Game]</code> or <code>[Family]</code>.'),
      ])],
    ['fuentes', L('Fuentes', 'Sources'), () =>
      h(L('Fuentes', 'Sources'))
      + ul([
        lk(L(LINK117.blizzEs, LINK117.blizz), L('Blizzard: «Midnight: resumen de Ecos del Núcleo del Mundo»', 'Blizzard: "Midnight: Echoes of the Worldcore Overview"')),
        lk(L(LINK117.wowheadEs, LINK117.wowhead), L('Wowhead: guía del parche 12.1.7 (características, actividades y recompensas)', 'Wowhead: Patch 12.1.7 overview guide (features, activities and rewards)')),
        lk(LINK117.wiki, 'Warcraft Wiki: Patch 12.1.7'),
        lk(LINK117.api, 'Warcraft Wiki: Patch 12.1.7/API changes'),
        lk(LINK117.icy, L('Icy Veins: notas de desarrollo del RPP del 12.1.7', 'Icy Veins: 12.1.7 PTR development notes')),
        lk('https://www.mmo-champion.com/content/14657-Patch-12-1-7-PTR-Build-70668', L('MMO-Champion: RPP del 12.1.7, build 70668', 'MMO-Champion: Patch 12.1.7 PTR build 70668')),
        lk('https://www.mmo-champion.com/content/14636-Patch-12-1-7-PTR-Build-70493', L('MMO-Champion: RPP del 12.1.7, build 70493', 'MMO-Champion: Patch 12.1.7 PTR build 70493')),
        lk('https://www.mmo-champion.com/content/14613-Patch-12-1-7-PTR-Build-70424', L('MMO-Champion: RPP del 12.1.7, build 70424', 'MMO-Champion: Patch 12.1.7 PTR build 70424')),
        lk('https://www.mmo-champion.com/content/14615-New-Winter-Veil-Housing-Decor-in-Patch-12-1-7', L('MMO-Champion: adornos de hogar del Festival de Invierno', 'MMO-Champion: Winter Veil housing decor')),
        lk('https://mamytwink.com/actualite/patch-12-1-7-les-elements-de-decoration-chez-les-marchands-dazeroth', L('Mamytwink: adornos de hogar en los mercaderes (en francés)', 'Mamytwink: decor sold by merchants (in French)')),
        lk(LINK117.mounts, L('Monturas encontradas en los datos del 12.1.7', 'Mounts found in the 12.1.7 data')),
      ])
      + p(L('Los textos están resumidos y traducidos por WipeHub. Los nombres de objetos, logros y hechizos sin traducción confirmada se dejan en inglés. Todo es contenido del RPP: puede cambiar antes de que el parche salga.', 'Texts are summarized and translated by WipeHub. Item, achievement and spell names without a confirmed translation are left in English. Everything is PTR content and may change before the patch goes live.'))],
  ];

  const PATCHES = () => ({
    '12.1.5': { title: L('Parche 12.1.5', 'Patch 12.1.5'), ban: L('Contenido que Blizzard ha hecho público · Midnight', 'Content Blizzard has made public · Midnight'), secs: SECTIONS() },
    '12.1.7': { title: L('Parche 12.1.7', 'Patch 12.1.7'), ban: L('Ecos del Núcleo del Mundo · en el RPP · Midnight', 'Echoes of the Worldcore · on the PTR · Midnight'), secs: SECTIONS117() },
  });

  function open(tabId, patchId) {
    let dlg = document.getElementById('patchDlg');
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.id = 'patchDlg';
      dlg.className = 'modal wide settings-dlg pn-dlg';
      document.body.appendChild(dlg);
      dlg.addEventListener('click', (ev) => {
        const tabBtn = ev.target.closest('[data-pn-tab]');
        if (tabBtn) { open(tabBtn.dataset.pnTab, dlg.dataset.patch); return; }
        const link = ev.target.closest('[data-pn-link]');
        if (link) { ev.preventDefault(); window.api.openExternal(link.dataset.pnLink); return; }
        if (ev.target.closest('[data-pn-close]') || ev.target === dlg) dlg.close();
      });
    }
    const all = PATCHES();
    const pid = all[patchId] ? patchId : (all[dlg.dataset.patch] ? dlg.dataset.patch : '12.1.5');
    const pt = all[pid];
    const secs = pt.secs;
    const cur = secs.find((s) => s[0] === (tabId || (pid === dlg.dataset.patch ? dlg.dataset.tab : ''))) || secs[0];
    dlg.dataset.patch = pid;
    dlg.dataset.tab = cur[0];
    dlg.innerHTML = `<div class="set-wrap"><div class="set-nav"><h2>${pt.title}</h2>
      ${secs.map(([id, label]) => `<button type="button" class="set-tab ${id === cur[0] ? 'on' : ''}" data-pn-tab="${id}">${label}</button>`).join('')}
      <span class="grow"></span><button type="button" class="btn ghost" data-pn-close>${L('Cerrar', 'Close')}</button></div>
      <div class="set-body pn-body"><div class="pn-ban">${pt.ban}</div>${cur[2]()}</div></div>`;
    if (!dlg.open) dlg.showModal();
    dlg.querySelector('.pn-body')?.scrollTo(0, 0);
  }

  // ------------------------------------------------------------ desplegable del botón del inicio
  // Cuelga del body (la tarjeta del inicio recorta lo que sobresale) y se abre hacia arriba desde el botón.
  let pop = null;
  function closeMenu() {
    if (!pop) return;
    const btn = document.querySelector('[data-pn="menu"]');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    const el = pop;
    pop = null;
    el.classList.add('out');
    setTimeout(() => el.remove(), 140);
  }
  function cardsHTML() {
    const zam = (n) => `raidicons/z_${n}.webp`;
    const boss = (id) => `raidicons/b${id}.webp`;
    const card = (v, color, icons, title, sub, tag, date) => `<button type="button" role="menuitem" class="rc-pick pn-card" style="--cc:${color}" data-pn-patch="${v}"><span class="rc-pick-ic">${icons.map((i) => `<img src="${i}" alt="">`).join('')}</span><b>${title}</b><small>${sub}</small><span class="rc-pick-n"><i class="rc-n g">${tag}</i><em>${date}</em></span></button>`;
    return card('12.1.5', '#b794ff', [boss(3513), zam('inv_121_trinket_raid_ulatek_ulatekclaw'), zam('inv_misc_net_01')], L('Parche 12.1.5', 'Patch 12.1.5'), L('La liberación de Kith\'ix, Laberinto de Kindo\'jan e Invasiones aqir', 'The Unbinding of Kith\'ix, Labyrinth of Kindo\'jan and Aqir Invasions'), L('En directo', 'Live'), L('13 y 14 de octubre', 'October 13 and 14'))
      + card('12.1.7', '#ffc933', [zam('item_shadowcloth'), zam('inv_misc_book_09'), zam('inv_gilneashorsemount')], L('Parche 12.1.7', 'Patch 12.1.7'), L('Ecos del Núcleo del Mundo: Talebound, Paseo por la historia y más', 'Echoes of the Worldcore: Talebound, Lorewalking and more'), L('En el RPP', 'On the PTR'), L('Sin fecha de salida', 'No release date'));
  }

  function openMenu(btn) {
    const r = btn.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'pn-pop pn-pop-cards';
    el.setAttribute('role', 'menu');
    el.innerHTML = cardsHTML();
    document.body.appendChild(el);
    el.style.visibility = 'hidden';
    el.style.left = '0px';
    el.style.top = '0px';
    const room = innerWidth - r.right - 18;
    if (room < el.offsetWidth) el.classList.add('stack');
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    el.style.left = (room >= w ? r.right + 12 : Math.max(8, innerWidth - w - 8)) + 'px';
    el.style.top = Math.max(8, Math.min(r.top + r.height / 2 - h / 2, innerHeight - h - 8)) + 'px';
    el.style.visibility = '';
    btn.setAttribute('aria-expanded', 'true');
    pop = el;
    el.querySelector('.pn-card')?.focus();
  }

  document.addEventListener('click', (ev) => {
    const opt = ev.target.closest('[data-pn-patch]');
    if (opt) { const v = opt.dataset.pnPatch; closeMenu(); open('', v); return; }
    const btn = ev.target.closest('[data-pn="menu"]');
    if (btn) { if (pop) closeMenu(); else openMenu(btn); return; }
    if (ev.target.closest('[data-pn="open"]')) { closeMenu(); open('', '12.1.5'); return; }
    if (pop && !ev.target.closest('.pn-pop')) closeMenu();
  });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && pop) closeMenu(); });
  window.addEventListener('resize', closeMenu);

  return { homeHTML, startTimer, open };
})();

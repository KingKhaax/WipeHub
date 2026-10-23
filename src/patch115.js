'use strict';

// Parches 12.1.5 y 12.1.7 de Midnight: cuenta atrás del 12.1.5 y paneles con el contenido que Blizzard ha hecho público.
// El botón del inicio abre un desplegable (hacia arriba) para elegir el parche.
// Fuentes oficiales: artículo del 29 de septiembre y notas de actualización 12.1.5 (enlaces al final del panel).
// Los nombres de talentos y hechizos se dejan en inglés (nombre oficial); las descripciones están traducidas.
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
    return `${count}<button type="button" class="pn-btn pn-menu-btn" data-pn="menu" aria-haspopup="menu" aria-expanded="false"><span class="pn-fx" aria-hidden="true"><i></i><i></i></span><span class="pn-lbl">${L('Contenido del 12.1.5 / 12.1.7', '12.1.5 / 12.1.7 content')}</span><i class="pn-chev" aria-hidden="true">▴</i></button>`;
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
        L('<b>Raid de un jefe:</b> The Unbinding of Kith\'ix.', '<b>Single-boss raid:</b> The Unbinding of Kith\'ix.'),
        L('<b>Labyrinth of Kindo\'jan:</b> reto de nueve cámaras tipo Inmersión/mazmorra gigante.', '<b>Labyrinth of Kindo\'jan:</b> a nine-chamber Delve-style mega-dungeon.'),
        L('<b>Aqir Invasions:</b> eventos públicos en Eversong y Zul\'Aman.', '<b>Aqir Invasions:</b> public events in Eversong and Zul\'Aman.'),
        L('<b>Refresco de mitad de la Temporada 2:</b> más Nebulous Voidcores y Ascendant Venomstones.', '<b>Season 2 mid-season refresh:</b> extra Nebulous Voidcores and Ascendant Venomstones.'),
        L('<b>Keystone Myth</b> de la Temporada 2 y ajustes de mazmorras.', '<b>Keystone Myth</b> for Season 2 and dungeon tuning.'),
        L('<b>Campaña:</b> "The Promise of Tomorrow".', '<b>Campaign:</b> "The Promise of Tomorrow".'),
        L('Cambios de clase, Housing, PvP, Prey, interfaz y reputación de banda de guerra.', 'Class changes, Housing, PvP, Prey, UI and warband reputation.'),
      ])],
    ['raid', L('Raid: Kith\'ix', 'Raid: Kith\'ix'), () =>
      h('The Unbinding of Kith\'ix')
      + p(L('Kith\'ix, general C\'Thraxxi, está atado en una guarida bajo el Abismo Venenoso (Venomous Abyss). Sus ataduras se debilitaron tras la derrota de Ula\'tek. Lady Liadrin te acompaña en el combate.', 'Kith\'ix, a C\'Thraxxi general, is bound in a lair beneath the Venomous Abyss. His restraints weakened after Ula\'tek\'s defeat. Lady Liadrin joins you in the fight.'))
      + h(L('Dificultades', 'Difficulties'))
      + ul([
        L('Modo historia, Buscador de bandas, Normal y Heroico.', 'Story Mode, Raid Finder, Normal and Heroic.'),
        L('<b>Mítico:</b> grupo flexible de <b>15 a 25 jugadores</b>.', '<b>Mythic:</b> a flexible group of <b>15 to 25 players</b>.'),
      ])
      + p(L('Blizzard no ha publicado todavía los detalles de las mecánicas del combate.', 'Blizzard has not yet published the encounter\'s mechanics.'))
      + kithixMechanics()],
    ['labyrinth', 'Labyrinth of Kindo\'jan', () =>
      h('Labyrinth of Kindo\'jan')
      + p(L('Un desafío de estilo Inmersión de gran tamaño (mazmorra gigante) en un complejo funerario amani sellado. Saqueadores y Vilebranch lo registran y los espíritus lo defienden.', 'A large Delve-style challenge (mega-dungeon) in a sealed Amani funeral complex. Looters and the Vilebranch search it while spirits defend it.'))
      + ul([
        L('<b>Nueve cámaras</b>; puedes hacerlo de una sentada o un ala cada vez.', '<b>Nine chambers</b>; run it in one session or one wing at a time.'),
        L('Una sola ala ya da recompensas; cada sala extra añade más tesoro y más riesgo.', 'A single wing still earns rewards; each extra room adds more treasure and more risk.'),
        L('<b>Valeera Sanguinar</b> es tu compañera.', '<b>Valeera Sanguinar</b> is your companion.'),
        L('Progresión y desbloqueos propios; recompensas con <b>equipo Mítico</b>, cosméticos y títulos.', 'Dedicated progression and unlocks; rewards include <b>Mythic gear</b>, cosmetics and titles.'),
        L('Incluye un reto en solitario de <b>Tier 11</b>.', 'Includes a <b>Tier 11</b> solo challenge.'),
      ])],
    ['aqir', 'Aqir Invasions', () =>
      h('Aqir Invasions')
      + p(L('Eventos públicos de toda la zona en <b>Eversong Woods</b> o <b>Zul\'Aman</b>. Cada hora hay una ventana de <b>10 minutos</b> para completar una serie de eventos y luchar contra un jefe. Las recompensas dependen de los objetivos que cumpla tu grupo antes de que se cierre la ventana.', 'Zone-wide public events in <b>Eversong Woods</b> or <b>Zul\'Aman</b>. Every hour there is a <b>10-minute</b> window to complete a series of events and fight a boss. Rewards depend on the objectives your group completes before the window closes.'))
      + ul([L('Seis tipos de escenario: tres de combate y tres sin combate.', 'Six scenario types: three combat and three non-combat.')])
      + h(L('Ocho afijos de combate', 'Eight combat affixes'))
      + ul([
        L('<b>Void Protection:</b> un Aqir Voidweaver crea una barrera protectora sobre los demás aqir.', '<b>Void Protection:</b> an Aqir Voidweaver shields the other aqir.'),
        L('<b>Aqir Burrower:</b> los aqir se entierran y lanzan a los jugadores por los aires.', '<b>Aqir Burrower:</b> aqir burrow and launch players into the air.'),
        L('<b>Void Sphere:</b> esferas que se mueven para atrapar a los jugadores.', '<b>Void Sphere:</b> spheres move around to trap players.'),
        L('<b>Astalor\'s Anguish:</b> cristales de angustia dañan a los aqir y a los aventureros cercanos.', '<b>Astalor\'s Anguish:</b> Anguish Crystals damage aqir and nearby adventurers.'),
        L('<b>Swarms!:</b> los aqir se sustituyen por enjambres de aqir más pequeños.', '<b>Swarms!:</b> aqir are replaced by swarms of smaller aqir.'),
        L('<b>Aqir Elites:</b> menos aqir pero más fuertes.', '<b>Aqir Elites:</b> fewer but stronger aqir.'),
        L('<b>Void Infestation:</b> los aqir infestados explotan a los pocos segundos y propagan la infección.', '<b>Void Infestation:</b> infested aqir explode after a few seconds and spread infection.'),
        L('<b>Web Weavers:</b> un Aqir Webweaver puede enredar a un jugador si no se interrumpe su canalización.', '<b>Web Weavers:</b> an Aqir Webweaver may web a player if its channel is not interrupted.'),
      ])],
    ['season', L('Mitad de temporada', 'Mid-season'), () =>
      h(L('Refresco de la Temporada 2', 'Season 2 refresh'))
      + p(L('Orin Straylight (Silvermoon City) ofrece <b>un Nebulous Voidcore extra por semana</b> para tiradas de bonificación.', 'Orin Straylight (Silvermoon City) offers <b>one extra Nebulous Voidcore per week</b> for bonus rolls.'))
      + h(L('Cómo se desbloquea', 'How it unlocks'))
      + ul([
        L('Acepta <b>"In the Catalyst\'s Shadow"</b> de Decimus en Voidstorm y después <b>"Prismatic Potential"</b> de Orin.', 'Accept <b>"In the Catalyst\'s Shadow"</b> from Decimus in Voidstorm, then <b>"Prismatic Potential"</b> from Orin.'),
        L('<b>Semana del 6 de octubre</b> (mantenimiento): Orin completa su investigación y ofrece <b>"Umbral Blessings of the Catalyst"</b>: intercambia oro, Voidlight Marl o Veteran Mistcrests por un Voidcore extra a la semana.', '<b>Week of October 6</b> (maintenance): Orin completes his research and offers <b>"Umbral Blessings of the Catalyst"</b>: trade gold, Voidlight Marl or Veteran Mistcrests for one extra Voidcore per week.'),
        L('<b>Semana del 13 de octubre:</b> <b>"Ancient Depths, Ancient Venom"</b> inicia la investigación de las Ascendant Venomstones.', '<b>Week of October 13:</b> <b>"Ancient Depths, Ancient Venom"</b> starts the Ascendant Venomstones research.'),
        L('<b>Semana del 20 de octubre:</b> termina la investigación y se ofrece <b>"Ascending with Venomstones"</b>. Ese día se <b>levanta el límite de crests</b>.', '<b>Week of October 20:</b> the research completes and <b>"Ascending with Venomstones"</b> is offered. The <b>crest cap is lifted</b> that week.'),
      ])
      + h('Ascendant Venomstones')
      + ul([
        L('Caen de: jefes de banda Heroicos o Míticos, mazmorras de llave Mítica+ de <b>+10 o más</b>, Delves Bountiful de <b>Tier 11</b> y cofres de equipo Champion de la cacería Nightmare de Prey.', 'Drop from: Heroic or Mythic raid bosses, Mythic+ keystone dungeons at <b>+10 and above</b>, <b>Tier 11</b> Bountiful Delves and Nightmare Prey Hunt Champion gear chests.'),
        L('Con <b>10</b> piedras, junto al Catalyst de Silvermoon City, subes el nivel de objeto de una pieza de Héroe o Mito de la Temporada 2 totalmente mejorada, o de un arma, abalorio o collar Tidal Crafted de calidad máxima.', 'With <b>10</b> stones, near the Catalyst in Silvermoon City, you raise the item level of a fully upgraded Season 2 Hero or Myth item, or a max-quality Tidal Crafted weapon, trinket or necklace.'),
      ])],
    ['keystone', L('Keystone Myth y logros', 'Keystone Myth & achievements'), () =>
      h('Keystone Myth')
      + ul([
        L('Vuelve en la Temporada 2: logro <b>"Midnight Keystone Myth: Season 2"</b> al llegar a <b>3600</b> de puntuación Mítica+. Da el título <b>"Venomous Contender"</b> y la <b>Timelost Saddle</b>.', 'Returns for Season 2: <b>"Midnight Keystone Myth: Season 2"</b> achievement at a Mythic+ rating of <b>3600</b>. Rewards the <b>"Venomous Contender"</b> title and the <b>Timelost Saddle</b>.'),
        L('Ajustes de dificultad en las mazmorras que se salen de la media.', 'Targeted tuning for dungeons that are difficulty outliers.'),
        L('<b>Murder Row:</b> corregido que Murder in a Row de Zaen Bladesorrow asignara a veces la zona segura a un barril tras el que no te escondías.', '<b>Murder Row:</b> fixed Zaen Bladesorrow\'s Murder in a Row sometimes assigning a safe spot to a barrel you were not hiding behind.'),
      ])
      + h(L('Logros', 'Achievements'))
      + ul([L('<i>Snake Eyes</i>, <i>Snake Eater</i> y <i>Good Night, Sweet Prince</i> ya no son necesarios para <i>Glory of the Wartorn Hero</i>.', '<i>Snake Eyes</i>, <i>Snake Eater</i> and <i>Good Night, Sweet Prince</i> are no longer required for <i>Glory of the Wartorn Hero</i>.')])
      + h(L('Campaña', 'Campaign'))
      + p(L('<b>"The Promise of Tomorrow":</b> la derrota de Ula\'tek despierta un terror ancestral. Mantén la paz entre Quel\'Thalas y Zul\'Aman, desciende a la Coiled Isle y planta cara a Kith\'ix.', '<b>"The Promise of Tomorrow":</b> Ula\'tek\'s defeat awakens an ancient terror. Keep the peace between Quel\'Thalas and Zul\'Aman, descend to the Coiled Isle and make a final stand against Kith\'ix.'))],
    ['clases', L('Clases', 'Classes'), () => {
      const c = (name, items) => `<h4>${name}</h4>${ul(items)}`;
      return h(L('Cambios de clase', 'Class changes'))
        + c(L('Cazador de demonios — Devourer', 'Demon Hunter — Devourer'), [
          L('Collapsing Star gana alcance extra tras empezar el lanzamiento.', 'Collapsing Star gains extra range after its cast begins.'),
          L('Cancelar Collapsing Star ya no provoca un enfriamiento de <b>5 s</b>.', 'Cancelling Collapsing Star no longer triggers a <b>5 s</b> cooldown.'),
          L('La ralentización de drenaje de Furia de Collapsing Star dura un tiempo limitado: unos <b>1,5 lanzamientos</b> completos entre cancelaciones; después la Furia se drena con normalidad.', 'Collapsing Star\'s Fury-drain slow now lasts a limited time: about <b>1.5 full casts</b> across cancel-and-recast; after that Fury drains normally.'),
          L('Soulforged Blades: probabilidad de crítico de Hungering Slash y Voidblade <b>18 %</b> (antes 15 %).', 'Soulforged Blades: crit chance of Hungering Slash and Voidblade <b>18%</b> (was 15%).'),
          L('Voidpurge: reducción de enfriamiento de Void Ray en Void Metamorphosis <b>2,5 s</b> (antes 2).', 'Voidpurge: Void Ray cooldown reduction during Void Metamorphosis <b>2.5 s</b> (was 2).'),
          L('The Hunt y Eradicate pasan a la puerta central del árbol; otros talentos pasan a posiciones de culminación.', 'The Hunt and Eradicate move to the middle gate; other talents move to capstone positions.'),
        ])
        + c(L('Cazador de demonios — Void-Scarred', 'Demon Hunter — Void-Scarred'), [
          L('Demonic Intensity: Collapsing Star reinicia el enfriamiento de The Hunt y el daño potenciado de The Hunt sube un <b>30 %</b>.', 'Demonic Intensity: Collapsing Star resets The Hunt\'s cooldown and The Hunt\'s empowered damage is up <b>30%</b>.'),
          L('Violent Transformation: reinicia Soul Immolation; ya no reinicia The Hunt ni aumenta su daño (era un 25 %).', 'Violent Transformation: resets Soul Immolation; no longer resets The Hunt or increases its damage (was 25%).'),
          L('Monster Rising: bonificación de Intelecto fuera de forma demoníaca <b>10 %</b> (antes 15 %); bonificación de daño de Collapsing Star <b>20 %</b> (antes 15 %).', 'Monster Rising: Intellect bonus outside demon form <b>10%</b> (was 15%); Collapsing Star damage bonus <b>20%</b> (was 15%).'),
        ])
        + c(L('Druida — Restauración', 'Druid — Restoration'), [L('Nature\'s Bounty rediseñado: Regrowth cura a hasta <b>3</b> aliados con Rejuvenation activa por el <b>15 %</b> de su sanación, priorizando a los de menos vida.', 'Nature\'s Bounty redesigned: Regrowth heals up to <b>3</b> allies with Rejuvenation active for <b>15%</b> of its healing, prioritizing lowest health.')])
        + c(L('Evocador — Aumento', 'Evoker — Augmentation'), [
          L('Chronowarden: las duraciones de Temporality y Temporal Burst aumentan con Mastery: Timewalker.', 'Chronowarden: Temporality and Temporal Burst durations are increased by Mastery: Timewalker.'),
          L('Scalecommander: el daño de Melt Armor aumenta un <b>100 %</b>.', 'Scalecommander: Melt Armor damage increased by <b>100%</b>.'),
        ])
        + c(L('Evocador — Preservación', 'Evoker — Preservation'), [
          L('Merithra\'s Blessing dura <b>30 s</b> (antes 1 min).', 'Merithra\'s Blessing lasts <b>30 s</b> (was 1 min).'),
          L('Consume Flame ya no aprovecha dos veces los aumentos de sanación del objetivo.', 'Consume Flame no longer double-dips healing increases on the target.'),
          L('Chronowarden: corregido que Double-time detuviera Life-Giver\'s Flame y que Afterimage hiciera que Deep Breath lanzara Living Flame sobre el Evocador.', 'Chronowarden: fixed Double-time stopping Life-Giver\'s Flame and Afterimage making Deep Breath cast Living Flame on the Evoker.'),
          L('Flameshaper: la sanación de Consume Flame sube un <b>20 %</b>.', 'Flameshaper: Consume Flame healing increased by <b>20%</b>.'),
        ])
        + c(L('Cazador — Puntería', 'Hunter — Marksmanship'), [
          L('Nuevo talento <b>Blood Fletching</b>: los críticos de Aimed Shot aplican el sangrado de Master Marksman al <b>20 %</b> del daño; durante <b>4 s</b> tras un crítico, el objetivo recibe más daño de sangrado de tus habilidades.', 'New talent <b>Blood Fletching</b>: Aimed Shot crits apply the Master Marksman bleed at <b>20%</b> of damage; for <b>4 s</b> after a crit the target takes extra bleed damage from your abilities.'),
          L('<b>Unload</b> eliminado.', '<b>Unload</b> removed.'),
          L('Corregido que Explosive Shot se lanzara solo contra un objetivo cercano sin objetivo seleccionado.', 'Fixed Explosive Shot auto-firing at a nearby target with no target selected.'),
          L('Dark Ranger: corregido que Umbral Reach no generara Trick Shots cuando Bleak Powder golpea exactamente a 2 objetivos.', 'Dark Ranger: fixed Umbral Reach not generating Trick Shots when Bleak Powder hits exactly 2 targets.'),
        ])
        + c(L('Cazador — Supervivencia', 'Hunter — Survival'), [
          L('Corregido que el daño extra de Strike as One de Raptor Swipe (rango 3) no funcionara con Aspect of the Eagle.', 'Fixed Strike as One bonus damage from Raptor Swipe (rank 3) not working with Aspect of the Eagle.'),
          L('Corregido que el alcance de Raptor Swipe fuera mayor de lo previsto con Aspect of the Eagle.', 'Fixed Raptor Swipe\'s range being longer than intended with Aspect of the Eagle.'),
        ])
        + c(L('Mago', 'Mage'), [
          L('<b>Arcano:</b> varios hechizos se añaden al sistema de Spell Density.', '<b>Arcane:</b> several spells added to the Spell Density system.'),
          L('<b>Escarcha:</b> corregidos varios fallos de Splitting Ice (daño sobre Frostbolt, segundo objetivo, radio de búsqueda), de Shatter con dos Ice Lances en el aire y de Ray of Frost interrumpido con Crystalline Refraction.', '<b>Frost:</b> fixed several Splitting Ice issues (Frostbolt damage, second target, search radius), Shatter with two Ice Lances in the air and interrupted Ray of Frost with Crystalline Refraction.'),
          L('<b>Frostfire:</b> corregido que Frostfire Empowerment no se aplicara al segundo objetivo de Splitting Ice; tooltip de Frostfire Infusion actualizado.', '<b>Frostfire:</b> fixed Frostfire Empowerment not applying to Splitting Ice\'s second target; Frostfire Infusion tooltip updated.'),
          L('<b>Spellslinger:</b> Splinterstorm se puede seguir como beneficio en el Cooldown Manager y ya no se quita al empezar un encuentro de banda o Mítica+.', '<b>Spellslinger:</b> Splinterstorm is trackable as a buff in the Cooldown Manager and is no longer removed at the start of a raid encounter or Mythic+.'),
        ])
        + c(L('Monje', 'Monk'), [L('Corregido que Transcendence: Transfer se pudiera usar estando silenciado con Transcendence: Linked Spirits.', 'Fixed Transcendence: Transfer being usable while silenced with Transcendence: Linked Spirits.')])
        + c(L('Sacerdote', 'Priest'), [
          L('<b>Disciplina:</b> Master the Darkness dura <b>30 s</b> (antes 1 min).', '<b>Discipline:</b> Master the Darkness lasts <b>30 s</b> (was 1 min).'),
          L('<b>Sagrado:</b> Holy Celerity y Ultimate Serenity intercambian posición; Ultimate Serenity es más fácil de alcanzar.', '<b>Holy:</b> Holy Celerity and Ultimate Serenity swap positions; Ultimate Serenity is easier to reach.'),
        ])
        + c(L('Pícaro', 'Rogue'), [
          L('Shiv ya no muestra efecto de impacto sobre el Pícaro.', 'Shiv no longer plays an impact visual on the Rogue.'),
          L('<b>Asesinato:</b> nueva estela de arma en Mutilate y animación de Crimson Tempest actualizada.', '<b>Assassination:</b> Mutilate has a new weapon trail and Crimson Tempest\'s animation is updated.'),
          L('<b>Forajido:</b> Deft Maneuvers ya no añade 30 de Energía a Blade Flurry: añade <b>5 por objetivo golpeado, hasta 30</b>.', '<b>Outlaw:</b> Deft Maneuvers no longer adds 30 Energy to Blade Flurry: it adds <b>5 per target hit, up to 30</b>.'),
          L('<b>Sutileza:</b> modificadores de daño de Sombras corregidos; Shadow Blades tiene nuevos efectos visuales.', '<b>Subtlety:</b> Shadow damage modifiers updated; Shadow Blades has new cast and weapon visuals.'),
        ])
        + c(L('Chamán', 'Shaman'), [
          L('<b>Mejora:</b> corregido que Static Accumulation detuviera la generación de cargas de Maelstrom Weapon durante Ascendance o Doom Winds.', '<b>Enhancement:</b> fixed Static Accumulation stopping Maelstrom Weapon stack generation during Ascendance or Doom Winds.'),
          L('<b>Restauración:</b> alargar Riptide con Swelling Tides ahora extiende el tiempo en vez de reiniciarlo; corregido que Nature\'s Swiftness y Ancestral Swiftness no hicieran instantáneo Healing Rain.', '<b>Restoration:</b> extending Riptide through Swelling Tides now extends the timer instead of resetting it; fixed Nature\'s Swiftness and Ancestral Swiftness not making Healing Rain instant.'),
        ])
        + c(L('Guerrero — Protección', 'Warrior — Protection'), [
          L('El daño de <b>Execute</b> sube un <b>30 %</b>.', '<b>Execute</b> damage increased by <b>30%</b>.'),
          L('Colossus: Practiced Strikes reduce el coste de Rabia de Execute y Revenge en <b>10</b>.', 'Colossus: Practiced Strikes now reduces Execute and Revenge Rage costs by <b>10</b>.'),
        ]);
    }],
    ['otros', L('Otros cambios', 'Other changes'), () =>
      h('PvP')
      + ul([L('Evocador Preservación: Merithra\'s Blessing ahora es un hechizo Arcano y puede lanzarse con la Naturaleza bloqueada.', 'Preservation Evoker: Merithra\'s Blessing is now an Arcane spell and can be cast while locked out of Nature.')])
      + h('Prey')
      + ul([
        L('Por debajo del rango 4: <b>4000</b> de progreso de Journey (un rango completo) por cacería, en lugar del progreso de las cuatro primeras cacerías semanales.', 'Below rank 4: <b>4000</b> Journey progress (a full rank) per hunt, replacing the progress from the first four hunts each week.'),
        L('Rangos 4 a 9: <b>2000</b> de progreso en cada una de las cuatro primeras cacerías de la semana.', 'Ranks 4–9: <b>2000</b> Journey progress from each of the first four hunts each week.'),
        L('Las Afflicted y Tormented Souls ya no se pueden usar durante una cacería activa; hay que usarlas entre cacerías.', 'Afflicted and Tormented Souls can no longer be used during an active hunt; use them between hunts.'),
      ])
      + h(L('Interfaz y accesibilidad', 'Interface and accessibility'))
      + ul([
        L('Coordenadas del jugador bajo el minimapa (se pueden desactivar y mostrar como enteros o decimales).', 'Player coordinates below the minimap (can be disabled and shown as integers or decimals).'),
        L('Opción para mostrar "hormigas" (borde animado) en los marcos de banda de las unidades que puedes disipar, y para hacer pulsar la opacidad de la superposición de disipación.', 'Option to show "ants" (animated border) on raid frames of units you can dispel, and to pulse the dispel overlay\'s opacity.'),
        L('Al hacer ping a una macro se muestra la información de #showtooltip.', 'Pinging a macro shows #showtooltip information.'),
        L('Nuevo ajuste "Pulse Your Health" en Alertas de audio de combate: un sonido en bucle bajo un porcentaje de vida que se intensifica al bajar.', 'New "Pulse Your Health" setting under Combat Audio Alerts: a looping sound below a health percentage that intensifies as health drops.'),
        L('Los ajustes de vista previa de la Trading Post (como "Combat Animation") se conservan al cambiar de objeto.', 'Trading Post preview settings (such as "Combat Animation") persist when switching items.'),
      ])
      + h('Housing')
      + ul([
        L('Modo de edición de plano: teclas para subir/bajar de planta (Re Pág / Av Pág por defecto) y acceso directo a la Blueprint Collection.', 'Floorplan edit mode: floor up/down keybinds (Page Up/Page Down by default) and a shortcut to the Blueprint Collection.'),
        L('Los Public Neighborhoods ya no reciben el mismo Endeavor dos veces seguidas.', 'Public Neighborhoods no longer receive the same Endeavor back-to-back.'),
        L('Blueprints: las escaleras exportan todas las salas conectadas en vertical; la lista de contenido excluye tintes ya incluidos en la decoración; tooltips y textos nuevos.', 'Blueprints: stairwells export all vertically connected rooms; the contents list excludes dyes already provided by decor; new tooltips and text.'),
      ])
      + h(L('Reputación de banda de guerra', 'Warband reputation'))
      + ul([L('Las reputaciones de Legion y Battle for Azeroth ahora se comparten con toda la banda de guerra.', 'Legion and Battle for Azeroth reputations are now shared across the warband.')])],
    ['fuentes', L('Fuentes', 'Sources'), () =>
      h(L('Fuentes oficiales de Blizzard', 'Official Blizzard sources'))
      + ul([
        `<a href="#" data-pn-link="${LINK_NEWS}">${L('Anuncio: "Midnight\'s 12.1.5 Content Update Arrives October 13"', 'Announcement: "Midnight\'s 12.1.5 Content Update Arrives October 13"')}</a>`,
        `<a href="#" data-pn-link="${LINK_NOTES}">${L('Notas de la actualización 12.1.5 (Midnight)', '12.1.5 Content Update Notes (Midnight)')}</a>`,
      ])
      + p(L('Los textos están resumidos y traducidos por WipeHub; los nombres de talentos y hechizos se dejan en inglés. La fecha del miércoles 14 en Europa viene de la prensa especializada. Si Blizzard cambia algo, manda su web.', 'Texts are summarised and translated by WipeHub; talent and spell names are kept in English. The Wednesday 14 European date comes from the specialist press. If Blizzard changes anything, its website prevails.'))],
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
  const lk = (u, t) => `<a href="#" data-pn-link="${u}">${t}</a>`;

  const SECTIONS117 = () => [
    ['resumen', L('Resumen', 'Overview'), () =>
      h(L('Ecos del Núcleo del Mundo', 'Echoes of the Worldcore'))
      + p(L('Próxima actualización de contenido de tamaño medio de Midnight. Devuelve a los jugadores a <b>Dornogal</b> para encontrar la forma de entrar en la <b>Vía del Núcleo</b> (Coreway) y, más allá, en el <b>Núcleo del Mundo</b> (Worldcore).', 'The next medium content update for Midnight. It sends players back to <b>Dornogal</b> to find a way into the <b>Coreway</b> and, beyond it, the <b>Worldcore</b>.'))
      + h(L('Estado y fecha', 'Status and date'))
      + ul([
        L('<b>En el RPP</b> desde el <b>15 de octubre de 2026</b>. Todo lo que se cuenta aquí es el contenido del RPP y puede cambiar antes de salir.', '<b>On the PTR</b> since <b>October 15, 2026</b>. Everything here is PTR content and may change before release.'),
        L('Blizzard <b>no ha anunciado fecha de salida</b>. La prensa especializada calcula diciembre de 2026, pero es solo una estimación.', 'Blizzard has <b>not announced a release date</b>. The specialist press estimates December 2026, but that is only a guess.'),
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
      + note(L('En las primeras semanas del RPP, el modo todavía no estaba abierto para probarlo.', 'During the first weeks on the PTR the mode was not yet open for testing.'))],
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
        L('<b>Autumn Dream Jumper</b> — aparece en la lista de Talebound.', '<b>Autumn Dream Jumper</b> — listed under Talebound.'),
      ])
      + h(L('Otras monturas encontradas', 'Other mounts found'))
      + p('Woodland Wanderer · Faith-Cursed · Gilnean Charger · Lost Mare · Night Court · Shadowpaw · Stone Crusher · Skeletal Raptor · Watcher · Stegodon (' + L('negro, azul, verde y morado', 'black, blue, green and purple') + ')')
      + note(L('De estas últimas todavía no se sabe cómo se consiguen.', 'How to obtain these is not known yet.'))],
    ['otros', L('Otros cambios', 'Other changes'), () =>
      h(L('Profesiones', 'Professions'))
      + ul([
        L('<b>Herboristería de Midnight:</b> la especialización <b>Bountiful Harvests</b> da más <b>Destreza</b> (Deftness).', '<b>Midnight Herbalism:</b> the <b>Bountiful Harvests</b> specialization grants more <b>Deftness</b>.'),
        L('<b>Minería de Midnight:</b> la especialización <b>Plentiful Ores</b> da más <b>Destreza</b> (Deftness).', '<b>Midnight Mining:</b> the <b>Plentiful Ores</b> specialization grants more <b>Deftness</b>.'),
      ])
      + h('Housing')
      + ul([
        L('Corregido que los adornos giraran al convertir los datos de una casa al formato nuevo.', 'Fixed decor rotating when house data is converted to the new format.'),
        L('Se han encontrado <b>63 adornos</b> nuevos que venden los mercaderes de Azeroth por distintas monedas (datos del RPP).', '<b>63 new decor items</b> sold by Azeroth merchants for various currencies have been found (PTR data).'),
        L('Nuevos adornos de hogar en los vendedores de Paseo en el tiempo y en la tienda de Talebound (ver las secciones correspondientes).', 'New housing decor at the Timewalking vendors and in the Talebound store (see the matching sections).'),
        L('Un nuevo <b>campamento de banda de guerra</b> aparece en los archivos del juego.', 'A new <b>Warband campsite</b> shows up in the game files.'),
      ])
      + h(L('Festival de Invierno', 'Feast of Winter Veil'))
      + ul([L('Novedades del Festival de Invierno, entre ellas la montura de Winterrrgl (ver Monturas). Blizzard no da más detalles.', 'Winter Veil updates, including Winterrrgl\'s mount (see Mounts). Blizzard gives no further details.')])
      + h(L('Para creadores de addons', 'For addon authors'))
      + ul([
        L('Los GUID dejan de exponer el ID del servidor y el de aparición (se ofuscan).', 'GUIDs no longer expose the server ID and spawn ID (they are obfuscated).'),
        L('Las directivas del .toc ya no expanden variables como <code>[Game]</code> o <code>[Family]</code>.', 'TOC directives no longer expand variables such as <code>[Game]</code> or <code>[Family]</code>.'),
      ])
      + note(L('No hay una lista de cambios de clase del 12.1.7: lo publicado hasta ahora es solo contenido y ajustes menores.', 'There is no 12.1.7 class changelist yet: what has been published so far is content and minor tweaks.'))],
    ['fuentes', L('Fuentes', 'Sources'), () =>
      h(L('Fuentes', 'Sources'))
      + ul([
        lk(L(LINK117.blizzEs, LINK117.blizz), L('Blizzard: «Midnight: resumen de Ecos del Núcleo del Mundo»', 'Blizzard: "Midnight: Echoes of the Worldcore Overview"')),
        lk(L(LINK117.wowheadEs, LINK117.wowhead), L('Wowhead: guía del parche 12.1.7 (características, actividades y recompensas)', 'Wowhead: Patch 12.1.7 overview guide (features, activities and rewards)')),
        lk(LINK117.wiki, 'Warcraft Wiki: Patch 12.1.7'),
        lk(LINK117.api, 'Warcraft Wiki: Patch 12.1.7/API changes'),
        lk(LINK117.icy, L('Icy Veins: notas de desarrollo del RPP del 12.1.7', 'Icy Veins: 12.1.7 PTR development notes')),
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
  function openMenu(btn) {
    const r = btn.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'pn-pop';
    el.setAttribute('role', 'menu');
    // 12.1.5: vacío de Kith'ix (morado, estrellas y agujero negro) · 12.1.7: Núcleo del Mundo (oro con destellos)
    el.innerHTML = `<button type="button" role="menuitem" class="pn-opt pn-void" data-pn-patch="12.1.5"><span class="pn-fx" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span><span class="pn-t">${L('Contenido del 12.1.5', '12.1.5 content')}</span></button>`
      + `<button type="button" role="menuitem" class="pn-opt pn-gold" data-pn-patch="12.1.7"><span class="pn-fx" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span class="pn-t">${L('Contenido del 12.1.7', '12.1.7 content')}</span></button>`;
    document.body.appendChild(el);
    const w = Math.max(r.width, 250);
    el.style.minWidth = w + 'px';
    el.style.left = Math.max(8, Math.min(r.left, innerWidth - el.offsetWidth - 8)) + 'px';
    el.style.bottom = (innerHeight - r.top + 8) + 'px';
    btn.setAttribute('aria-expanded', 'true');
    pop = el;
    el.querySelector('.pn-opt')?.focus();
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

'use strict';

// Parche 12.2 de Midnight («Midnight: Eclipse»): botón de «Próximamente» en el inicio y panel con lo que Blizzard ha mostrado.
// Fuentes: resumen oficial de Blizzard del panel What's Next (BlizzCon 2026), noticias de Wowhead y el avance de @Warcraft_ES. Blizzard no ha dado fecha de salida.
const Patch122 = (() => {
  const L = tr;
  const LINK = 'https://x.com/Warcraft_ES/status/2110641846351237267';

  // lo que muestra el avance (4 imágenes del anuncio): título, subtítulo, descripción
  const CARDS = () => [
    {
      img: 'patch/122-avance.jpg',
      title: 'Midnight: Eclipse',
      sub: L('Avance del parche 12.2', 'Patch 12.2 preview'),
      text: L('El próximo capítulo de Midnight. El anuncio habla de una nueva zona, una daga legendaria y la lucha por proteger el alma-mundo.', 'The next chapter of Midnight. The announcement mentions a new zone, a legendary dagger and the fight to protect the world-soul.'),
    },
    {
      img: 'patch/122-thraegar.jpg',
      title: L('Bastión de Thraegar', 'Thraegar\'s Bastion'),
      sub: L('Mazmorra de tres jefes', 'Three-boss dungeon'),
      text: L('Nueva mazmorra de tres jefes. El avance muestra un gólem de cristal dorado y azul como uno de sus habitantes.', 'New three-boss dungeon. The preview shows a gold and blue crystal golem as one of its inhabitants.'),
    },
    {
      img: 'patch/122-nucleo.jpg',
      title: L('El Núcleo del Mundo', 'The World\'s Core'),
      sub: L('Banda de ocho jefes', 'Eight-boss raid'),
      text: L('Nueva banda de ocho jefes: una cámara con una esfera de fuego suspendida sobre una gran plataforma de mecanismos.', 'New eight-boss raid: a chamber with a sphere of fire hanging over a large platform of mechanisms.'),
    },
    {
      img: 'patch/122-filo.jpg',
      title: L('Filo de Medianoche', 'Midnight\'s Edge'),
      sub: L('Nueva daga legendaria', 'New legendary dagger'),
      text: L('Daga legendaria de una mano que liga al recogerla. La imagen enseña su descripción parcialmente tapada, con efectos relacionados con el Vacío (Void).', 'One-handed legendary dagger that binds when picked up. The image shows its description partly covered, with effects related to the Void.'),
    },
  ];

  function homeHTML() {
    return `<button type="button" class="pn-btn pn-soon" data-p22="open"><span>${L('Parche 12.2', 'Patch 12.2')}</span><em class="pn-soon-tag">${L('Próximamente', 'Coming soon')}</em></button>`;
  }


  const BZ = () => (S.lang === 'es' ? 'https://news.blizzard.com/es-es/article/24298591/world-of-warcraft-midnight-whats-next-panel-recap' : 'https://news.blizzard.com/en-us/article/24298591/world-of-warcraft-midnight-whats-next-panel-recap');
  const WH = {
    recap: 'https://www.wowhead.com/blue-tracker/news/us/world-of-warcraft-midnight-what-s-next-panel-recap-world-of-warcraft-blizzard-24298591',
    announce: 'https://www.wowhead.com/news/midnight-eclipse-announced-as-patch-12-2-reveal-cinematic-382820',
    worldcore: 'https://www.wowhead.com/news/the-final-raid-of-midnight-the-worldcore-382844',
    top5: 'https://www.wowhead.com/news/new-top-5-mythic-achievement-and-spec-based-achievements-coming-in-patch-12-2-382846',
    noctinaxx: 'https://www.wowhead.com/news/noctinaxx-a-giant-azerite-bat-is-the-lair-world-boss-for-patch-12-2-382886',
    overview: 'https://www.wowhead.com/guide/midnight/patch-12-2-overview-features-activities-rewards',
    talebound: 'https://www.wowhead.com/news/talebound-a-new-game-mode-in-patch-12-1-7-382843',
    echoes: 'https://www.wowhead.com/blue-tracker/news/us/midnight-echoes-of-the-worldcore-overview-world-of-warcraft-blizzard-news-24310659',
  };
  const lnk = (url, label) => `<a href="#" data-p22-link="${esc(url)}">${esc(label)}</a>`;
  const ICONS = {
    overview: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><circle cx="12" cy="16.5" r=".6"/>',
    zone: '<path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5z"/><path d="M9 4v13"/><path d="M15 6.5v13"/>',
    raids: '<path d="M4 20V9l4-3 4 3 4-3 4 3v11"/><path d="M4 20h16"/><path d="M10 20v-5h4v5"/>',
    dungeons: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8"/><path d="m16 7 3 3"/><path d="m14 9 2 2"/>',
    delves: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    prey: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    pvp: '<path d="m4 4 7 7"/><path d="m4 8 3-3"/><path d="m20 4-7 7"/><path d="m20 8-3-3"/><path d="m11 11-6 6 2 2 6-6"/><path d="m13 11 6 6-2 2-6-6"/>',
    housing: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
    legendary: '<path d="M14 4h6v6L10 20l-6-6z"/><path d="m8 16-3 3"/><path d="M13 7l4 4"/>',
    classes: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c.6-4 3.6-6.2 7.5-6.2s6.9 2.2 7.5 6.2"/>',
    roadmap: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6"/>',
    sources: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  };
  const icon = (k) => `<svg class="navic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>`;
  const ul = (arr) => `<ul class="pn-list">${arr.map((x) => `<li>${x}</li>`).join('')}</ul>`;
  const wh = (arr) => `<h3 class="pn-h">${L('Lo que ha confirmado Wowhead', 'What Wowhead has confirmed')}</h3><ul class="pn-list p22-wh">${arr.map((w) => `<li>${esc(w[1])}<br>${lnk(w[0], w[2])}</li>`).join('')}</ul>`;
  const bz = () => `<p class="foot">${L('Fuente oficial:', 'Official source:')} ${lnk(BZ(), L('Resumen del panel «What\'s Next» de Midnight · Blizzard', 'Midnight “What\'s Next” panel recap · Blizzard'))}</p>`;
  const none = (es, en) => `<p class="foot">${L(es, en)}</p>`;

  const W = {
    announce: () => [WH.announce, L('Midnight: Eclipse se anuncia como el parche 12.2, con una cinemática de presentación, centrado en Xal\'atath y su objetivo (12 de septiembre de 2026).', 'Midnight: Eclipse is announced as Patch 12.2 with a reveal cinematic, focused on Xal\'atath and her objective (September 12, 2026).'), 'Midnight: Eclipse Announced as Patch 12.2 - Reveal Cinematic'],
    worldcore: () => [WH.worldcore, L('La banda final de Midnight es el Núcleo del Mundo (The Worldcore): ocho jefes y un último enfrentamiento contra Xal\'atath, con enemigos del Vacío, constructos titánicos y azerita viva (12 de septiembre de 2026).', 'The final raid of Midnight is The Worldcore: eight bosses and a last stand against Xal\'atath, with Void enemies, Titan constructs and living Azerite (September 12, 2026).'), 'The Final Raid of Midnight: The Worldcore'],
    top5: () => [WH.top5, L('Llegan al 12.2 un nuevo logro de Mítica+ para el 5 % superior y logros por especialización (12 de septiembre de 2026).', 'A new top 5% Mythic+ achievement and spec-based achievements arrive in Patch 12.2 (September 12, 2026).'), 'New Top 5% Mythic+ Achievement & Spec-Based Achievements Coming in Patch 12.2'],
    noctinaxx: () => [WH.noctinaxx, L('Noctinaxx, un murciélago gigante de azerita, es el jefe de la guarida del 12.2; la guarida es El Almacén de Equipo (The Gearhold) (16 de septiembre de 2026).', 'Noctinaxx, a giant Azerite bat, is the Lair world boss of Patch 12.2; the lair is The Gearhold (September 16, 2026).'), 'Noctinaxx: A Giant Azerite Bat is the Lair World Boss for Patch 12.2'],
    recap: () => [WH.recap, L('Wowhead reproduce el resumen oficial de Blizzard del panel «What\'s Next» de la BlizzCon 2026, con todo el contenido de Eclipse y la Temporada 3.', 'Wowhead republishes Blizzard\'s official recap of the BlizzCon 2026 “What\'s Next” panel, with all the Eclipse and Season 3 content.'), 'World of Warcraft: Midnight What\'s Next Panel Recap'],
    overview: () => [WH.overview, L('Guía de Wowhead con el resumen del parche 12.2: funciones, actividades y recompensas.', 'Wowhead guide with the Patch 12.2 overview: features, activities and rewards.'), 'Midnight Patch 12.2 Overview - Features, Activities, and Rewards'],
  };

  const ROADMAP = () => [
    [L('12.1.5 · Ya disponible', '12.1.5 · Live now'), L('«La promesa del mañana» (campaña), la banda de un jefe La liberación de Kith\'ix, Laberintos (experiencia tipo profundidades), la invasión aqir (evento exterior) y las Piedravenenos ascendentes (renovación de mitad de temporada).', '“The Promise of Tomorrow” (campaign), the single-boss raid The Unbinding of Kith\'ix, Labyrinths (Delve-like experience), the Aqir Invasion (outdoor event) and Ascendant Venomstones (mid-season refresh).')],
    [L('Ecos del Núcleo del Mundo · 12.1.7', 'Echoes of the Worldcore · 12.1.7'), L('Campaña «El regreso a Dornogal» (Xal\'atath ha abierto brecha en el Núcleo del Mundo), el nuevo modo de acción RPG JcE «Historias de leyenda» (Talebound: Refugioscuro, Bosque de Cardoverde, Expedición de Estelagrís y Arboleda de la Corte de la Noche), Lorewalking, Turbulent Timeways y el Omnium Folio. Avance en el RPP previsto para octubre; sin fecha de salida.', 'Story campaign “The Return to Dornogal” (Xal\'atath has breached the Worldcore), the new PvE action RPG mode Talebound (Darkhaven, Greenthistle Wood, Greywake\'s Expedition and Grove of the Night Court), Lorewalking, Turbulent Timeways and the Omnium Folio. PTR preview expected in October; no release date.')],
    [L('12.2 · Midnight: Eclipse', '12.2 · Midnight: Eclipse'), L('La última gran actualización de Midnight: Cámara del Manto, banda Núcleo del Mundo, guarida Almacén de Equipo, mazmorra Bastión de Thraegar, daga Filo de medianoche, modo agonía de Presa, aullidos radiantes, cámara de calibración, paladines renegados/elfos de la noche/trols y proyectos de hogares. Sin fecha anunciada.', 'The last major Midnight update: Mantle Vault, Worldcore raid, Gearhold lair, Thraegar\'s Stand dungeon, Midnight\'s Edge dagger, Prey Agony Mode, Radiant Screams, Calibration Chamber, Forsaken/Night Elf/Troll Paladins and Housing endeavors. No date announced.')],
    [L('Temporada 3', 'Season 3'), L('Empieza poco después del lanzamiento de Eclipse: nueva rotación de Mítica+, némesis de profundidades Astalor Jurasangre, nueva temporada JcJ y recompensas por especialización para el 1 % y el 5 % superior.', 'Starts shortly after Eclipse launches: new Mythic+ rotation, Delve nemesis Astalor Bloodsworn, new PvP season and per-specialization rewards for the top 1% and 5%.')],
    [L('12.2.5', '12.2.5'), L('Transfiguración de equipo entre tipos de armadura sin restricciones. Sin fecha.', 'Transmog gear across armor types without restriction. No date.')],
    [L('Wrath of the Lich King Remix', 'Wrath of the Lich King Remix'), L('Nuevo remix: «Prepárate para volver a Rasganorte y abrazar el poder de la Plaga». Sin fecha.', 'New Remix: “Prepare to return to Northrend and embrace the power of the Scourge”. No date.')],
  ];

  const TABS = () => {
    const cards = CARDS().map((c) => `<article class="p22-card">
        <img src="${c.img}" alt="${esc(c.title)}" loading="lazy">
        <div class="p22-txt"><b>${esc(c.title)}</b><small>${esc(c.sub)}</small><p>${esc(c.text)}</p></div></article>`).join('');
    return [
      ['overview', L('Resumen', 'Overview'), `
        <p class="p22-lead">${L('Midnight: Eclipse es el parche 12.2: la última gran actualización de contenido de Midnight, centrada en el conflicto entre la Luz y el Vacío con Xal\'atath.', 'Midnight: Eclipse is Patch 12.2: the final major content update for Midnight, focused on the Light vs. Void conflict with Xal\'atath.')}</p>
        ${ul([
          L('<b>Estado:</b> anunciado en la BlizzCon el 12 de septiembre de 2026. Blizzard no ha dado fecha de salida, por eso sale como «Próximamente».', '<b>Status:</b> announced at BlizzCon on September 12, 2026. Blizzard has not given a release date, so it is shown as “Coming soon”.'),
          L('<b>Temporada 3:</b> empieza «poco después del lanzamiento de Eclipse», sin fecha.', '<b>Season 3:</b> starts “shortly after the launch of Eclipse”, no date.'),
          L('<b>Cambios de clase:</b> Blizzard y Wowhead no han publicado ninguno para el 12.2 en las fuentes consultadas; WipeTime los añadirá cuando salgan.', '<b>Class changes:</b> Blizzard and Wowhead have not published any for 12.2 in the sources consulted; WipeTime will add them when they appear.'),
        ])}
        ${bz()}
        <div class="p22-grid">${cards}</div>
        ${wh([W.announce(), W.recap(), W.overview()])}`],
      ['zone', L('Zona y mundo', 'Zone and world'), `
        ${ul([
          L('<b>Zona nueva: Cámara del Manto</b> (Mantle Vault), hogar de los thraegar, un bioma de piedra y azerita.', '<b>New zone: the Mantle Vault</b>, home of the Thraegar, a biome of stone and azerite.'),
          L('<b>Facción de la zona: Imperio Brechabisal</b> (Deepskar Empire), con kóbolds, troggs, drógbar y niffen.', '<b>Zone faction: the Deepskar Empire</b>, with kobolds, troggs, drogbar and niffen.'),
          L('<b>Exteriores: aullidos radiantes</b> (Radiant Screams), perturbaciones ligadas al sufrimiento del alma-mundo dentro de la Cámara del Manto.', '<b>Outdoors: Radiant Screams</b>, disturbances tied to the Worldsoul\'s outcries inside the Mantle Vault.'),
        ])}
        ${bz()}`],
      ['raids', L('Bandas y guaridas', 'Raids and lairs'), `
        ${ul([
          L('<b>Banda de 8 jefes: Núcleo del Mundo</b> (The Worldcore), con enemigos del Vacío y ensamblajes titánicos; el último jefe es Xal\'atath.', '<b>Eight-boss raid: The Worldcore</b>, with Void enemies and titan assemblies; the last boss is Xal\'atath.'),
          L('<b>Guarida: Almacén de Equipo</b> (The Gearhold), donde está <b>Noctinaxx</b>, un nuevo jefe de banda disponible en dificultad Mundo, Normal, Heroico y Mítico flexible.', '<b>Lair: The Gearhold</b>, where <b>Noctinaxx</b> awaits, a new raid boss available on World, Normal, Heroic and flexible Mythic.'),
        ])}
        ${bz()}
        ${wh([W.worldcore(), W.noctinaxx()])}`],
      ['mplus', L('Mazmorras y Mítica+', 'Dungeons and Mythic+'), `
        ${ul([
          L('<b>Mazmorra de 3 jefes: Bastión de Thraegar</b> (Thraegar\'s Stand), con Rajarriscos y el supervisor Sullk (Cragcleaver and Foreman Sullk), Monokk y Stenvarg el Inevitable (Stenvarg the Inevitable). Entra en la rotación de Mítica+ de la Temporada 3.', '<b>Three-boss dungeon: Thraegar\'s Stand</b>, with Cragcleaver and Foreman Sullk, Monokk and Stenvarg the Inevitable. It joins the Season 3 Mythic+ rotation.'),
          L('<b>Rotación de Mítica+ de la Temporada 3 (8 mazmorras):</b> Catacumbas Putrefactas, Puerto de Hierro, Cavernas Sanguinas, Núcleo Pétreo y Uldaman: Legado de Tyr (mazmorras de leyenda), Bancal del Magister y Cavernas de Maisara (vuelven con cambios) y Bastión de Thraegar.', '<b>Season 3 Mythic+ rotation (8 dungeons):</b> The Underrot, Iron Docks, Sanguine Depths, The Stonecore and Uldaman: Legacy of Tyr (Legacy dungeons), Magisters\' Terrace and Maisara Cavern (returning with changes) and Thraegar\'s Stand.'),
          L('<b>Recompensas de Mítica+:</b> nuevo nivel para el 5 % superior; las del 1 % y el 5 % se otorgan según tu clasificación dentro de tu especialización.', '<b>Mythic+ rewards:</b> a new tier for the top 5%; the top 1% and top 5% rewards are awarded based on your ranking within your specialization.'),
        ])}
        ${bz()}
        ${wh([W.top5()])}`],
      ['delves', L('Profundidades', 'Delves'), `
        ${ul([
          L('<b>Temporada 3:</b> continúa el viaje de Valeera Sanguinar con un nivel máximo más alto y nuevas curiosidades (Curios).', '<b>Season 3:</b> Valeera Sanguinar\'s journey continues with a higher level cap and new Curios.'),
          L('<b>Nuevo némesis: Astalor Jurasangre</b> (Astalor Bloodsworn), con desafíos opcionales y variantes de las profundidades existentes.', '<b>New Delve Nemesis: Astalor Bloodsworn</b>, plus additional variations on existing Delves.'),
        ])}
        ${bz()}`],
      ['prey', L('Presa', 'Prey'), `
        ${ul([L('<b>Modo agonía</b> (Agony Mode): la dificultad definitiva de Presa, en la Cámara del Manto.', '<b>Agony Mode</b>: the final Prey difficulty, in the Mantle Vault.')])}
        ${bz()}`],
      ['pvp', L('JcJ', 'PvP'), `
        ${ul([L('<b>Nueva temporada de JcJ</b> y un registro (Journey) de JcJ renovado con recompensas nuevas.', '<b>A new PvP season</b> and a refreshed PvP Journey with new rewards.')])}
        ${none('Blizzard no ha detallado más cambios de JcJ para el 12.2 en el resumen del panel.', 'Blizzard has not detailed further PvP changes for 12.2 in the panel recap.')}
        ${bz()}`],
      ['housing', L('Hogares', 'Housing'), `
        ${ul([
          L('<b>Exposiciones</b> y <b>maniquíes</b> para decorar.', '<b>Showcase</b> and <b>mannequins</b> for decorating.'),
          L('<b>Copiar y pegar</b> y <b>selección múltiple</b> de adornos.', '<b>Copy-paste</b> and <b>multi-select</b> for décor.'),
          L('Comprar <b>copias extra</b> de adornos desde tu propio hogar.', 'Buying <b>extra copies</b> of décor from your own home.'),
          L('<b>Cuatro nuevos proyectos</b> de hogares (endeavors).', '<b>Four new Housing endeavors</b>.'),
        ])}
        ${bz()}`],
      ['legendary', L('Legendaria y objetos', 'Legendary and items'), `
        ${ul([
          L('<b>Nueva legendaria: Filo de medianoche</b> (Midnight\'s Edge), una daga para taumaturgo: la primera legendaria de Midnight y de la Saga del alma-mundo. Se obtiene en la banda Núcleo del Mundo.', '<b>New legendary: Midnight\'s Edge</b>, a caster dagger: the first Legendary of Midnight and of the Worldsoul Saga. It is obtained from the Worldcore raid.'),
          L('<b>Actualización 12.2.5:</b> podrás transfigurar el equipo entre tipos de armadura sin restricciones. Sin fecha.', '<b>Content update 12.2.5:</b> you will be able to transmog gear across armor types without restriction. No date.'),
        ])}
        ${bz()}`],
      ['classes', L('Clases y razas', 'Classes and races'), `
        ${ul([
          L('<b>Paladines nuevos:</b> los Renegados, los elfos de la noche y los trols podrán ser paladines.', '<b>New Paladins:</b> Forsaken, Night Elf and Troll characters will be able to be Paladins.'),
          L('<b>Cámara de calibración</b> (Calibration Chamber): prueba tus rotaciones contra muñecos-diana, con reinicio de tiempos de reutilización y mejoras de banda.', '<b>Calibration Chamber</b>: test your rotations against target dummies, with cooldown resets and raid buffs.'),
        ])}
        ${none('Cambios de clase y talentos: Blizzard y Wowhead no han publicado ninguno para el 12.2 en las fuentes consultadas.', 'Class and talent changes: Blizzard and Wowhead have not published any for 12.2 in the sources consulted.')}
        ${bz()}`],
      ['roadmap', L('Roadmap', 'Roadmap'), `
        <ol class="p22-road">${ROADMAP().map((r) => `<li><b>${esc(r[0])}</b><span>${esc(r[1])}</span></li>`).join('')}</ol>
        ${bz()}
        <p class="foot">${L('Más información sobre Ecos del Núcleo del Mundo:', 'More about Echoes of the Worldcore:')} ${lnk(WH.echoes, L('Midnight: Echoes of the Worldcore Overview · Blizzard (vía Wowhead)', 'Midnight: Echoes of the Worldcore Overview · Blizzard (via Wowhead)'))} · ${lnk(WH.talebound, 'Talebound: A New Game Mode in Patch 12.1.7 · Wowhead')}</p>`],
      ['sources', L('Fuentes', 'Sources'), `
        <h3 class="pn-h">Blizzard</h3>
        <ul class="pn-list"><li>${lnk(BZ(), L('Resumen del panel «What\'s Next» de Midnight (BlizzCon 2026)', 'Midnight “What\'s Next” panel recap (BlizzCon 2026)'))}</li><li>${lnk(WH.echoes, 'Midnight: Echoes of the Worldcore Overview (vía Wowhead)')}</li></ul>
        <h3 class="pn-h">Wowhead</h3>
        <ul class="pn-list">${[W.announce(), W.worldcore(), W.top5(), W.noctinaxx(), W.recap(), W.overview()].map((w) => `<li>${lnk(w[0], w[2])}</li>`).join('')}<li>${lnk(WH.talebound, 'Talebound: A New Game Mode in Patch 12.1.7')}</li></ul>
        <h3 class="pn-h">${L('Avance en redes', 'Preview on social media')}</h3>
        <ul class="pn-list"><li>${lnk(LINK, L('Avance del parche 12.2 · @Warcraft_ES en X', 'Patch 12.2 preview · @Warcraft_ES on X'))}</li></ul>
        <p class="foot">${L('Los textos están traducidos y resumidos por WipeTime; los nombres en español son los de la página oficial de Blizzard en español. De las noticias de Wowhead solo se pudo leer el titular y la fecha, por eso cada una se resume con eso y enlaza al artículo.', 'Texts are translated and summarized by WipeTime; Spanish names are those of Blizzard\'s official Spanish page. Only the headline and date of the Wowhead news could be read, so each is summarized with that and links to the article.')}</p>`],
    ];
  };

  function open() {
    let dlg = document.getElementById('patch122Dlg');
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.id = 'patch122Dlg';
      dlg.className = 'modal wide settings-dlg pn-dlg';
      document.body.appendChild(dlg);
      dlg.addEventListener('click', (ev) => {
        const link = ev.target.closest('[data-p22-link]');
        if (link) { ev.preventDefault(); window.api.openExternal(link.dataset.p22Link); return; }
        const tab = ev.target.closest('[data-p22-tab]');
        if (tab) {
          dlg.querySelectorAll('[data-p22-tab]').forEach((b) => b.classList.toggle('on', b === tab));
          dlg.querySelectorAll('[data-p22-pane]').forEach((x) => { x.hidden = x.dataset.p22Pane !== tab.dataset.p22Tab; });
          dlg.querySelector('.pn-body')?.scrollTo(0, 0);
          return;
        }
        if (ev.target.closest('[data-p22-close]') || ev.target === dlg) dlg.close();
      });
    }
    const tabs = TABS();
    dlg.innerHTML = `<div class="set-wrap"><div class="set-nav"><h2>${L('Parche 12.2', 'Patch 12.2')}</h2>
        <span class="pn-soon-tag big">${L('Próximamente', 'Coming soon')}</span>
        ${tabs.map(([id, label], i) => `<button type="button" class="set-tab p22-tab${i === 0 ? ' on' : ''}" data-p22-tab="${id}">${icon(id === 'mplus' ? 'dungeons' : id)}<span>${esc(label)}</span></button>`).join('')}
        <span class="grow"></span><button type="button" class="btn ghost" data-p22-close>${L('Cerrar', 'Close')}</button></div>
      <div class="set-body pn-body">
        <div class="pn-ban">Midnight: Eclipse · ${L('anunciado en la BlizzCon el 12 de septiembre de 2026', 'announced at BlizzCon on September 12, 2026')}</div>
        ${tabs.map(([id, label, html], i) => `<section class="p22-pane" data-p22-pane="${id}"${i === 0 ? '' : ' hidden'}><h3 class="pn-h p22-title">${esc(label)}</h3>${html}</section>`).join('')}
      </div></div>`;
    if (!dlg.open) dlg.showModal();
    dlg.querySelector('.pn-body')?.scrollTo(0, 0);
  }

  document.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-p22="open"]')) open();
  });

  return { homeHTML, open };
})();

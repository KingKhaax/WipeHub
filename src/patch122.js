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

  const BLIZZARD = () => [
    [L('<b>Eclipse es la última gran actualización de contenido de Midnight</b>, centrada en el conflicto entre la Luz y el Vacío con Xal\'atath.', '<b>Eclipse is the final major content update for Midnight</b>, focused on the Light vs. Void conflict with Xal\'atath.')],
    [L('<b>Zona nueva: Cámara del Manto</b> (Mantle Vault), hogar de los thraegar, un bioma de piedra y azerita. Facción de la zona: <b>Imperio Brechabisal</b> (Deepskar Empire), con kóbolds, troggs, drógbar y niffen.', '<b>New zone: the Mantle Vault</b>, home of the Thraegar, a biome of stone and azerite. Zone faction: the <b>Deepskar Empire</b>, with kobolds, troggs, drogbar and niffen.')],
    [L('<b>Banda de 8 jefes: Núcleo del Mundo</b> (The Worldcore), con enemigos del Vacío y ensamblajes titánicos; el último jefe es Xal\'atath.', '<b>Eight-boss raid: The Worldcore</b>, with Void enemies and titan assemblies; the last boss is Xal\'atath.')],
    [L('<b>Guarida: Almacén de Equipo</b> (The Gearhold), donde está <b>Noctinaxx</b>, un nuevo jefe de banda disponible en dificultad Mundo, Normal, Heroico y Mítico flexible.', '<b>Lair: The Gearhold</b>, where <b>Noctinaxx</b> awaits, a new raid boss available on World, Normal, Heroic and flexible Mythic.')],
    [L('<b>Mazmorra de 3 jefes: Bastión de Thraegar</b> (Thraegar\'s Stand), con Rajarriscos y el supervisor Sullk (Cragcleaver and Foreman Sullk), Monokk y Stenvarg el Inevitable (Stenvarg the Inevitable). Entra en la rotación de Mítica+ de la Temporada 3.', '<b>Three-boss dungeon: Thraegar\'s Stand</b>, with Cragcleaver and Foreman Sullk, Monokk and Stenvarg the Inevitable. It joins the Season 3 Mythic+ rotation.')],
    [L('<b>Nueva legendaria: Filo de medianoche</b> (Midnight\'s Edge), una daga para taumaturgo: la primera legendaria de Midnight y de la Saga del alma-mundo. Se obtiene en la banda Núcleo del Mundo.', '<b>New legendary: Midnight\'s Edge</b>, a caster dagger: the first Legendary of Midnight and of the Worldsoul Saga. It is obtained from the Worldcore raid.')],
    [L('<b>Presa: modo agonía</b> (Agony Mode), la dificultad definitiva, en la Cámara del Manto.', '<b>Prey: Agony Mode</b>, the final Prey difficulty, in the Mantle Vault.')],
    [L('<b>Exteriores: aullidos radiantes</b> (Radiant Screams), perturbaciones ligadas al sufrimiento del alma-mundo dentro de la Cámara del Manto.', '<b>Outdoors: Radiant Screams</b>, disturbances tied to the Worldsoul\'s outcries inside the Mantle Vault.')],
    [L('<b>Cámara de calibración</b> (Calibration Chamber): prueba tus rotaciones contra muñecos-diana, con reinicio de tiempos de reutilización y mejoras de banda.', '<b>Calibration Chamber</b>: test your rotations against target dummies, with cooldown resets and raid buffs.')],
    [L('<b>Paladines nuevos:</b> los Renegados, los elfos de la noche y los trols podrán ser paladines.', '<b>New Paladins:</b> Forsaken, Night Elf and Troll characters will be able to be Paladins.')],
    [L('<b>Hogares:</b> exposiciones, maniquíes, copiar y pegar y selección múltiple de adornos, comprar copias extra desde tu hogar y cuatro nuevos proyectos.', '<b>Housing:</b> showcase, mannequins, copy-paste and multi-select for décor, buying extra décor copies from your home, and four new endeavors.')],
    [L('<b>JcJ:</b> nueva temporada y un registro (Journey) renovado con recompensas nuevas.', '<b>PvP:</b> a new season and a refreshed PvP Journey with new rewards.')],
  ];

  const SEASON3 = () => [
    [L('<b>Rotación de Mítica+ (8 mazmorras):</b> Catacumbas Putrefactas, Puerto de Hierro, Cavernas Sanguinas, Núcleo Pétreo y Uldaman: Legado de Tyr (mazmorras de leyenda), Bancal del Magister y Cavernas de Maisara (vuelven con cambios) y Bastión de Thraegar.', '<b>Mythic+ rotation (8 dungeons):</b> The Underrot, Iron Docks, Sanguine Depths, The Stonecore and Uldaman: Legacy of Tyr (Legacy dungeons), Magisters\' Terrace and Maisara Cavern (returning with changes) and Thraegar\'s Stand.')],
    [L('<b>Recompensas de Mítica+:</b> nuevo nivel para el 5 % superior; las del 1 % y el 5 % se otorgan según tu clasificación dentro de tu especialización.', '<b>Mythic+ rewards:</b> a new tier for the top 5%; the top 1% and top 5% rewards are awarded based on your ranking within your specialization.')],
    [L('<b>Profundidades:</b> continúa el viaje de Valeera Sanguinar con un nivel máximo más alto y nuevas curiosidades; nuevo némesis, Astalor Jurasangre (Astalor Bloodsworn), y variantes de las profundidades existentes.', '<b>Delves:</b> Valeera Sanguinar\'s journey continues with a higher level cap and new Curios; new Delve Nemesis, Astalor Bloodsworn, plus variations on existing Delves.')],
    [L('<b>Cuándo:</b> la Temporada 3 empieza «poco después del lanzamiento de Eclipse». Blizzard no ha dado fecha.', '<b>When:</b> Season 3 starts “shortly after the launch of Eclipse”. Blizzard has not given a date.')],
  ];

  const WOWHEAD = () => [
    [WH.announce, L('Midnight: Eclipse se anuncia como el parche 12.2, con una cinemática de presentación, centrado en Xal\'atath y su objetivo (12 de septiembre de 2026).', 'Midnight: Eclipse is announced as Patch 12.2 with a reveal cinematic, focused on Xal\'atath and her objective (September 12, 2026).'), 'Midnight: Eclipse Announced as Patch 12.2 - Reveal Cinematic'],
    [WH.worldcore, L('La banda final de Midnight es el Núcleo del Mundo (The Worldcore): ocho jefes y un último enfrentamiento contra Xal\'atath, con enemigos del Vacío, constructos titánicos y azerita viva (12 de septiembre de 2026).', 'The final raid of Midnight is The Worldcore: eight bosses and a last stand against Xal\'atath, with Void enemies, Titan constructs and living Azerite (September 12, 2026).'), 'The Final Raid of Midnight: The Worldcore'],
    [WH.top5, L('Llegan al 12.2 un nuevo logro de Mítica+ para el 5 % superior y logros por especialización (12 de septiembre de 2026).', 'A new top 5% Mythic+ achievement and spec-based achievements arrive in Patch 12.2 (September 12, 2026).'), 'New Top 5% Mythic+ Achievement & Spec-Based Achievements Coming in Patch 12.2'],
    [WH.noctinaxx, L('Noctinaxx, un murciélago gigante de azerita, es el jefe de la guarida del 12.2; la guarida es El Almacén de Equipo (The Gearhold) (16 de septiembre de 2026).', 'Noctinaxx, a giant Azerite bat, is the Lair world boss of Patch 12.2; the lair is The Gearhold (September 16, 2026).'), 'Noctinaxx: A Giant Azerite Bat is the Lair World Boss for Patch 12.2'],
    [WH.recap, L('Wowhead reproduce el resumen oficial de Blizzard del panel «What\'s Next» de la BlizzCon 2026, con todo el contenido de Eclipse y la Temporada 3.', 'Wowhead republishes Blizzard\'s official recap of the BlizzCon 2026 “What\'s Next” panel, with all the Eclipse and Season 3 content.'), 'World of Warcraft: Midnight What\'s Next Panel Recap'],
    [WH.overview, L('Guía de Wowhead con el resumen del parche 12.2: funciones, actividades y recompensas.', 'Wowhead guide with the Patch 12.2 overview: features, activities and rewards.'), 'Midnight Patch 12.2 Overview - Features, Activities, and Rewards'],
  ];

  const ROADMAP = () => [
    [L('12.1.5 · Ya disponible', '12.1.5 · Live now'), L('«La promesa del mañana» (campaña), la banda de un jefe La liberación de Kith\'ix, Laberintos (experiencia tipo profundidades), la invasión aqir (evento exterior) y las Piedravenenos ascendentes (renovación de mitad de temporada).', '“The Promise of Tomorrow” (campaign), the single-boss raid The Unbinding of Kith\'ix, Labyrinths (Delve-like experience), the Aqir Invasion (outdoor event) and Ascendant Venomstones (mid-season refresh).')],
    [L('Ecos del Núcleo del Mundo · 12.1.7', 'Echoes of the Worldcore · 12.1.7'), L('Campaña «El regreso a Dornogal» (Xal\'atath ha abierto brecha en el Núcleo del Mundo), el nuevo modo de acción RPG JcE «Historias de leyenda» (Talebound: Refugioscuro, Bosque de Cardoverde, Expedición de Estelagrís y Arboleda de la Corte de la Noche), Lorewalking, Turbulent Timeways y el Omnium Folio. Avance en el RPP previsto para octubre; sin fecha de salida.', 'Story campaign “The Return to Dornogal” (Xal\'atath has breached the Worldcore), the new PvE action RPG mode Talebound (Darkhaven, Greenthistle Wood, Greywake\'s Expedition and Grove of the Night Court), Lorewalking, Turbulent Timeways and the Omnium Folio. PTR preview expected in October; no release date.')],
    [L('12.2 · Midnight: Eclipse', '12.2 · Midnight: Eclipse'), L('La última gran actualización de Midnight: Cámara del Manto, banda Núcleo del Mundo, guarida Almacén de Equipo, mazmorra Bastión de Thraegar, daga Filo de medianoche, modo agonía de Presa, aullidos radiantes, cámara de calibración, paladines renegados/elfos de la noche/trols y proyectos de hogares. Sin fecha anunciada.', 'The last major Midnight update: Mantle Vault, Worldcore raid, Gearhold lair, Thraegar\'s Stand dungeon, Midnight\'s Edge dagger, Prey Agony Mode, Radiant Screams, Calibration Chamber, Forsaken/Night Elf/Troll Paladins and Housing endeavors. No date announced.')],
    [L('Temporada 3', 'Season 3'), L('Empieza poco después del lanzamiento de Eclipse: nueva rotación de Mítica+, némesis de profundidades Astalor Jurasangre, nueva temporada JcJ y recompensas por especialización para el 1 % y el 5 % superior.', 'Starts shortly after Eclipse launches: new Mythic+ rotation, Delve nemesis Astalor Bloodsworn, new PvP season and per-specialization rewards for the top 1% and 5%.')],
    [L('12.2.5', '12.2.5'), L('Transfiguración de equipo entre tipos de armadura sin restricciones. Sin fecha.', 'Transmog gear across armor types without restriction. No date.')],
    [L('Wrath of the Lich King Remix', 'Wrath of the Lich King Remix'), L('Nuevo remix: «Prepárate para volver a Rasganorte y abrazar el poder de la Plaga». Sin fecha.', 'New Remix: “Prepare to return to Northrend and embrace the power of the Scourge”. No date.')],
  ];

  function detailsHTML() {
    const li = (arr) => arr.map((x) => `<li>${x[0]}</li>`).join('');
    return `<h3 class="pn-h">${L('Confirmado por Blizzard · Eclipse (12.2)', 'Confirmed by Blizzard · Eclipse (12.2)')}</h3>
        <ul class="pn-list">${li(BLIZZARD())}</ul>
        <p class="foot">${L('Fuente oficial:', 'Official source:')} ${lnk(BZ(), L('Resumen del panel «What\'s Next» de Midnight · Blizzard', 'Midnight “What\'s Next” panel recap · Blizzard'))}</p>
        <h3 class="pn-h">${L('Temporada 3 (empieza poco después de Eclipse)', 'Season 3 (starts shortly after Eclipse)')}</h3>
        <ul class="pn-list">${li(SEASON3())}</ul>
        <h3 class="pn-h">${L('Lo que ha confirmado Wowhead sobre el 12.2', 'What Wowhead has confirmed about 12.2')}</h3>
        <ul class="pn-list p22-wh">${WOWHEAD().map((w) => `<li>${esc(w[1])}<br>${lnk(w[0], w[2])}</li>`).join('')}</ul>
        <h3 class="pn-h">${L('Roadmap de Midnight', 'Midnight roadmap')}</h3>
        <ol class="p22-road">${ROADMAP().map((r) => `<li><b>${esc(r[0])}</b><span>${esc(r[1])}</span></li>`).join('')}</ol>
        <p class="foot">${L('Más información sobre Ecos del Núcleo del Mundo:', 'More about Echoes of the Worldcore:')} ${lnk(WH.echoes, L('Midnight: Echoes of the Worldcore Overview · Blizzard (vía Wowhead)', 'Midnight: Echoes of the Worldcore Overview · Blizzard (via Wowhead)'))} · ${lnk(WH.talebound, 'Talebound: A New Game Mode in Patch 12.1.7 · Wowhead')}</p>
        <p class="foot">${L('Cambios de clase: Blizzard y Wowhead no han publicado ninguno para el 12.2 en las fuentes consultadas; WipeTime los añadirá cuando salgan. Los textos están traducidos y resumidos por WipeTime; los nombres en español son los de la página oficial de Blizzard en español.', 'Class changes: Blizzard and Wowhead have not published any for 12.2 in the sources consulted; WipeTime will add them when they appear. Texts are translated and summarized by WipeTime; Spanish names are those of Blizzard\'s official Spanish page.')}</p>`;
  }

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
        if (ev.target.closest('[data-p22-close]') || ev.target === dlg) dlg.close();
      });
    }
    const cards = CARDS().map((c) => `<article class="p22-card">
        <img src="${c.img}" alt="${esc(c.title)}" loading="lazy">
        <div class="p22-txt"><b>${esc(c.title)}</b><small>${esc(c.sub)}</small><p>${esc(c.text)}</p></div></article>`).join('');
    dlg.innerHTML = `<div class="set-wrap"><div class="set-nav"><h2>${L('Parche 12.2', 'Patch 12.2')}</h2>
        <span class="pn-soon-tag big">${L('Próximamente', 'Coming soon')}</span>
        <span class="grow"></span><button type="button" class="btn ghost" data-p22-close>${L('Cerrar', 'Close')}</button></div>
      <div class="set-body pn-body">
        <div class="pn-ban">Midnight: Eclipse · ${L('anunciado en la BlizzCon el 12 de septiembre de 2026', 'announced at BlizzCon on September 12, 2026')}</div>
        <p class="p22-lead">${L('Explora una nueva zona, hazte con la daga legendaria y lucha para proteger el alma-mundo.', 'Explore a new zone, get the legendary dagger and fight to protect the world-soul.')}</p>
        <div class="p22-grid">${cards}</div>
        ${detailsHTML()}
        <h3 class="pn-h">${L('Avance de @Warcraft_ES', '@Warcraft_ES preview')}</h3>
        <ul class="pn-list"><li><a href="#" data-p22-link="${LINK}">${L('Avance del parche 12.2 · @Warcraft_ES en X', 'Patch 12.2 preview · @Warcraft_ES on X')}</a></li></ul>
        <p class="foot">${L('Los textos están resumidos por WipeTime a partir del anuncio; las imágenes son del propio avance.', 'Texts are summarized by WipeTime from the announcement; the images are from the preview itself.')}</p>
      </div></div>`;
    if (!dlg.open) dlg.showModal();
    dlg.querySelector('.pn-body')?.scrollTo(0, 0);
  }

  document.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-p22="open"]')) open();
  });

  return { homeHTML, open };
})();

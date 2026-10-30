'use strict';

// Historial de versiones de WipeHub (Ajustes → Versión). La más reciente arriba.
// Cada entrada agrupa varias versiones pequeñas en una sola «versión» con un resumen y sus cambios por secciones (icono de WoW, título y viñetas).
// Se numera con la última versión del grupo. Los cambios que solo tocan colores, tamaños o ajustes internos no se cuentan.
// Estructura: { v, date, es: { intro, sections: [[icono, título, [viñetas]]] }, en: { ... } }
const RELEASES = [
  { v: '2.12.32', date: '2026-10-29',
    es: { intro: 'Los personajes muestran su nivel y su Ilvl con el color de su equipo y se pueden ordenar, el panel del parche 12.1.7 se completa y los cambios de clase llegan hasta el 27 de octubre.', sections: [
      ['achievement_bg_winwsg', 'Personajes', [
        'Cada tarjeta muestra el nivel del personaje (en un color neutro) y su Ilvl, coloreado como un parse según el equipo: verde si todo es verde, azul si hay piezas azules, morado si todo es épico Normal/Heroico y rosa (parse 99) si todo es Mítico. Las crafteadas con blasones míticos cuentan como Míticas.',
        'Nuevo selector «Ordenar por»: orden de añadido, nombre, Ilvl, nivel o clase. Se recuerda tu elección.',
        '«Tus personajes» ya no se vacía cuando Warcraft Logs o Blizzard no responden: lo guardado sale al instante con su última ficha y se actualiza cuando llegan datos nuevos. La lista tiene además una copia de seguridad.',
        '«Añadir un personaje» y «Añadir guild» usan las mismas barras que el buscador. El reino que escribes se conserva y, tras pulsar Intro, sigues escribiendo sin perder el foco.',
        'El ranking de la guild tarda menos (pide a los jugadores de tres en tres) y ya no deja jugadores fuera cuando Warcraft Logs responde con error: reintenta y, si algo falla, no guarda el resultado incompleto. Los datos guardados se renuevan cada 3 horas.',
        'En el ranking de la guild, las columnas Nombre y Avg se quedan fijas a la izquierda al desplazarte hacia los demás jefes, en daño, tanques y sanadores.',
        'En la tabla de parses por jefe de un log (DPS, Tanks y Healers), los nombres y la media se quedan fijos a la izquierda cuando te desplazas hacia los demás jefes.',
        'Los grupos de las tablas de jugadores se llaman DPS, Tanks y Healers, y el número de jugadores tiene el mismo tamaño que el título.',
        'La vista avanzada también usa DPS, Tanks y Healers como títulos, con el contador del mismo tamaño.',
        'En la vista avanzada, el Total de cada jugador se ve con la cifra en negrita y clara, la unidad (M, B) con el color de acento y el número de intentos apagado.',
        'En la lista de intentos, cada jefe muestra su dificultad y número de intentos en verde si hay kill y en rojo si solo hay wipes (se quita el tic).',
        'Se quita la mini-gráfica de progreso junto a cada jefe en la lista de intentos.',
      ]],
      ['inv_misc_book_11', 'Parche 12.1.7', [
        'El botón de contenido recoge las novedades de las builds 70424 y 70493 del RPP: escenarios, jefes, personajes y logros de Historias de leyenda (Talebound), monturas, mascotas y objetos nuevos, adornos de hogar, Festival de Invierno, madrigueras y profesiones.',
      ]],
      ['spell_holy_crusade', 'Cambios de clase', [
        'Al día hasta el 27 de octubre: ajustes del mantenimiento semanal (Feral, Fuego, Restauración, Puntería, Sutileza, Aflicción y Destrucción) y hotfixes del 23 y del 26 de octubre (Chamán Mejora y Brujo), con nombres en español, iconos y tooltips.',
      ]],
      ['inv_gizmo_02', 'Apariencia', ['Nuevo fondo general con el arte de «Hope Shall Rise» (Midnight), oscurecido para que los paneles se lean bien.', 'El fondo ilustrado solo se ve en Inicio; el resto de apartados quedan limpios.']],
      ['inv_shield_04', 'Rendimiento y accesibilidad', ['Carga más rápida, sobre todo en el móvil: el fondo y el logo del parche pesan hasta un 85 % menos sin cambiar su aspecto y la web guarda mejor sus archivos para que las visitas siguientes vayan casi al instante.', 'Mejor accesibilidad y búsqueda: etiquetas para lectores de pantalla en los botones y selectores sin texto, un título principal por página y descripción de la web para los buscadores.', 'En el móvil, las animaciones continuas (borde de luz, halos y fondos en movimiento) se quedan quietas para ahorrar batería y hacer más fluido el desplazamiento. Se pueden reactivar en Ajustes → Apariencia → «Animaciones continuas en el móvil».', 'Las letras de la región (EU, US…) del reloj del servidor se leen mejor sobre el fondo oscuro.', 'En el tema claro, la insignia de versión y las etiquetas pequeñas en mayúsculas se leen mejor.']],
    ] },
    en: { intro: 'Characters show their level and Ilvl in the color of their gear and can be sorted, the 12.1.7 patch panel is completed and class changes are up to date through October 27.', sections: [
      ['achievement_bg_winwsg', 'Characters', [
        'Each card shows the character level (neutral color) and its Ilvl, colored like a parse by gear: green if all green, blue if any blue piece, purple if all Normal/Heroic epic and pink (parse 99) if all Mythic. Pieces crafted with Mythic crests count as Mythic.',
        'New “Sort by” selector: order added, name, Ilvl, level or class. Your choice is remembered.',
        '“Your characters” no longer empties when Warcraft Logs or Blizzard do not answer: saved characters show instantly with their last card and refresh when new data arrives. The list also has a backup copy.',
        '“Add a character” and “Add guild” use the same bars as the search form. The realm you type is kept and, after pressing Enter, you keep typing without losing focus.',
        'The guild ranking loads faster (players are requested three at a time) and no longer leaves players out when Warcraft Logs returns an error: it retries and, if anything fails, does not save the incomplete result. Saved data refreshes every 3 hours.',
        'In the guild ranking, the Name and Avg columns stay pinned on the left while you scroll to the other bosses, in damage, tanks and healers.',
        'In the per-boss parse table of a log (DPS, Tanks and Healers), the names and the average stay pinned on the left while you scroll to the other bosses.',
        'The player table groups are now called DPS, Tanks and Healers, and the player count is the same size as the title.',
        'The advanced view also uses DPS, Tanks and Healers as titles, with the counter at the same size.',
        'In the advanced view, each player’s Total shows a bold, bright figure, the unit (M, B) in the accent color and the number of tries muted.',
        'In the attempts list, each boss shows its difficulty and number of tries in green if there is a kill and in red if there are only wipes (the check mark is gone).',
        'The progress mini-chart next to each boss in the attempts list is removed.',
      ]],
      ['inv_misc_book_11', 'Patch 12.1.7', [
        'The content button collects what builds 70424 and 70493 of the PTR brought: scenarios, bosses, characters and achievements of Talebound, new mounts, pets and items, housing decor, Feast of Winter Veil, burrows and professions.',
      ]],
      ['spell_holy_crusade', 'Class changes', [
        'Up to date through October 27: the weekly maintenance tuning (Feral, Fire, Restoration, Marksmanship, Subtlety, Affliction and Destruction) and the October 23 and 26 hotfixes (Enhancement Shaman and Warlock), with translated names, icons and tooltips.',
      ]],
      ['inv_gizmo_02', 'Appearance', ['New general background with the “Hope Shall Rise” (Midnight) art, dimmed so panels stay readable.', 'The illustrated background now shows only on Home; the other sections stay clean.']],
      ['inv_shield_04', 'Performance and accessibility', ['Faster loading, especially on mobile: the background and the patch logo weigh up to 85% less without changing their look, and the web caches its files better so repeat visits are almost instant.', 'Better accessibility and search: screen-reader labels on buttons and selectors without text, one main heading per page and a site description for search engines.', 'On phones, ambient animations (light border, halos and moving backgrounds) stay still to save battery and scroll more smoothly. They can be turned back on in Settings → Appearance → “Ambient animations on phones”.', 'The region letters (EU, US…) of the server clock are easier to read on the dark background.', 'In the light theme, the version badge and the small uppercase labels are easier to read.']],
    ] } },

  { v: '2.12.10', date: '2026-10-23',
    es: { intro: 'WipeTime pasa a llamarse WipeHub y el comparador de guilds cuenta mejor los intentos.', sections: [
      ['inv_misc_note_06', 'Nuevo nombre', ['WipeTime ahora se llama WipeHub: nuevo nombre en la aplicación, los instaladores, la web y los repositorios.', 'Tus ajustes, personajes y claves se conservan y los enlaces wipetime:// siguen funcionando.']],
      ['inv_shirt_guildtabard_01', 'Comparar guilds', [
        'Los trys ya no se pierden cuando una noche de raid se subió a Warcraft Logs con otra zona (por ejemplo una mazmorra): antes un jefe podía salir con 1 try cuando la guild había hecho varios.',
        'Si Raider.IO registra la primera kill de una guild antes que su primer log en Warcraft Logs, el número sale como «≥» y aparece un aviso de que faltan logs.',
      ]],
    ] },
    en: { intro: 'WipeTime is now called WipeHub and the guild comparison counts attempts more accurately.', sections: [
      ['inv_misc_note_06', 'New name', ['WipeTime is now called WipeHub: new name in the app, installers, website and repositories.', 'Your settings, characters and keys are kept and wipetime:// links keep working.']],
      ['inv_shirt_guildtabard_01', 'Compare guilds', [
        'Tries are no longer lost when a raid night was uploaded to Warcraft Logs with another zone (for example a dungeon): a boss could show 1 try when the guild had made several.',
        'If Raider.IO records a guild’s first kill before its first Warcraft Logs log, the number shows as “≥” with a notice that logs are missing.',
      ]],
    ] } },

  { v: '2.11.5', date: '2026-10-23',
    es: { intro: 'El botón de la portada reúne los parches 12.1.5, 12.1.7 y 12.2 con todo lo que Blizzard y Wowhead han publicado.', sections: [
      ['inv_misc_book_11', 'Parche 12.2 (Midnight: Eclipse)', [
        'Un panel por apartados (Resumen, Zona y mundo, Bandas y guaridas, Mazmorras y Mítica+, Profundidades, Presa, JcJ, Hogares, Legendaria y objetos, Clases y razas, Roadmap y Fuentes) con lo confirmado por Blizzard y lo publicado por Wowhead, traducido con los nombres oficiales.',
        'El roadmap de Midnight: 12.1.5, Ecos del Núcleo del Mundo, 12.2, Temporada 3, 12.2.5 y el Remix de Wrath.',
      ]],
      ['inv_misc_book_11', 'Parche 12.1.7 (Ecos del Núcleo del Mundo)', ['Nuevo panel del RPP con la campaña «Regreso a Dornogal», Historias de leyenda (Talebound), Paseo por la historia, Líneas temporales turbulentas, Folio del Omnium y monturas.']],
      ['inv_misc_net_01', 'Botón «Contenido del 12.1.5 / 12.1.7»', ['Un solo botón con un desplegable hacia arriba para elegir el parche, con el vacío de Kith’ix (morado) para el 12.1.5 y el oro del Núcleo del Mundo para el 12.1.7, y un efecto de doble barrido de luz al pasar el ratón.']],
    ] },
    en: { intro: 'The home button gathers patches 12.1.5, 12.1.7 and 12.2 with everything Blizzard and Wowhead have published.', sections: [
      ['inv_misc_book_11', 'Patch 12.2 (Midnight: Eclipse)', [
        'A panel with sections (Overview, Zone and world, Raids and lairs, Dungeons and Mythic+, Depths, Prey, PvP, Housing, Legendary and items, Classes and races, Roadmap and Sources) with what Blizzard confirmed and Wowhead published, translated with the official names.',
        'The Midnight roadmap: 12.1.5, Echoes of the Worldcore, 12.2, Season 3, 12.2.5 and the Wrath Remix.',
      ]],
      ['inv_misc_book_11', 'Patch 12.1.7 (Echoes of the Worldcore)', ['New PTR panel with the “Return to Dornogal” campaign, Talebound, Lorewalking, Turbulent Timeways, the Omnium Folio and mounts.']],
      ['inv_misc_net_01', '“12.1.5 / 12.1.7 content” button', ['One button with an upward menu to pick the patch, with Kith’ix void purple for 12.1.5 and Worldcore gold for 12.1.7, and a double light sweep on hover.']],
    ] } },

  { v: '2.10.9', date: '2026-10-21',
    es: { intro: 'Pulido visual de toda la interfaz, versión para móvil y avisos claros cuando Warcraft Logs falla.', sections: [
      ['inv_gizmo_02', 'Interfaz', [
        'Barra superior con iconos de línea que siguen el color del tema y pestañas con un indicador que se desliza bajo la activa.',
        'Reportes recientes con el icono de la zona y sus kills y wipes; cifras clave (duración, resultado, DPS/HPS de la banda) sobre Daño y Sanación; tablas con cabecera fija y franja de color de clase.',
        'Lista de intentos con punto de kill/wipe y mini-gráfica de progreso; comparar logs con chips A/B y barra de diferencia; medallas del top 3 en los rankings; ajustes con secciones y vista previa del tema.',
      ]],
      ['inv_misc_net_01', 'Versión móvil', ['WipeTime se adapta al teléfono: la navegación pasa a una barra de pestañas abajo, la portada se apila, los ajustes se abren como una hoja desde abajo y las tablas se desplazan de lado en vez de cortarse.']],
      ['inv_shield_04', 'Avisos de Warcraft Logs', [
        'Si Warcraft Logs no da acceso, el aviso dice «Warcraft Logs no responde» y aclara que no es cosa tuya ni de WipeTime, con botón Reintentar.',
        'Durante un mantenimiento sale una franja ámbar bajo la barra superior que desaparece sola cuando su API vuelve.',
      ]],
      ['inv_misc_book_11', 'Nombres en español', ['Guía de mecánicas con los nombres de los archivos del juego: «Abismo Venenoso», «La Gruta Mareal» y «La liberación de Kith’ix».']],
    ] },
    en: { intro: 'Visual polish across the whole interface, a mobile version and clear notices when Warcraft Logs fails.', sections: [
      ['inv_gizmo_02', 'Interface', [
        'Top bar with line icons that follow the theme color and tabs with an indicator that slides under the active one.',
        'Recent reports with the zone icon and their kills and wipes; key figures (duration, result, raid DPS/HPS) above Damage and Healing; tables with sticky header and class color stripe.',
        'Attempt list with kill/wipe dot and a progress mini-chart; compare logs with A/B chips and a difference bar; top-3 medals in rankings; settings with sections and a theme preview.',
      ]],
      ['inv_misc_net_01', 'Mobile version', ['WipeTime adapts to phones: navigation moves to a bottom tab bar, the home page stacks, settings open as a sheet from the bottom and tables scroll sideways instead of being cut off.']],
      ['inv_shield_04', 'Warcraft Logs notices', [
        'If Warcraft Logs does not grant access, the notice says “Warcraft Logs is not responding” and makes clear it is not your fault or WipeTime’s, with a Retry button.',
        'During maintenance an amber strip appears under the top bar and disappears by itself when their API is back.',
      ]],
      ['inv_misc_book_11', 'Spanish names', ['Mechanics guide with the names from the Spanish game files: “Abismo Venenoso”, “La Gruta Mareal” and “La liberación de Kith’ix”.']],
    ] } },

  { v: '2.9.15', date: '2026-10-21',
    es: { intro: 'Informe general con más tarjetas, defensivos rediseñados con el segundo exacto de cada uso y una web más fiable con iconos que nunca fallan.', sections: [
      ['inv_misc_note_06', 'Informe general', [
        'Cuatro tarjetas nuevas en el Top 5 de la noche: uso de defensivos, daño recibido total, daño evitable y consumibles.',
        'El «Chivato» es una tabla compacta del mismo tamaño que las tarjetas, con las pociones y piedras de salud.',
        'La clasificación de jugadores por jefe se ordena por la media, por el nombre o por un jefe concreto, y muestra la especialización más jugada.',
      ]],
      ['ability_warrior_innerrage', 'Defensivos', [
        'Selector de jugador: la línea de tiempo y el registro exacto muestran solo lo que lanzó esa persona y sobre quién.',
        'Líneas de tiempo nuevas con carril de color, guías, iconos con el color de la clase y, bajo cada icono, el segundo exacto (m:ss.mmm) en que se usó. Al pasar el ratón sobre un icono solapado, sube y se resalta.',
      ]],
      ['inv_chest_plate04', 'Daño', ['La métrica «Solo jefe» da el mismo daño que el «Damage to Bosses» de Warcraft Logs, con sus propios parses.']],
      ['inv_shield_04', 'Fiabilidad', [
        'Si el servidor intermedio se satura, WipeTime reintenta solo y, si sigue igual, muestra un aviso claro con botón Reintentar. El informe general espacia sus consultas para no llegar a ese límite.',
        'Los iconos de habilidades y objetos se guardan en una caché propia que no se borra al actualizar y, si un servidor falla, se prueba el siguiente. Si ninguno sirve, sale un signo de interrogación en vez de un icono roto.',
        'Si cargas un log vacío sale un aviso en rojo en vez de una pantalla en blanco, y la barra superior queda fija al bajar.',
      ]],
    ] },
    en: { intro: 'A fuller night report, redesigned defensives with the exact second of each use and a more reliable web with icons that never fail.', sections: [
      ['inv_misc_note_06', 'Night report', [
        'Four new cards in the night’s Top 5: defensive usage, total damage taken, avoidable damage and consumables.',
        'The “Snitch” is a compact table the same size as the cards, with health potions and healthstones.',
        'The player ranking by boss sorts by average, name or a specific boss, and shows the most played specialization.',
      ]],
      ['ability_warrior_innerrage', 'Defensives', [
        'Player selector: the timeline and the exact log show only what that person cast and on whom.',
        'New timelines with a colored rail, guides, class-colored icons and, under each icon, the exact second (m:ss.mmm) it was used. Hovering an overlapped icon lifts and highlights it.',
      ]],
      ['inv_chest_plate04', 'Damage', ['The “Boss only” metric gives the same damage as Warcraft Logs’ “Damage to Bosses”, with its own parses.']],
      ['inv_shield_04', 'Reliability', [
        'If the intermediate server gets saturated, WipeTime retries by itself and, if it persists, shows a clear notice with a Retry button. The night report spaces its requests to avoid that limit.',
        'Spell and item icons are stored in their own cache that is not cleared on update and, if a server fails, the next one is tried. If none works, a question mark shows instead of a broken icon.',
        'Loading an empty log shows a red notice instead of a blank screen, and the top bar stays fixed while scrolling.',
      ]],
    ] } },

  { v: '2.8.9', date: '2026-10-20',
    es: { intro: 'Daño recibido, Daño y Sanación pasan a verse como en Warcraft Logs, y todo se puede copiar como imagen.', sections: [
      ['inv_chest_plate04', 'Daño recibido', [
        'Tabla en general con el estilo de Warcraft Logs (Nombre, Cantidad, Mitigado, Ilvl, Activo, DTPS, desglose con «+» y fila de Total). Al pasar el ratón por un jugador sale el reparto Normal / Absorbido / Bloqueado.',
        'La tabla de una habilidad es más compacta e incluye el desglose por tipo de golpe (cantidad, absorbido, mínimo, máximo y medio) con «tick» en lugar de «pulso».',
      ]],
      ['achievement_bg_winwsg', 'Daño y Sanación', ['Al pasar el ratón por una barra sale la tabla Jugador/Mascota como en Warcraft Logs, y al pulsar al jugador se abre su ventana con el daño de cada habilidad.']],
      ['inv_scroll_03', 'Copiar imagen', ['Las pestañas de estadísticas y barras tienen «Copiar imagen» y «Guardar PNG», con los iconos de jefes y de habilidades y las imágenes de fondo de la cabecera también en la web.']],
      ['inv_gizmo_02', 'Informe', ['Las pestañas cambian de orden (Daño recibido antes que Sanación) y tienen animación propia.']],
    ] },
    en: { intro: 'Damage Taken, Damage and Healing look like Warcraft Logs, and everything can be copied as an image.', sections: [
      ['inv_chest_plate04', 'Damage Taken', [
        'Overall table in Warcraft Logs style (Name, Amount, Mitigated, Ilvl, Active, DTPS, “+” breakdown and Total row). Hovering a player shows the Normal / Absorbed / Blocked split.',
        'A single ability’s table is more compact and includes the hit-type breakdown (amount, absorbed, min, max and average) with “tick” instead of “pulse”.',
      ]],
      ['achievement_bg_winwsg', 'Damage and Healing', ['Hovering a bar shows the Player/Pet table as in Warcraft Logs, and clicking the player opens their window with the damage of each ability.']],
      ['inv_scroll_03', 'Copy image', ['The statistics and bars tabs have “Copy image” and “Save PNG”, with boss and ability icons and the header background images, also on the web.']],
      ['inv_gizmo_02', 'Report', ['Tabs change order (Damage Taken before Healing) and have their own animation.']],
    ] } },

  { v: '2.7.9', date: '2026-10-20',
    es: { intro: 'Elige a qué enemigo se hizo el daño, el historial de versiones estrena tarjetas y las comprobaciones automáticas protegen cada versión.', sections: [
      ['inv_chest_plate04', 'Daño por enemigo', [
        'Nuevo selector «Enemigo» en Daño para ver solo el daño hecho a un jefe o a un add concreto, con sus habilidades. Los nombres salen en español, con un icono.',
        'Al elegir una habilidad en Daño recibido, la tabla sale como la de Warcraft Logs (Cantidad, Golpes, Golpe medio, Tiempo activo, Fallos, Mitigado y DTPS, con fila de Total, desglose por golpe y CSV).',
      ]],
      ['inv_scroll_03', 'Avisos y datos de contacto', ['Cada vez que copias algo sale un aviso en medio de la pantalla. El nombre de Discord o de Battle.net en Acerca de se copia en vez de abrir una aplicación.']],
      ['inv_shield_04', 'Calidad', ['Pruebas automáticas de navegador antes de publicar: si algo falla, no se actualiza ni la web ni los .exe. La web avisa con «Hay una versión nueva, Recargar».']],
      ['inv_shirt_guildtabard_01', 'Guilds y cambios de clase', ['Chips de orden en Logs y Banda de cada guild y Progreso ordenable por columnas.', 'Un comprobador semanal avisa cuando Blizzard publica hotfixes de clases.']],
      ['inv_misc_gem_diamond_07', 'Color de botones', ['Nueve colores más y una rueda para elegir cualquiera, aplicada al momento.']],
    ] },
    en: { intro: 'Choose which enemy the damage went to, the version history gets cards and automatic checks protect every version.', sections: [
      ['inv_chest_plate04', 'Damage by enemy', [
        'New “Enemy” selector in Damage to see only the damage done to a specific boss or add, with its abilities. Names are in Spanish when the web is, with an icon.',
        'Picking an ability in Damage Taken shows the table like Warcraft Logs (Amount, Hits, Average hit, Active time, Misses, Mitigated and DTPS, with a Total row, per-hit breakdown and CSV).',
      ]],
      ['inv_scroll_03', 'Notices and contact', ['Every time you copy something a notice appears in the middle of the screen. The Discord or Battle.net name in About is copied instead of opening an app.']],
      ['inv_shield_04', 'Quality', ['Automatic browser tests before publishing: if anything fails, neither the web nor the .exe are updated. The web warns with “New version available, Reload”.']],
      ['inv_shirt_guildtabard_01', 'Guilds and class changes', ['Sort chips in each guild’s Logs and Roster tabs and a Progress table sortable by column.', 'A weekly check warns when Blizzard publishes class hotfixes.']],
      ['inv_misc_gem_diamond_07', 'Button color', ['Nine more colors and a wheel to pick any, applied instantly.']],
    ] } },

  { v: '2.6.11', date: '2026-10-19',
    es: { intro: 'Ajustes renovados de arriba abajo y una ficha de personaje cada vez más parecida a la de Warcraft Logs.', sections: [
      ['inv_gizmo_02', 'Ajustes', [
        'Nueva pestaña General con el idioma, la hora del servidor y la región y dificultad por defecto, y colores propios de fondo, paneles y texto.',
        'Datos agrupado en Cachés, Mis datos y Restablecer, con exportar e importar tus ajustes y confirmación al restablecer.',
        'Versión y Acerca de en una sola pestaña, con el historial de las últimas 10 versiones y «Ver más».',
      ]],
      ['achievement_bg_winwsg', 'Ficha de personaje', [
        'Una tira de All Stars con las bandas y las temporadas de Mítica+ de la expansión elegida (dificultad, puntos, jefes derrotados y puesto) y el bloque de All Stars bajo la tabla de logs.',
        'La bandera del reino sigue su idioma, cada guild y cada comparación tienen su propia dirección y las tablas se ordenan por columna.',
      ]],
      ['achievement_boss_kingymiron', 'Portada', ['Con la web en español el logo del parche es «La maldición de Ula’tek».']],
    ] },
    en: { intro: 'Settings revamped from top to bottom and a character page ever closer to Warcraft Logs.', sections: [
      ['inv_gizmo_02', 'Settings', [
        'New General tab with the language, server time and default region and difficulty, and custom background, panel and text colors.',
        'Data grouped into Caches, My data and Reset, with settings export and import and a confirmation when resetting.',
        'Version and About in one tab, with the history of the latest 10 versions and “Show more”.',
      ]],
      ['achievement_bg_winwsg', 'Character page', [
        'An All Stars strip with the raids and Mythic+ seasons of the chosen expansion (difficulty, points, bosses defeated and rank) and the All Stars block under the logs table.',
        'The realm flag follows its language, every guild and comparison has its own address and tables sort by column.',
      ]],
      ['achievement_boss_kingymiron', 'Home', ['With the web in Spanish the patch logo is “La maldición de Ula’tek”.']],
    ] } },

  { v: '2.5.13', date: '2026-10-18',
    es: { intro: 'Guías de mecánicas rehechas con logs reales, ficha de personaje en tres columnas y una dirección propia para cada pantalla.', sections: [
      ['inv_misc_book_11', 'Guía de mecánicas', ['Rehecha con logs de Warcraft Logs, tooltips oficiales y las guías de Method para Ula’tek, El Altar en Espiral, Nek’zali, Los colmillos gemelos, Vashnik, Centinelas sepultados, Exploradores perdidos, Sszorak y Nymrissa.']],
      ['achievement_bg_winwsg', 'Ficha de personaje', [
        'Tres columnas como Warcraft Logs: tabla de jefes, equipo con talentos y el modelo 3D fijo a la derecha, con el fondo de la armería de Blizzard.',
        'Nuevo botón «Exportar a SimC» y, junto al nivel de cada pieza, el icono de su mejora (Mito, Héroe, Campeón, Veterano) y «Crafteado» en las creadas.',
        'Botones «Actualizar logs» para ver un log recién subido sin pulsar F5, y «Not locked in» cuando el mejor parse aún no está confirmado.',
        'El «Parse %» coincide con el de la web de Warcraft Logs y las listas se ordenan pulsando cada columna.',
      ]],
      ['inv_misc_net_01', 'Direcciones y personajes', [
        'Cada pantalla tiene su propia dirección: Atrás vuelve a la pantalla anterior, F5 se queda donde estabas y los enlaces se abren en otra ventana o pestaña.',
        '«Personajes favoritos», «Tus personajes» y «Añadir un personaje» pasan a la pestaña Personajes.',
      ]],
      ['ability_warrior_innerrage', 'Informe', ['Rotación: pulsa habilidades para ver solo esas, con la hora exacta de cada lanzamiento. Aviso rojo cuando Warcraft Logs invalida el ranking de un jugador por buffos externos.']],
    ] },
    en: { intro: 'Mechanics guides rebuilt from real logs, a three-column character page and its own address for every screen.', sections: [
      ['inv_misc_book_11', 'Mechanics guide', ['Rebuilt with Warcraft Logs logs, official tooltips and Method’s guides for Ula’tek, The Coiled Altar, Nek’zali, The Twin Fangs, Vashnik, Buried Sentinels, Lost Scouts, Sszorak and Nymrissa.']],
      ['achievement_bg_winwsg', 'Character page', [
        'Three columns like Warcraft Logs: boss table, gear with talents and the 3D model fixed on the right, with Blizzard’s armory background.',
        'New “Export to SimC” button and, next to each piece’s level, its upgrade icon (Myth, Hero, Champion, Veteran) and “Crafted” on crafted ones.',
        '“Update logs” button to see a freshly uploaded log without F5, and “Not locked in” when the best parse is not confirmed yet.',
        'The “Parse %” matches the Warcraft Logs website and lists sort by clicking each column.',
      ]],
      ['inv_misc_net_01', 'Addresses and characters', [
        'Every screen has its own address: Back returns to the previous screen, F5 stays where you were and links open in another window or tab.',
        '“Favorite characters”, “Your characters” and “Add a character” move to the Characters tab.',
      ]],
      ['ability_warrior_innerrage', 'Report', ['Rotation: click abilities to see only those, with the exact time of each cast. Red notice when Warcraft Logs invalidates a player’s ranking because of excessive external buffs.']],
    ] } },

  { v: '2.4.1', date: '2026-10-18',
    es: { intro: 'Tema claro, mejor contraste y un reloj del servidor nuevo.', sections: [
      ['inv_gizmo_02', 'Apariencia', [
        'Tema claro completo, con una guarda de contraste en todo el texto y botones primarios más legibles.',
        'Barras de datos cuadradas, cabeceras con el ambiente de la zona y el icono del jefe, esqueletos de carga, cifras animadas, tipografía más clara y barra lateral plegable.',
      ]],
      ['inv_misc_gear_01', 'Reloj del servidor', ['Nuevo reloj con estilo consola, sin esfera, y contador de reinicio con las unidades completas.']],
    ] },
    en: { intro: 'Light theme, better contrast and a new server clock.', sections: [
      ['inv_gizmo_02', 'Appearance', [
        'Complete light theme, with a contrast guard on all text and more legible primary buttons.',
        'Square data bars, headers with the zone’s mood and the boss icon, loading skeletons, animated figures, clearer typography and a collapsible sidebar.',
      ]],
      ['inv_misc_gear_01', 'Server clock', ['New console-style clock, without a dial, and a reset counter with full units.']],
    ] } },

  { v: '2.2.3', date: '2026-10-17',
    es: { intro: 'WipeTime pasa a ser independiente, con clasificaciones de todas las kills, buffos con alcance y más Top 5 de la noche.', sections: [
      ['achievement_bg_winwsg', 'Clasificaciones', ['Clasificaciones de todas las kills como en Warcraft Logs, con el icono y el nombre completo del jefe en la lista de intentos.']],
      ['inv_misc_note_06', 'Informe de la noche', ['Top 5 «disfrutones»: quién recibe más Infusiones de poder, sin contar a los sacerdotes. Top 5 de muertes de la noche.']],
      ['ability_warrior_innerrage', 'Buffos y defensivos', [
        'Buffos con alcance: este intento, todos los intentos del jefe o todos los kills del log (PI, prepoti, buffos de banda y resumen).',
        'Defensivos en una línea por tipo, con leyenda y tooltips; dispels e interrupciones con barras cuadradas.',
      ]],
      ['inv_misc_net_01', 'Independencia', ['WipeTime deja de depender de NinjaLoot y la insignia de versión usa el mismo formato que la suya.']],
    ] },
    en: { intro: 'WipeTime becomes independent, with rankings for all kills, scoped buffs and more night Top 5s.', sections: [
      ['achievement_bg_winwsg', 'Rankings', ['Rankings for all kills as in Warcraft Logs, with the boss icon and full name in the attempt list.']],
      ['inv_misc_note_06', 'Night report', ['“Enjoyers” Top 5: who receives the most Power Infusions, not counting priests. Top 5 deaths of the night.']],
      ['ability_warrior_innerrage', 'Buffs and defensives', [
        'Scoped buffs: this attempt, all attempts of the boss or all kills in the log (PI, pre-pot, raid buffs and summary).',
        'Defensives on one line per type, with legend and tooltips; dispels and interrupts with square bars.',
      ]],
      ['inv_misc_net_01', 'Independence', ['WipeTime no longer depends on NinjaLoot and the version badge uses the same format as theirs.']],
    ] } },

  { v: '1.9.1', date: '2026-10-17',
    es: { intro: 'La web carga mucho más rápido y las guilds ganan progreso, asistencia y composición de banda.', sections: [
      ['inv_misc_net_01', 'Web más rápida', ['Scripts y estilos en un solo archivo, fuentes precargadas, imagen del parche más ligera y un service worker que guarda lo estático: la primera carga pasa de 13 s a 4 s en una conexión lenta y la web abre incluso sin conexión.']],
      ['inv_shirt_guildtabard_01', 'Guilds', [
        'La ficha de cada guild suma las pestañas Progreso (kills por semana, ritmo y kill de cada jefe), Asistencia (quién fue a cada noche y su porcentaje) y Banda (composición por clase y buffos que faltan).',
        'Una campana avisa cuando una guild sube un log nuevo o mata un jefe, y en el ranking de parses pulsando dos jugadores se comparan jefe a jefe.',
      ]],
      ['achievement_bg_winwsg', 'Informe', ['Paneles y pestañas con entrada escalonada, tarjetas de jugador en el Resumen, línea de tiempo del intento con fases, daño recibido, muertes y defensivos, y ranking de daño evitable en el Informe general.']],
    ] },
    en: { intro: 'The web loads much faster and guilds gain progress, attendance and raid composition.', sections: [
      ['inv_misc_net_01', 'Faster web', ['Scripts and styles in a single file, preloaded fonts, a lighter patch image and a service worker that stores static files: first load goes from 13 s to 4 s on a slow connection and the web opens even offline.']],
      ['inv_shirt_guildtabard_01', 'Guilds', [
        'Each guild page adds the Progress (kills per week, pace and each boss kill), Attendance (who went each night and their percentage) and Roster (class composition and missing buffs) tabs.',
        'A bell warns when a guild uploads a new log or kills a boss, and in the parse ranking clicking two players compares them boss by boss.',
      ]],
      ['achievement_bg_winwsg', 'Report', ['Staggered panel and tab entrances, player cards in the Summary, an attempt timeline with phases, damage taken, deaths and defensives, and an avoidable-damage ranking in the General report.']],
    ] } },

  { v: '1.7.4', date: '2026-10-16',
    es: { intro: 'Comparar guilds, una armería con tooltips exactos y cambios de clase traducidos con sus iconos.', sections: [
      ['inv_shirt_guildtabard_01', 'Comparar guilds', [
        'Busca dos guilds y elige banda y dificultad: para cada jefe ves los trys hasta la primera kill, la fecha, el tiempo invertido, el mejor wipe y quién la mató antes. Al pulsar un jefe se despliega el detalle try a try con la vida del jefe en cada pull.',
        'El conteo de trys coincide con el de Warcraft Logs (se descartan los pulls repetidos entre logs), y la tabla se puede copiar como imagen o guardar como PNG.',
      ]],
      ['inv_chest_plate04', 'Armería y personajes', [
        'Tooltip exacto de cada objeto (versión, nivel de objeto, estadísticas, encantamientos, gemas, efectos y conjunto) y nivel de objeto equipado con decimales.',
        'Objetos como tarjetas uniformes, con la cabecera coloreada según la calidad más baja que llevas, y todos los números con separador de miles y decimales.',
      ]],
      ['spell_holy_crusade', 'Cambios de clase', ['Los tooltips usan el hechizo exacto de cada habilidad y talento, con icono, nombre y descripción en español, y los cambios se explican solos.', 'Dispels e interrupciones con el icono de especialización junto a cada nombre.']],
    ] },
    en: { intro: 'Guild comparison, an armory with exact tooltips and translated class changes with their icons.', sections: [
      ['inv_shirt_guildtabard_01', 'Compare guilds', [
        'Search two guilds and choose raid and difficulty: for each boss you see the tries until the first kill, the date, time spent, best wipe and who killed it sooner. Clicking a boss expands the try-by-try detail with the boss health at each pull.',
        'The try count matches Warcraft Logs (duplicated pulls across logs are discarded), and the table can be copied as an image or saved as PNG.',
      ]],
      ['inv_chest_plate04', 'Armory and characters', [
        'Exact tooltip for each item (version, item level, stats, enchants, gems, effects and set) and equipped item level with decimals.',
        'Items as uniform cards, with the header colored by the lowest quality you wear, and every number with thousands separator and decimals.',
      ]],
      ['spell_holy_crusade', 'Class changes', ['Tooltips use the exact spell of every ability and talent, with icon, name and description in Spanish, and changes explain themselves.', 'Dispels and interrupts with the specialization icon next to each name.']],
    ] } },

  { v: '1.4.1', date: '2026-10-16',
    es: { intro: 'Filtros de personaje como los de Warcraft Logs y una armería de guilds mucho más completa.', sections: [
      ['achievement_bg_winwsg', 'Personajes', [
        'Filtros como los de Warcraft Logs, todos con desplegable: expansión, season, métrica, jefe, especialización y dificultad (incluida «Dificultad máxima»). Los parses y logs de cada jefe los respetan.',
        'El desplegable de season lista las bandas de todas las expansiones y los parches de cada banda salen como botones tipo pestaña, con «Todos» para el overall de la season.',
        'Los parses coinciden con los de la web de Warcraft Logs (antes salían 2-5 puntos más altos en logs recientes).',
      ]],
      ['inv_shirt_guildtabard_01', 'Guilds', [
        'Nuevo formulario «Añadir una guild» (nombre, reino y región), que comprueba que exista en Warcraft Logs.',
        'La ventana de un personaje muestra sus parses y logs por jefe, la especialización como icono y el modelo 3D; las tarjetas son compactas.',
      ]],
    ] },
    en: { intro: 'Warcraft Logs-style character filters and a much fuller guild armory.', sections: [
      ['achievement_bg_winwsg', 'Characters', [
        'Warcraft Logs-style filters, all as dropdowns: expansion, season, metric, boss, specialization and difficulty (including “Max difficulty”). Parses and logs of each boss follow them.',
        'The season dropdown lists the raids of every expansion and each raid’s patches appear as tab buttons, with “All” for the season overall.',
        'Parses match the Warcraft Logs website (they used to read 2-5 points higher on recent logs).',
      ]],
      ['inv_shirt_guildtabard_01', 'Guilds', [
        'New “Add a guild” form (name, realm and region), which checks the guild exists on Warcraft Logs.',
        'A character’s window shows their parses and logs per boss, the specialization as an icon and the 3D model; cards are compact.',
      ]],
    ] } },

  { v: '1.0.16', date: '2026-10-15',
    es: { intro: 'Nace el apartado «Cambios de las clases», con el reloj del servidor, el chivato de pociones y mejoras en el daño recibido.', sections: [
      ['spell_holy_crusade', 'Cambios de las clases', [
        'Todos los cambios de PvE del 12.1.0 al 12.1.5 por clase y especialización, con su fecha exacta (verde = mejora, rojo = nerfeo), los nombres en el idioma de la web y su tooltip.',
        'Cada especialización es un desplegable, y las correcciones que decían solo «correcciones varias» explican qué se corrigió, a partir del registro oficial de hotfixes de Blizzard.',
      ]],
      ['inv_misc_book_11', 'Parches', ['Botón «Parche 12.2 · Próximamente» con lo que muestra el avance de Midnight: Eclipse, y el tráiler oficial del 12.1.5 dentro de la propia ventana.']],
      ['inv_misc_gear_01', 'Reloj del servidor', ['Reloj arriba a la izquierda (Europa por defecto; América, Latinoamérica, Oceanía, Corea y Taiwán en Ajustes) con cuenta atrás al reinicio semanal al pasar el ratón.']],
      ['inv_misc_note_06', 'Informe general', ['«Chivato»: las pociones y piedras de salud que usó cada jugador en los intentos de jefe de la noche, con el total de la banda.', 'Daño recibido de un jugador: al pulsarlo se ve el daño de cada habilidad y de qué fuente venía.']],
    ] },
    en: { intro: 'The “Class changes” section is born, with the server clock, the potion snitch and improvements to damage taken.', sections: [
      ['spell_holy_crusade', 'Class changes', [
        'All PvE changes from 12.1.0 to 12.1.5 by class and specialization, with their exact date (green = buff, red = nerf), names in the website language and their tooltip.',
        'Each specialization is a dropdown, and fixes that only said “various fixes” explain what was fixed, from Blizzard’s official hotfix log.',
      ]],
      ['inv_misc_book_11', 'Patches', ['“Patch 12.2 · Coming soon” button with what the Midnight: Eclipse preview shows, and the official 12.1.5 trailer inside the window itself.']],
      ['inv_misc_gear_01', 'Server clock', ['Clock at the top left (Europe by default; Americas, Latin America, Oceania, Korea and Taiwan in Settings) with a countdown to the weekly reset on hover.']],
      ['inv_misc_note_06', 'General report', ['“Snitch”: the health potions and healthstones each player used in the night’s boss attempts, with the raid total.', 'A player’s damage taken: clicking them shows the damage of each ability and which source it came from.']],
    ] } },

  { v: '0.9.3', date: '2026-10-15',
    es: { intro: 'Parses corregidos, replay con los buffos exactos y un resumen del intento listo para Discord.', sections: [
      ['achievement_bg_winwsg', 'Parses', ['Warcraft Logs devuelve 0 a los jugadores con posición aproximada (~) en su modo por defecto, así que ahora se piden también en modo «Parses», que es el valor que enseña su web. En logs recientes se vuelven a pedir cada minuto y se avisa de que son provisionales.']],
      ['inv_misc_spyglass_02', 'Replay', ['Buffos y debuffos exactos a partir de las bandas de actividad de Warcraft Logs, también los que ya estaban puestos antes del pull (frasco, comida, runas).']],
      ['inv_misc_note_06', 'Progreso y resumen', ['Compara con el intento anterior además de con tu mejor intento, con HPS por sanador.', 'Botón «Copiar resumen»: resultado, motivo del wipe, primeras muertes, mejores DPS y HPS y enlace, listo para pegar en Discord.']],
      ['inv_gizmo_02', 'Idiomas', ['La aplicación queda en español e inglés.']],
    ] },
    en: { intro: 'Corrected parses, a replay with exact buffs and an attempt summary ready for Discord.', sections: [
      ['achievement_bg_winwsg', 'Parses', ['Warcraft Logs returns 0 for players with an approximate position (~) in its default mode, so they are now also requested in “Parses” mode, the value its website shows. On recent logs they are requested again every minute and flagged as provisional.']],
      ['inv_misc_spyglass_02', 'Replay', ['Exact buffs and debuffs from Warcraft Logs activity bands, including those already up before the pull (flask, food, runes).']],
      ['inv_misc_note_06', 'Progress and summary', ['Compare with the previous attempt as well as your best, with HPS per healer.', '“Copy summary” button: result, wipe reason, first deaths, top DPS and HPS and link, ready to paste in Discord.']],
      ['inv_gizmo_02', 'Languages', ['The app is now Spanish and English.']],
    ] } },

  { v: '0.8.4', date: '2026-10-15',
    es: { intro: 'Guía completa de Kith’ix y clasificaciones con el formato de Warcraft Logs.', sections: [
      ['inv_misc_book_11', 'Kith’ix', ['Guía de mecánicas completa: 28 mecánicas repartidas en Fase 1, intermedio de Oscuridad agobiante y Fase 2, con el nombre real de cada habilidad en español, su tipo, las dificultades en que aparece y su icono. Las que solo cuenta una guía salen como «sin verificar».']],
      ['achievement_bg_winwsg', 'Clasificaciones', ['Para el kill elegido: ranking de ejecución (muertes, daño recibido, nivel de objeto), ranking de velocidad y clasificación de jugadores con pestañas Daño, Sanación y Daño al jefe, con % de rango, mejor rango, DPS/HPS, Ilvl e Ilvl %.']],
      ['inv_misc_note_06', 'Informe general', ['Nuevo Top 5 de dispels de la noche.']],
    ] },
    en: { intro: 'A complete Kith’ix guide and rankings in Warcraft Logs format.', sections: [
      ['inv_misc_book_11', 'Kith’ix', ['Complete mechanics guide: 28 mechanics across Phase 1, the Suffocating Darkness intermission and Phase 2, with each ability’s real name in Spanish, its type, the difficulties it appears on and its icon. Ones only a single guide mentions show as “unverified”.']],
      ['achievement_bg_winwsg', 'Rankings', ['For the chosen kill: execution ranking (deaths, damage taken, item level), speed ranking and player ranking with Damage, Healing and Boss Damage tabs, with rank %, best rank, DPS/HPS, Ilvl and Ilvl %.']],
      ['inv_misc_note_06', 'General report', ['New Top 5 dispels of the night.']],
    ] } },

  { v: '0.7.9', date: '2026-10-14',
    es: { intro: 'Replay con marcos como los de Warcraft Logs, parses completos y iconos que ya no fallan.', sections: [
      ['inv_misc_spyglass_02', 'Replay', [
        'Al pulsar un jugador sale su cono de visión en el mapa y, abajo, los marcos como en Warcraft Logs: el jugador con sus buffos, perjuicios, barra de vida y el hechizo que lanza, su objetivo (el jefe) y el objetivo del jefe.',
        'Los buffos salen tal como están en el log en cada instante y la barra de casteo solo muestra hechizos con tiempo de lanzamiento.',
      ]],
      ['achievement_bg_winwsg', 'Listas y parses', ['Listas con el formato de Warcraft Logs (Parse %, nombre con icono de spec, cantidad con el % del total, barra del color de clase, Ilvl, Ilvl %, Activo y DPS/HPS), y parses completos: los sanadores también tienen parse de daño y los DPS y tanques de sanación.']],
      ['inv_shield_04', 'Fiabilidad', [
        'Los iconos de especializaciones, clases y de la interfaz vienen incluidos en el programa; si un servidor de iconos falla se usan los de Wowhead y Blizzard.',
        'Todo lo que sale de un informe se pide en vivo a Warcraft Logs, sin guardar copias en el disco, y el programa ya no puede incluir claves de API.',
      ]],
    ] },
    en: { intro: 'A replay with Warcraft Logs-style frames, complete parses and icons that no longer fail.', sections: [
      ['inv_misc_spyglass_02', 'Replay', [
        'Clicking a player shows their vision cone on the map and, below, the frames as in Warcraft Logs: the player with buffs, debuffs, health bar and the spell being cast, their target (the boss) and the boss’s target.',
        'Buffs appear exactly as in the log at each moment and the cast bar only shows spells with a real cast time.',
      ]],
      ['achievement_bg_winwsg', 'Lists and parses', ['Lists in Warcraft Logs format (Parse %, name with spec icon, amount with % of total, class-colored bar, Ilvl, Ilvl %, Active and DPS/HPS), and complete parses: healers also get a damage parse and DPS and tanks a healing parse.']],
      ['inv_shield_04', 'Reliability', [
        'Specialization, class and interface icons are bundled with the app; if an icon server fails, Wowhead and Blizzard ones are used.',
        'Everything from a report is requested live from Warcraft Logs, with no copies saved on disk, and the app can no longer include API keys.',
      ]],
    ] } },

  { v: '0.6.8', date: '2026-10-12',
    es: { intro: 'Listas compactas como las de Warcraft Logs, pestaña de perjuicios y escudos más completos.', sections: [
      ['inv_chest_plate04', 'Listas con barras', ['Todas las listas (daño, sanación, daño recibido, escudos, mecánicas…) tienen un formato compacto tipo tabla, con la barra del color de la clase y rojo cuando el daño lo hace un jefe o un add. Al pasar el ratón sale el daño o la sanación de cada habilidad de esa persona.', 'Botones «Copiar imagen» y «Guardar PNG» para exportar la lista que estás viendo.']],
      ['ability_warrior_innerrage', 'Perjuicios y escudos', ['Nueva pestaña «Perjuicios» junto a Buffos: todos los debuffs de la pelea, con sus aplicaciones y tiempo activo, y quién los recibió o aplicó.', 'Daño a escudos: elige qué escudos ver (el jefe, cada add y los jugadores con control mental) con su daño y su DPS.']],
      ['inv_misc_note_06', 'Pulls y detector de PI', ['Lista de pulls con barras de vida más gruesas, botón «Actualizar», botones «Todos los trys» y «Todo el log», y colores como los parses al revés (cuanto menos vida le queda al jefe, mejor).', 'Detector de PI rehecho: quién dio la Infusión, quién la recibió, el minuto, el daño con PI y el DPS.']],
    ] },
    en: { intro: 'Warcraft Logs-style compact lists, a debuffs tab and fuller shields.', sections: [
      ['inv_chest_plate04', 'Bar lists', ['All lists (damage, healing, damage taken, shields, mechanics…) use a compact table-like format, with class-colored bars and red when a boss or add does the damage. Hovering shows the damage or healing of each of that person’s abilities.', '“Copy image” and “Save PNG” buttons to export the list you are viewing.']],
      ['ability_warrior_innerrage', 'Debuffs and shields', ['New “Debuffs” tab next to Buffs: all debuffs of the fight, with their applications and uptime, and who received or applied them.', 'Damage to shields: choose which shields to see (the boss, each add and mind-controlled players) with their damage and DPS.']],
      ['inv_misc_note_06', 'Pulls and PI detector', ['Pull list with thicker health bars, an “Update” button, “All tries” and “Whole log” buttons, and colors like parses in reverse (the less health the boss has left, the better).', 'Rebuilt PI detector: who gave the Infusion, who received it, the minute, the damage with PI and the DPS.']],
    ] } },

  { v: '0.5.4', date: '2026-10-12',
    es: { intro: 'Un diseño más sobrio y profesional y una ficha de personaje al estilo de Warcraft Logs.', sections: [
      ['inv_gizmo_02', 'Diseño', ['Nuevo diseño más sobrio, con grises neutros y el turquesa solo en lo importante, y la tarjeta del parche con un efecto animado en los colores del logo de Curse of Ula’tek.', 'Tipografía Noto Sans en toda la app, con más opciones en Ajustes.']],
      ['achievement_bg_winwsg', 'Ficha de personaje', ['Tabla de rankings más limpia con el icono de cada jefe, los talentos que lleva (con botón para copiarlos al juego) y el icono de su spec.', 'Resumen con la misma disposición que Warcraft Logs, jefes desplegables con todos sus logs, métrica «Daño a jefe» y el icono de la spec de cada «Mejor %».']],
      ['inv_misc_book_11', 'Parche 12.1.5', ['Cuando la cuenta atrás llega a 0 el parche cambia solo a 12.1.5 en la pantalla de inicio, sin reiniciar la app.']],
    ] },
    en: { intro: 'A more sober, professional design and a Warcraft Logs-style character page.', sections: [
      ['inv_gizmo_02', 'Design', ['New, more sober design with neutral grays and teal only for what matters, and the patch card with an animated effect in the colors of the Curse of Ula’tek logo.', 'Noto Sans typography across the app, with more options in Settings.']],
      ['achievement_bg_winwsg', 'Character page', ['Cleaner rankings table with each boss icon, the talents they use (with a button to copy them into the game) and their spec icon.', 'Summary laid out like Warcraft Logs, expandable bosses with all their logs, a “Boss damage” metric and the spec icon of each “Best %”.']],
      ['inv_misc_book_11', 'Patch 12.1.5', ['When the countdown reaches 0 the patch switches to 12.1.5 by itself on the home screen, without restarting the app.']],
    ] } },

  { v: '0.4.9', date: '2026-10-11',
    es: { intro: 'WipeTime se puede usar desde el navegador, con un buscador de personajes nuevo y actualizaciones con un solo botón.', sections: [
      ['inv_misc_net_01', 'Web', ['Ya se puede usar desde el navegador, sin instalar nada, alojada en GitHub Pages. Admite abrir un log con ?report=CÓDIGO&fight=N en la dirección.', 'El servidor intermedio pasa a Vercel, así que funciona sin claves propias incluso durante los bloqueos de IPs de Cloudflare.']],
      ['achievement_bg_winwsg', 'Buscar personaje', ['Escribe el nombre (el reino es opcional) y pulsa Intro para ver todos los personajes con ese nombre, su reino y la bandera de su país. Al pulsar uno se abre su ficha con posiciones, logs por jefe, equipo y modelo, con enlaces a Warcraft Logs, Raider.IO y la armería.']],
      ['inv_hammer_20', 'Actualizaciones', ['Actualización con un solo botón en Ajustes → Versión: comprueba, descarga, instala y reabre. Con el Setup solo se descarga lo que ha cambiado.']],
      ['inv_misc_horn_02', 'Idiomas y fuente', ['Botón de idiomas, la ficha muestra a quién te comparas por su nombre y reino, y nueva tipografía Noto Sans con más opciones en Ajustes → Apariencia.']],
    ] },
    en: { intro: 'WipeTime can be used from the browser, with a new character search and one-button updates.', sections: [
      ['inv_misc_net_01', 'Web', ['It can now be used from the browser, with nothing to install, hosted on GitHub Pages. It supports opening a log with ?report=CODE&fight=N in the address.', 'The intermediate server moves to Vercel, so it works without its own keys even during Cloudflare IP blocks.']],
      ['achievement_bg_winwsg', 'Find a character', ['Type the name (realm optional) and press Enter to see every character with that name, their realm and country flag. Clicking one opens their page with rankings, logs per boss, gear and model, with links to Warcraft Logs, Raider.IO and the armory.']],
      ['inv_hammer_20', 'Updates', ['One-button update in Settings → Version: checks, downloads, installs and reopens. With the Setup only what changed is downloaded.']],
      ['inv_misc_horn_02', 'Languages and font', ['Language button, the page shows who you compare to by name and realm, and new Noto Sans typography with more options in Settings → Appearance.']],
    ] } },

  { v: '0.3.9', date: '2026-10-10',
    es: { intro: 'Carga mucho más rápida, clasificaciones en tres ventanas y el programa pasa a llamarse WipeTime.', sections: [
      ['inv_misc_gear_01', 'Velocidad', ['Caché en disco de los datos de Warcraft Logs (reabrir un log o un replay es casi instantáneo), eventos descargados en paralelo y un botón para vaciar la caché en Ajustes → Datos.']],
      ['achievement_bg_winwsg', 'Clasificaciones', ['Clasificaciones en tres ventanas (DPS, tanques y sanadores) por daño, sanación o daño al jefe, con parse y parse por nivel de objeto, y ranking de guild por rol.']],
      ['inv_misc_book_11', 'Replay y otros', ['Replay solo en raids, con zoom y arrastre, e iconos reales. «No estoy en el log» arriba del todo, con solo los jugadores del log.']],
    ] },
    en: { intro: 'Much faster loading, rankings in three windows and the program is renamed WipeTime.', sections: [
      ['inv_misc_gear_01', 'Speed', ['Disk cache of Warcraft Logs data (reopening a log or a replay is almost instant), events downloaded in parallel and a button to clear the cache in Settings → Data.']],
      ['achievement_bg_winwsg', 'Rankings', ['Rankings in three windows (DPS, tanks and healers) by damage, healing or boss damage, with parse and item-level parse, and a guild ranking by role.']],
      ['inv_misc_book_11', 'Replay and more', ['Replay only in raids, with zoom and drag, and real icons. “I’m not in the log” at the very top, with only the log’s players.']],
    ] } },

  { v: '0.2.8', date: '2026-10-10',
    es: { intro: 'Pestañas reordenadas por importancia y las primeras herramientas para analizar defensivos, mecánicas y comparaciones.', sections: [
      ['ability_warrior_innerrage', 'Informe', [
        'Pestañas ordenadas por importancia (Informe general primero, luego Resumen) y nueva pestaña Daño evitable.',
        'Defensivos: registro exacto de quién usó qué, cuándo y sobre quién. Buffos de banda por clase dentro de Buffos y prepoti con la piedra de salud.',
      ]],
      ['inv_misc_book_11', 'Mecánicas y comparar', ['Guía de mecánicas con iconos, dificultades y lo importante de cada jefe.', 'Comparar logs: maná del sanador y mitigación y pasivas del tanque.']],
      ['achievement_bg_winwsg', 'Resumen', ['Al hacer clic en un jugador se abre su equipo (como la armería) y los talentos que usó en ese jefe; iconos de rol PvP originales y de especialización.']],
    ] },
    en: { intro: 'Tabs reordered by importance and the first tools to analyze defensives, mechanics and comparisons.', sections: [
      ['ability_warrior_innerrage', 'Report', [
        'Tabs sorted by importance (General report first, then Summary) and a new Avoidable damage tab.',
        'Defensives: exact log of who used what, when and on whom. Raid buffs by class inside Buffs and pre-pot with the healthstone.',
      ]],
      ['inv_misc_book_11', 'Mechanics and compare', ['Mechanics guide with icons, difficulties and what matters of each boss.', 'Compare logs: healer mana and tank mitigation and passives.']],
      ['achievement_bg_winwsg', 'Summary', ['Clicking a player opens their gear (like the armory) and the talents they used on that boss; original PvP role icons and specialization icons.']],
    ] } },

  { v: '0.1.9', date: '2026-10-10',
    es: { intro: 'Las primeras versiones: análisis de logs de Warcraft Logs con daño, sanación, muertes, buffos, rotación, replay y parses.', sections: [
      ['inv_misc_note_06', 'Primera versión', ['Daño, sanación, muertes, buffos, rotación y parses; replay con mapas; analizador y comparador de logs; Resumen, Detalle, Gráficas, Defensivos y Mecánicas con guía por dificultad; Mítica+; informe de la noche con rankings; guilds con Battle.net y ranking por rol.', 'Cuenta atrás y contenido del parche 12.1.5, tooltips, iconos de WoW y una estética con los colores del logo.']],
      ['inv_misc_spyglass_02', 'Mejoras iniciales', ['Replay con buffos y debuffos del jugador, su objetivo y el jefe; Top 5 de interrupciones; retratos de personaje y escudos de guild; buscar guilds solo por nombre.', 'Comparar logs con botón «Cargar logs» y reintentos si un log no carga.']],
    ] },
    en: { intro: 'The first versions: Warcraft Logs log analysis with damage, healing, deaths, buffs, rotation, replay and parses.', sections: [
      ['inv_misc_note_06', 'First version', ['Damage, healing, deaths, buffs, rotation and parses; replay with maps; log analyzer and comparator; Summary, Detail, Charts, Defensives and Mechanics with a per-difficulty guide; Mythic+; night report with rankings; guilds with Battle.net and a ranking by role.', 'Countdown and content for patch 12.1.5, tooltips, WoW icons and an aesthetic with the logo colors.']],
      ['inv_misc_spyglass_02', 'Early improvements', ['Replay with the player’s, their target’s and the boss’s buffs and debuffs; Top 5 interrupts; character portraits and guild crests; search guilds by name only.', 'Compare logs with a “Load logs” button and retries if a log does not load.']],
    ] } },
];

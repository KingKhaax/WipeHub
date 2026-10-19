# WipeTime

Programa de Windows para **ver, analizar y comparar logs de World of Warcraft** a partir de un enlace público de [Warcraft Logs](https://www.warcraftlogs.com). Hecho por Drakko · sr.kitkat ♥ · España 🇪🇸

[![Última versión](https://img.shields.io/github/v/release/KingKhaax/WipeTime?label=versi%C3%B3n)](https://github.com/KingKhaax/WipeTime/releases/latest)
[![Descargas](https://img.shields.io/github/downloads/KingKhaax/WipeTime/total?label=descargas)](https://github.com/KingKhaax/WipeTime/releases)
[![Licencia: MIT](https://img.shields.io/github/license/KingKhaax/WipeTime?label=licencia)](LICENSE)

### 🌐 Pruébalo en la web: **[wipetime.vercel.app](https://wipetime.vercel.app)**

## Web

Usa WipeTime directamente en el navegador, sin instalar nada:

**[https://wipetime.vercel.app](https://wipetime.vercel.app)**

Alternativa: [https://kingkhaax.github.io/WipeTime/](https://kingkhaax.github.io/WipeTime/)

## Qué hace

- **Clasificaciones:** ranking de parses por rol (DPS, tanques y sanadores) de un intento, varios pulls o todos los intentos del jefe, con filtros por clase y orden.
- **Chivato** (en el Informe general): pociones de salud y piedras de salud que ha usado cada jugador en la noche, por separado y con el total.
- **Informe general y Resumen:** top de la noche, equipo, talentos, encantamientos y consumibles de cada jugador.
- **Daño, sanación, muertes, defensivos, buffos, prepoti y piedra de salud.**
- **Mecánicas:** guía de cada jefe con iconos y dificultades, y análisis del daño evitable.
- **Replay** de la pelea con zoom, buffos y debuffos (solo raids).
- **Mítica+:** pulls, ruta y comparación con los mejores de tu nivel de llave.
- **Comparar logs**, con consejos específicos para sanadores (maná) y tanques (mitigación).
- **Guilds:** ranking de la guild y de sus miembros; al pulsar uno de tus personajes se despliega su armería (equipo y estadísticas en número y %).
- **Buscar personaje:** escribe el nombre (reino opcional) y elige entre los personajes que existen, con su reino y bandera; la ficha al estilo WoWProgress muestra posiciones, tabla por jefe, equipo y modelo en vivo.
- **Idiomas:** español e inglés desde el botón «Idiomas».

## Cómo usarlo

1. **Abre WipeTime**, como prefieras: en el navegador en [wipetime.vercel.app](https://wipetime.vercel.app) (sin instalar nada), instalando `WipeTime.vX.Y.Z.Setup.exe` o abriendo la versión portable `WipeTime.vX.Y.Z.exe` (los dos están en [Releases](https://github.com/KingKhaax/WipeTime/releases/latest)).
2. **Analiza un log:** pega el enlace de un informe de Warcraft Logs en la barra de arriba y pulsa **Cargar**. Elige tu personaje cuando te lo pida y navega por las pestañas del intento (Daño, Sanación, Muertes, Defensivos, Buffos, Mecánicas, Replay…).
3. **Mira más cosas desde la barra superior:**
   - **Comparar logs:** tu intento contra 1–10 más, con consejos según tu rol.
   - **Guilds:** ranking, logs recientes, progreso, asistencia, banda y comparación entre dos guilds.
   - **Personajes:** la ficha de cualquier personaje con sus All Stars de todas las temporadas y bandas, la tabla de jefes, equipo con mejoras y gemas, talentos y modelo 3D.
4. **Enlaces que se pueden compartir:** cada pantalla tiene su propia dirección (por ejemplo `#/report/…`, `#/guilds/…` o `#/char/…`), así que Atrás, Adelante y F5 funcionan, y con Mayús + clic se abre en otra ventana.
5. **Ajustes** (la rueda de arriba): tema claro u oscuro, color de botones (con rueda para elegir cualquier color), colores propios, tamaño y fuente, región y dificultad por defecto, y exportar o importar tus ajustes. El idioma se cambia con el botón «Idioma» de la barra de arriba.

> No necesitas cuenta ni claves: WipeTime usa un servidor intermedio propio (`server/vercel`, desplegado en Vercel) que hace las consultas de solo lectura a Warcraft Logs y Blizzard. Tus ajustes y tus personajes se guardan solo en tu equipo (o en tu navegador, si usas la web).

## Requisitos

- Windows 10 u 11 (64 bits) para el programa de escritorio.
- O cualquier navegador moderno para la [versión web](https://wipetime.vercel.app).
- Un enlace público de un informe de [Warcraft Logs](https://www.warcraftlogs.com).

## Descarga

Descarga la última versión desde [Releases](https://github.com/KingKhaax/WipeTime/releases/latest) (GitHub sustituye los espacios del nombre por puntos). En Releases solo está la última versión:

- `WipeTime.vX.Y.Z.Setup.exe`: instalador. Se actualiza solo al abrirlo y se desinstala desde *Configuración → Aplicaciones* de Windows.
- `WipeTime.vX.Y.Z.exe`: versión portable, no necesita instalación.
- `latest.json`: versión y hashes SHA-256 (los usa el actualizador del programa).

O sin descargar nada, en la web: [wipetime.vercel.app](https://wipetime.vercel.app).

Los ejecutables todavía no llevan firma digital (está en trámite la firma gratuita de SignPath; ver [Code signing policy](#code-signing-policy)), así que Windows SmartScreen puede avisar la primera vez: pulsa *Más información → Ejecutar de todas formas*. Puedes comprobar el archivo con los hashes de `latest.json`.

## Novedades

El historial de versiones está en el propio programa (Ajustes → Versión) y en [Releases](https://github.com/KingKhaax/WipeTime/releases) (solo se conserva la última).

> Las secciones *Code signing policy* y *Privacy policy* están en inglés a propósito (requisito de la firma de código y de las políticas de privacidad).

## Code signing policy

Free code signing provided by [SignPath.io](https://about.signpath.io/), certificate by [SignPath Foundation](https://signpath.org/).

- Committers and reviewers: [KingKhaax](https://github.com/KingKhaax)
- Approvers: [KingKhaax](https://github.com/KingKhaax)

Release binaries are built from this repository's source code by GitHub Actions and every signing request is approved manually.

## Privacy policy

WipeTime does not collect telemetry and has no user accounts of its own. Settings, API keys you enter and the Battle.net login token are stored only on your computer (encrypted with Windows when available). To work, it makes these requests:

| Service | When | What is sent |
|---|---|---|
| [Warcraft Logs](https://www.warcraftlogs.com/) | When you load a log or rankings | The report code and the data queried |
| WipeTime proxy (`wipetime-proxy.vercel.app`, run by the WipeTime developer on [Vercel](https://vercel.com/)) | When you haven't entered your own API keys | Forwards read-only Warcraft Logs and Blizzard queries (report codes, character/guild names). Nothing is stored; Vercel may keep standard request logs (IP address, time). |
| [Blizzard Battle.net](https://www.blizzard.com/) | Only if you choose to log in, or look up characters/guilds | Login happens on Blizzard's own page; WipeTime receives your BattleTag and a read-only `wow.profile` token |
| [Raider.IO](https://raider.io/) | When you search characters/guilds or view Mythic+ rankings | The names searched |
| [Wowhead](https://www.wowhead.com/), [Raidbots](https://www.raidbots.com/), assets.rpglogs.com, cdn.raidplan.io | When spells, talents, icons or boss maps are shown | Spell IDs and image requests |
| [YouTube](https://www.youtube.com/) (modo de privacidad ampliada, `youtube-nocookie.com`) | Solo al abrir el panel del 12.1.5, donde se muestra el tráiler oficial | La petición del vídeo y tu dirección IP; el reproductor se carga desde la página de la web de WipeTime |
| [GitHub Pages](https://pages.github.com/) | Only if you use the web version | Serves the page; your settings, chosen character and uploaded maps stay in your browser (localStorage/IndexedDB) |
| [GitHub](https://github.com/) | At startup and when you click update; first run downloads an icon pack | Checks for a new version and downloads updates |

Only the request itself and your IP address reach these services. Their privacy policies: [Warcraft Logs](https://www.warcraftlogs.com/) (linked in its site footer), [Vercel](https://vercel.com/legal/privacy-policy), [Blizzard](https://www.blizzard.com/legal/a4380ee5-5c8d-4e3b-83b7-ea26d01a9918/blizzard-entertainment-online-privacy-policy), [Raider.IO](https://raider.io/privacy-policy), [Wowhead](https://www.wowhead.com/privacy), [Raidbots](https://www.raidbots.com/privacy), [GitHub](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement).

## License

[MIT](LICENSE)

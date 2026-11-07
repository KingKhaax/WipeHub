# Flujo para añadir cambios nuevos de clases, raids y Míticas+

Este archivo lo sigue cualquier ejecución (manual o programada). Todo en español; los textos de la web van siempre en español e inglés.

## 1. Detectar qué hay nuevo

1. `git pull --rebase` antes de tocar nada.
2. `node tools/check-hotfixes.mjs` imprime un JSON con `newClassDates`, `newRaidDates` y el texto de esos días (`classText`, `raidText`). Si las dos listas están vacías y `failed` está vacío, no hay nada que hacer: termina sin cambiar nada.
3. Blizzard crea un artículo nuevo de hotfixes cada cierto tiempo. Busca en la web «Hotfixes» + la fecha de hoy en worldofwarcraft.blizzard.com/en-us/news y, si hay un artículo que no está en `tools/raidchanges/data/articles.json`, añade su URL a ese archivo y vuelve a lanzar el paso 2.

## 2. Cambios de clase (solo PvE)

1. Mira en `classText` (salida de check-hotfixes) las secciones «Classes» de cada fecha nueva. Solo PvE: ignora los apartados «Player versus Player».
2. Añade filas en `src/classchanges.js`, dentro de la clase y la especialización que toque (o en `general` si afecta a toda la clase): `['AAAA-MM-DD', tipo, 'texto en español', 'texto en inglés']`. Tipos: `b` mejora, `n` nerfeo, `r` cambio o rediseño, `f` corrección. El texto en inglés es el oficial de Blizzard; el español lo traduces tú.
3. Los nombres de talentos y hechizos se escriben en inglés dentro del texto en español: la app los sustituye sola por el nombre oficial en castellano con su icono y su tooltip. Para que eso funcione hay que regenerar los datos:
   - `node tools/build-classspells.mjs` (descarga las tablas de nombres de wago.tools y escribe `src/classspells.js`).
   - `node tools/fix-classspells.mjs --write` (ajusta cada hechizo al id exacto del árbol de talentos).
4. Comprueba que no queda ningún nombre sin traducir: en `src/classspells.js` ningún nombre nuevo debe quedar con el español igual al inglés (salvo nombres propios como San'layn) ni con id -1. Si alguno no tiene traducción oficial en Wowhead (locale=6), añádelo a `MANUAL_ES` de `tools/fix-classspells.mjs` con su traducción y apúntalo en `tools/raidchanges/data/pending-names.json` para revisarlo cuando Wowhead lo traduzca.
5. Actualiza el texto del subtítulo de la ventana (`PvE · parches 12.1.0 a 12.1.5 y ajustes del …`) y el enlace de fuente (`LINK_TUNING`/`LINK_HOTFIX`) si hay un artículo nuevo.

## 3. Cambios de raids y Míticas+

- Datos en `tools/raidchanges/data/entries.json`. Cada cambio es un objeto:
  `{ "d": "AAAA-MM-DD", "a": "<área>", "u": "<unidad en inglés>", "t": "<tipo>", "es": "...", "en": "..." }`
  - `a`: `va` (El Abismo Venenoso), `tg` (La Gruta Mareal), `kx` (Kith'ix) o el nombre en inglés de la mazmorra de Míticas+ (`Altar of Fangs`, `Den of Nalorakk`, `Murder Row`, `The Blinding Vale`, `Voidscar Arena`, `Kings' Rest`, `Temple of Sethraliss`, `Ruby Life Pools`). Si sale una banda o mazmorra nueva, añádela en la lista `AREAS` de `tools/raidchanges/build.mjs` (con su icono HD en `src/raidicons/`).
  - `u`: jefe o enemigo en inglés tal cual lo escribe Blizzard; `*General` para los cambios sin jefe concreto. Los jefes de mazmorra nuevos van en `BOSS_UNITS` de `build.mjs`.
  - `t`: `g` nerf (verde: al jefe le quitan daño, vida o mecánicas), `r` buff (rojo: le suben daño, vida o mecánicas), `a` cambio sin signo, `v` visual, `f` corrección de errores.
  - `en`: el texto oficial de Blizzard, sin traducir ni cambiar.
  - `es`: la traducción. Los hechizos se escriben `{Nombre en inglés}`; el nombre en castellano, el icono y el tooltip salen solos.
- Cada hechizo nuevo se apunta en `data/lexicon.json` (`"Nombre en inglés": idDelHechizo`). El id se busca en Wowhead; el nombre oficial en castellano sale de `https://nether.wowhead.com/tooltip/spell/<id>?dataEnv=1&locale=6`.
- La dificultad de cada cambio la detecta el generador leyendo el texto en inglés (Raid Finder, Normal, Heroic, Mythic, «all difficulties», «non-Mythic»). Sin dificultad en el texto, el cambio vale para todas.
- Genera con `node tools/raidchanges/build.mjs` (escribe `src/raidchanges.js`). Revisa que el recuento y la fecha final sean los esperados.

## 4. Nombres en castellano (regla: primero inglés, luego castellano)

- Los nombres de criaturas y jefes se traducen con los oficiales de Wowhead. Los que no tengan traducción (Wowhead devuelve el nombre entre corchetes `[Nombre]` o no hay ficha) se publican en inglés y se apuntan en `data/pending-names.json`.
- En cada ejecución semanal lanza `node tools/raidchanges/names.mjs` para ver cuáles ya están traducidos (suele tardar 2-3 días). Con `--write` pasa los traducidos a `data/names_es.json` y los quita de pendientes. Después lanza `build.mjs` y publica.
- Entradas con `"keep": true` se dejan como están a propósito.

## 5. Probar, versión y publicar

1. `node --check src/raidchanges.js src/classchanges.js` y `node --test`.
2. Si has tocado la interfaz, compila la web (`node tools/build-web.mjs`) y míralo con capturas sin ventana (Chrome headless).
3. Versión: solo sube el segundo número (`x.y.0`) en `package.json`. Mira la actual antes. Reutiliza la entrada superior de `src/changelog.js` (cambia `v` y `date` a hoy) salvo que los cambios sean grandes: entonces entrada nueva encima en español e inglés y la anterior recupera su fecha.
4. Commit con autor y committer `sr.kitkat <180756772+KingKhaax@users.noreply.github.com>`, mensaje corto tipo `WipeHub 2.24: cambios de raids del 12 de noviembre`. Nunca menciones a Claude (ni `Co-Authored-By` ni «Generated with»).
5. `git pull --rebase` y `git push` a `main` (o Pull Request si se está en modo revisión).
6. Comprueba con la API de GitHub (`gh run list`) que el workflow Release termina en success y que `https://wipehub.vercel.app/version.json` y `https://kingkhaax.github.io/WipeHub/version.json` sirven la versión nueva. Solo debe quedar la última Release y su tag.

## 6. Resumen final

Deja un resumen corto: qué cambios se añadieron (clases, raids, Míticas+), qué nombres quedan pendientes de traducción, qué versión salió y qué no se pudo comprobar. Si algo falla, dilo claro.

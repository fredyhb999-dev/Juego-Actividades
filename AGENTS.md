# AGENTS.md — Juego-Actividades

Lo general (cómo trabajamos) está en el `AGENTS.md` global. Aquí solo lo de este
repo.

## Qué es

Repo personal de juegos y actividades web. Son páginas HTML que se abren
directamente en el navegador, sin framework, sin build, sin npm y sin
dependencias.

El `index.html` de la raíz enlaza a **Juegos**, **JuegosGuiados**, **Audios**,
**Mental** y **Rutinas**. Cada página tiene su propio CSS y su propio JavaScript.

## Zonas activas

- La raíz y la carpeta `Juego-Actividades/` **se trabajan las dos**. Aunque el
  nombre se repita, **no son copias**: su contenido es diferente. No asumir que
  una es la versión vieja de la otra.
- Los scripts compartidos están en `js/` (`volver.js`, `funciones.js`).
- Las carpetas de audio e imágenes (`Actividades en Audio por Tiempo`,
  `Audio Tiempo Esp`, `Frases Accion`, `Impacto`, `Mental`,
  `Sonido-Frases`) son contenido. No se renombran, mueven ni editan salvo que
  se pida.
- El contenido de esas carpetas (textos, nombres, ponderaciones, audios e
  imágenes) tampoco es nuestro: no se corrige ni se "arregla", aunque tenga
  erratas o datos repetidos. Se avisa al usuario y él decide.
- `Rutinas.html` es una página de este repo; el proyecto `rutinas` es otro repo
  aparte. No mezclarlos.

## Cómo se trabaja

- Leer antes de tocar. Cambios mínimos, en el estilo que ya existe.
- Pedido claro: hacer eso y nada más. Sin arreglos "de paso".
- Pedido ambiguo: preguntar antes de escribir.
- No borrar ni reescribir trabajo a medio hacer sin preguntar.
- No agregar frameworks, librerías, build ni dependencias.
- No renombrar ni mover archivos sin pedirlo.

## Verificación

Después de cada cambio, correr **una sola vez**:

```powershell
node tools/verificar.mjs
```

Revisa la sintaxis de los `.js`, que los `.json` estén bien formados y los
`<script>` escritos dentro de los HTML. **No prueba la app.**

Si falla, se arregla antes de seguir. Si no se puede arreglar, decírselo al
usuario y explicar qué queda roto.

## Pruebas

- El agente comprueba lo que se puede revisar aquí: sintaxis, JSON y scripts.
- Las pruebas de funcionamiento (abrir la app, tocar botones, revisar en el
  navegador o el celular) **las hace el usuario**.
- El agente no abre la app, no inventa pruebas y no crea páginas de prueba.
- Al terminar, entregar **qué cambió** y **uno o dos pasos concretos** para
  probar.
- "Listo" significa revisión de código en verde y código entregado. No
  significa "probado en vivo".

## Documentación

No es obligatoria en este repo. Si se pide, que sea breve y en el archivo que
corresponda. No crear documentación por iniciativa propia.

## Decisiones y publicación

- Las decisiones de producto se preguntan, salvo que ya estén escritas.
- Commit, push y publicar los hace el usuario.

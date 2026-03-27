# Memoria de sesión — 2026-03-27

## Qué se hizo (2026-03-27)

### NavBar: Config movido al dropdown del usuario

- **Config fuera del nav:** El enlace de Config ya no es un item del nav principal. Ahora está dentro del dropdown del usuario (avatar) junto con el logout
- **Click outside:** Añadido `document.addEventListener('click', closeMenu)` en `onMounted` para cerrar el dropdown al clicar fuera
- **`@click.stop`:** El botón del avatar usa `@click.stop` para evitar que el listener de document cierre el menú inmediatamente al abrirlo
- **NuxtLink en dropdown:** El enlace a `/config` dentro del dropdown cierra el menú al navegar (`@click="showUserMenu = false"`)

### Config tabs accesibles por URL

- **Query param `?tab=`:** Las subtabs de `/config` ahora se sincronizan con la URL: `/config?tab=keys`, `/config?tab=linear`, `/config?tab=ai`, `/config?tab=user`, `/config?tab=tokens`
- **Validación:** Solo se aceptan valores válidos del tipo `TabValue`, fallback a `'keys'`
- **Bidireccional:** Cambiar tab actualiza la URL, cambiar la URL actualiza el tab (útil para navegación con botones atrás/adelante)
- **`router.replace`:** Usa `replace` en vez de `push` para no llenar el historial

### Mejora del prompt de generación de planes

- **Prompt reescrito** en `server/api/ai/action-plan.post.ts` — de 3-8 pasos genéricos a 4-12 pasos específicos con:
  - **CONTEXT NEEDED:** Si falta info, lista preguntas al dev (archivos, edge cases, criterios de aceptación, feature flags)
  - **PLAN:** Pasos concretos con archivos/funciones/endpoints, agrupados lógicamente, con testing cuando aplique
  - **QUESTIONS:** 1-5 preguntas concretas al desarrollador, o "None — task is clear"
  - **GENERATED CONTEXT:** Mini documento de contexto reutilizable para futuras tareas del mismo área (2-10 bullets con area, key files, patterns, dependencies, notes)
- **Sentinel value `__DEFAULT__`:** `customPrompt` en `useConfig` usa `'__DEFAULT__'` en vez de `''` para distinguir "no customizado" de "vacío"
- **Textarea editable:** El prompt por defecto ahora aparece como texto en el textarea (no placeholder), para que el usuario pueda hacer ediciones parciales sin reescribir todo
- **`resolvedCustomPrompt`:** Computed getter/setter en config.vue que mapea `__DEFAULT__` y `''` (legacy) al prompt por defecto
- **Backend:** `action-plan.post.ts` trata `__DEFAULT__` como "sin custom prompt", usa el default
- **Contexto con contextos:** Cuando hay contextos activos, el system prompt también pide skippear QUESTIONS ya respondidas por los contextos y enriquecer el GENERATED CONTEXT

### MCP Skill para Claude Code

- **Servidor MCP** en `mcp/task-server.ts` — usa `@modelcontextprotocol/sdk` con transporte stdio
- **3 tools:**
  - `list_tasks` — GET /api/tasks con filtros `task_status`, `assigned_to`, `limit`
  - `get_task` — GET /api/tasks/:id
  - `update_task_status` — PATCH /api/tasks/:id/status con `task_status` y `assigned_to` opcional
- **Auth:** Bearer token vía env var `VOICE_TO_TASK_TOKEN` (generado en /config?tab=tokens)
- **URL base:** `VOICE_TO_TASK_URL` env var, default `https://voice-to-task-taupe.vercel.app`
- **Workflow agéntico:** Las descripciones de las tools guían al agente: pick TODO → claim con IN_PROGRESS + assigned_to → work → mark DONE
- **Errores:** 401 (auth), 404 (not found), 429 (usage limit), genéricos
- **`.mcp.json`** en raíz del proyecto para que Claude Code auto-descubra el servidor
- **Dependencia:** `@modelcontextprotocol/sdk` (trae `zod` como peer)
- **Runner:** `npx tsx mcp/task-server.ts`

### Rediseño mobile-first de index.vue

- **Layout reorganizado:** Hero record button cuando no hay texto + textarea siempre visible + toolbar compacta con texto
- **Botón grabar dual:** Hero (w-20 h-20) sin texto, compact (w-10 h-10 en toolbar) con texto
- **Toolbar row:** Record, clear, generate plan, refine, auto mode (icono), spacer, preview toggle (ojo), SplitActionButton
- **Markdown preview:** Toggle ojo para alternar entre textarea y preview renderizado. Click en preview vuelve a edición
- **Markdown rendering:** `marked` + `dompurify` (lazy-loaded client-only vía dynamic import para evitar SSR errors)
- **Pills horizontales en móvil:** `flex-nowrap overflow-x-auto scrollbar-hide` con `sm:flex-wrap`. Touch targets aumentados a `px-3 py-1.5`
- **Success message movido arriba** (entre banners y contenido)
- **Transiciones animadas:** `hero-fade` (scale + opacity), `toolbar-slide` (translateY + opacity)
- **SplitActionButton:** Nueva prop `dropDirection: 'up' | 'down'` (default `'up'`), usado con `'down'` en toolbar
- **CSS:** Estilos markdown-preview en CSS puro (no `@apply`, el proyecto usa Tailwind CDN no PostCSS). scrollbar-hide, transiciones
- **i18n:** Añadidas claves `index.preview` / `index.edit` en EN y ES
- **Dependencias:** `marked`, `dompurify` (peer, lazy client import)

### Selector de color de acento (Task 17)

- **6 colores:** indigo, blue, violet, rose, emerald, amber
- **Reemplazo masivo:** ~68 referencias `indigo-*` cambiadas a `accent-*` en 10+ archivos
- **Tailwind CDN config:** `tailwind.config` en `nuxt.config.ts` mapea color `accent` a CSS variables (`--accent-50`, etc.)
- **useTheme.ts:** Exporta `applyAccentColor(color)` y objeto `accentPalettes` con las paletas completas
- **Config.vue:** UI de selección con swatches de color en el tab "User"
- **CSS variables:** `assets/css/main.css` define las variables por defecto (indigo), `applyAccentColor` las actualiza dinámicamente
- **Persistencia:** Color guardado en `useConfig` → localStorage, keyed por email
- **Fix (2026-03-27):** El config de Tailwind CDN debía estar en el mismo script tag que el src. Separados en dos tags.
- **Fix (2026-03-27):** `useI18n()` no exporta `success`/`error`, solo `t`. Corregido en config.vue para usar `useToast()` para toasts.
- **Fix (2026-03-27):** Añadidas variables CSS por defecto en `main.css` (`:root` block) porque el Tailwind config se carga antes de que las variables estén definidas.
- **Fix (2026-03-27):** Faltaban traducciones de theme y accent color en inglés y español. Añadidas `config.theme`, `config.themeSystem`, `config.themeLight`, `config.themeDark` y `config.accentColor*` en ambos idiomas.

---

### Reglas importantes para1. **RESPETET ABS ÓRDENES EXPLÍCITAS:** Si el usuario dice explícitamente "no toques X", "no edites X", "para aquí", "stop", DEBO DETENERME INMEDIATAMENTE.
2. **VERIFICAR ANTES DE ACTUAR:** Si el usuario proporciona un archivo completo (ej. SVG, código), usarlo EXACTAMENTE como está, sin modificaciones.
3. **ESCUCHAR FEEDBACK:** Si el usuario dice que algo está mal 3 veces, PARAR, preguntar alternativas o pedir aclaración antes de continuar.
4. **NO SOBREREITAR ALGO:** Cuando algo está mal, no intentar arreglarlo con más cambios. Preguntar qué quiere el usuario.

### Icono de la app (2026-03-27)
- **Diseño:** Micrófono en esquina inferior izquierda + 3 ondas de sonido curvas (círculo + curva bézier)
- **Archivos:** `favicon.svg` (512x512), `apple-touch-icon.svg` (180x180)
- **Problema inicial:** Hice cambios incorrectos múltiples veces ignorando el SVG proporcionado por el usuario
- **Corrección:** Usar EXACTAMENTE el SVG dado por el usuario, sin modificaciones
- **Commit:** `acb950d`

### Notas técnicas
- Tailwind en este proyecto se carga via CDN script (`cdn.tailwindcss.com`), NO como plugin PostCSS. Por tanto `@apply` en CSS externo no funciona — hay que usar CSS puro
- `dompurify` no se puede importar estáticamente en SSR (necesita DOM). Se hace `import('dompurify')` dinámico guardado en un `ref` que se resuelve en el cliente. El computed `renderedMarkdown` devuelve HTML sin sanitizar en SSR (fallback seguro, es contenido del propio usuario)
- `isomorphic-dompurify` tampoco funciona en Nuxt SSR (error `bind` en ViteNodeRunner)
- `v-icon` (oh-vue-icons) es un plugin `.client.ts`, genera warnings SSR pre-existentes — no es un bug nuevo

---

# Memoria de sesión — 2026-03-26

## Qué se hizo

### Migración de better-sqlite3 a @libsql/client (Turso)
- **Motivo:** Preparar la app para despliegue en Vercel (serverless). better-sqlite3 requiere un binario nativo y archivo local, incompatible con serverless.
- **Solución:** Migrar a `@libsql/client`, que soporta tanto archivos locales (`file:data/voice-linear.db`) como bases de datos remotas en Turso.

### Cambios principales

1. **Dependencias:** Eliminado `better-sqlite3` y `@types/better-sqlite3`. Instalado `@libsql/client`.

2. **`nuxt.config.ts`:** Añadido `runtimeConfig.turso` con `url` (default `file:data/voice-linear.db`) y `authToken` (default vacío). Variables de entorno: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`.

3. **`server/utils/db.ts` — reescritura completa:**
   - `useDB()` → devuelve el `Client` singleton de libsql (sync, solo crea la conexión)
   - `ensureDB()` → async, inicializa el esquema una vez con `db.batch()` y migraciones idempotentes con try/catch en ALTER TABLE
   - Todos los consumidores deben usar `await ensureDB()` en vez de `useDB()`

4. **Patrón de conversión sync → async:**
   - `db.prepare(sql).get(...args)` → `await db.execute({ sql, args })` → `result.rows[0]`
   - `db.prepare(sql).all(...args)` → `await db.execute({ sql, args })` → `result.rows`
   - `db.prepare(sql).run(...args)` → `await db.execute({ sql, args })` → `result`
   - `result.lastInsertRowid` → `Number(result.lastInsertRowid)` (bigint)
   - `result.changes` → `result.rowsAffected`
   - `db.transaction(fn)` → `db.batch(statements, 'deferred')`

5. **Archivos convertidos a async (27 archivos):**
   - `server/utils/db.ts` (reescritura)
   - `server/utils/api-tokens.ts` — todas las funciones async
   - `server/utils/user-keys.ts` — todas las funciones async
   - `server/utils/session-email.ts` — añadido `await` a `validateApiToken()`
   - `server/utils/linear-sync.ts` — `getStateMap()` ahora async
   - 4 endpoints de contexts, 4 de entries, 3 de tasks, 2 de settings, 2 de AI, 3 de api-tokens, 2 de user-keys

6. **Fixes de TypeScript:**
   - `getRouterParam()` devuelve `string | undefined`, pero `InValue` no acepta `undefined` → añadido `!` assertion en rutas con param obligatorio
   - `Row` de libsql no se puede castear directamente a tipos concretos → usar `as unknown as Type`

7. **Documentación actualizada:** README.md, CONTEXT.md, .env.example con referencias a Turso/libsql.

### Commit
- Hash: `7564f06`
- Branch: `main`
- Pusheado a origin (nota: el remote se ha movido a `git@github.com:iago-sf/voice-to-task.git`)

## Decisiones tomadas

- **No usar Prisma:** Se discutió usar Prisma como ORM por preocupaciones de SQL injection. Se decidió continuar con `@libsql/client` porque:
  - Las consultas parametrizadas (`?` + `args`) ya previenen SQL injection
  - La construcción dinámica de SQL en PATCH handlers usa nombres de columna de arrays hardcodeados, no input del usuario
  - Prisma + Turso requiere `@prisma/adapter-libsql` (experimental) y sería un cambio mucho mayor

## Arquitectura actual de sesión/auth
- **Sesión:** `nuxt-auth-utils` con cookie cifrada server-side (`NUXT_SESSION_PASSWORD`)
- **Login:** Google OAuth → `setUserSession({ user: { name, email, avatar } })`
- **Datos sensibles en servidor:** API keys cifradas con AES-256-GCM en `user_api_keys`, tokens hasheados con SHA256 en `api_tokens`, settings en `user_settings`
- **No hay tabla `users`** explícita — el email de Google es la clave. Suficiente mientras solo haya OAuth.
- **localStorage** solo tiene preferencias de UI (tema, idioma, equipo Linear seleccionado), keyed por email

## Errores pre-existentes
- `server/api/transcribe.post.ts` tiene errores de tipo `Buffer` vs `BlobPart` — no relacionados con la migración

## Pendiente / ideas futuras
- Actualizar el remote URL del repo: `git remote set-url origin git@github.com:iago-sf/voice-to-task.git`
- Desplegar en Vercel con Turso remoto (configurar `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`)
- Considerar tabla `users` formal si se añaden más providers de auth
- Fix del error de tipos en `transcribe.post.ts`

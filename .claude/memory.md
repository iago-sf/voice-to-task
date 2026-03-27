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

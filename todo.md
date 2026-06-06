# TODO - WorkerOnline


FIX:

- [x] git config user.email/name desde env vars GIT_USER_EMAIL + GIT_USER_NAME ✅ (entrypoint.sh + docker-compose.yml)
- npm install -g @juliusbrussee/caveman-code / curl -fsSL https://raw.githubusercontent.com/JuliusBrussee/caveman/main/install.sh | bash
- skills y plugins de claude

## 🔔 Notificaciones
- [ ] Notificaciones cuando una tarea de AI termina (integrar `opencode-notifier` o hook `event` → `session.idle`)
- [x] Notificaciones visuales en la UI (toast/snackbar) para eventos importantes ✅ (ToastProvider + ToastContainer + useToast)
- [x] Sonido/configuración por tipo de evento (complete, error, permission, etc.) ✅ (useSound con Web Audio API, toggle mute)

## 🖥️ UI/UX - Clonar repos
- [x] Input + botón en sidebar para pegar URL de GitHub y clonar sin escribir `git clone` ✅ (WorkspaceModal + botón "Clone" en sidebar)
- [ ] Selector de branch/tag al clonar
- [x] Feedback visual: toast al terminar clone ✅ (toast success/error con sonido)
- [x] Botón "New workspace" (mkdir) ✅ (WorkspaceModal + botón "New" en sidebar)
- [ ] Botón "New repo" (git init + remote add)
- [ ] Historial de repos clonados recientemente

## 🔐 Gestión de credenciales
- [ ] UI de Settings para gestionar `GITHUB_TOKEN`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
- [ ] Enmascarar claves en la UI (tipo password)
- [ ] Backend: endpoint CRUD para credenciales (almacenar en archivo JSON cifrado o `.env`)
- [x] `.env.example` para documentar variables disponibles ✅ (creado con todas las variables)
- [x] Validación de variables de entorno al iniciar el servidor ✅ (validación básica en server.ts)

## 🔒 Seguridad
- [x] Autenticación de usuarios (login/password o token) ✅ (JWT hardcodeado con env: ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET)
- [x] Proteger `/api/exec` — solo usuarios autenticados, whitelist de comandos o sandbox ✅ (requireAuth middleware + validación básica de comandos)
- [x] Autenticación WebSocket (token en handshake o cookie) ✅ (token en query param `?token=xxx`)
- [ ] Rate limiting en HTTP y WebSocket
- [ ] HTTPS/TLS con certificados auto-generados o configurables
- [ ] Aislar sesiones por usuario (cada usuario su propio workspace)

## 🖇️ Terminal & Sesiones
- [x] Soporte para múltiples pestañas de terminal ✅ (Dashboard: add/close terminal tabs, each tab isolated WS+PTY)
- [x] Reconexión automática del WebSocket (reconnect con backoff) ✅ (Terminal.tsx: exponential backoff 1s→2s→4s→30s max)
- [ ] Persistencia de sesión: reabrir terminal sin perder historial
- [ ] Atajos de teclado configurables (Ctrl+Shift+C/V, nuevas pestañas, etc.)
- [ ] Control de tamaño de fuente desde la UI
- [ ] Exportar historial de terminal a archivo

## 📁 Explorador de archivos
- [x] File tree visual en sidebar (navegar `/workspace` gráficamente) ✅ (FileExplorer component en sidebar)
- [x] Editor de texto básico embebido (CodeMirror) ✅ (CodeEditor en tab separado con soporte JS/TS/JSON/Markdown/Python)
- [x] Crear/renombrar/eliminar archivos y carpetas desde UI ✅ (FileExplorer: +f/+d/rename/delete buttons; backend: DELETE /api/files, POST /api/files/mkdir, PATCH /api/files/rename)
- [ ] Upload/download de archivos

## 🤖 Herramientas AI
- [ ] Detección real de si opencode/claude están corriendo (no solo estado UI)
- [ ] Panel de output dedicado para AI (separado de la terminal)
- [ ] Historial de sesiones AI anteriores
- [ ] Selector de modelo/provider para AI tools
- [ ] Comandos rápidos predefinidos para AI ("Explain this code", "Refactor", etc.)

## 🎨 UI/UX General
- [x] Toggle dark/light theme ✅ (ThemeProvider + ThemeToggle + CSS variables)
- [ ] Temas de terminal seleccionables (Monokai, Solarized, Nord, etc.)
- [ ] Responsive: mejorar experiencia mobile (touch gestures, teclado virtual)
- [x] Error boundary en React (evitar white screen en crashes) ✅ (ErrorBoundary component en App.tsx)
- [x] Skeleton/spinner durante carga inicial de terminal ✅ (TerminalSkeleton component)
- [x] Atajos de teclado documentados (modal de ayuda `?`) ✅ (ShortcutsModal con tecla ?)

## 🧪 Testing
- [ ] Tests unitarios backend con Vitest o Jest
- [ ] Tests unitarios frontend con React Testing Library
- [ ] Tests de integración WebSocket
- [ ] Tests E2E con Playwright (terminal + sidebar)

## ⚡ Optimizaciones Frontend
- [x] Code splitting con `React.lazy()` + `Suspense` (cargar paneles bajo demanda) ✅ (CodeEditor lazy-loaded, ~900KB separado del bundle inicial)
- [ ] Compresión gzip/brotli en Vite (`vite-plugin-compression`)
- [ ] Caché de assets con hash en nombre de archivo (ya tiene, verificar config)
- [ ] Precargar fuentes y assets críticos (`<link rel="preload">`)
- [ ] Optimizar bundle size: analizar con `rollup-plugin-visualizer`
- [ ] Tree shaking: verificar imports sin barrel files
- [ ] PWA: service worker, offline support, manifest, íconos
- [ ] Virtual scrolling para file tree grande
- [x] Debounce/throttle en eventos de resize de terminal ✅ (Terminal.tsx: 150ms debounce en ResizeObserver)
- [ ] React.memo en componentes de sidebar para evitar re-renders
- [ ] CSS containment y `will-change` para animaciones del sidebar
- [x] Formato y linting: ESLint + Prettier + `.editorconfig` ✅ (configurados en frontend/)
- [ ] Pre-commit hooks con husky + lint-staged
- [x] TypeScript strict + path aliases (`@/components`, `@/hooks`) ✅ (configurados en vite.config.ts y tsconfig.json)

## ⚡ Optimizaciones Backend
- [x] Compresión WebSocket (`perMessageDeflate: true`) ✅ (cambiado en server.ts)
- [ ] Cluster mode con `node:cluster` o PM2 para multi-core
- [x] Health check endpoint (`GET /api/health`) ✅ (endpoint + docker-compose healthcheck)
- [x] Graceful shutdown (cerrar PTYs, WebSockets, conexiones activas) ✅ (cierra WS, fuerza salida tras 10s)
- [x] Rate limiting (express-rate-limit) ✅ (100 req/15min en /api/, 5 req/15min en /api/auth/login)
- [x] Logging estructurado con `pino` o `winston` (reemplazar console.log) ✅ (logger básico con timestamps/requestId)
- [x] Request ID por sesión para tracing de logs ✅ (requestId en Express middleware y WS)
- [x] Timeout en WebSocket inactivo (cerrar tras N minutos) ✅ (configurable via WS_TIMEOUT_MS, default 15min)
- [ ] Límite de sesiones concurrentes por IP/usuario
- [ ] Quitar `sourceMap: true` en producción (backend tsconfig) ⚠️ (pendiente: crear script build:prod)
- [x] Validación de input con Zod en `/api/exec` y `/api/workspaces` ✅ (validación básica de cmd + caracteres bloqueados)
- [ ] Caché en memoria para lista de workspaces (invalidar con watcher)
- [ ] Tipos compartidos entre frontend/backend (monorepo o types package)
- [x] Variables de entorno tipadas y validadas al arranque ✅ (validación básica en startup)

## 🐳 Docker & DevOps
- [x] `.env.example` con todas las variables documentadas ✅ (creado en raíz)
- [x] Docker healthcheck en `docker-compose.yml` ✅ (healthcheck con curl a /api/health)
- [ ] `docker-compose.override.yml` para desarrollo local
- [x] Arreglar indentación del `COPY` en Dockerfile (línea ~45) ✅ (indentación corregida)
- [ ] Multi-stage build: optimizar orden de capas para mejor caché
- [x] `.dockerignore` revisar (excluir `node_modules`, `.git`, archivos innecesarios) ✅ (creado .dockerignore)
- [ ] CI/CD: arreglar orden de bump de versión (bump antes de build, no después)
- [ ] CI/CD: añadir paso de tests antes del build de imagen
- [ ] CI/CD: añadir linting/typecheck antes del build

---

## 📋 Resumen de Progreso (Actualizado: 2026-06-06, v0.1.12)

### ✅ Completado en FASE 5 (esta sesión)

| Área | Tareas completadas |
|------|-------------------|
| **Persistencia sesiones** | Volúmenes Docker para `~/.claude` y `~/.opencode` y `~/.config` — Claude Code y OpenCode no pierden auth/sesiones al reiniciar |
| **Git identity** | `GIT_USER_EMAIL` + `GIT_USER_NAME` env vars configuran git en entrypoint.sh. Fix: `gitconfig:/root/.gitconfig` era volumen de directorio (bug Docker), eliminado |
| **Terminal multi-tab** | Dashboard: add/close terminal tabs, cada tab tiene WS+PTY aislado |
| **WS auto-reconnect** | Terminal.tsx: backoff exponencial 1s→2s→4s→30s, muestra "Reconnecting in Xs..." |
| **Debounce resize** | Terminal.tsx: ResizeObserver con 150ms debounce, reduce WS messages |
| **Code splitting** | CodeEditor lazy-loaded con React.lazy+Suspense, ~900KB fuera del bundle inicial |
| **Rate limiting** | express-rate-limit: 100 req/15min en /api/, 5 req/15min en /api/auth/login |
| **File CRUD** | Backend: DELETE /api/files, POST /api/files/mkdir, PATCH /api/files/rename. Frontend: +f/+d/rename(dblclick)/delete en FileExplorer |

### ⚠️ Pendientes (para futuras fases)

| Tarea | ¿Qué falta? |
|-------|-------------|
| **Imágenes en editor** | CodeMirror solo soporta texto. Pendiente: preview de imágenes |
| **Múltiples usuarios** | Actualmente solo 1 usuario hardcodeado. Pendiente: sistema de usuarios real |
| **HTTPS/TLS** | Pendiente: certificados auto-generados o configurables |
| **PWA** | Pendiente: service worker, offline support, manifest |
| **Tests** | Pendiente: Vitest/Jest backend, React Testing Library frontend, Playwright E2E |
| **UI Settings credenciales** | Pendiente: panel para gestionar API keys desde la UI |

### 📝 Notas técnicas
- **Autenticación**: El sistema usa JWT con 1 usuario hardcodeado en variables de entorno. El token se envía en `Authorization: Bearer <token>` para REST y `?token=xxx` para WebSocket.
- **Bug Fix (2026-06-06)**: Se corrigió un bug donde los componentes `WorkspacePanel` y `GitPanel` usaban `fetch` directo en lugar de `authFetch` (que incluye el header `Authorization: Bearer <token>`). Esto causaba "Unauthorized - No token provided" después de login exitoso. El fix fue propagar el `token` desde `Dashboard` → `Sidebar` → `WorkspacePanel`/`GitPanel` y usar `authFetch` en todas las llamadas a la API.
- **Fix Terminal Loading (2026-06-06)**: Se corrigió bug donde la terminal quedaba en estado de carga (Skeleton) sin cambiar nunca. El problema era que el estado `loading` se inicializaba como `true` y `setLoading(false)` solo se ejecutaba dentro del `useEffect` si había un `token`. Si el token llegaba tarde o no existía, el Skeleton se mostraba indefinidamente. Solución: Se eliminó el estado `loading` y el `TerminalSkeleton` del componente Terminal. La terminal se renderiza inmediatamente con xterm.js, y el WebSocket maneja su propio estado de conexión.
- **CodeMirror**: Editor funcional con soporte para JS, TS, JSON, Markdown, Python. Temas dark/light integrados. El bundle aumentó a ~1MB (996KB) por CodeMirror. Recomendado: code splitting para CodeMirror.
- **Validación de comandos**: `/api/exec` bloquea caracteres peligrosos (`;`, `&&`, `||`, `|`, etc.) como medida de seguridad básica temporal.
- **Logging**: El logger actual es básico (console.log con formato). Para producción se recomienda migrar a `pino` o `winston`.
- **ESLint/Prettier**: Configurados en `frontend/` ✅ (0 errores, 0 warnings). Hooks separados a archivos independientes (`useAuth.ts`, `useToast.ts`, `useTheme.ts`) para Fast Refresh.
- **TypeScript**: Declaraciones de tipos para `.css` creadas (`src/types/css.d.ts`). Todos los errores de tipo corregidos.
- **Tema light**: El UI del sidebar y editor cambia con CSS variables. El terminal (xterm.js) sigue con colores hardcoded dark - necesitaría actualizar `term.options.theme` dinámicamente.
- **Lint Fixes (2026-06-06)**: Se corrigieron todos los errores de linting:
  - Fast Refresh: Hooks separados de componentes (useAuth, useToast, useTheme)
  - useEffect deps: Añadidas dependencias faltantes en Dashboard.tsx y CodeEditor.tsx
  - `any` types: Reemplazados por tipos específicos en GitPanel.tsx y useSound.ts
  - CSS imports: Creado `src/types/css.d.ts` para declaraciones de módulos CSS

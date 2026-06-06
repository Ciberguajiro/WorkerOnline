# TODO - WorkerOnline

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
- [ ] Soporte para múltiples pestañas de terminal
- [ ] Reconexión automática del WebSocket (reconnect con backoff)
- [ ] Persistencia de sesión: reabrir terminal sin perder historial
- [ ] Atajos de teclado configurables (Ctrl+Shift+C/V, nuevas pestañas, etc.)
- [ ] Control de tamaño de fuente desde la UI
- [ ] Exportar historial de terminal a archivo

## 📁 Explorador de archivos
- [x] File tree visual en sidebar (navegar `/workspace` gráficamente) ✅ (FileExplorer component en sidebar)
- [x] Editor de texto básico embebido (CodeMirror) ✅ (CodeEditor en tab separado con soporte JS/TS/JSON/Markdown/Python)
- [ ] Crear/renombrar/eliminar archivos y carpetas desde UI
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
- [ ] Code splitting con `React.lazy()` + `Suspense` (cargar paneles bajo demanda)
- [ ] Compresión gzip/brotli en Vite (`vite-plugin-compression`)
- [ ] Caché de assets con hash en nombre de archivo (ya tiene, verificar config)
- [ ] Precargar fuentes y assets críticos (`<link rel="preload">`)
- [ ] Optimizar bundle size: analizar con `rollup-plugin-visualizer`
- [ ] Tree shaking: verificar imports sin barrel files
- [ ] PWA: service worker, offline support, manifest, íconos
- [ ] Virtual scrolling para file tree grande
- [ ] Debounce/throttle en eventos de resize de terminal
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
- [ ] Rate limiting (express-rate-limit + ws-rate-limit)
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

## 📋 Resumen de Progreso (Actualizado: 2026-06-06)

### ✅ Completado en esta sesión (FASE 4 + Fixes)

| Área | Tareas completadas |
|------|-------------------|
| **Autenticación** | JWT hardcodeado (ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET), login/logout, protección de endpoints REST y WebSocket |
| **Notificaciones** | Toast system (success, error, info, warning), sonidos con Web Audio API (beep simples), toggle mute |
| **Explorador de archivos** | FileExplorer en sidebar (árbol de archivos), CodeEditor en tab separado (CodeMirror 6 con JS/TS/JSON/Markdown/Python), guardar archivos (Ctrl+S) |
| **UI/UX** | Tabs Terminal/Editor, botón login/logout en header, botón explore en workspaces |
| **Clone/New** | Botones "Clone Repo" y "New Workspace" en sidebar con modal (WorkspaceModal) |
| **Fixes** | Terminal layout (flex:1), WebSocket reconexión con token, authFetch en todos los componentes |

### ⚠️ Pendientes de FASE 4 (para futura implementación)

| Tarea | ¿Qué falta? |
|-------|-------------|
| **Imágenes en editor** | CodeMirror solo soporta texto. Pendiente: preview de imágenes |
| **CRUD archivos** | Solo navegar y editar. Pendiente: crear/renombrar/eliminar archivos/carpetas |
| **Múltiples usuarios** | Actualmente solo 1 usuario hardcodeado. Pendiente: sistema de usuarios real |
| **Rate limiting** | Pendiente: express-rate-limit + ws-rate-limit |
| **HTTPS/TLS** | Pendiente: certificados auto-generados o configurables |
| **PWA** | Pendiente: service worker, offline support, manifest |
| **Code splitting** | Bundle de 1MB. Pendiente: React.lazy() + Suspense para CodeMirror |
| **Tests** | Pendiente: Vitest/Jest backend, React Testing Library frontend, Playwright E2E |

### 📝 Notas técnicas
- **Autenticación**: El sistema usa JWT con 1 usuario hardcodeado en variables de entorno. El token se envía en `Authorization: Bearer <token>` para REST y `?token=xxx` para WebSocket.
- **Bug Fix (2026-06-06)**: Se corrigió un bug donde los componentes `WorkspacePanel` y `GitPanel` usaban `fetch` directo en lugar de `authFetch` (que incluye el header `Authorization: Bearer <token>`). Esto causaba "Unauthorized - No token provided" después de login exitoso. El fix fue propagar el `token` desde `Dashboard` → `Sidebar` → `WorkspacePanel`/`GitPanel` y usar `authFetch` en todas las llamadas a la API.
- **Fix Terminal (2026-06-06)**: Se corrigió el layout de la terminal (cambió `height: '100%'` a `flex: 1` para que funcione en contenedor flex). También se añadió reconexión automática del WebSocket cuando cambia el token (el componente se remonta con `key` basado en auth state).
- **CodeMirror**: Editor funcional con soporte para JS, TS, JSON, Markdown, Python. Temas dark/light integrados. El bundle aumentó a ~1MB (996KB) por CodeMirror. Recomendado: code splitting para CodeMirror.
- **Validación de comandos**: `/api/exec` bloquea caracteres peligrosos (`;`, `&&`, `||`, `|`, etc.) como medida de seguridad básica temporal.
- **Logging**: El logger actual es básico (console.log con formato). Para producción se recomienda migrar a `pino` o `winston`.
- **ESLint/Prettier**: Configurados en `frontend/` pero no en `backend/` (falta añadir config similar en backend).
- **Tema light**: El UI del sidebar y editor cambia con CSS variables. El terminal (xterm.js) sigue con colores hardcoded dark - necesitaría actualizar `term.options.theme` dinámicamente.

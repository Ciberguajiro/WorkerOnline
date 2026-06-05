# TODO - WorkerOnline

## 🔔 Notificaciones
- [ ] Notificaciones cuando una tarea de AI termina (integrar `opencode-notifier` o hook `event` → `session.idle`)
- [ ] Notificaciones visuales en la UI (toast/snackbar) para eventos: repo clonado, comando completado, error
- [ ] Sonido/configuración por tipo de evento (complete, error, permission, etc.)

## 🖥️ UI/UX - Clonar repos
- [ ] Input + botón en sidebar para pegar URL de GitHub y clonar sin escribir `git clone`
- [ ] Selector de branch/tag al clonar
- [ ] Feedback visual: spinner durante clone, toast al terminar
- [ ] Botón "New repo" (git init + remote add)
- [ ] Historial de repos clonados recientemente

## 🔐 Gestión de credenciales
- [ ] UI de Settings para gestionar `GITHUB_TOKEN`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
- [ ] Enmascarar claves en la UI (tipo password)
- [ ] Backend: endpoint CRUD para credenciales (almacenar en archivo JSON cifrado o `.env`)
- [ ] `.env.example` para documentar variables disponibles
- [ ] Validación de variables de entorno al iniciar el servidor

## 🔒 Seguridad
- [ ] Autenticación de usuarios (login/password o token)
- [ ] Proteger `/api/exec` — solo usuarios autenticados, whitelist de comandos o sandbox
- [ ] Autenticación WebSocket (token en handshake o cookie)
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
- [ ] File tree visual en sidebar (navegar `/workspace` gráficamente)
- [ ] Editor de texto básico embebido (Monaco/CodeMirror)
- [ ] Crear/renombrar/eliminar archivos y carpetas desde UI
- [ ] Upload/download de archivos

## 🤖 Herramientas AI
- [ ] Detección real de si opencode/claude están corriendo (no solo estado UI)
- [ ] Panel de output dedicado para AI (separado de la terminal)
- [ ] Historial de sesiones AI anteriores
- [ ] Selector de modelo/provider para AI tools
- [ ] Comandos rápidos predefinidos para AI ("Explain this code", "Refactor", etc.)

## 🎨 UI/UX General
- [ ] Toggle dark/light theme
- [ ] Temas de terminal seleccionables (Monokai, Solarized, Nord, etc.)
- [ ] Responsive: mejorar experiencia mobile (touch gestures, teclado virtual)
- [ ] Error boundary en React (evitar white screen en crashes)
- [ ] Skeleton/spinner durante carga inicial de terminal
- [ ] Atajos de teclado documentados (modal de ayuda `?`)

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
- [ ] Formato y linting: ESLint + Prettier + `.editorconfig`
- [ ] Pre-commit hooks con husky + lint-staged
- [ ] TypeScript strict + path aliases (`@/components`, `@/hooks`)

## ⚡ Optimizaciones Backend
- [ ] Compresión WebSocket (`perMessageDeflate: true`)
- [ ] Cluster mode con `node:cluster` o PM2 para multi-core
- [ ] Health check endpoint (`GET /api/health`)
- [ ] Graceful shutdown (cerrar PTYs, WebSockets, conexiones activas)
- [ ] Rate limiting (express-rate-limit + ws-rate-limit)
- [ ] Logging estructurado con `pino` o `winston` (reemplazar console.log)
- [ ] Request ID por sesión para tracing de logs
- [ ] Timeout en WebSocket inactivo (cerrar tras N minutos)
- [ ] Límite de sesiones concurrentes por IP/usuario
- [ ] Quitar `sourceMap: true` en producción (backend tsconfig)
- [ ] Validación de input con Zod en `/api/exec` y `/api/workspaces`
- [ ] Caché en memoria para lista de workspaces (invalidar con watcher)
- [ ] Tipos compartidos entre frontend/backend (monorepo o types package)
- [ ] Variables de entorno tipadas y validadas al arranque

## 🐳 Docker & DevOps
- [ ] `.env.example` con todas las variables documentadas
- [ ] Docker healthcheck en `docker-compose.yml`
- [ ] `docker-compose.override.yml` para desarrollo local
- [ ] Arreglar indentación del `COPY` en Dockerfile (línea ~45)
- [ ] Multi-stage build: optimizar orden de capas para mejor caché
- [ ] `.dockerignore` revisar (excluir `node_modules`, `.git`, archivos innecesarios)
- [ ] CI/CD: arreglar orden de bump de versión (bump antes de build, no después)
- [ ] CI/CD: añadir paso de tests antes del build de imagen
- [ ] CI/CD: añadir linting/typecheck antes del build

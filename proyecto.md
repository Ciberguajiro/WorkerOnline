# WorkerOnline - Especificación del Proyecto (Agnóstica de Tecnología)

> Este documento describe el proyecto WorkerOnline sin hacer referencia a tecnologías concretas,
> para que pueda ser reconstruido con cualquier stack tecnológico.

---

## 1. Descripción General

**WorkerOnline** es una terminal web interactiva que expone una shell real del sistema operativo a través del navegador. Permite a los usuarios:

- Clonar repositorios Git y trabajar con ellos en un directorio persistente de trabajo
- Ejecutar herramientas de IA para programación directamente desde la terminal del navegador
- Navegar y editar archivos mediante un explorador lateral y un editor de código embebido
- Ejecutar cualquier comando del sistema desde la interfaz web

### Versión actual: 0.1.10
### Licencia: MIT

---

## 2. Funcionalidades

### Terminal Web
- Shell real del sistema con soporte completo de entrada/salida
- Redimensionamiento dinámico según el tamaño de la ventana del navegador
- Comunicación bidireccional en tiempo real
- Timeout de inactividad configurable
- Soporte para pegar texto desde el portapapeles
- Tema oscuro/claro

### Editor de Código
- Editor de código completo con pestañas múltiples
- Resaltado de sintaxis para múltiples lenguajes (JavaScript, TypeScript, JSON, Markdown, Python)
- Indicador de cambios no guardados
- Guardado con atajo de teclado
- Carga de archivos desde el explorador de archivos

### Explorador de Archivos
- Navegación de árbol de directorios recursiva
- Expandir/colapsar directorios
- Apertura de archivos en el editor al hacer clic
- Visible cuando hay un espacio de trabajo seleccionado

### Gestión de Espacios de Trabajo
- Listado de espacios de trabajo existentes
- Clonación de repositorios desde GitHub
- Creación de nuevos espacios de trabajo vacíos
- Cada espacio de trabajo es un directorio persistente en el servidor

### Panel Git
- Visualización de la rama actual
- Botones de Git Status, Pull y Push
- Panel de salida colapsable con resultados de comandos Git

### Herramientas de IA
- Botones para iniciar/detener herramientas de IA de codificación directamente en la terminal
- Inyección de comandos en la terminal activa

### Autenticación
- Sistema de login con token
- Un único usuario administrador configurable
- Cierre de sesión
- Verificación automática de sesión al cargar la aplicación

### Sistema de Notificaciones
- Notificaciones tipo toast con auto-desaparición
- Cuatro tipos: éxito, error, información, advertencia
- Sonidos de notificación (toggleable)

### Atajos de Teclado
- Modal de referencia con todos los atajos disponibles
- Atajos para pegar, limpiar terminal, abrir ayuda, cerrar modales

### Tema
- Alternancia entre tema claro y oscuro
- Persistencia de preferencia en almacenamiento local

### Responsive
- Diseño adaptable a dispositivos móviles
- Sidebar convertible en drawer con overlay en pantallas pequeñas

### Manejo de Errores
- Boundary de errores para capturar fallos de la interfaz
- Mensaje de error con botón de recarga

---

## 3. Arquitectura General

```
┌─────────────┐         ┌──────────────────────────────────┐
│  Navegador  │◄───────►│           Servidor               │
│  (Frontend) │  HTTP + │                                  │
│             │  WebSock│  ┌────────────┐  ┌────────────┐  │
│  • Terminal │         │  │ API REST   │  │ Shell Real │  │
│  • Editor   │         │  │ • Auth     │  │ (bash)     │  │
│  • Sidebar  │         │  │ • Archivos │  │            │  │
│  • Modales  │         │  │ • Worksp.  │  │  /workspace│  │
│             │         │  │ • Ejecución│  │            │  │
└─────────────┘         │  └────────────┘  └────────────┘  │
                        └──────────────────────────────────┘
```

### Separación de Responsabilidades

**Backend:**
- Servidor HTTP que sirve la aplicación web y expone una API REST
- Servidor WebSocket para comunicación en tiempo real con la terminal
- Manejo de procesos de shell del sistema
- Autenticación y autorización
- Operaciones con el sistema de archivos
- Ejecución segura de comandos

**Frontend:**
- Aplicación de una sola página (SPA)
- Terminal emulada en el navegador
- Editor de código
- Sidebar con paneles de navegación
- Modales para login, espacios de trabajo y ayuda

---

## 4. Estructura del Proyecto

```
/
├── entrypoint.sh              # Script de inicio del contenedor
├── docker-compose.yml         # Configuración de servicios y volúmenes
├── Dockerfile                 # Construcción multi-etapa del contenedor
├── .env.example               # Plantilla de variables de entorno
├── .editorconfig              # Configuración de editores de texto
├── .gitignore                 # Exclusiones de git
├── .dockerignore              # Exclusiones de docker
├── VERSION                    # Versión semántica (0.1.10)
├── README.md                  # Documentación completa
├── todo.md                    # Hoja de ruta de desarrollo
│
├── workspace/                 # Directorio persistente para espacios de trabajo
│
├── .github/
│   └── workflows/
│       └── docker-publish.yml # CI/CD: publicar imagen multi-arquitectura
│
├── backend/
│   ├── package.json           # Dependencias y scripts del backend
│   ├── tsconfig.json          # Configuración de compilación
│   └── src/
│       ├── server.ts          # Punto de entrada del servidor
│       ├── terminal.ts        # Manejo de sesiones de terminal
│       ├── auth.ts            # Autenticación JWT
│       └── files.ts           # API de sistema de archivos
│
└── frontend/
    ├── package.json           # Dependencias y scripts del frontend
    ├── tsconfig.json          # Configuración de compilación
    ├── index.html             # Punto de entrada HTML
    ├── vite.config.ts         # Configuración de build y proxy de desarrollo
    ├── .eslintrc.cjs          # Reglas de linting
    ├── .prettierrc            # Reglas de formateo
    └── src/
        ├── main.tsx           # Punto de entrada de la aplicación
        ├── App.tsx            # Componente raíz con providers
        ├── Dashboard.tsx      # Layout principal
        ├── Terminal.tsx       # Componente de terminal
        ├── Sidebar.tsx        # Contenedor del sidebar
        ├── WorkspacePanel.tsx # Panel de espacios de trabajo
        ├── GitPanel.tsx       # Panel de Git
        ├── AIToolsPanel.tsx   # Panel de herramientas IA
        ├── ThemeProvider.tsx  # Proveedor de tema
        ├── styles.css         # Estilos globales y variables de tema
        │
        ├── components/
        │   ├── ErrorBoundary.tsx      # Captura de errores
        │   ├── LoginModal.tsx         # Modal de inicio de sesión
        │   ├── Toast.tsx              # Componente de notificación
        │   ├── ToastContainer.tsx     # Contenedor de notificaciones
        │   ├── ThemeToggle.tsx        # Botón de cambio de tema
        │   ├── ShortcutsModal.tsx     # Modal de atajos de teclado
        │   ├── WorkspaceModal.tsx     # Modal de clonar/crear workspace
        │   ├── FileExplorer.tsx       # Explorador de archivos en árbol
        │   ├── CodeEditor.tsx         # Editor de código con pestañas
        │   └── TerminalSkeleton.tsx   # Esqueleto de carga para terminal
        │
        ├── contexts/
        │   ├── AuthContext.tsx        # Contexto de autenticación
        │   ├── AuthContextValue.ts    # Valores por defecto de auth
        │   ├── ThemeContext.tsx       # Contexto de tema
        │   └── ToastContext.tsx       # Contexto de notificaciones
        │
        ├── hooks/
        │   ├── useAuth.ts            # Hook de autenticación + fetch autenticado
        │   ├── useSound.ts           # Hook de efectos de sonido
        │   ├── useTheme.ts           # Hook de tema
        │   └── useToast.ts           # Hook de notificaciones
        │
        └── types/
            └── css.d.ts              # Declaraciones de tipos para CSS
```

---

## 5. Modelos de Datos

> No hay base de datos. Toda la persistencia es basada en sistema de archivos.

### Espacio de Trabajo

| Campo      | Tipo    | Descripción                              |
|------------|---------|------------------------------------------|
| name       | texto   | Nombre del directorio                    |
| path       | texto   | Ruta absoluta en el sistema de archivos  |
| isGitRepo  | booleano| Indica si es un repositorio Git          |
| branch     | texto   | Rama actual (si es repo Git)             |

### Elemento del Árbol de Archivos

| Campo    | Tipo                  | Descripción                       |
|----------|-----------------------|-----------------------------------|
| name     | texto                 | Nombre del archivo o directorio   |
| path     | texto                 | Ruta relativa al workspace        |
| type     | "file" \| "directory" | Tipo de elemento                  |
| children | array recursivo       | Sub-elementos (solo directorios)  |

### Usuario Autenticado

| Campo    | Tipo  | Descripción              |
|----------|-------|--------------------------|
| username | texto | Nombre de usuario admin  |

### Token de Autenticación

| Campo    | Tipo   | Descripción          |
|----------|--------|----------------------|
| username | texto  | Payload del token    |
| exp      | número | Expiración (24 horas)|

### Archivo Abierto en el Editor

| Campo           | Tipo    | Descripción                            |
|-----------------|---------|----------------------------------------|
| path            | texto   | Ruta del archivo                       |
| content         | texto   | Contenido actual                       |
| originalContent | texto   | Contenido original (detección cambios) |
| language        | texto   | Lenguaje para resaltado de sintaxis    |

### Notificación Toast

| Campo    | Tipo                                        | Descripción                 |
|----------|---------------------------------------------|-----------------------------|
| id       | texto                                       | Identificador único         |
| type     | "success" \| "error" \| "info" \| "warning" | Tipo de notificación        |
| message  | texto                                       | Contenido del mensaje       |
| duration | número (opcional)                           | Duración en ms (default 5s) |

### Resultado de Ejecución de Comando

| Campo    | Tipo    | Descripción                          |
|----------|---------|--------------------------------------|
| output   | texto   | Salida estándar del comando          |
| exitCode | número  | Código de salida                     |
| error    | texto   | Mensaje de error (si falló)          |

---

## 6. API Endpoints

### Endpoints REST

| Método | Ruta                          | Autenticación | Descripción                                                |
|--------|-------------------------------|---------------|------------------------------------------------------------|
| GET    | /api/health                   | Pública       | Health check. Retorna: status, uptime, version              |
| POST   | /api/auth/login               | Pública       | Login. Body: { username, password }. Retorna: { token, user } |
| GET    | /api/auth/me                  | Requerida     | Verificar token. Retorna: { user: { username } }            |
| GET    | /api/workspaces               | Requerida     | Lista directorios en /workspace con metadatos git          |
| POST   | /api/exec                     | Requerida     | Ejecuta un comando shell. Body: { cmd, cwd? }              |
| GET    | /api/files/tree?workspace=    | Requerida     | Árbol recursivo de archivos para un workspace              |
| GET    | /api/files?path=              | Requerida     | Leer contenido de un archivo (máx 1MB)                     |
| POST   | /api/files                    | Requerida     | Guardar archivo. Body: { path, content }. Crea directorios |
| GET    | * (catch-all)                 | Pública       | Sirve index.html para enrutamiento SPA                     |

### Endpoint WebSocket

| Ruta                         | Autenticación     | Protocolo                                    |
|------------------------------|-------------------|----------------------------------------------|
| ws://host:3000/ws?token=jwt  | Token en query    | Mensajes JSON: { type: "data" \| "resize" } |

**Tipos de mensajes WebSocket:**

**Cliente → Servidor:**
- `{ type: "data", data: "texto" }` - Datos de entrada de terminal
- `{ type: "resize", cols: número, rows: número }` - Redimensionar terminal

**Servidor → Cliente:**
- `{ type: "data", data: "texto" }` - Salida de terminal

### Características de la API de Ejecución

- Bloquea caracteres peligrosos por seguridad: `;`, `&&`, `||`, `|`, backticks, `$`, `>`, `<`
- Timeout de 30 segundos
- Buffer máximo de 1MB
- Directorio de trabajo configurable
- Retorna salida combinada stdout+stderr, código de salida, y error si existe

### Características de la API de Archivos

- Protección contra path traversal (no permite salir del directorio base)
- Límite de 1MB para lectura de archivos
- Creación automática de directorios al guardar
- El árbol de archivos excluye directorios ocultos (comienzan con `.`)

---

## 7. Autenticación y Seguridad

### Sistema de Login
- Autenticación basada en token con expiración de 24 horas
- Un único usuario administrador configurable mediante variables de entorno (default: admin/admin)
- Secreto de firma configurable mediante variable de entorno (con advertencia si se usa el default)
- Almacenamiento del token en el navegador (localStorage, clave: `webterminal-token`)

### Flujo de Autenticación
1. La aplicación verifica si hay un token almacenado al cargar
2. Si existe, lo valida contra `/api/auth/me`
3. Si no existe o es inválido, muestra el modal de login
4. Al hacer login exitoso, almacena el token y oculta el modal
5. Todas las peticiones a la API incluyen el token en la cabecera `Authorization: Bearer <token>`
6. La conexión WebSocket incluye el token como parámetro de query

### Seguridad de Comandos
- Bloqueo de caracteres de encadenamiento de comandos (`;`, `&&`, `||`), pipes (`|`), redirecciones (`>`, `<`), sustitución de comandos (backticks, `$`)
- Timeout de ejecución de 30 segundos
- Límite de buffer de salida de 1MB
- Protección contra path traversal en operaciones de archivos

---

## 8. Diseño de la Interfaz de Usuario

### Layout Principal (Dashboard)

```
┌─────────────────────────────────────────────────────────────┐
│ ┌──────────┐  ┌──────────────────────────────────────────┐  │
│ │ Sidebar  │  │ Encabezado [Terminal | Editor] [🌙 🔊 ⌨️ 👤] │  │
│ │ (280px)  │  ├──────────────────────────────────────────┤  │
│ │          │  │                                          │  │
│ │ 📁 Worksp│  │   Terminal                                │  │
│ │ 🔀 Git   │  │   (emulador de terminal completo)         │  │
│ │ 🤖 IA    │  │   O BIEN                                  │  │
│ │ 🗂️ Archi│  │   Editor de Código                         │  │
│ │          │  │   (editor con pestañas)                   │  │
│ └──────────┘  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Sidebar - Paneles Colapsables

1. **Panel de Espacios de Trabajo:**
   - Lista de directorios en /workspace
   - Muestra rama git actual (si es repo)
   - Botón para clonar repositorio (GitHub URL)
   - Botón para crear nuevo espacio de trabajo
   - Clic en workspace revela explorador de archivos

2. **Panel de Git:**
   - Muestra la rama actual
   - Botones: Git Status, Git Pull, Git Push
   - Panel de salida colapsable con resultado de comandos
   - Deshabilitado si no hay workspace seleccionado o no es repo git

3. **Panel de Herramientas IA:**
   - Botones para iniciar/detener herramientas de IA
   - Inyecta comandos directamente en la terminal activa
   - Las herramientas se instalan bajo demanda en el contenedor

4. **Panel de Archivos (File Explorer):**
   - Visible al seleccionar un workspace
   - Árbol recursivo de archivos y directorios
   - Expandir/colapsar directorios
   - Clic en archivo lo abre en el editor
   - Excluye directorios y archivos ocultos (comienzan con `.`)
   - Scroll independiente con altura máxima

### Encabezado
- Título de la aplicación (WorkerOnline)
- Pestañas: Terminal | Editor
- Toggle de tema (íconos de sol/luna)
- Toggle de sonido (ícono de parlante)
- Botón de atajos de teclado (ícono `?`)
- Botón de usuario (muestra username, opción de logout)

### Terminal
- Ocupa el panel principal
- Emulador de terminal completo
- Conexión WebSocket en tiempo real
- Redimensionamiento automático al cambiar tamaño del panel
- Scrollback buffer
- Soporte de pegado (Ctrl+Shift+V)
- Cursor parpadeante
- Tema oscuro (hardcodeado, pendiente tema claro)

### Editor de Código
- Sistema de pestañas múltiples
- Detección de lenguaje por extensión de archivo
- Indicador visual de cambios no guardados (punto en la pestaña)
- Guardado con Ctrl+S
- Cierre de pestañas con botón X
- Resaltado de sintaxis para: JavaScript, TypeScript, JSON, Markdown, Python
- Línea activa resaltada
- Números de línea
- Tema oscuro

### Modales

1. **Login Modal:**
   - Campo de usuario y contraseña
   - Botón de inicio de sesión
   - Mensaje de error si credenciales inválidas
   - No se puede cerrar sin autenticarse

2. **Workspace Modal:**
   - Dos modos: "Clone Repository" y "New Workspace"
   - Modo Clone: campo para URL de GitHub
   - Modo New: campo para nombre del directorio
   - Ejecuta `git clone` o `mkdir` según el modo
   - Notificación toast al completar

3. **Shortcuts Modal:**
   - Lista de atajos de teclado disponibles
   - Se abre con la tecla `?`
   - Se cierra con Escape o botón de cerrar

### Notificaciones Toast
- Aparecen en la esquina superior derecha
- Auto-desaparecen después de 5 segundos
- 4 tipos: éxito (verde), error (rojo), info (azul), advertencia (amarillo)
- Se apilan verticalmente
- Botón de cerrar individual
- Efectos de sonido opcionales (beeps generados por Web Audio API)

### Diseño Responsive
- En móvil (<768px), el sidebar se oculta y se muestra como drawer
- Overlay oscuro detrás del sidebar en móvil
- Botón de menú hamburguesa para abrir/cerrar sidebar en móvil

---

## 9. Flujos de Usuario Principales

### Flujo de Inicio de Sesión
1. Usuario accede a la URL de la aplicación
2. Si no hay token válido → se muestra modal de login
3. Usuario ingresa credenciales
4. Se envía POST a `/api/auth/login`
5. Si éxito → se almacena token, se oculta modal, se establece conexión WebSocket
6. Si fallo → se muestra error en el modal

### Flujo de Terminal
1. Al autenticarse, se establece conexión WebSocket a `/ws?token=<jwt>`
2. El servidor crea una sesión de shell (bash) por cada conexión
3. Cada tecla presionada en la terminal se envía como mensaje WebSocket
4. La salida de la shell se envía de vuelta y se renderiza en la terminal
5. Al redimensionar el panel, se envía evento de resize al servidor
6. Timeout de inactividad: 15 minutos sin actividad cierra la conexión
7. Al cerrar la sesión o recargar, se cierra el WebSocket

### Flujo de Clonación de Repositorio
1. Usuario hace clic en "Clone" en el panel de espacios de trabajo
2. Se abre modal con campo de URL
3. Usuario pega URL de GitHub y confirma
4. Se ejecuta `git clone <url>` en el directorio workspace
5. Al completar, se recarga la lista de espacios de trabajo
6. Se muestra toast de éxito o error

### Flujo de Edición de Archivos
1. Usuario selecciona un workspace
2. Se muestra el árbol de archivos en el sidebar
3. Usuario hace clic en un archivo
4. Si es un archivo de texto, se abre una nueva pestaña en el editor
5. El contenido se carga desde `/api/files?path=`
6. Usuario edita el archivo
7. Aparece indicador de cambios no guardados (punto en la pestaña)
8. Usuario presiona Ctrl+S para guardar
9. Se envía POST a `/api/files` con el nuevo contenido
10. Se muestra toast de éxito/error

### Flujo de Git
1. Usuario selecciona un workspace que es un repo git
2. En el panel Git, se muestra la rama actual
3. Usuario puede hacer clic en Status, Pull, o Push
4. El comando se ejecuta vía `/api/exec` con el cwd adecuado
5. La salida se muestra en el panel colapsable debajo de los botones

---

## 10. Ciclo de Vida del Contenedor

### Arranque (entrypoint)
1. Configurar credenciales Git globales si existe `GITHUB_TOKEN` o `GIT_*`
2. Exportar variables de entorno para APIs (ANTHROPIC_API_KEY, OPENAI_API_KEY)
3. Instalación perezosa de herramientas de IA (solo si no están ya instaladas)
4. Arrancar el servidor HTTP en el puerto configurado (default 3000)

### Health Check
- El contenedor expone un endpoint `/api/health`
- El health check de Docker consulta este endpoint cada 30 segundos
- Timeout de 10 segundos, 3 reintentos
- Política de reinicio: unless-stopped

### Persistencia
- 6 volúmenes Docker nombrados:
  - `workspace`: directorios de trabajo de los usuarios
  - `gitconfig`: configuración global de Git
  - `ssh`: claves SSH para autenticación Git
  - `cache`: caché de paquetes del sistema
  - `npm-global`: paquetes globales instalados
  - `bun-cache`: caché del gestor de paquetes alternativo

### Construcción (Dockerfile multi-etapa)
1. **Etapa base:** Imagen del runtime con dependencias del sistema (git, python3, make, compiladores, curl, bash, openssh)
2. **Etapa backend-build:** Compilación del código fuente del backend
3. **Etapa frontend-build:** Empaquetado de la aplicación web
4. **Etapa final:** Imagen ligera solo con lo necesario para ejecutar

### CI/CD
- Se dispara en cada push a la rama principal
- Auto-incrementa la versión parche en el archivo VERSION
- Crea commit y tag de git con la nueva versión
- Construye imagen multi-arquitectura
- Publica en registro de contenedores con tag de versión y tag `latest`

---

## 11. Variables de Entorno

| Variable          | Obligatoria | Default                          | Descripción                         |
|-------------------|-------------|----------------------------------|-------------------------------------|
| PORT              | No          | 3000                             | Puerto del servidor HTTP            |
| NODE_ENV          | No          | production                       | Entorno de ejecución                |
| GITHUB_TOKEN      | No          | -                                | Token para clonar repos privados    |
| ANTHROPIC_API_KEY | No          | -                                | API key para herramienta de IA      |
| OPENAI_API_KEY    | No          | -                                | API key para herramienta de IA      |
| ADMIN_USERNAME    | No          | admin                            | Usuario para login                  |
| ADMIN_PASSWORD    | No          | admin                            | Contraseña para login               |
| JWT_SECRET        | No          | default-secret-change-me         | Secreto para firmar tokens          |
| WS_TIMEOUT_MS     | No          | 900000 (15 min)                  | Timeout de inactividad WebSocket    |
| LOG_LEVEL         | No          | info                             | Nivel de logging                    |
| LOG_FORMAT        | No          | json                             | Formato de logging                  |
| RATE_LIMIT_MAX    | No          | 100                              | Máximo de peticiones por ventana    |
| RATE_LIMIT_WINDOW | No          | 900000 (15 min)                  | Ventana de rate limiting en ms      |

---

## 12. Funcionalidades Pendientes (del roadmap)

### Alta Prioridad
- Tema claro en el componente terminal
- Scroll del panel lateral en móviles
- Modal de confirmación de cierre de sesión
- Migración de variables CSS a diseño por componentes

### Media Prioridad
- Confirmación antes de recargar/cerrar página si hay cambios sin guardar
- Diálogo "Guardar cambios" al cerrar pestañas del editor
- Proxy de assets de GitHub
- Manejo de conflictos de merge en frontend
- Backend de historial Git
- Implementar cierre de sesión completo en frontend
- Mejorar accesibilidad de header

### Baja Prioridad
- Tests unitarios e integración (se propone Vitest, Testing Library, Playwright)
- Implementar rate limiting
- TLS/HTTPS
- Migrar logging a librería estructurada
- Code splitting para bundles grandes
- Skeleton de carga para terminal
- Mostrar icono de archivo según tipo en explorador

---

## 13. Notas Técnicas Relevantes

- El servidor maneja graceful shutdown: al recibir señal de terminación, cierra todas las conexiones WebSocket activas y luego detiene el servidor HTTP
- Cada conexión WebSocket crea un proceso de shell independiente (aislamiento de sesiones)
- La API de ejecución de comandos bloquea caracteres de encadenamiento como medida básica de seguridad (no reemplaza sandboxing adecuado)
- El WebSocket usa compresión por mensaje para reducir tráfico
- El frontend usa aliasing de rutas para imports limpios
- La aplicación es completamente autocontenida en un contenedor
- No hay base de datos: toda configuración y estado se maneja con archivos y variables de entorno
- Los espacios de trabajo se persisten en volumen Docker
- Las herramientas de IA se instalan perezosamente: solo se descargan la primera vez que se usan

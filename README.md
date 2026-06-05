# 🖥️ Web Terminal - Dockerized Interactive Terminal

Una aplicación web que ejecuta una terminal interactiva real dentro de Docker, permitiendo clonar repositorios de GitHub, ejecutar herramientas AI (opencode, claude console) y cualquier comando de sistema directamente desde el navegador.

## 🚀 Características

- ✅ Terminal real basada en `node-pty` con shell bash
- ✅ Cliente web con React + xterm.js (soporte completo de interacción)
- ✅ Persistencia de repositorios, configuración Git y credenciales SSH
- ✅ Instalación lazy de herramientas AI (opencode, claude-code)
- ✅ Soporte para redimensionamiento dinámico de terminal
- ✅ Copiar/pegar nativo del navegador
- ✅ Sin base de datos - todo basado en sistema de archivos
- ✅ Imagen optimizada basada en Alpine Linux

## 📋 Requisitos Previos

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Git (para clonar este repositorio)

## 🏗️ Estructura del Proyecto

```
.
├── docker-compose.yml          # Configuración de servicios Docker
├── Dockerfile                  # Imagen optimizada Alpine + Node 22
├── entrypoint.sh               # Script de inicio (instala herramientas AI lazy)
├── README.md                   # Este archivo
├── workspace/                  # Directorio persistente para repositorios (creado automáticamente)
├── backend/
│   ├── package.json            # Dependencias del servidor
│   ├── tsconfig.json           # Configuración TypeScript
│   └── src/
│       ├── server.ts           # Servidor Express + WebSocket
│       └── terminal.ts         # Lógica node-pty
└── frontend/
    ├── package.json            # Dependencias del cliente
    ├── tsconfig.json           # Configuración TypeScript
    ├── vite.config.ts          # Configuración Vite
    ├── index.html              # HTML principal
    └── src/
        ├── main.tsx            # Punto de entrada React
        ├── App.tsx             # Componente principal
        └── Terminal.tsx        # Componente xterm.js
```

## 🚀 Instrucciones de Uso

### 1. Clonar y entrar al directorio

```bash
git clone <este-repositorio>
cd web-terminal-docker
```

### 2. Configurar variables de entorno (opcional pero recomendado)

Crea un archivo `.env` en la raíz del proyecto:

```bash
# GitHub Personal Access Token (para clonar repos privados)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# API Keys para herramientas AI
ANTHROPIC_API_KEY=sk-ant-api-xx-xxxxxxxxx
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxx
```

> **Nota:** También puedes pasar estas variables directamente al levantar el contenedor:
> ```bash
> GITHUB_TOKEN=ghp_xxx ANTHROPIC_API_KEY=sk-ant-xxx docker-compose up
> ```

### 3. Construir y levantar el proyecto

```bash
docker-compose up --build
```

> La primera vez descargará las imágenes base e instalará las dependencias. Las siguientes veces será más rápido.

### 4. Acceder a la terminal web

Abre tu navegador en: **http://localhost:3000**

## 🔐 Configuración de Autenticación

### Opción A: GitHub Personal Access Token (Recomendado)

1. Genera un token en [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Añade el token al archivo `.env` o pásalo como variable de entorno:
   ```bash
   GITHUB_TOKEN=ghp_tu_token_aqui docker-compose up
   ```
3. El `entrypoint.sh` configurará Git automáticamente para usar este token al clonar.

### Opción B: Claves SSH

1. Copia tu clave SSH al volumen persistente:
   ```bash
   # Primero levanta el contenedor una vez
   docker-compose up -d
   
   # Copia tu clave SSH (asegúrate de que la ruta sea correcta)
   docker cp ~/.ssh/id_rsa web-terminal:/root/.ssh/
   docker cp ~/.ssh/id_rsa.pub web-terminal:/root/.ssh/
   docker cp ~/.ssh/known_hosts web-terminal:/root/.ssh/
   
   # Reinicia el contenedor
   docker-compose restart
   ```

2. O monta directamente desde tu host modificando `docker-compose.yml`:
   ```yaml
   volumes:
     - ~/.ssh:/root/.ssh:ro  # Solo lectura desde host
   ```

### Configuración de API Keys para Herramientas AI

Las siguientes variables se cargan automáticamente en el entorno de la terminal:

- `ANTHROPIC_API_KEY` - Para Claude Code
- `OPENAI_API_KEY` - Para OpenAI/opencode
- `GITHUB_TOKEN` - Para autenticación Git

## 💻 Ejemplos de Uso

Una vez dentro de la terminal web (http://localhost:3000):

### Clonar un repositorio

```bash
git clone https://github.com/usuario/mi-proyecto.git
cd mi-proyecto
ls -la
```

### Usar opencode

```bash
# opencode se instala automáticamente la primera vez que lo ejecutas
opencode
```

### Usar Claude Code

```bash
# claude se instala automáticamente la primera vez que lo ejecutas
claude
```

### Comandos de sistema

```bash
# Listar archivos
ls -la

# Navegar entre directorios
cd /workspace
pwd

# Ver procesos
ps aux

# Espacio en disco
df -h
```

## 💾 Persistencia de Datos

El proyecto utiliza volúmenes Docker para persistir datos entre reinicios:

| Volumen | Ubicación | Propósito |
|---------|-----------|-----------|
| `./workspace` | `/workspace` | Repositorios clonados y archivos de trabajo |
| `gitconfig` | `/root/.gitconfig` | Configuración global de Git |
| `ssh` | `/root/.ssh` | Claves SSH y known_hosts |
| `cache` | `/root/.cache` | Caché de herramientas |
| `npm-global` | `/root/.npm-global` | Paquetes npm globales (opencode, claude) |
| `bun-cache` | `/root/.bun/install/cache` | Caché de Bun |

> **Importante:** Los datos persisten automáticamente. Si destruyes el contenedor (`docker-compose down -v`), los volúmenes nombrados se eliminarán, pero el directorio `./workspace` en tu host permanecerá.

## 🔧 Comandos Útiles

```bash
# Ver logs
docker-compose logs -f web-terminal

# Entrar al contenedor para debugging
docker-compose exec web-terminal sh

# Reconstruir desde cero (sin caché)
docker-compose build --no-cache
docker-compose up

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ pierde gitconfig, ssh, cache)
docker-compose down -v
```

## 🐛 Solución de Problemas

### Error: "Cannot find module 'node-pty'"

Asegúrate de que el Dockerfile está compilando correctamente los módulos nativos. Verifica que `python3`, `make`, `gcc`, `g++` y `linux-headers` están instalados.

### Error de conexión WebSocket

- Verifica que el puerto 3000 no está en uso: `lsof -i :3000`
- Revisa los logs: `docker-compose logs web-terminal`
- Asegúrate de no estar detrás de un proxy que bloquee WebSockets

### Problemas con git clone en repos privados

- Verifica que `GITHUB_TOKEN` esté configurado correctamente
- Prueba con un repo público primero: `git clone https://github.com/github/hello-world.git`
- Si usas SSH, asegúrate de que las claves están en `/root/.ssh/`

## 📦 Stack Tecnológico

- **Backend:** Node.js 22, Express, WebSocket (ws), node-pty, TypeScript
- **Frontend:** React 18, Vite, xterm.js, xterm-addon-fit, TypeScript
- **Infraestructura:** Docker, Docker Compose, Alpine Linux
- **Package Manager:** Bun (solo para instalación de paquetes)

## 📄 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request para sugerencias y mejoras.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A web app that serves a **real interactive bash terminal** in the browser, running inside Docker. Frontend (React + xterm.js) talks to a backend (Express + `ws` WebSocket + `node-pty`) that spawns a PTY-backed `/bin/bash` per connection. No database — all state is filesystem-based under `/workspace`. The container lazy-installs AI CLIs (`opencode`, `@anthropic-ai/claude-code`) on first boot so they can be run from inside the web terminal.

## Commands

The project is a two-package monorepo (`backend/`, `frontend/`) with no root build tooling — run commands inside each package dir.

```bash
# Backend (Express + WS + node-pty)
cd backend && bun install        # or npm install
bun run dev                      # ts-node src/server.ts (live)
bun run build                    # tsc -> dist/
bun run start                    # node dist/server.js

# Frontend (React + Vite)
cd frontend && bun install
bun run dev                      # vite dev server on :5173 (proxies /ws -> :3000)
bun run build                    # tsc && vite build -> dist/
npx eslint src                   # lint (no npm script defined)

# Full stack via Docker (production-like)
docker-compose up --build        # builds image, serves everything on :3000
```

There is **no test suite** and no lint script in package.json — lint frontend manually with `npx eslint src`. The backend has no linter configured.

### Local dev wiring
- Backend serves the built frontend from `frontend/dist` as static files and falls back to `index.html` for SPA routes. In production (Docker) you hit everything on `:3000`.
- For frontend hot-reload, run `vite dev` on `:5173`; it proxies `/ws` to the backend on `:3000`. API calls (`/api/*`) are not proxied, so point them at `:3000` or run the backend built+served.

## Architecture

### Request → PTY flow
1. Client logs in via `POST /api/auth/login` (single hardcoded admin user from `ADMIN_USERNAME`/`ADMIN_PASSWORD` env), gets a 24h JWT.
2. `Terminal.tsx` opens `ws(s)://host/ws?token=<JWT>`. The WS server (`server.ts`) verifies the token from the query param **before** creating the session — there is no per-message auth after the handshake.
3. `TerminalSession` (`terminal.ts`) spawns `/bin/bash` via `node-pty`, pipes PTY output to the WS as `{type:'data'}` JSON frames, and routes inbound `{type:'data'}` / `{type:'resize'}` frames to the PTY. Closing the WS kills the PTY.
4. Idle WS connections are killed after `WS_TIMEOUT_MS` (default 15 min). `activeSessions` set drives graceful shutdown on SIGTERM/SIGINT.

### Backend modules (`backend/src/`)
- `server.ts` — Express app, static serving, WS server, `/api/health`, `/api/workspaces` (lists `/workspace` subdirs + git branch), `/api/exec` (one-shot command runner with a character blocklist + 30s timeout), graceful shutdown, structured `log()`.
- `auth.ts` — JWT issue/verify, `requireAuth` Bearer middleware, `/api/auth/login`, `/api/auth/me`. `JWT_SECRET`, admin creds all come from env with insecure defaults.
- `files.ts` — `/api/files/tree`, `/api/files` (read/write). Used by the in-browser CodeEditor.
- `terminal.ts` — the per-connection PTY wrapper described above.

### Auth gotcha
`requireAuth` is applied to `/api/workspaces` and `/api/exec`, but the routes registered by `filesRoutes()` (`/api/files*`) and `/api/auth/me` do **not** use `requireAuth` — they only validate tokens inline (or not at all, for files). If you add file/workspace endpoints, wire auth explicitly; don't assume a global guard exists.

### Frontend (`frontend/src/`)
- `App.tsx` nests providers: `ErrorBoundary > ThemeProvider > AuthProvider > ToastProvider > Dashboard`.
- `Dashboard.tsx` is the shell: sidebar (workspaces / git / AI tools panels), tabbed Terminal vs CodeEditor, mobile responsiveness, command injection into the terminal.
- Terminal input is **injected** by changing `injectedCommand` + bumping `commandId` (a monotonic counter) so the same command can be re-sent; `Terminal.tsx` watches `commandId` to fire.
- Auth state + `authFetch` (adds Bearer header) live in `hooks/useAuth.ts` / `contexts/AuthContext`. Toasts, theme, and a sound system are context-driven (`contexts/`, `hooks/`).
- Vite path aliases: `@`, `@components`, `@hooks`, `@utils` -> `src/...`.

### Docker
Multi-stage build (`Dockerfile`): `base` (node:22-alpine + git/bash/ssh/build tools + bun) → separate `backend-build` and `frontend-build` stages (both install with **bun**, compile with `npx tsc` / `npx vite build`) → slim `final` stage copying `backend/dist`, `backend/node_modules`, and `frontend/dist`. `entrypoint.sh` runs at container start: configures `GITHUB_TOKEN` git rewrite, exports API keys, lazy-installs `opencode` and `claude-code` if absent, then `exec node dist/server.js`. Persistence is via named volumes for `.gitconfig`, `.ssh`, `.cache`, `.npm-global`, bun cache, plus a `./workspace` bind mount.

## Conventions
- TypeScript everywhere, strict-ish. Backend is plain Node ESM-target via tsc; frontend is Vite ESM (`"type":"module"`).
- The repo's README and `.env.example` comments are in **Spanish**; code, identifiers, and logs are in English.
- `VERSION` file + hardcoded version string in `/api/health` are bumped manually per release (see recent commits "Bump version to X").
- Bun is used only as the package manager / installer in Docker; runtime is Node 22. Either bun or npm works locally.

## Security context
This app deliberately grants browser users a real shell with the container's full privileges and env (including injected API keys). The `/api/exec` blocklist (`; && || | \` $ > <`) is shallow and the WS terminal has no such restriction. Default admin creds and JWT secret are insecure placeholders — treat any deployment as remote-code-execution-by-design and gate it accordingly.

# Base image with Node 22 and Bun
FROM node:22-alpine AS base

# Install system dependencies for node-pty and general tools
RUN apk add --no-cache \
    git \
    python3 \
    make \
    gcc \
    g++ \
    linux-headers \
    curl \
    bash \
    openssh-client

# Install Bun (used only as package manager)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Verify installations
RUN node -v && npm -v && bun -v && git --version

# Set working directory
WORKDIR /app

# --- Backend Stage ---
FROM base AS backend-build

# Copy backend package files
COPY backend/package.json backend/tsconfig.json ./

# Install backend dependencies using Bun
RUN bun install

# Copy backend source code
COPY backend/src ./src

# Compile TypeScript to JavaScript
RUN npx tsc

# --- Frontend Build Stage ---
FROM base AS frontend-build

# Copy frontend package files
    COPY frontend/package.json frontend/tsconfig.json frontend/tsconfig.node.json frontend/vite.config.ts frontend/index.html ./

# Install frontend dependencies using Bun
RUN bun install

# Copy frontend source code
COPY frontend/src ./src

# Build the frontend for production
RUN npx vite build

# --- Final Stage ---
FROM node:22-alpine AS final

# Install runtime dependencies only (git, bash, ssh-client)
RUN apk add --no-cache \
    git \
    bash \
    openssh-client \
    curl \
    python3 \
    make \
    gcc \
    g++ \
    linux-headers

# Set main app directory
WORKDIR /app
RUN mkdir -p /workspace /root/.ssh /root/.cache /root/.npm-global

# Copy backend build from backend-build stage
COPY --from=backend-build /app/dist ./backend/dist
COPY --from=backend-build /app/node_modules ./backend/node_modules
COPY --from=backend-build /app/package.json ./backend/package.json

# Copy frontend build from frontend-build stage
COPY --from=frontend-build /app/dist ./frontend/dist

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose the application port
EXPOSE 3000

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]

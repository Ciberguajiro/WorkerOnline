#!/bin/sh
set -e

# Create workspace directory if it doesn't exist
mkdir -p /workspace
cd /workspace

# Set PATH to include npm global bin if needed
export PATH="/root/.npm-global/bin:${PATH}"
mkdir -p /root/.npm-global
npm config set prefix '/root/.npm-global'

# Configure GitHub token if provided
if [ -n "$GITHUB_TOKEN" ]; then
    echo "Configuring GitHub token..."
    git config --global url."https://${GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/"
    export GITHUB_TOKEN="$GITHUB_TOKEN"
fi

# Configure API keys environment variables
if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo "ANTHROPIC_API_KEY configured"
    export ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"
fi

if [ -n "$OPENAI_API_KEY" ]; then
    echo "OPENAI_API_KEY configured"
    export OPENAI_API_KEY="$OPENAI_API_KEY"
fi

# Lazy-install opencode if not present
if ! command -v opencode >/dev/null 2>&1; then
    echo "Installing opencode..."
    npm install -g opencode
else
    echo "opencode already installed"
fi

# Lazy-install claude-code if not present (check both 'claude' and 'claude-code' binaries)
if ! command -v claude >/dev/null 2>&1 && ! command -v claude-code >/dev/null 2>&1; then
    echo "Installing @anthropic-ai/claude-code..."
    npm install -g @anthropic-ai/claude-code
else
    echo "claude already installed"
fi

# Ensure PATH includes global npm packages
export PATH="$(npm config get prefix)/bin:${PATH}"

# Start the backend server
echo "Starting Web Terminal Server on port ${PORT:-3000}..."
cd /app/backend
exec node dist/server.js

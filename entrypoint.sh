#!/bin/sh
set -e
# Enable pipefail if supported (bash/zsh) to catch errors in pipes like curl|bash
if set -o | grep -q pipefail; then set -o pipefail; fi

# Pin HOME and the opencode install dir so install location and PATH agree.
# Docker leaves HOME unset for root, which made opencode land in /.opencode/bin
# while the PTY shell looked in /root/.opencode/bin -> "command not found".
export HOME=/root
export OPENCODE_INSTALL_DIR=/root/.opencode/bin

# Credential persistence: pin the dirs the AI tools store auth in so they land
# on mounted volumes and survive image rebuilds.
#   opencode -> $XDG_DATA_HOME/opencode/auth.json   (volume: /root/.local/share)
#   claude   -> $CLAUDE_CONFIG_DIR (config+creds)    (volume: /root/.claude)
export XDG_DATA_HOME=/root/.local/share
export CLAUDE_CONFIG_DIR=/root/.claude

# Create workspace directory if it doesn't exist
mkdir -p /workspace
cd /workspace

# Set up PATH and npm prefix for tools (npm global + opencode)
TOOLS_BIN_PATH="/root/.npm-global/bin:$HOME/.opencode/bin"
export PATH="${TOOLS_BIN_PATH}:${PATH}"
export npm_config_prefix='/root/.npm-global'
mkdir -p /root/.npm-global "$HOME/.opencode/bin"
npm config set prefix '/root/.npm-global'

# Persist .npmrc inside the npm-global volume so npm prefix survives rebuilds
NPMRC_PERSIST="/root/.npm-global/.npmrc"
echo "prefix=/root/.npm-global" > "$NPMRC_PERSIST"
ln -sf "$NPMRC_PERSIST" /root/.npmrc

# Ensure .bashrc always adds tools to PATH so every new bash session
# (PTY, tmux, manual bash invocations) finds opencode and claude-code
cat > /root/.bashrc << 'BASHRC_EOF'
# Clear cached command-not-found entries so newly installed tools are found
hash -r 2>/dev/null || true
# Tools PATH — keep opencode and claude-code available in every session
export PATH="/root/.npm-global/bin:$HOME/.opencode/bin:${PATH}"
# Credential dirs so opencode/claude auth lands on the mounted volumes
export XDG_DATA_HOME=/root/.local/share
export CLAUDE_CONFIG_DIR=/root/.claude
BASHRC_EOF

# tmux starts the pane shell as a LOGIN shell, which sources /etc/profile +
# ~/.bash_profile/~/.profile but NOT ~/.bashrc. Put the tools PATH where login
# shells will read it so opencode/claude resolve inside tmux sessions too.
mkdir -p /etc/profile.d
cat > /etc/profile.d/00-tools-path.sh << 'PROFILE_EOF'
# Keep opencode and claude-code on PATH for every login shell (tmux panes).
hash -r 2>/dev/null || true
export PATH="/root/.npm-global/bin:/root/.opencode/bin:${PATH}"
# Credential dirs so opencode/claude auth lands on the mounted volumes
export XDG_DATA_HOME=/root/.local/share
export CLAUDE_CONFIG_DIR=/root/.claude
PROFILE_EOF
chmod +x /etc/profile.d/00-tools-path.sh

# Login bash reads ~/.bash_profile (not ~/.bashrc); make it pull in both.
cat > /root/.bash_profile << 'PROFILE_EOF'
# Source the system profile (which loads /etc/profile.d/*.sh) then ~/.bashrc.
[ -f /etc/profile ] && . /etc/profile
[ -f /root/.bashrc ] && . /root/.bashrc
PROFILE_EOF

# Configure GitHub token if provided
if [ -n "$GITHUB_TOKEN" ]; then
    echo "Configuring GitHub token..."
    git config --global url."https://${GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/"
    export GITHUB_TOKEN="$GITHUB_TOKEN"
fi

# Configure git user identity from env vars (required for git commits)
if [ -n "$GIT_USER_EMAIL" ]; then
    git config --global user.email "$GIT_USER_EMAIL"
fi
if [ -n "$GIT_USER_NAME" ]; then
    git config --global user.name "$GIT_USER_NAME"
fi

# Ensure persistent data dirs exist (volumes may be empty on first mount)
mkdir -p /root/.claude /root/.config /root/.local/share/opencode

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
    if curl -fsSL --connect-timeout 10 --max-time 600 https://opencode.ai/install | bash -s -- --no-modify-path; then
        hash -r 2>/dev/null || true
        if command -v opencode >/dev/null 2>&1; then
            echo "opencode installed successfully ($(opencode --version 2>/dev/null || echo 'unknown version'))"
        else
            echo "WARNING: opencode install script ran but binary not found in PATH"
            echo "  Expected at: $HOME/.opencode/bin/opencode"
        fi
    else
        echo "WARNING: Failed to install opencode — install script exited with error"
    fi
else
    echo "opencode already installed ($(opencode --version 2>/dev/null || echo 'unknown version'))"
fi

# Ensure opencode is in PATH (installed to ~/.opencode/bin by the official script)
export PATH="$HOME/.opencode/bin:${PATH}"

# Lazy-install claude-code if not present (check both 'claude' and 'claude-code' binaries)
if ! command -v claude >/dev/null 2>&1 && ! command -v claude-code >/dev/null 2>&1; then
    echo "Installing @anthropic-ai/claude-code..."
    if npm install -g @anthropic-ai/claude-code 2>&1; then
        hash -r 2>/dev/null || true
        if command -v claude >/dev/null 2>&1; then
            echo "claude installed successfully"
        elif command -v claude-code >/dev/null 2>&1; then
            echo "claude-code installed successfully"
        else
            echo "WARNING: npm install succeeded but neither 'claude' nor 'claude-code' found in PATH"
            echo "  Expected at: /root/.npm-global/bin/"
        fi
    else
        echo "WARNING: Failed to install @anthropic-ai/claude-code — npm install exited with error"
    fi
else
    echo "claude already installed"
fi

# Ensure PATH includes global npm packages
export PATH="$(npm config get prefix)/bin:${PATH}"

# Start the backend server
echo "Starting Web Terminal Server on port ${PORT:-3000}..."
cd /app/backend
exec node dist/server.js

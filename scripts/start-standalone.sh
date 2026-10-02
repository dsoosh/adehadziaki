#!/usr/bin/env bash
# Uruchamia zbudowany serwer standalone – na Railway (startCommand) i lokalnie.
set -euo pipefail
cd "$(dirname "$0")/.."
cp -r public .next/standalone/
mkdir -p .next/standalone/.next && cp -r .next/static .next/standalone/.next/
if [ -f .env.local ]; then cp .env.local .next/standalone/; fi
# Next.js nasłuchuje na $HOSTNAME, a kontener ustawia tam swój identyfikator –
# proxy Railway nie mogłoby się połączyć. 0.0.0.0 = wszystkie interfejsy.
export HOSTNAME="${BIND_HOST:-0.0.0.0}"
export PORT="${PORT:-3000}"
exec node .next/standalone/server.js

#!/usr/bin/env bash
# Uruchamia zbudowany serwer standalone (tak jak na Railway) lokalnie.
set -euo pipefail
cd "$(dirname "$0")/.."
cp -r public .next/standalone/
mkdir -p .next/standalone/.next && cp -r .next/static .next/standalone/.next/
[ -f .env.local ] && cp .env.local .next/standalone/
PORT="${PORT:-3000}" exec node .next/standalone/server.js

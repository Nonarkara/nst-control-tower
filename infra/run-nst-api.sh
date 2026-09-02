#!/bin/bash -l
# Launchd entrypoint for the NST API daemon. Run via `bash -l` (login shell) so
# it inherits the full user environment (HOME, pnpm store, node) — the bare
# launchd env is too minimal for the pnpm shim to resolve, which silently fails.
# caffeinate -is keeps the Mac awake (no idle/system sleep on AC) while it runs.
cd /Users/axiom/Projects/dashboards/NST/apps/api || exit 1
export HOST=127.0.0.1
export PORT=8794
export ENVIRONMENT=production

# Optional keys (GEMINI_API_KEY, AIRLABS_API_KEY, …) belong in apps/api/.env
# (gitignored) or the live LaunchAgent plist — never in this committed script.
exec /usr/bin/caffeinate -is /Users/axiom/Library/pnpm/pnpm start:node

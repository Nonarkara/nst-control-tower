#!/bin/bash -l
# Launchd entrypoint for the NST API daemon. Run via `bash -l` (login shell) so
# it inherits the full user environment (HOME, pnpm store, node) — the bare
# launchd env is too minimal for the pnpm shim to resolve, which silently fails.
# caffeinate -is keeps the Mac awake (no idle/system sleep on AC) while it runs.
#
# Set NST_ROOT to the repository checkout before starting the agent.
# Set PNPM_BIN if pnpm is not on PATH (the login shell usually has it).
# Provider keys must already be in the launchd environment or in the gitignored
# apps/api/.env. Do not assign them here.
: "${NST_ROOT:?Set NST_ROOT to the repository root}"
cd "$NST_ROOT/apps/api" || exit 1
export HOST=127.0.0.1
export PORT=8794
export ENVIRONMENT=production

PNPM_BIN="${PNPM_BIN:-pnpm}"
exec /usr/bin/caffeinate -is "$PNPM_BIN" start:node

// Default production API host.
//
// We point at the Cloudflare Workers default hostname. Once a custom domain is
// wired up in Cloudflare, set `VITE_API_BASE_URL` at build time on Cloudflare
// Pages and the override below kicks in.
const NST_API_BASE = "https://nst-control-tower-api.drnon.workers.dev";
const LEGACY_API_HOSTS = new Set([
  "https://chula-api.nonarkara.org",
  "http://chula-api.nonarkara.org",
  // Stale build-time env vars from previous forks — route through the NST worker.
  "https://chonburi-api.nonarkara.org",
  "https://chonburi-control-tower-api.drnon.workers.dev",
  "https://yala-api.nonarkara.org",
  "https://yala-control-tower-api.drnon.workers.dev",
]);

function normalizeBase(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/\/+$/, "");
}

export function resolveApiBase(raw: string | undefined = import.meta.env.VITE_API_BASE_URL): string {
  const base = normalizeBase(raw);
  const isLegacy = LEGACY_API_HOSTS.has(base);

  if (import.meta.env.DEV && (!base || isLegacy)) {
    return "";
  }

  if (!base || isLegacy) {
    return NST_API_BASE;
  }

  return base;
}

export const API_BASE = resolveApiBase();

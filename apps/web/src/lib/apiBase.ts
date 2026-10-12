// Default production API host.
//
// We point at the Cloudflare Workers default hostname. Once a custom domain is
// wired up in Cloudflare, set `VITE_API_BASE_URL` at build time on Cloudflare
// Pages and the override below kicks in.
const NST_API_BASE = "https://nst-control-tower-api.drnon.workers.dev";

function normalizeBase(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/\/+$/, "");
}

function hostOf(base: string): string | null {
  try {
    return new URL(base).host.toLowerCase();
  } catch {
    return null;
  }
}

// A build-time API base that points at another host on this operator's domains
// is a stale fork setting. Send those through the NST worker. A fork's own
// host (any other domain) is left unchanged.
function isSiblingOperatorHost(base: string): boolean {
  const host = hostOf(base);
  const nst = hostOf(NST_API_BASE);
  if (!host || !nst || host === nst) return false;
  return host === "nonarkara.org" || host.endsWith(".nonarkara.org") || host.endsWith(".drnon.workers.dev");
}

export function resolveApiBase(raw: string | undefined = import.meta.env.VITE_API_BASE_URL): string {
  const base = normalizeBase(raw);
  const isLegacy = isSiblingOperatorHost(base);

  if (import.meta.env.DEV && (!base || isLegacy)) {
    return "";
  }

  if (!base || isLegacy) {
    return NST_API_BASE;
  }

  return base;
}

export const API_BASE = resolveApiBase();

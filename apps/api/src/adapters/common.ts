const DEFAULT_TIMEOUT_MS = 25_000;
const USER_AGENT = "NSTControlTower/1.0 (+https://nst.nonarkara.org)";

function mergeHeaders(base: Record<string, string>, init?: RequestInit): Headers {
  const h = new Headers(init?.headers);
  for (const [k, v] of Object.entries(base)) {
    if (!h.has(k)) h.set(k, v);
  }
  return h;
}

async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function getDefaultHeaders(): Record<string, string> {
  const h: Record<string, string> = { accept: "application/json" };
  // Cloudflare Workers forbids setting User-Agent at runtime.
  if (typeof navigator === "undefined") h["user-agent"] = USER_AGENT;
  return h;
}

const SENSITIVE_QUERY_PARAMS = ["key", "api_key", "apikey", "access_token", "token", "secret"];

// Upstream URLs often carry live API keys in the query string; never let them reach logs verbatim.
function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    for (const name of SENSITIVE_QUERY_PARAMS) {
      if (u.searchParams.has(name)) u.searchParams.set(name, "***");
    }
    return u.toString();
  } catch {
    return url.replace(/([?&](?:key|api_key|apikey|access_token|token|secret)=)[^&]+/gi, "$1***");
  }
}

export async function fetchJsonOrNull<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetchWithTimeout(url, {
      ...init,
      headers: mergeHeaders(getDefaultHeaders(), init),
    });
    if (!res.ok) {
      console.warn(`fetchJsonOrNull non-OK ${res.status} ${redactUrl(url)}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`fetchJsonOrNull error ${redactUrl(url)}`, (err as Error).message);
    return null;
  }
}

export async function fetchTextOrNull(url: string, init?: RequestInit, timeoutMs?: number): Promise<string | null> {
  try {
    const h: Record<string, string> = {};
    if (typeof navigator === "undefined") h["user-agent"] = USER_AGENT;
    const res = await fetchWithTimeout(url, {
      ...init,
      headers: mergeHeaders(h, init),
    }, timeoutMs);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

class UpstreamHttpError extends Error {}

// Despite the name, this used to swallow every failure and resolve null — which meant
// cachedWithStale's stale-if-error fallback (lib/cache.ts) never engaged for any adapter
// relying on it. It must actually reject so a rejected compute() triggers that fallback.
export async function fetchJsonOrThrow<T>(url: string, init?: RequestInit): Promise<T> {
  let attempt = 0;
  while (attempt < 3) {
    try {
      const res = await fetchWithTimeout(url, {
        ...init,
        headers: mergeHeaders(getDefaultHeaders(), init),
      });
      if (res.ok) return (await res.json()) as T;
      if (res.status === 429) {
        attempt++;
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
      throw new UpstreamHttpError(`fetchJsonOrThrow non-OK ${res.status} ${redactUrl(url)}`);
    } catch (err) {
      if (err instanceof UpstreamHttpError) throw err;
      throw new Error(`fetchJsonOrThrow error ${redactUrl(url)}: ${(err as Error).message}`);
    }
  }
  throw new Error(`fetchJsonOrThrow rate-limited, gave up ${redactUrl(url)}`);
}

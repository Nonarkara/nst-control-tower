const DEFAULT_TIMEOUT_MS = 25_000;
const USER_AGENT = "NSTControlTower/1.0 (+https://nst.nonarkara.org)";

function mergeHeaders(base: Record<string, string>, init?: RequestInit): Headers {
  const h = new Headers(init?.headers);
  for (const [k, v] of Object.entries(base)) {
    if (!h.has(k)) h.set(k, v);
  }
  return h;
}

async function fetchWithTimeout<T>(
  url: string,
  init: RequestInit,
  read: (response: Response) => Promise<T>,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const ctrl = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      ctrl.abort();
      reject(new Error(`Upstream timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  try {
    // The deadline includes body consumption. Headers arriving alone must not
    // clear it: an upstream can send headers then stall its JSON indefinitely.
    return await Promise.race([
      Promise.resolve().then(() => fetch(url, { ...init, signal: ctrl.signal })).then(read),
      timeout,
    ]);
  } finally {
    clearTimeout(timer!);
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
    return await fetchWithTimeout(url, {
      ...init,
      headers: mergeHeaders(getDefaultHeaders(), init),
    }, async (res) => {
      if (!res.ok) {
        console.warn(`fetchJsonOrNull non-OK ${res.status} ${redactUrl(url)}`);
        return null;
      }
      return await res.json() as T;
    });
  } catch (err) {
    console.warn(`fetchJsonOrNull error ${redactUrl(url)}`, (err as Error).message);
    return null;
  }
}

export async function fetchTextOrNull(url: string, init?: RequestInit, timeoutMs?: number): Promise<string | null> {
  try {
    const h: Record<string, string> = {};
    if (typeof navigator === "undefined") h["user-agent"] = USER_AGENT;
    return await fetchWithTimeout(url, {
      ...init,
      headers: mergeHeaders(h, init),
    }, async (res) => res.ok ? await res.text() : null, timeoutMs);
  } catch {
    return null;
  }
}

class UpstreamHttpError extends Error {}

// Despite the name, this used to swallow every failure and resolve null — which meant
// cachedWithStale's stale-if-error fallback (lib/cache.ts) never engaged for any adapter
// relying on it. It must actually reject so a rejected compute() triggers that fallback.
export async function fetchJsonOrThrow<T>(url: string, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  let attempt = 0;
  const deadline = Date.now() + timeoutMs;
  while (attempt < 3) {
    try {
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new Error(`Upstream timed out after ${timeoutMs}ms`);
      const result = await fetchWithTimeout<{ ok: true; data: T } | { ok: false }>(url, {
        ...init,
        headers: mergeHeaders(getDefaultHeaders(), init),
      }, async (res) => {
        if (res.ok) return { ok: true, data: await res.json() as T };
        if (res.status === 429) return { ok: false };
        throw new UpstreamHttpError(`fetchJsonOrThrow non-OK ${res.status} ${redactUrl(url)}`);
      }, remaining);
      if (result.ok) return result.data;
      if (!result.ok) {
        attempt++;
        const delay = 1000 * Math.pow(2, attempt);
        if (attempt >= 3 || Date.now() + delay >= deadline) break;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
    } catch (err) {
      if (err instanceof UpstreamHttpError) throw err;
      throw new Error(`fetchJsonOrThrow error ${redactUrl(url)}: ${(err as Error).message}`);
    }
  }
  throw new Error(`fetchJsonOrThrow rate-limited, gave up ${redactUrl(url)}`);
}

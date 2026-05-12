/**
 * Rate-limited HTTP client with retry and caching.
 * Used by all crawler sources to avoid overwhelming target sites.
 */

const DEFAULT_RATE_LIMIT_MS = 800;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_RETRY_DELAY_MS = 2000;

const COMMON_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AIModelNavi/1.0",
  Accept: "text/html,application/xhtml+xml,application/json",
  "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
};

let lastRequestTime = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function enforceRateLimit(minIntervalMs: number): Promise<void> {
  const elapsed = Date.now() - lastRequestTime;
  const wait = minIntervalMs - elapsed + Math.random() * 100; // jitter
  if (wait > 0) {
    await sleep(wait);
  }
}

export interface FetchResult {
  body: string;
  status: number;
  durationMs: number;
}

export async function rateLimitedFetch(
  url: string,
  options?: {
    headers?: Record<string, string>;
    rateLimitMs?: number;
    maxRetries?: number;
    retryDelayMs?: number;
    timeoutMs?: number;
  }
): Promise<FetchResult> {
  const rateLimitMs = options?.rateLimitMs ?? DEFAULT_RATE_LIMIT_MS;
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const retryDelayMs = options?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const headers = { ...COMMON_HEADERS, ...options?.headers };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    await enforceRateLimit(rateLimitMs);

    const start = Date.now();
    lastRequestTime = start;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const body = await res.text();
      const durationMs = Date.now() - start;

      if (res.ok) {
        return { body, status: res.status, durationMs };
      }

      // Don't retry 4xx errors (except 429)
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        throw new Error(`HTTP ${res.status} fetching ${url}`);
      }

      lastError = new Error(`HTTP ${res.status} fetching ${url}`);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("HTTP 4")) {
        throw err; // Don't retry client errors
      }
      lastError = err instanceof Error ? err : new Error(String(err));
    }

    // Retry with exponential backoff
    if (attempt < maxRetries) {
      const delay = retryDelayMs * Math.pow(2, attempt) + Math.random() * 1000;
      console.warn(`  Retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms: ${lastError?.message}`);
      await sleep(delay);
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}

export async function fetchJson<T>(
  url: string,
  options?: {
    headers?: Record<string, string>;
    rateLimitMs?: number;
    maxRetries?: number;
  }
): Promise<T> {
  const result = await rateLimitedFetch(url, {
    ...options,
    headers: { ...options?.headers, Accept: "application/json" },
  });
  return JSON.parse(result.body) as T;
}
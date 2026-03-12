/**
 * Core HTTP client.
 *
 * Access token is stored as a module-level singleton (in-memory, never
 * persisted to localStorage).  The AuthContext calls `setAccessToken`
 * whenever a new token is obtained.
 *
 * On 401 the client automatically tries to refresh the token once via
 * the httpOnly-cookie-based refresh endpoint, then retries the original
 * request.  If the refresh also fails, it dispatches a custom event so
 * the AuthContext can clear state and redirect to /login.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

// ── Singleton access token (in-memory only) ─────────────────────────────────
let _accessToken: string | null = null;
let _isRefreshing = false;
let _refreshQueue: Array<(token: string | null) => void> = [];

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

// ── Silent token refresh ─────────────────────────────────────────────────────
async function doRefresh(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
    });
    if (!res.ok) return null;
    const json = await res.json();
    const token: string | null = json?.data?.accessToken ?? null;
    _accessToken = token;
    return token;
  } catch {
    return null;
  }
}

async function refreshOnce(): Promise<string | null> {
  if (_isRefreshing) {
    // Queue subsequent callers until the in-flight refresh completes
    return new Promise((resolve) => _refreshQueue.push(resolve));
  }

  _isRefreshing = true;
  const token = await doRefresh();
  _isRefreshing = false;

  // Resolve all queued callers
  _refreshQueue.forEach((cb) => cb(token));
  _refreshQueue = [];

  if (!token) {
    // Fire a global event so AuthContext can clear state
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:session-expired'));
    }
  }

  return token;
}

// ── API error class ──────────────────────────────────────────────────────────
export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ── Core fetch wrapper ───────────────────────────────────────────────────────
interface FetchOptions extends Omit<RequestInit, 'body'> {
  /** Skip attaching the Authorization header (e.g. for login / refresh) */
  skipAuth?: boolean;
  /** JSON body — will be serialised automatically */
  body?: unknown;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth = false, body, headers: extraHeaders, ...rest } = options;

  const buildHeaders = (token: string | null): HeadersInit => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (!skipAuth && token) h['Authorization'] = `Bearer ${token}`;
    if (extraHeaders) Object.assign(h, extraHeaders);
    return h;
  };

  const buildInit = (token: string | null): RequestInit => ({
    ...rest,
    headers: buildHeaders(token),
    credentials: 'include',
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  let res = await fetch(`${BASE_URL}${path}`, buildInit(_accessToken));

  // One automatic retry after token refresh on 401
  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshOnce();
    if (newToken) {
      res = await fetch(`${BASE_URL}${path}`, buildInit(newToken));
    }
  }

  // Handle non-JSON responses (e.g. CSV export)
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    if (!res.ok) throw new ApiError(`Request failed: ${res.status}`, res.status);
    return res as unknown as T;
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      json?.message ?? `Request failed with status ${res.status}`,
      res.status,
      json?.details
    );
  }

  return json as T;
}

// ── File upload (FormData) ────────────────────────────────────────────────────
export async function apiUpload<T = unknown>(
  path: string,
  formData: FormData,
  method: 'POST' | 'PATCH' = 'PATCH',
): Promise<T> {
  const headers: Record<string, string> = {};
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;

  let res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: formData,
  });

  if (res.status === 401) {
    const newToken = await refreshOnce();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${BASE_URL}${path}`, { method, headers, credentials: 'include', body: formData });
    }
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(json?.message ?? `Request failed with status ${res.status}`, res.status, json?.details);
  }
  return json as T;
}

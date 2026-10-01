import { auth } from './firebase';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const TIMEOUT_MS = 30000;

// Notified after every successful write, so cached reads can refresh (see useApi.ts)
const writeListeners = new Set<(path: string) => void>();
export function onApiWrite(fn: (path: string) => void) {
  writeListeners.add(fn);
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers = await getAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new Error('Server took too long to respond. Please try again.');
    }
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }

  // Proxies/gateways can answer with HTML (e.g. a 504 page), so don't assume JSON
  let data: { data?: T; message?: string } | null = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON body
  }
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  if (method !== 'GET') writeListeners.forEach((fn) => fn(path));
  return data?.data as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>('GET', path);
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>('POST', path, body);
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return request<T>('PUT', path, body);
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>('DELETE', path);
}

export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
  return err instanceof Error ? err.message : fallback;
}

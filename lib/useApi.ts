'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { apiGet, onApiWrite } from './api';

/**
 * Stale-while-revalidate cache for GET requests.
 * - A page shows the last known data instantly (also across reloads, via localStorage),
 *   then refreshes it in the background.
 * - Identical requests in flight are shared.
 * - invalidateApi() after any write refreshes everything currently on screen.
 */

interface Entry {
  data?: unknown;
  error?: string;
  /** a request for this key is in flight */
  pending?: boolean;
}

const EMPTY: Entry = {};
const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<void>>();
const listeners = new Map<string, Set<() => void>>();
const STORAGE_PREFIX = 'mw-cache:';
let storageKey: string | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function emit(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}

function setEntry(key: string, entry: Entry) {
  cache.set(key, entry);
  emit(key);
}

function persist() {
  if (!storageKey || persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    if (!storageKey) return;
    const data: Record<string, unknown> = {};
    for (const [k, v] of cache) if (v.data !== undefined) data[k] = v.data;
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      // quota exceeded or storage blocked: the in-memory cache still works
    }
  }, 300);
}

/** Scope the cache to a signed-in user (restores their saved data), or clear it on sign-out. */
export function setApiCacheUser(uid: string | null) {
  const next = uid ? STORAGE_PREFIX + uid : null;
  if (next === storageKey) return;
  if (!uid && storageKey) {
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
  }
  storageKey = next;
  cache.clear();
  inflight.clear();
  if (storageKey) {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}') as Record<string, unknown>;
      for (const [k, data] of Object.entries(saved)) cache.set(k, { data });
    } catch {
      // corrupt or unavailable storage: start empty
    }
  }
  for (const key of listeners.keys()) emit(key);
}

export function revalidate(key: string): Promise<void> {
  const running = inflight.get(key);
  if (running) return running;
  const prev = cache.get(key) || EMPTY;
  setEntry(key, { ...prev, pending: true });
  const p = apiGet<unknown>(key)
    .then((data) => {
      setEntry(key, { data });
      persist();
    })
    .catch((err: unknown) => {
      // Keep showing old data if we have it; surface the error alongside
      setEntry(key, { data: prev.data, error: err instanceof Error ? err.message : 'Request failed' });
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

/** Refresh every cached response (call after any create/update/delete). */
export function invalidateApi() {
  for (const key of cache.keys()) {
    if (listeners.get(key)?.size) revalidate(key);
    else cache.set(key, { ...cache.get(key), error: undefined });
  }
  // Keys not on screen stay as stale data; they revalidate when their page mounts
}

// Any create/update/delete can change balances, totals and lists everywhere
onApiWrite((path) => {
  if (path !== '/auth/sync') invalidateApi();
});

export function useApi<T>(path: string | null) {
  const subscribe = useCallback((onChange: () => void) => {
    if (!path) return () => {};
    let set = listeners.get(path);
    if (!set) listeners.set(path, (set = new Set()));
    set.add(onChange);
    return () => { set.delete(onChange); };
  }, [path]);

  const entry = useSyncExternalStore(
    subscribe,
    () => (path && cache.get(path)) || EMPTY,
    () => EMPTY,
  );

  // Always refresh on mount / path change; cached data (if any) shows meanwhile
  useEffect(() => {
    if (path) revalidate(path);
  }, [path]);

  const reload = useCallback(() => (path ? revalidate(path) : Promise.resolve()), [path]);

  return {
    data: entry.data as T | undefined,
    error: entry.data === undefined ? entry.error ?? null : null,
    /** a background refresh failed while older data is shown */
    staleError: entry.data !== undefined ? entry.error ?? null : null,
    loading: entry.data === undefined && !entry.error,
    refreshing: !!entry.pending,
    reload,
  };
}

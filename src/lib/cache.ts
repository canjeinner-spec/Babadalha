import AsyncStorage from "@react-native-async-storage/async-storage";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

const mem = new Map<string, unknown>();
const sonCekim = new Map<string, number>();
const EN_AZ_ARALIK_MS = 20000;
const PREFIX = "cache:";

export function getCached<T>(key: string): T | undefined {
  return mem.get(key) as T | undefined;
}
export function setCached<T>(key: string, value: T, persist = false): void {
  mem.set(key, value);
  if (persist) AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)).catch(() => {});
}

export function cacheTemizle(): void {
  mem.clear();
  sonCekim.clear();
  AsyncStorage.getAllKeys()
    .then((k) => AsyncStorage.multiRemove(k.filter((x) => x.startsWith(PREFIX))))
    .catch(() => { /* sessiz — bellek zaten temizlendi */ });
}

export async function prefetch<T>(key: string, fetcher: () => Promise<T>, persist = false): Promise<void> {
  try { setCached(key, await fetcher(), persist); } catch { /* sessiz */ }
}

async function hydrate<T>(key: string): Promise<T | undefined> {
  if (mem.has(key)) return mem.get(key) as T;
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (raw != null) { const v = JSON.parse(raw) as T; mem.set(key, v); return v; }
  } catch { /* sessiz */ }
  return undefined;
}

type Options = { persist?: boolean; enabled?: boolean };

export function useCachedResource<T>(
  key: string,
  fetcher: () => Promise<T>,
  opts: Options = {},
): { data: T | undefined; loading: boolean; refresh: () => void } {
  const { persist = false, enabled = true } = opts;
  const [data, setData] = useState<T | undefined>(() => getCached<T>(key));
  const [loading, setLoading] = useState(getCached<T>(key) === undefined);
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const revalidate = useCallback(async (zorla = false) => {
    if (!enabled) return;
    if (!zorla && Date.now() - (sonCekim.get(key) ?? 0) < EN_AZ_ARALIK_MS) {
      setLoading(false);
      return;
    }
    try {
      const fresh = await fetcherRef.current();
      sonCekim.set(key, Date.now());
      setCached(key, fresh, persist);
      startTransition(() => setData(fresh));
    } catch (e) {
      console.warn("[cache]", key, (e as Error)?.message || e);
    } finally {
      setLoading(false);
    }
  }, [key, persist, enabled]);

  useEffect(() => {
    let alive = true;
    if (getCached<T>(key) === undefined) {
      hydrate<T>(key).then((v) => {
        if (alive && v !== undefined) startTransition(() => { setData(v); setLoading(false); });
      });
    }
    return () => { alive = false; };
  }, [key]);

  useFocusEffect(useCallback(() => { revalidate(); }, [revalidate]));

  const refresh = useCallback(() => { void revalidate(true); }, [revalidate]);

  return { data, loading, refresh };
}

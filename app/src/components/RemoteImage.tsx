import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, StyleProp, ImageStyle } from 'react-native';

/**
 * Real destination/place photos, resolved via Wikipedia's keyless MediaWiki
 * Action API (generator=search + pageimages) — a single CORS-enabled GET
 * that maps a loose query like "Sagrada Familia" or "Barcelona skyline" to
 * the best-matching Wikipedia article and its real thumbnail. This replaces
 * LoremFlickr (generic stock photos, unreliable in production) with actual
 * photos of the named place. Results are cached in memory per query+size so
 * repeated cards (same destination across screens) cost one request total.
 */

const cache = new Map<string, string | null>();
const inFlight = new Map<string, Promise<string | null>>();

async function resolveWikipediaThumb(query: string, size: number): Promise<string | null> {
  const key = `${query}::${size}`;
  if (cache.has(key)) return cache.get(key) ?? null;
  if (inFlight.has(key)) return inFlight.get(key)!;

  const promise = (async () => {
    try {
      const url =
        'https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=' +
        encodeURIComponent(query) +
        '&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=' +
        size +
        '&format=json&origin=*';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = await res.json();
      const pages = json?.query?.pages;
      if (!pages) return null;
      const page: any = Object.values(pages)[0];
      const thumb = page?.thumbnail?.source ?? null;
      cache.set(key, thumb);
      return thumb;
    } catch {
      cache.set(key, null);
      return null;
    }
  })();
  inFlight.set(key, promise);
  const result = await promise;
  inFlight.delete(key);
  return result;
}

/**
 * Renders a real photo for the given query, absolutely filling its parent.
 * Renders nothing while resolving or if no photo is found, letting the
 * caller's own background color/gradient show through — matching the
 * existing card design's fallback behavior.
 */
export function PlaceImage({
  query,
  size = 640,
  style,
  resizeMode = 'cover',
}: {
  query: string;
  size?: number;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain';
}) {
  const [uri, setUri] = useState<string | null>(() => cache.get(`${query}::${size}`) ?? null);

  useEffect(() => {
    let cancelled = false;
    const key = `${query}::${size}`;
    if (cache.has(key)) {
      setUri(cache.get(key) ?? null);
      return;
    }
    setUri(null);
    resolveWikipediaThumb(query, size).then((thumb) => {
      if (!cancelled) setUri(thumb);
    });
    return () => {
      cancelled = true;
    };
  }, [query, size]);

  if (!uri) return null;
  return <Image source={{ uri }} style={[StyleSheet.absoluteFill, style]} resizeMode={resizeMode} />;
}

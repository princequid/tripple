'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ShotCard } from '@/modules/shots/types';
import { mediaUrl } from '@/lib/media';

/**
 * SCR-60 colour-mosaic 404 (X-02, FR-08): the digits "404" drawn from the product's own shot thumbnails, ordered
 * by closeness to a hue chosen with the slider. Decorative (aria-hidden); the message, search and links carry
 * the meaning. Falls back to flat tiles when shots can't be loaded.
 */
const FONT: Record<string, string[]> = {
  '4': ['10010', '10010', '10010', '11111', '00010', '00010', '00010'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
};

const hueOf = (hex: string | null) => {
  if (!hex) return 0;
  const n = parseInt(hex.replace('#', ''), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};

export function NotFoundMosaic() {
  const [shots, setShots] = useState<ShotCard[]>([]);
  const [hue, setHue] = useState(350);
  useEffect(() => {
    fetch('/api/shots?sort=recent&limit=48', { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((b: { data?: ShotCard[] } | null) => setShots(b?.data ?? []))
      .catch(() => undefined);
  }, []);
  const sorted = useMemo(() => {
    const dist = (h: number) => Math.min(Math.abs(h - hue), 360 - Math.abs(h - hue));
    return [...shots].sort((a, b) => dist(hueOf(a.cover?.dominantColor ?? null)) - dist(hueOf(b.cover?.dominantColor ?? null)));
  }, [shots, hue]);

  let k = 0;
  return (
    <div className="mosaic404" style={{ ['--hue' as string]: String(hue) }}>
      <div className="mosaic404__digits" aria-hidden="true">
        {'404'.split('').map((d, di) => (
          <div key={di} className="mosaic404__digit">
            {FONT[d]!.flatMap((row, ri) =>
              row.split('').map((on, ci) => {
                if (on !== '1') return <span key={`${ri}-${ci}`} className="mosaic404__cell" />;
                const s = sorted[k++ % Math.max(1, sorted.length)];
                return (
                  <span key={`${ri}-${ci}`} className="mosaic404__cell is-on" style={{ background: s?.cover?.dominantColor ?? undefined }}>
                    {s?.cover && (
                      // eslint-disable-next-line @next/next/no-img-element -- custom media host
                      <img src={mediaUrl(s.cover.key, 'cover-400')} alt="" loading="lazy" />
                    )}
                  </span>
                );
              }),
            )}
          </div>
        ))}
      </div>
      <label className="mosaic404__slider">
        <span className="visually-hidden">Tile colour (hue)</span>
        <input type="range" min={0} max={359} value={hue} aria-valuetext={`Hue ${hue} degrees`} onChange={(e) => setHue(Number(e.target.value))} />
      </label>
    </div>
  );
}

export function NotFoundLinks() {
  return (
    <div className="cluster" style={{ justifyContent: 'center' }}>
      <Link className="ui-btn ui-btn--primary" href="/">
        Go home
      </Link>
      <Link className="ui-btn ui-btn--secondary neu-control" href="/shots/popular">
        Explore shots
      </Link>
    </div>
  );
}

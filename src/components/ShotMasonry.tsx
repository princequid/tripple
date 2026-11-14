'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { ShotCard as ShotCardDto } from '@/modules/shots/types';
import { ShotCard, cardRatio } from './ShotCard';

/**
 * C18b ShotMasonry (A-27): a Pinterest-style grid whose cards keep each artwork's own aspect ratio.
 *
 * - Column count comes from the container width (1 → 5), not from image resolution: the ratio sets a card's shape,
 *   the grid sets its size.
 * - Placement is "shortest column first", using the known ratio (MediaRef width/height), so nothing waits for images
 *   to load and nothing shifts: every <img> also reserves its box with width/height.
 * - Server render (and no-JS) uses CSS multi-column as the fallback; after hydration the JS layout takes over.
 * - Appending a page only appends to the columns, so earlier cards never jump.
 */
const META_PX = 72; // card meta row + padding, used only for balancing estimates

export function columnsFor(width: number) {
  return width >= 1500 ? 5 : width >= 1100 ? 4 : width >= 740 ? 3 : width >= 480 ? 2 : 1;
}

export function ShotMasonry({ shots, label, eager = 4 }: { shots: ShotCardDto[]; label: string; eager?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ cols: number; colW: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const gap = parseFloat(getComputedStyle(el).columnGap) || 24;
      const cols = columnsFor(w);
      const colW = (w - gap * (cols - 1)) / cols;
      setBox((b) => (b && b.cols === cols && Math.abs(b.colW - colW) < 1 ? b : { cols, colW }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!box) {
    return (
      <div ref={ref} role="list" aria-label={label} className="masonry masonry--css shot-feed">
        {shots.map((s, i) => (
          <ShotCard key={s.id} shot={s} priority={i < eager} as="div" />
        ))}
      </div>
    );
  }

  const heights = new Array<number>(box.cols).fill(0);
  const columns: { shot: ShotCardDto; index: number }[][] = Array.from({ length: box.cols }, () => []);
  shots.forEach((shot, index) => {
    let c = 0;
    for (let k = 1; k < box.cols; k++) if (heights[k]! < heights[c]! - 1) c = k;
    const small = shot.cover && shot.cover.width < 480 ? shot.cover.height + 32 : null;
    heights[c]! += (small ?? box.colW / cardRatio(shot)) + META_PX;
    columns[c]!.push({ shot, index });
  });

  return (
    <div ref={ref} role="list" aria-label={label} className="masonry shot-feed" style={{ ['--masonry-cols' as string]: box.cols }}>
      {columns.map((col, i) => (
        <div key={i} className="masonry__col" role="presentation">
          {col.map(({ shot, index }) => (
            <ShotCard key={shot.id} shot={shot} priority={index < eager} as="div" />
          ))}
        </div>
      ))}
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import * as search from '@/modules/search/service';
import { formatCount } from '@/lib/format';

export const metadata: Metadata = { title: 'Tags' };

/** /tags (D-07, FR-33, BR-41): the 50 tags with the most eligible shots, then an A–Z index. */
export default async function TagsPage() {
  const { top, index } = await search.tagIndex();
  return (
    <>
      <div className="page-head">
        <h1 className="t-h2">Tags</h1>
      </div>
      <section className="stack section" aria-labelledby="top-tags">
        <h2 id="top-tags" className="t-h4">
          Popular tags
        </h2>
        <ul className="ui-chip-row">
          {top.map((t) => (
            <li key={t.slug}>
              <Link className="ui-chip" href={`/tags/${t.slug}`}>
                #{t.name} <span className="text-secondary">{formatCount(t.count)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="all-tags">
        <h2 id="all-tags" className="t-h4" style={{ marginBottom: 'var(--space-6)' }}>
          All tags
        </h2>
        <div className="tag-index">
          {index.map((g) => (
            <section key={g.letter} aria-label={`Tags starting with ${g.letter}`}>
              <h3 className="t-label">{g.letter}</h3>
              <ul>
                {g.tags.map((t) => (
                  <li key={t.slug}>
                    <Link className="text-link" href={`/tags/${t.slug}`}>
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}

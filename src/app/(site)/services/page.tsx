import type { Metadata } from 'next';
import Link from 'next/link';
import { ServicesBrowser } from '@/components/hire/ServicesBrowser';
import { PreviewNote } from '@/components/ui/PreviewNote';

export const metadata: Metadata = { title: 'Design services', description: 'Productised design services from independent designers.' };

/** /services — SCR-54 (M-01, FR-75). `?q=` comes from the header search "Services" type. */
export default function ServicesPage() {
  return (
    <>
      <header className="page-head row-between">
        <div className="stack" style={{ ['--stack-gap' as string]: 'var(--space-3)' }}>
          <h1 className="t-h1">Design services</h1>
          <p className="t-body-lg text-secondary measure">Fixed-scope work from designers you can trust. Message the designer to get started.</p>
          <PreviewNote feature="services" />
        </div>
        <Link className="ui-btn ui-btn--secondary neu-control" href="/services/new">
          Offer a service
        </Link>
      </header>
      <ServicesBrowser />
    </>
  );
}

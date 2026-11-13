import type { Metadata } from 'next';
import { ServiceForm } from '@/components/hire/ServiceForm';
import { requireMemberPage } from '../../../_guard';

export const metadata: Metadata = { title: 'Offer a service', robots: { index: false } };

/** /services/new — SCR-56 (auth). */
export default async function NewServicePage() {
  await requireMemberPage('/services/new');
  return (
    <div className="page-narrow form-page">
      <header className="page-head stack" style={{ ['--stack-gap' as string]: 'var(--space-2)' }}>
        <h1 className="t-h2">Offer a service</h1>
        <p className="text-secondary">Package what you do best with a clear price and delivery time.</p>
      </header>
      <ServiceForm id={null} />
    </div>
  );
}

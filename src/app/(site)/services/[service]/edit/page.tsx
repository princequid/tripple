import type { Metadata } from 'next';
import { ServiceForm } from '@/components/hire/ServiceForm';
import { idFromSegment, requireMemberPage } from '../../../../_guard';

export const metadata: Metadata = { title: 'Edit service', robots: { index: false } };

/** /services/:id/edit — SCR-56 (owner; non-owners see a permission state). */
export default async function EditServicePage({ params }: { params: Promise<{ service: string }> }) {
  const seg = (await params).service;
  await requireMemberPage(`/services/${seg}/edit`);
  return (
    <div className="page-narrow form-page">
      <h1 className="t-h2 page-head">Edit service</h1>
      <ServiceForm id={idFromSegment(seg)} />
    </div>
  );
}

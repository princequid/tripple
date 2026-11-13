import type { Metadata } from 'next';
import { ServiceDetailView } from '@/components/hire/ServiceDetailView';
import { idFromSegment } from '../../../_guard';

export const metadata: Metadata = { title: 'Service' };

/** /services/:id-:slug — SCR-55. */
export default async function ServicePage({ params }: { params: Promise<{ service: string }> }) {
  return <ServiceDetailView id={idFromSegment((await params).service)} />;
}

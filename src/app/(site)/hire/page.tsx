import type { Metadata } from 'next';
import { HireDirectory } from '@/components/hire/HireDirectory';
import { PreviewNote } from '@/components/ui/PreviewNote';

export const metadata: Metadata = { title: 'Hire designers', description: 'Find independent designers and studios for your next project.' };

/** /hire — SCR-53 designer directory (H-01, FR-73). `/designers?search=` style links land here as `?search=`. */
export default function HirePage() {
  return (
    <>
      <header className="page-head stack" style={{ ['--stack-gap' as string]: 'var(--space-3)' }}>
        <h1 className="t-h1">
          Find the right <span className="text-accent-display">designer</span>
        </h1>
        <p className="t-body-lg text-secondary measure">Browse independent designers and studios, see their latest work, and message them directly.</p>
        <PreviewNote feature="hire" />
      </header>
      <HireDirectory />
    </>
  );
}

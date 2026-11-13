import type { Metadata } from 'next';
import { ReportQueue } from '@/components/admin/ReportQueue';
import { PreviewNote } from '@/components/ui/PreviewNote';
import { requireStaffPage } from '../../../_guard';

export const metadata: Metadata = { title: 'Report queue', robots: { index: false } };

/** /admin/reports — SCR-41 (staff only; others 404). */
export default async function ReportsPage() {
  await requireStaffPage();
  return (
    <>
      <header className="page-head stack" style={{ ['--stack-gap' as string]: 'var(--space-2)' }}>
        <h1 className="t-h2">Report queue</h1>
        <p className="text-secondary">Oldest first. Every decision needs a reason and is written to the audit log.</p>
        <PreviewNote feature="reports" />
      </header>
      <ReportQueue />
    </>
  );
}

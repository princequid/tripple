/**
 * Static and legal pages (NX-06, FR-04). The text is a placeholder until the user supplies or approves legal copy
 * (OQ-03, A-14). Pages say so plainly rather than pretending to be final.
 */
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="section prose">
      <h1 className="t-h2">{title}</h1>
      <div className="ui-alert" role="note">
        Draft placeholder text. The final wording needs legal review before launch.
      </div>
      {children}
    </article>
  );
}

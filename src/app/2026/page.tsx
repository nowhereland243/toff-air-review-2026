import { getApplicants, getCohortConfig } from '@/lib/data';
import { HeaderNav } from '@/components/HeaderNav';
import { IndexGridView } from '@/components/IndexGridView';

export const metadata = {
  title: '2026 Applicants — ToFF Residency Review',
};

export default function IndexPage() {
  const applicants = getApplicants('2026');
  const config = getCohortConfig('2026');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <HeaderNav totalApplicants={applicants.length} />
      
      <main>
        <IndexGridView applicants={applicants} />
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '3rem 1.5rem',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        borderTop: '1px solid var(--border-subtle)',
        marginTop: '4rem',
      }}>
        <p>{config.cohortTitle} — Confidential Review Portal</p>
        <p style={{ marginTop: '0.25rem' }}>Tom of Finland Foundation</p>
      </footer>
    </div>
  );
}

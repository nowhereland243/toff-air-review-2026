import { getApplicants } from '@/lib/data';
import { HeaderNav } from '@/components/HeaderNav';
import { CompareView } from '@/components/CompareView';

export const metadata = {
  title: 'Compare Finalists — ToFF Residency Review 2026',
};

export default function ComparePage() {
  const applicants = getApplicants('2026');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <HeaderNav totalApplicants={applicants.length} />
      
      <main>
        <CompareView allApplicants={applicants} />
      </main>
    </div>
  );
}

import { notFound } from 'next/navigation';
import { getApplicants, getApplicantBySlug } from '@/lib/data';
import { HeaderNav } from '@/components/HeaderNav';
import { DetailView } from '@/components/DetailView';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const applicant = getApplicantBySlug(slug, '2026');
  if (!applicant) return { title: 'Applicant Not Found' };
  return {
    title: `${applicant.fullName} — ToFF Residency Review 2026`,
  };
}

export default async function ArtistDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const applicants = getApplicants('2026');
  const index = applicants.findIndex(a => a.slug === slug);

  if (index === -1) {
    notFound();
  }

  const applicant = applicants[index];
  const prevSlug = index > 0 ? applicants[index - 1].slug : null;
  const nextSlug = index < applicants.length - 1 ? applicants[index + 1].slug : null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <HeaderNav totalApplicants={applicants.length} />
      
      <main>
        <DetailView
          applicant={applicant}
          prevSlug={prevSlug}
          nextSlug={nextSlug}
        />
      </main>
    </div>
  );
}

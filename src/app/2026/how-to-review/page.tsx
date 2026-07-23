import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Shield, LayoutGrid, Columns3, Award } from 'lucide-react';
import { getApplicants, getCohortConfig } from '@/lib/data';
import { HeaderNav } from '@/components/HeaderNav';

export const metadata = {
  title: 'Judge Instructions — ToFF Residency Review 2026',
};

export default function HowToReviewPage() {
  const applicants = getApplicants('2026');
  const config = getCohortConfig('2026');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <HeaderNav totalApplicants={applicants.length} />
      
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem 6rem 1.5rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <Link
            href="/2026"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-card)',
              marginBottom: '1.5rem',
            }}
          >
            <ArrowLeft size={16} />
            Back to applicants grid
          </Link>

          <span className="label-utility" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--accent)' }}>
            Judge Reference Guide
          </span>
          <h1 className="font-display" style={{ fontSize: '2.5rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            Reviewing the 2026 Residency Applications
          </h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Welcome Intro */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '2rem' }}>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: 1.7 }}>
              Welcome — and thank you for taking the time to review the candidates for the 2026 Tom of Finland Foundation Artist-in-Residence program. This private portal holds every submitted application for your visual and textual evaluation.
            </p>
          </div>

          {/* Section: Getting In & Browsing */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <LayoutGrid size={22} style={{ color: 'var(--accent)' }} />
              <h2 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 600 }}>Browsing & Evaluation</h2>
            </div>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', lineHeight: 1.85 }}>
              <li><strong>Front Page Grid:</strong> Browse all applicants visually. Cards display high-resolution artwork at native aspect ratio without cropping.</li>
              <li><strong>Full Application Detail:</strong> Click any card to read proposals and bios side-by-side, view artwork descriptions, check room/term preferences, and open the embedded CV PDF under <em>"View CV"</em>.</li>
              <li><strong>Fast Navigation:</strong> Use the <code>←</code> <code>→</code> keyboard arrow keys (or on-screen arrows) to navigate sequentially between applicants.</li>
            </ul>
          </div>

          {/* Section: Comparing */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Columns3 size={22} style={{ color: 'var(--accent)' }} />
              <h2 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 600 }}>Comparing Finalists</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
              When weighing top finalists against each other, tap the <strong>Pin</strong> icon on up to three artists from either the grid or their detail page. Then click <strong>Compare</strong> in the top header to review their portfolios, proposals, and room preferences in synchronized side-by-side columns.
            </p>
          </div>

          {/* Section: Scoring */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Award size={22} style={{ color: 'var(--accent)' }} />
              <h2 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 600 }}>Submitting Blind Scores</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '1rem' }}>
              On each artist's page, press <strong>Score this artist</strong>. A clean scoring form will open with the artist's name pre-filled.
            </p>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', lineHeight: 1.85 }}>
              <li><strong>Judge Name Memory:</strong> The first time you score, the site will prompt for your name once and remember it locally to pre-fill all future submissions.</li>
              <li><strong>Criteria (1–5 scale):</strong> Rate each applicant on <em>Artistic Merit</em>, <em>Strength of Proposal</em>, <em>Resonance with Mission</em>, and <em>Readiness</em>.</li>
              <li><strong>Local Progress:</strong> A <code>Scored ✓</code> indicator marks applicants you have scored in your current browser session.</li>
            </ul>
          </div>

          {/* Section: Ground Rules */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--accent-muted)', borderRadius: '8px', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Shield size={22} style={{ color: 'var(--accent)' }} />
              <h2 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 600 }}>Three Ground Rules</h2>
            </div>
            <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-primary)', lineHeight: 1.85 }}>
              <li><strong>Score Independently:</strong> No judge can view another's ratings. Please refrain from discussing scores until committee deliberation.</li>
              <li><strong>Broad Coverage:</strong> Please rate every applicant you can — thorough coverage maintains statistical fairness across the pool.</li>
              <li><strong>Strict Confidentiality:</strong> Applications contain unpublished portfolio artwork and personal proposals. Do not share credentials or site links outside the review committee.</li>
            </ol>
          </div>

          {/* Deadline Footer */}
          <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              Scoring Deadline: <strong>{config.scoringDeadline || 'August 15, 2026'}</strong>
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Questions or technical issues? Contact Nolan Feng at <a href="mailto:nolan@tomoffinland.org" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>nolan@tomoffinland.org</a>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

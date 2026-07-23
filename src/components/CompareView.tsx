'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pin, X, ArrowLeft, ExternalLink, Maximize2 } from 'lucide-react';
import type { Applicant } from '@/lib/data';
import { InlineScoreForm } from './InlineScoreForm';
import { PdfModal } from './PdfModal';

interface CompareViewProps {
  allApplicants: Applicant[];
}

export function CompareView({ allApplicants }: CompareViewProps) {
  const router = useRouter();
  const [pinnedSlugs, setPinnedSlugs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // PDF Modal state
  const [activePdf, setActivePdf] = useState<{ title: string; url: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    const pinnedRaw = localStorage.getItem('pinned_slugs');
    if (pinnedRaw) {
      try {
        const parsed = JSON.parse(pinnedRaw);
        if (Array.isArray(parsed)) setPinnedSlugs(parsed);
      } catch (e) {}
    }
  }, []);

  const unpinArtist = (slug: string) => {
    const updated = pinnedSlugs.filter(s => s !== slug);
    setPinnedSlugs(updated);
    localStorage.setItem('pinned_slugs', JSON.stringify(updated));
    window.dispatchEvent(new Event('toff_pinned_change'));
  };

  const pinnedApplicants = pinnedSlugs
    .map(slug => allApplicants.find(a => a.slug === slug))
    .filter(Boolean) as Applicant[];

  if (!mounted) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading compare mode...</div>;
  }

  if (pinnedApplicants.length === 0) {
    return (
      <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px dashed var(--border-strong)' }}>
        <Pin size={32} style={{ color: 'var(--accent)', margin: '0 auto 1rem auto' }} />
        <h2 className="font-display" style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>No Artists Pinned for Comparison</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Pin up to 3 artists while browsing the index grid or detail pages to compare their portfolios, proposals, and room requests side by side.
        </p>
        <Link
          href="/2026"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--accent)',
            color: '#FFF',
            borderRadius: '6px',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} />
          Browse Applicants Grid
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '2rem 1.5rem 6rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 600 }}>Compare Finalists</h1>
          <p className="label-utility" style={{ color: 'var(--text-muted)' }}>Side-by-side evaluation ({pinnedApplicants.length} of 3 pinned)</p>
        </div>

        <button
          onClick={() => router.push('/2026')}
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
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
          Back to all applicants
        </button>
      </div>

      {/* Synchronized Columns Table */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${pinnedApplicants.length}, 1fr)`,
        gap: '1.5rem',
      }}>
        {pinnedApplicants.map((artist) => (
          <div
            key={artist.slug}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header & Unpin Button */}
            <div style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--bg-elevated)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span className="label-utility">Pinned Artist</span>
              <button
                onClick={() => unpinArtist(artist.slug)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontSize: '0.8rem',
                }}
              >
                <X size={14} />
                Unpin
              </button>
            </div>

            {/* Row 1: Work Samples Strip (Images & PDFs) */}
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)', backgroundColor: '#0D0C0A' }}>
              {artist.workSamples && artist.workSamples.length > 0 ? (
                <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                  {artist.workSamples.slice(0, 4).map((sample, idx) => {
                    const isImg = sample.isImage !== false && !sample.web.toLowerCase().endsWith('.pdf');

                    if (isImg) {
                      return (
                        <img
                          key={idx}
                          src={sample.web}
                          alt={sample.name}
                          style={{
                            height: '180px',
                            width: 'auto',
                            objectFit: 'contain',
                            borderRadius: '4px',
                            flexShrink: 0,
                          }}
                        />
                      );
                    } else {
                      // Visual PDF iframe preview with small top-right badge button (pointer-events: none hides Chrome zoom toolbar)
                      return (
                        <div
                          key={idx}
                          onClick={() => setActivePdf({ title: `${artist.fullName} - ${sample.name}`, url: sample.original })}
                          style={{
                            height: '180px',
                            width: '220px',
                            flexShrink: 0,
                            position: 'relative',
                            backgroundColor: '#191714',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            border: '1px solid var(--border-strong)',
                            cursor: 'pointer',
                          }}
                        >
                          <iframe
                            src={`${sample.original}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                            title={sample.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              border: 'none',
                              pointerEvents: 'none',
                              backgroundColor: '#FFF',
                            }}
                          />
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            backgroundColor: 'rgba(20, 18, 16, 0.88)',
                            border: '1px solid var(--border-strong)',
                            borderRadius: '4px',
                            padding: '0.3rem 0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '10px',
                            fontWeight: 600,
                            color: '#FFF',
                            zIndex: 10,
                            backdropFilter: 'blur(4px)',
                            pointerEvents: 'none',
                          }}>
                            <Maximize2 size={11} />
                            Full Screen
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              ) : (
                <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No work sample files
                </div>
              )}
            </div>

            {/* Row 2: Name & Metadata */}
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="label-utility" style={{ marginBottom: '0.35rem' }}>
                {artist.medium} · {[artist.city, artist.country].filter(Boolean).join(', ')}
              </div>
              <h2 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {artist.fullName}
              </h2>
              <Link
                href={`/2026/artist/${artist.slug}`}
                style={{ fontSize: '0.85rem', color: 'var(--accent)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                View full profile <ExternalLink size={12} />
              </Link>
            </div>

            {/* Row 3: Proposal Excerpt */}
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)', flex: 1 }}>
              <h3 className="label-utility" style={{ marginBottom: '0.5rem' }}>Proposal Excerpt</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {artist.proposal ? `${artist.proposal.slice(0, 500)}...` : '(No proposal text)'}
              </p>
            </div>

            {/* Row 4: Room Requests */}
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 className="label-utility" style={{ marginBottom: '0.5rem' }}>Room Requests</h3>
              {artist.roomRequests && artist.roomRequests.length > 0 ? (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {artist.roomRequests.map((req, idx) => (
                    <span key={idx} style={{ fontSize: '11px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-subtle)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {req.room} ({req.price})
                    </span>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>None specified</span>
              )}
            </div>

            {/* Row 5: Score Button */}
            <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-elevated)', textAlign: 'center' }}>
              <InlineScoreForm slug={artist.slug} artistName={artist.fullName} />
            </div>
          </div>
        ))}
      </div>

      {/* Full Screen PDF Modal */}
      <PdfModal
        isOpen={!!activePdf}
        onClose={() => setActivePdf(null)}
        title={activePdf?.title || 'PDF Document'}
        pdfUrl={activePdf?.url || ''}
      />
    </div>
  );
}

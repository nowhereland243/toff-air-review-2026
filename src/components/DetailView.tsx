'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MapPin,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  Calendar,
  Sparkles,
  Globe,
  Share2,
  Video,
  Maximize2
} from 'lucide-react';
import type { Applicant } from '@/lib/data';
import { InlineScoreForm } from './InlineScoreForm';
import { ArtworkLightbox } from './ArtworkLightbox';
import { PdfModal } from './PdfModal';

interface DetailViewProps {
  applicant: Applicant;
  prevSlug: string | null;
  nextSlug: string | null;
}

export function DetailView({ applicant, prevSlug, nextSlug }: DetailViewProps) {
  const router = useRouter();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Active PDF for Full Screen Modal
  const [activePdf, setActivePdf] = useState<{ title: string; url: string } | null>(null);

  const [cvExpanded, setCvExpanded] = useState(false);
  const [writingExpanded, setWritingExpanded] = useState(false);
  const [anythingElseExpanded, setAnythingElseExpanded] = useState(false);

  // Keyboard navigation for Prev / Next artist
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't navigate if user is inside lightbox or typing in an input
      if (lightboxOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowLeft' && prevSlug) {
        router.push(`/2026/artist/${prevSlug}`);
      } else if (e.key === 'ArrowRight' && nextSlug) {
        router.push(`/2026/artist/${nextSlug}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevSlug, nextSlug, lightboxOpen, router]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem 6rem 1.5rem' }}>
      {/* Top Breadcrumb & Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <button
          onClick={() => router.push('/2026')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            padding: '0.5rem 0.85rem',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-card)',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
          Back to all applicants
        </button>

        {/* Prev / Next Arrows */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {prevSlug ? (
            <Link
              href={`/2026/artist/${prevSlug}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
              }}
            >
              <ChevronLeft size={16} />
              Previous
            </Link>
          ) : (
            <span style={{ opacity: 0.4, padding: '0.5rem 0.85rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Previous
            </span>
          )}

          {nextSlug ? (
            <Link
              href={`/2026/artist/${nextSlug}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
              }}
            >
              Next
              <ChevronRight size={16} />
            </Link>
          ) : (
            <span style={{ opacity: 0.4, padding: '0.5rem 0.85rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Next
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'start' }}>
        {/* Left Column: Main Content */}
        <div>

      {/* Artist Header Band */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: '2rem',
        marginBottom: '2.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1.5rem',
      }}>
        <div>
          <div className="label-utility" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{applicant.medium || 'Visual Art'}</span>
            {(applicant.city || applicant.country) && (
              <>
                <span>·</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={12} />
                  {[applicant.city, applicant.country].filter(Boolean).join(', ')}
                </span>
              </>
            )}
            {applicant.isLA && (
              <span style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '10px' }}>
                LA Based
              </span>
            )}
          </div>

          <h1 className="font-display" style={{ fontSize: '2.5rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.15 }}>
            {applicant.fullName}
          </h1>
        </div>
      </div>

      {/* 1. Work Samples Gallery */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 600 }}>Work Samples</h2>
          {applicant.workSamples && applicant.workSamples.length > 0 && (
            <span className="label-utility">{applicant.workSamples.length} samples</span>
          )}
        </div>

        {applicant.workSamples && applicant.workSamples.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            {applicant.workSamples.map((sample, idx) => {
              const isImg = sample.isImage !== false && !sample.web.toLowerCase().endsWith('.pdf');

              if (isImg) {
                return (
                  <div
                    key={idx}
                    onClick={() => openLightbox(idx)}
                    style={{
                      backgroundColor: '#0D0C0A',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'transform 0.2s ease, border-color 0.2s ease',
                    }}
                  >
                    <img
                      src={sample.web}
                      alt={sample.name}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '240px',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    <div style={{
                      padding: '0.75rem 1rem',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      backgroundColor: 'var(--bg-card)',
                      borderTop: '1px solid var(--border-subtle)',
                    }}>
                      {sample.name}
                    </div>
                  </div>
                );
              } else {
                // PDF / Document Work Sample Card & Viewer
                return (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: '6px',
                      padding: '1.25rem',
                      border: '1px solid var(--border-strong)',
                      gridColumn: '1 / -1', // Full width for embedded PDF document viewer
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)' }}>
                        <FileText size={20} />
                        <span className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {sample.name}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                          onClick={() => setActivePdf({ title: sample.name, url: sample.original })}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.85rem',
                            color: '#FFF',
                            backgroundColor: 'var(--accent)',
                            border: 'none',
                            padding: '0.35rem 0.8rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <Maximize2 size={13} />
                          Full Screen
                        </button>
                        <a
                          href={sample.original}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.35rem 0.8rem',
                            backgroundColor: 'var(--bg-main)',
                            border: '1px solid var(--border-strong)',
                            borderRadius: '4px',
                            color: 'var(--text-secondary)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          <Download size={13} />
                          Download PDF
                        </a>
                      </div>
                    </div>

                    <iframe
                      src={`${sample.original}#toolbar=0&navpanes=0`}
                      title={sample.name}
                      style={{
                        width: '100%',
                        height: '600px',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        backgroundColor: '#FFF',
                      }}
                    />
                  </div>
                );
              }
            })}
          </div>
        ) : (
          <div style={{
            padding: '3rem 2rem',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '8px',
            border: '1px dashed var(--border-strong)',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}>
            <Sparkles size={24} style={{ margin: '0 auto 0.75rem auto' }} />
            <p className="font-display" style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>No work sample images provided</p>
          </div>
        )}

        {/* Artwork Descriptions */}
        {applicant.artworkDescriptions && (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '1.5rem',
            marginTop: '1.5rem',
          }}>
            <h3 className="label-utility" style={{ marginBottom: '0.75rem' }}>About the Works / Artwork Descriptions</h3>
            <p style={{ whiteSpace: 'pre-line', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              {applicant.artworkDescriptions}
            </p>
          </div>
        )}
      </section>

      {/* 2. Proposal ‖ Biography (2 columns on desktop) */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        marginBottom: '3rem',
      }}>
        {/* Proposal (Left Column, Wider emphasis) */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '2rem',
          flex: 2,
        }}>
          <h2 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            Residency Proposal
          </h2>
          <div style={{
            color: 'var(--text-primary)',
            fontSize: '1rem',
            lineHeight: 1.75,
            whiteSpace: 'pre-line',
          }}>
            {applicant.proposal || '(No proposal provided)'}
          </div>
        </div>

        {/* Biography (Right Column) */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '2rem',
          flex: 1,
        }}>
          <h2 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            Artist Biography
          </h2>
          <div style={{
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            lineHeight: 1.7,
            whiteSpace: 'pre-line',
          }}>
            {applicant.bio || '(No biography provided)'}
          </div>
        </div>
      </section>

      {/* 3. Logistics Band */}
      <section style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: '2rem',
        marginBottom: '3rem',
      }}>
        <h2 className="font-display" style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '1.25rem' }}>
          Logistics & Accommodation Preferences
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Requested Rooms & Terms */}
          <div>
            <span className="label-utility" style={{ display: 'block', marginBottom: '0.5rem' }}>Requested Room(s) & Term(s)</span>
            {applicant.roomRequests && applicant.roomRequests.length > 0 ? (
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {applicant.roomRequests.map((req, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-strong)',
                      padding: '0.5rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                    }}
                  >
                    <strong>{req.room}</strong>
                    {req.price && <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem' }}>({req.price})</span>}
                    {req.term && <span style={{ color: 'var(--accent)', marginLeft: '0.5rem' }}>— {req.term}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No specific canonical room selected.</p>
            )}
          </div>

          {/* Flexibility Note */}
          {applicant.flexibilityNote && (
            <div style={{
              backgroundColor: 'var(--bg-main)',
              borderLeft: '3px solid var(--accent)',
              padding: '1rem 1.25rem',
              borderRadius: '0 6px 6px 0',
            }}>
              <span className="label-utility" style={{ display: 'block', marginBottom: '0.35rem' }}>Flexibility & Date Notes</span>
              <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                "{applicant.flexibilityNote}"
              </p>
            </div>
          )}

          {/* Flags & Additional Detail */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div>
              <span className="label-utility" style={{ display: 'block' }}>Past Residency</span>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{applicant.pastResidency || 'None / Not specified'}</span>
            </div>

            <div>
              <span className="label-utility" style={{ display: 'block' }}>LA Based</span>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{applicant.isLA ? 'Yes' : 'No'}</span>
            </div>
          </div>

          {/* Plans for Archive */}
          {applicant.plansForArchive && (
            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
              <span className="label-utility" style={{ display: 'block', marginBottom: '0.35rem' }}>Plans for Archive</span>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {applicant.plansForArchive}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 4. Collapsed Expander Sections */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '3rem' }}>
        {/* Expander: View CV */}
        {applicant.cvFiles && applicant.cvFiles.length > 0 && (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <button
              onClick={() => setCvExpanded(!cvExpanded)}
              style={{
                width: '100%',
                padding: '1.25rem 1.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileText size={18} style={{ color: 'var(--accent)' }} />
                <span className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600 }}>Resume / CV</span>
              </div>
              {cvExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {cvExpanded && (
              <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                {applicant.cvFiles.map((cv, idx) => (
                  <div key={idx} style={{ marginTop: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{cv.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                          onClick={() => setActivePdf({ title: cv.name, url: cv.path })}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.85rem',
                            color: '#FFF',
                            backgroundColor: 'var(--accent)',
                            border: 'none',
                            padding: '0.35rem 0.8rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <Maximize2 size={13} />
                          Full Screen
                        </button>
                        <a
                          href={cv.path}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.85rem',
                            color: 'var(--text-secondary)',
                            padding: '0.35rem 0.8rem',
                            borderRadius: '4px',
                            border: '1px solid var(--border-strong)',
                            backgroundColor: 'var(--bg-main)',
                            textDecoration: 'none',
                          }}
                        >
                          <Download size={13} />
                          Download PDF
                        </a>
                      </div>
                    </div>
                    <iframe
                      src={cv.path}
                      title={cv.name}
                      style={{
                        width: '100%',
                        height: '600px',
                        border: '1px solid var(--border-strong)',
                        borderRadius: '6px',
                        backgroundColor: '#FFF',
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Expander: Writing Samples */}
        {applicant.writingSamples && (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <button
              onClick={() => setWritingExpanded(!writingExpanded)}
              style={{
                width: '100%',
                padding: '1.25rem 1.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileText size={18} style={{ color: 'var(--text-muted)' }} />
                <span className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600 }}>Writing Samples</span>
              </div>
              {writingExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {writingExpanded && (
              <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-subtle)', whiteSpace: 'pre-line', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {applicant.writingSamples}
              </div>
            )}
          </div>
        )}

        {/* Expander: Anything Else */}
        {applicant.anythingElse && (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <button
              onClick={() => setAnythingElseExpanded(!anythingElseExpanded)}
              style={{
                width: '100%',
                padding: '1.25rem 1.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileText size={18} style={{ color: 'var(--text-muted)' }} />
                <span className="font-display" style={{ fontSize: '1.15rem', fontWeight: 600 }}>Anything Else / Notes to Reviewers</span>
              </div>
              {anythingElseExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {anythingElseExpanded && (
              <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-subtle)', whiteSpace: 'pre-line', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {applicant.anythingElse}
              </div>
            )}
          </div>
        )}

        {/* External Links Buttons */}
        {(applicant.website || applicant.socialUrl || applicant.otherLinks || applicant.videoAudioUrls) && (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            <span className="label-utility">External Links:</span>
            {applicant.website && (
              <a
                href={applicant.website.startsWith('http') ? applicant.website : `https://${applicant.website}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  padding: '0.4rem 0.8rem',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '4px',
                  color: 'var(--text-secondary)',
                }}
              >
                <Globe size={14} />
                Website
                <ExternalLink size={12} />
              </a>
            )}

            {applicant.socialUrl && (
              <a
                href={applicant.socialUrl.startsWith('http') ? applicant.socialUrl : `https://${applicant.socialUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  padding: '0.4rem 0.8rem',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '4px',
                  color: 'var(--text-secondary)',
                }}
              >
                <Share2 size={14} />
                Social
                <ExternalLink size={12} />
              </a>
            )}

            {applicant.videoAudioUrls && (
              <a
                href={applicant.videoAudioUrls.startsWith('http') ? applicant.videoAudioUrls : `https://${applicant.videoAudioUrls}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  padding: '0.4rem 0.8rem',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '4px',
                  color: 'var(--text-secondary)',
                }}
              >
                <Video size={14} />
                Video/Audio
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}
      </section>
      </div>

      {/* Right Column: Sticky Review Panel */}
      <div style={{ position: 'sticky', top: '5.5rem' }}>
        <InlineScoreForm slug={applicant.slug} artistName={applicant.fullName} />
      </div>
    </div>

      {/* Lightbox Modal */}
      <ArtworkLightbox
        samples={applicant.workSamples || []}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

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

'use client';

import { useEffect } from 'react';
import { X, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Applicant } from '@/lib/data';
import { DetailView } from './DetailView';

interface ArtistDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: Applicant | null;
  prevSlug: string | null;
  nextSlug: string | null;
  onNavigate: (slug: string) => void;
}

export function ArtistDetailModal({
  isOpen,
  onClose,
  applicant,
  prevSlug,
  nextSlug,
  onNavigate,
}: ArtistDetailModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    // Prevent body scrolling behind overlay
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && prevSlug) {
        onNavigate(prevSlug);
      } else if (e.key === 'ArrowRight' && nextSlug) {
        onNavigate(nextSlug);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, prevSlug, nextSlug, onNavigate]);

  if (!isOpen || !applicant) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 9, 8, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 2500,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Top Sticky Bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 2600,
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0.85rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={onClose}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-strong)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
          Back to Grid <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(Esc)</span>
        </button>

        {/* Prev / Next Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => prevSlug && onNavigate(prevSlug)}
            disabled={!prevSlug}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.45rem 0.85rem',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: prevSlug ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '0.85rem',
              cursor: prevSlug ? 'pointer' : 'not-allowed',
              opacity: prevSlug ? 1 : 0.4,
            }}
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <button
            onClick={() => nextSlug && onNavigate(nextSlug)}
            disabled={!nextSlug}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.45rem 0.85rem',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: nextSlug ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '0.85rem',
              cursor: nextSlug ? 'pointer' : 'not-allowed',
              opacity: nextSlug ? 1 : 0.4,
            }}
          >
            Next
            <ChevronRight size={16} />
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '0.5rem',
            }}
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Main Detail View Content */}
      <div style={{ flex: 1, padding: '2rem 1rem 6rem 1rem' }}>
        <DetailView applicant={applicant} prevSlug={prevSlug} nextSlug={nextSlug} />
      </div>
    </div>
  );
}

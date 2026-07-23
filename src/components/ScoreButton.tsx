'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle } from 'lucide-react';
import { JudgeModal } from './JudgeModal';

interface ScoreButtonProps {
  slug: string;
  artistName: string;
  rawScoreUrl: string | null;
  sticky?: boolean;
}

export function ScoreButton({ slug, artistName, rawScoreUrl, sticky = false }: ScoreButtonProps) {
  const [isScored, setIsScored] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedScore = localStorage.getItem(`scored_${slug}`);
      if (storedScore === 'true') {
        setIsScored(true);
      }
    }
  }, [slug]);

  const openScoreForm = (judgeName: string) => {
    let finalUrl = rawScoreUrl || `https://tally.so/r/FORM_ID?artist=${encodeURIComponent(artistName)}`;
    if (judgeName) {
      finalUrl = finalUrl.replace('{{judgeName}}', encodeURIComponent(judgeName));
      if (!finalUrl.includes('judge=')) {
        finalUrl += `&judge=${encodeURIComponent(judgeName)}`;
      }
    } else {
      finalUrl = finalUrl.replace('{{judgeName}}', '');
    }

    // Mark as scored locally
    localStorage.setItem(`scored_${slug}`, 'true');
    setIsScored(true);
    window.dispatchEvent(new Event('toff_scored_change'));

    // Open score form in new tab
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  const handleClick = () => {
    const existingJudgeName = localStorage.getItem('judge_name');
    if (!existingJudgeName) {
      setShowModal(true);
    } else {
      openScoreForm(existingJudgeName);
    }
  };

  const handleModalSubmit = (name: string) => {
    localStorage.setItem('judge_name', name);
    setShowModal(false);
    openScoreForm(name);
  };

  return (
    <>
      <button
        onClick={handleClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.75rem 1.4rem',
          backgroundColor: isScored ? 'var(--bg-elevated)' : 'var(--accent)',
          border: isScored ? '1px solid var(--border-strong)' : 'none',
          color: isScored ? 'var(--text-secondary)' : '#FFF',
          borderRadius: '6px',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: sticky ? '0 4px 16px rgba(0, 0, 0, 0.4)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {isScored ? (
          <>
            <CheckCircle size={18} style={{ color: '#4CAF50' }} />
            Scored ✓ (Edit Score)
          </>
        ) : (
          <>
            <ExternalLink size={18} />
            Score this artist
          </>
        )}
      </button>

      <JudgeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleModalSubmit}
      />
    </>
  );
}

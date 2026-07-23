'use client';

import { useState, useEffect } from 'react';
import { X, Check, Download, UploadCloud, AlertCircle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { getAllScores, getPendingChangesCount, getCompositeScore, markAsSubmitted, ScoreRecord } from '@/lib/scoreManager';

interface ReviewDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToArtist?: (slug: string) => void;
}

type SortField = 'artist' | 'artisticMerit' | 'proposal' | 'mission' | 'readiness' | 'composite';
type SortOrder = 'asc' | 'desc';

export function ReviewDashboard({ isOpen, onClose, onNavigateToArtist }: ReviewDashboardProps) {
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortField, setSortField] = useState<SortField>('composite');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => {
      if (isOpen) loadData();
    };
    window.addEventListener('toff_score_updated', handleUpdate);
    return () => window.removeEventListener('toff_score_updated', handleUpdate);
  }, [isOpen]);

  const loadData = () => {
    setScores(getAllScores());
    setPendingCount(getPendingChangesCount());
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedScores = [...scores].sort((a, b) => {
    let valA: any = a[sortField as keyof ScoreRecord];
    let valB: any = b[sortField as keyof ScoreRecord];

    if (sortField === 'composite') {
      valA = getCompositeScore(a);
      valB = getCompositeScore(b);
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleBulkSubmit = async () => {
    if (scores.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const webhookUrl = process.env.NEXT_PUBLIC_SCORE_WEBHOOK_URL;
      const judgeName = localStorage.getItem('judge_name') || 'Unknown Judge';
      
      const payload = {
        judge: judgeName,
        records: scores
      };

      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'no-cors' // Google Apps Script often requires no-cors if not returning strict JSON headers
        });
      } else {
        console.warn('NEXT_PUBLIC_SCORE_WEBHOOK_URL is not defined in config. Data was not sent to a remote server.');
      }

      markAsSubmitted();
      loadData();
    } catch (error) {
      console.error('Error submitting scores:', error);
      alert('Failed to submit scores. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadCsv = () => {
    if (scores.length === 0) return;
    const headers = ['Artist', 'Slug', 'Artistic Merit', 'Proposal', 'Mission', 'Readiness', 'Composite', 'Comments', 'Last Updated'];
    const rows = scores.map(s => [
      `"${s.artist.replace(/"/g, '""')}"`,
      s.slug,
      s.artisticMerit,
      s.proposal,
      s.mission,
      s.readiness,
      getCompositeScore(s).toFixed(2),
      `"${s.comments.replace(/"/g, '""')}"`,
      new Date(s.updatedAt).toISOString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `toff_scores_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="radix-overlay" style={{ zIndex: 3000 }} />
        <Dialog.Content 
          className="radix-drawer-content"
          style={{
            width: '100%',
            maxWidth: '900px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 3001,
          }}
        >
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)' }}>
            <div>
              <Dialog.Title className="font-display" style={{ fontSize: '1.5rem', margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>My Scores</Dialog.Title>
              <Dialog.Description style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Review and submit your evaluations.</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </Dialog.Close>
          </div>

        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {pendingCount > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffb74d', fontSize: '0.9rem', fontWeight: 500 }}>
                <AlertCircle size={16} />
                {pendingCount} score{pendingCount !== 1 && 's'} changed since last submit
              </div>
            ) : scores.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4CAF50', fontSize: '0.9rem', fontWeight: 500 }}>
                <Check size={16} />
                All scores submitted ✓
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No scores recorded yet.</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleDownloadCsv}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-strong)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              <Download size={16} />
              CSV Backup
            </button>
            <button
              onClick={handleBulkSubmit}
              disabled={isSubmitting || scores.length === 0 || pendingCount === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1.5rem',
                backgroundColor: (scores.length > 0 && pendingCount > 0) ? 'var(--accent)' : 'var(--bg-card)',
                border: 'none',
                borderRadius: '6px',
                color: (scores.length > 0 && pendingCount > 0) ? '#FFF' : 'var(--text-muted)',
                fontWeight: 600,
                cursor: (scores.length > 0 && pendingCount > 0) ? 'pointer' : 'not-allowed',
                fontSize: '0.9rem',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              <UploadCloud size={16} />
              {isSubmitting ? 'Submitting...' : `Submit Scores (${scores.length})`}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {scores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
              Start scoring applicants to see them listed here.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-strong)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 0.5rem', cursor: 'pointer' }} onClick={() => handleSort('artist')}>Artist</th>
                  <th style={{ padding: '0.75rem 0.5rem', cursor: 'pointer' }} onClick={() => handleSort('artisticMerit')}>Artistic Merit</th>
                  <th style={{ padding: '0.75rem 0.5rem', cursor: 'pointer' }} onClick={() => handleSort('proposal')}>Proposal</th>
                  <th style={{ padding: '0.75rem 0.5rem', cursor: 'pointer' }} onClick={() => handleSort('mission')}>Mission</th>
                  <th style={{ padding: '0.75rem 0.5rem', cursor: 'pointer' }} onClick={() => handleSort('readiness')}>Readiness</th>
                  <th style={{ padding: '0.75rem 0.5rem', cursor: 'pointer' }} onClick={() => handleSort('composite')}>Composite</th>
                </tr>
              </thead>
              <tbody>
                {sortedScores.map(score => (
                  <tr key={score.slug} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s ease' }}>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <button 
                        onClick={() => {
                          onClose();
                          onNavigateToArtist && onNavigateToArtist(score.slug);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', textAlign: 'left', fontWeight: 600, padding: 0 }}
                      >
                        {score.artist}
                      </button>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>{score.artisticMerit || '-'}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>{score.proposal || '-'}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>{score.mission || '-'}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>{score.readiness || '-'}</td>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{getCompositeScore(score).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

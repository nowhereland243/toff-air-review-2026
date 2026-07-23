'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Columns3, HelpCircle, CheckCircle2, ClipboardList, AlertCircle, User, RefreshCw, Smartphone } from 'lucide-react';
import { ReviewDashboard } from './ReviewDashboard';
import { JudgeModal } from './JudgeModal';
import { getPendingChangesCount, getJudgeName, setJudgeName, syncScoresFromRemote } from '@/lib/scoreManager';

interface HeaderNavProps {
  totalApplicants: number;
}

export function HeaderNav({ totalApplicants }: HeaderNavProps) {
  const [scoredCount, setScoredCount] = useState(0);
  const [pinnedCount, setPinnedCount] = useState(0);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isJudgeModalOpen, setIsJudgeModalOpen] = useState(false);
  const [judgeName, setJudgeNameState] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const updateCounts = () => {
    if (typeof window === 'undefined') return;

    let scored = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('scored_') && localStorage.getItem(key) === 'true') {
        scored++;
      }
    }
    setScoredCount(scored);

    const pinnedRaw = localStorage.getItem('pinned_slugs');
    if (pinnedRaw) {
      try {
        const parsed = JSON.parse(pinnedRaw);
        setPinnedCount(Array.isArray(parsed) ? parsed.length : 0);
      } catch (e) {
        setPinnedCount(0);
      }
    } else {
      setPinnedCount(0);
    }

    setPendingChanges(getPendingChangesCount());
    setJudgeNameState(getJudgeName());
  };

  useEffect(() => {
    // Check URL for ?judge= or ?code=
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const judgeFromUrl = params.get('judge') || params.get('code');
      if (judgeFromUrl) {
        setJudgeName(judgeFromUrl);
      }
    }

    updateCounts();

    // Auto-sync from remote on load if judge is set
    const currentJudge = getJudgeName();
    if (currentJudge) {
      setIsSyncing(true);
      syncScoresFromRemote(currentJudge).finally(() => setIsSyncing(false));
    }

    window.addEventListener('toff_score_updated', updateCounts);
    window.addEventListener('toff_pinned_change', updateCounts);
    window.addEventListener('storage', updateCounts);

    return () => {
      window.removeEventListener('toff_score_updated', updateCounts);
      window.removeEventListener('toff_pinned_change', updateCounts);
      window.removeEventListener('storage', updateCounts);
    };
  }, []);

  return (
    <>
      {isMobile && (
        <div style={{
          backgroundColor: '#2A2016',
          borderBottom: '1px solid rgba(255, 183, 77, 0.4)',
          color: '#ffb74d',
          padding: '0.65rem 1rem',
          textAlign: 'center',
          fontSize: '0.825rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 101,
        }}>
          <Smartphone size={16} />
          <span>The experience is optimized for iPad, Mac, and PC.</span>
        </div>
      )}
      <header style={{
        backgroundColor: 'var(--bg-main)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: isMobile ? '38px' : 0,
        zIndex: 100,
        padding: '1rem 1.5rem',
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link href="/2026" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 className="font-display" style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Tom of Finland Foundation
              </h1>
              <span className="label-utility" style={{
                backgroundColor: 'var(--bg-elevated)',
                padding: '0.25rem 0.6rem',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
              }}>
                2026 Residency
              </span>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.85rem' }}>
            {/* Progress Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-card)',
              padding: '0.4rem 0.8rem',
              borderRadius: '20px',
              border: '1px solid var(--border-subtle)',
            }}>
              <CheckCircle2 size={15} style={{ color: scoredCount > 0 ? '#4CAF50' : 'var(--text-muted)' }} />
              <span>
                <strong>{scoredCount}</strong> of {totalApplicants} reviewed
              </span>
            </div>

            {/* My Scores Trigger */}
            <button
              onClick={() => setIsDashboardOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: pendingChanges > 0 ? '#ffb74d' : 'var(--text-primary)',
                fontWeight: 600,
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-card-hover)',
                border: pendingChanges > 0 ? '1px solid rgba(255, 183, 77, 0.5)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {pendingChanges > 0 ? <AlertCircle size={16} /> : <ClipboardList size={16} />}
              <span>My Scores</span>
              {pendingChanges > 0 && (
                <span style={{
                  backgroundColor: '#ffb74d',
                  color: '#1a1a1a',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '0.1rem 0.45rem',
                  borderRadius: '10px',
                }}>
                  {pendingChanges} pending
                </span>
              )}
            </button>

            {/* Judge Identity Badge */}
            <button
              onClick={() => setIsJudgeModalOpen(true)}
              title="Click to change Judge Name / Code"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: judgeName ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: 600,
                padding: '0.4rem 0.8rem',
                borderRadius: '20px',
                backgroundColor: 'var(--bg-card)',
                border: judgeName ? '1px solid var(--accent-muted)' : '1px dashed var(--border-strong)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <User size={15} />
              <span>{judgeName ? `Judge: ${judgeName}` : 'Set Judge ID'}</span>
              {isSyncing && <RefreshCw size={12} className="spin" style={{ marginLeft: '0.2rem' }} />}
            </button>

            {/* Compare Link */}
            <Link
              href="/2026/compare"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: pathname === '/2026/compare' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === '/2026/compare' ? 600 : 400,
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                backgroundColor: pathname === '/2026/compare' ? 'var(--bg-card-hover)' : 'transparent',
                transition: 'background-color 0.2s',
              }}
            >
              <Columns3 size={16} />
              <span>Compare</span>
              {pinnedCount > 0 && (
                <span style={{
                  backgroundColor: 'var(--accent)',
                  color: '#FFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '0.1rem 0.45rem',
                  borderRadius: '10px',
                }}>
                  {pinnedCount}
                </span>
              )}
            </Link>

            {/* Judge Guide Link */}
            <Link
              href="/2026/how-to-review"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: pathname === '/2026/how-to-review' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pathname === '/2026/how-to-review' ? 600 : 400,
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                backgroundColor: pathname === '/2026/how-to-review' ? 'var(--bg-card-hover)' : 'transparent',
              }}
            >
              <HelpCircle size={16} />
              <span>Judge Guide</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Review Dashboard Drawer */}
      <ReviewDashboard
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        onNavigateToArtist={(slug) => {
          setIsDashboardOpen(false);
          if (pathname === '/2026') {
            window.dispatchEvent(new CustomEvent('toff_open_artist_modal', { detail: { slug } }));
          } else {
            window.location.href = `/2026?artist=${slug}`;
          }
        }}
      />
    </>
  );
}

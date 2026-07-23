'use client';

import { useState, useEffect } from 'react';
import { Star, CheckCircle, RefreshCw } from 'lucide-react';
import { getScore, saveScore, ScoreRecord } from '@/lib/scoreManager';
import { JudgeModal } from './JudgeModal';

interface InlineScoreFormProps {
  slug: string;
  artistName: string;
}

function StarRating({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) {
  const [hoverVal, setHoverVal] = useState(0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: '0.25rem' }} onMouseLeave={() => setHoverVal(0)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const active = hoverVal ? star <= hoverVal : star <= value;
          return (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverVal(star)}
              onClick={() => onChange(star)}
              style={{
                background: 'none',
                border: 'none',
                padding: '0',
                cursor: 'pointer',
                color: active ? 'var(--accent)' : 'var(--border-strong)',
                transition: 'color 0.1s ease',
              }}
            >
              <Star size={20} fill={active ? 'currentColor' : 'none'} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function InlineScoreForm({ slug, artistName }: InlineScoreFormProps) {
  const [record, setRecord] = useState<Partial<ScoreRecord>>({
    artisticMerit: 0,
    proposal: 0,
    mission: 0,
    readiness: 0,
    comments: '',
  });
  
  const [showJudgeModal, setShowJudgeModal] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    const loadScore = () => {
      const existing = getScore(slug);
      if (existing) {
        setRecord(existing);
      }
    };
    loadScore();

    const handleAutoSaveStatus = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.status) {
        setAutoSaveStatus(customEvent.detail.status);
      }
    };

    window.addEventListener('toff_score_updated', loadScore);
    window.addEventListener('toff_autosave_status', handleAutoSaveStatus);
    return () => {
      window.removeEventListener('toff_score_updated', loadScore);
      window.removeEventListener('toff_autosave_status', handleAutoSaveStatus);
    };
  }, [slug]);

  const handleUpdate = (field: keyof ScoreRecord, value: any) => {
    const judgeName = localStorage.getItem('judge_name');
    if (!judgeName) {
      setShowJudgeModal(true);
      return;
    }

    const updated = { ...record, [field]: value };
    setRecord(updated);
    saveScore(slug, artistName, updated);
  };

  const handleJudgeSubmit = (name: string) => {
    localStorage.setItem('judge_name', name);
    setShowJudgeModal(false);
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-elevated)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '8px',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="font-display" style={{ fontSize: '1.1rem', margin: 0 }}>Review Panel</h3>
        {autoSaveStatus === 'saving' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600 }}>
            <RefreshCw size={12} className="spin" />
            Auto-saving...
          </div>
        )}
        {autoSaveStatus === 'saved' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#4CAF50', fontSize: '0.8rem', fontWeight: 600 }}>
            <CheckCircle size={14} />
            Auto-saved to Sheet
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
        <StarRating 
          label="Artistic Merit" 
          value={record.artisticMerit || 0} 
          onChange={(v) => handleUpdate('artisticMerit', v)} 
        />
        <StarRating 
          label="Strength of Proposal" 
          value={record.proposal || 0} 
          onChange={(v) => handleUpdate('proposal', v)} 
        />
        <StarRating 
          label="Resonance w/ Mission" 
          value={record.mission || 0} 
          onChange={(v) => handleUpdate('mission', v)} 
        />
        <StarRating 
          label="Readiness" 
          value={record.readiness || 0} 
          onChange={(v) => handleUpdate('readiness', v)} 
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Comments (Optional)
        </label>
        <textarea
          value={record.comments || ''}
          onChange={(e) => setRecord({ ...record, comments: e.target.value })}
          onBlur={(e) => handleUpdate('comments', e.target.value)}
          placeholder="Add your thoughts here..."
          rows={3}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-strong)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <JudgeModal
        isOpen={showJudgeModal}
        onClose={() => setShowJudgeModal(false)}
        onSubmit={handleJudgeSubmit}
      />
    </div>
  );
}

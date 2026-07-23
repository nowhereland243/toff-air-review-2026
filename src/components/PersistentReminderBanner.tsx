'use client';

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { getPendingChangesCount } from '@/lib/scoreManager';

export function PersistentReminderBanner() {
  const [pendingChanges, setPendingChanges] = useState(0);

  const updateCounts = () => {
    setPendingChanges(getPendingChangesCount());
  };

  useEffect(() => {
    updateCounts();
    window.addEventListener('toff_score_updated', updateCounts);
    return () => window.removeEventListener('toff_score_updated', updateCounts);
  }, []);

  if (pendingChanges === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      backgroundColor: '#ffb74d',
      color: '#1a1a1a',
      padding: '0.75rem 1.25rem',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      fontWeight: 600,
      fontSize: '0.9rem',
      pointerEvents: 'none',
      animation: 'slideUp 0.3s ease',
    }}>
      <AlertCircle size={20} />
      You have {pendingChanges} pending score{pendingChanges !== 1 && 's'} to submit. Open "My Scores" in the header to sync.
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />
    </div>
  );
}

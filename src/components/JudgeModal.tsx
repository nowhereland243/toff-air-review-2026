'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { User, Check, X } from 'lucide-react';
import { getJudgeName } from '@/lib/scoreManager';

interface JudgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

const PRESET_JUDGES = ['Judge 1', 'Judge 2', 'Judge 3', 'Judge 4', 'Judge 5'];

export function JudgeModal({ isOpen, onClose, onSubmit }: JudgeModalProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(getJudgeName());
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
  };

  const handleSelectPreset = (preset: string) => {
    setName(preset);
    onSubmit(preset);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content 
          className="dialog-content"
          style={{
            maxWidth: '460px',
            width: '90vw',
            padding: '2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}>
                <User size={20} />
              </div>
              <div>
                <Dialog.Title className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                  Judge Identity / ID
                </Dialog.Title>
                <Dialog.Description className="label-utility" style={{ fontSize: '10px', margin: 0 }}>
                  Syncs scores across devices
                </Dialog.Description>
              </div>
            </div>

            <Dialog.Close asChild>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Select or enter your reviewer name or ID. All scores submitted on this device will be linked to your identity.
          </p>

          {/* Quick Presets */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="label-utility" style={{ display: 'block', fontSize: '11px', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
              Quick Presets:
            </label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {PRESET_JUDGES.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    backgroundColor: name === preset ? 'var(--accent-muted)' : 'var(--bg-main)',
                    border: name === preset ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                    color: name === preset ? 'var(--accent)' : 'var(--text-secondary)',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: name === preset ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="label-utility" style={{ display: 'block', fontSize: '11px', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
              Or type custom Name / Code:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah, Alex, or 1001"
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-strong)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                marginBottom: '1.5rem',
                outline: 'none',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '0.65rem 1.25rem',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '6px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '0.65rem 1.5rem',
                  backgroundColor: 'var(--accent)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#FFF',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Check size={16} />
                Save & Sync
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

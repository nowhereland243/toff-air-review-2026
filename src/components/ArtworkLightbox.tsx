'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Maximize2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import type { WorkSample } from '@/lib/data';

interface ArtworkLightboxProps {
  samples: WorkSample[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ArtworkLightbox({ samples, initialIndex, isOpen, onClose }: ArtworkLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % samples.length);
  }, [samples.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + samples.length) % samples.length);
  }, [samples.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  if (!samples || samples.length === 0) return null;

  const currentSample = samples[currentIndex];

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="radix-overlay" style={{ zIndex: 2000 }} />
        <Dialog.Content 
          className="radix-dialog-content"
          style={{
            width: '100vw',
            height: '100vh',
            maxWidth: 'none',
            border: 'none',
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: 'transparent',
            boxShadow: 'none',
            zIndex: 2001,
          }}
        >
          <Dialog.Title className="sr-only">Artwork Lightbox</Dialog.Title>
          <Dialog.Description className="sr-only">View full size artwork</Dialog.Description>
      {/* Lightbox Header Bar */}
      <div style={{
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#EDE8E0',
      }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Work Sample {currentIndex + 1} of {samples.length} — <strong>{currentSample.name}</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a
            href={currentSample.original}
            download
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              padding: '0.4rem 0.8rem',
              borderRadius: '4px',
              border: '1px solid var(--border-strong)',
            }}
          >
            <Download size={15} />
            Original File
          </a>

          <Dialog.Close asChild>
            <button
              style={{
                background: 'none',
                border: 'none',
                color: '#FFF',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X size={24} />
            </button>
          </Dialog.Close>
        </div>
      </div>

      {/* Lightbox Image Area */}
      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        overflow: 'hidden',
      }}>
        {samples.length > 1 && (
          <button
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: '1.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(30, 28, 25, 0.8)',
              border: '1px solid var(--border-strong)',
              color: '#FFF',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {currentSample.isImage !== false && !currentSample.web.toLowerCase().endsWith('.pdf') ? (
          <img
            src={currentSample.original || currentSample.web}
            alt={currentSample.name}
            style={{
              maxWidth: '100%',
              maxHeight: 'calc(100vh - 160px)',
              objectFit: 'contain',
              borderRadius: '4px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
            }}
          />
        ) : (
          <iframe
            src={currentSample.original}
            title={currentSample.name}
            style={{
              width: '90%',
              height: 'calc(100vh - 180px)',
              border: '1px solid var(--border-strong)',
              borderRadius: '6px',
              backgroundColor: '#FFF',
            }}
          />
        )}

        {samples.length > 1 && (
          <button
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: '1.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(30, 28, 25, 0.8)',
              border: '1px solid var(--border-strong)',
              color: '#FFF',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>

      {/* Lightbox Footer Caption */}
      <div style={{
        padding: '1rem 1.5rem',
        textAlign: 'center',
        backgroundColor: 'rgba(15, 14, 12, 0.9)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        fontSize: '0.9rem',
        color: 'var(--text-secondary)',
      }}>
        {currentSample.name}
      </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

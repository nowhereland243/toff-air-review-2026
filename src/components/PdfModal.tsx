'use client';

import { X, Download, FileText } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface PdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl: string;
}

export function PdfModal({ isOpen, onClose, title, pdfUrl }: PdfModalProps) {
  if (!pdfUrl) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="radix-overlay" />
        <Dialog.Content 
          className="radix-dialog-content"
          style={{
            width: '95vw',
            height: '95vh',
            maxWidth: '1200px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header Bar */}
          <div style={{
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}>
                <FileText size={18} />
              </div>
              <div>
                <Dialog.Title className="font-display" style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>
                  {title}
                </Dialog.Title>
                <Dialog.Description className="label-utility" style={{ fontSize: '10px', margin: 0 }}>
                  Full Screen Document Inspection
                </Dialog.Description>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <a
                href={pdfUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--bg-main)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <Download size={15} />
                Download PDF
              </a>

              <Dialog.Close asChild>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* PDF Viewer */}
          <div style={{ flex: 1, backgroundColor: '#323639', width: '100%', position: 'relative' }}>
            <iframe
              src={pdfUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
              title={title}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

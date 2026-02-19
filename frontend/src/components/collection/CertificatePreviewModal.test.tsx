import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CertificatePreviewModal from './CertificatePreviewModal';

vi.mock('@/components/common/Button', () => ({
  Button: ({
    children,
    onClick,
    'aria-label': ariaLabel,
  }: {
    children: ReactNode;
    onClick: () => void;
    'aria-label'?: string;
  }) => (
    <button type="button" onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));

describe('CertificatePreviewModal', () => {
  it('returns null when open is false', () => {
    const { container } = render(
      <CertificatePreviewModal
        open={false}
        onClose={vi.fn()}
        previewUrl="https://example.com/cert.png"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders dialog when open is true', () => {
    render(
      <CertificatePreviewModal
        open={true}
        onClose={vi.fn()}
        previewUrl="https://example.com/cert.png"
      />
    );
    expect(screen.getByRole('dialog', { name: 'Certificate preview' })).toBeInTheDocument();
    expect(screen.getByText('Certificate Preview')).toBeInTheDocument();
    expect(screen.getByAltText('Certificate preview')).toHaveAttribute('src', 'https://example.com/cert.png');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <CertificatePreviewModal
        open={true}
        onClose={onClose}
        previewUrl="https://example.com/cert.png"
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay (dialog) is clicked', () => {
    const onClose = vi.fn();
    render(
      <CertificatePreviewModal
        open={true}
        onClose={onClose}
        previewUrl="https://example.com/cert.png"
      />
    );
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when inner content is clicked', () => {
    const onClose = vi.fn();
    render(
      <CertificatePreviewModal
        open={true}
        onClose={onClose}
        previewUrl="https://example.com/cert.png"
      />
    );
    fireEvent.click(screen.getByText('Certificate Preview'));
    expect(onClose).not.toHaveBeenCalled();
  });
});

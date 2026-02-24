import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CertificatePreviewModal, { replacePlaceholders } from './CertificatePreviewModal';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

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

describe('replacePlaceholders', () => {
  it('replaces credentialSubject.recipientName', () => {
    const text = 'Hello {{credentialSubject.recipientName}}!';
    expect(replacePlaceholders(text, 'Jane Doe')).toBe('Hello Jane Doe!');
  });

  it('handles placeholders with optional spaces', () => {
    const text = 'Name: {{ credentialSubject.recipientName }}';
    expect(replacePlaceholders(text, 'Bob')).toBe('Name: Bob');
  });

  it('leaves other template placeholders unchanged', () => {
    const text = '{{credentialSubject.recipientName}} and {{credentialSubject.trainingName}}';
    const out = replacePlaceholders(text, 'Alice');
    expect(out).toBe('Alice and {{credentialSubject.trainingName}}');
  });

  it('escapes recipientName for SVG to prevent XSS', () => {
    const text = 'Hello {{credentialSubject.recipientName}}!';
    expect(replacePlaceholders(text, '<script>alert(1)</script>')).toBe(
      'Hello &lt;script&gt;alert(1)&lt;/script&gt;!'
    );
    expect(replacePlaceholders(text, 'O\'Reilly & Co.')).toBe('Hello O&#39;Reilly &amp; Co.!');
  });
});

describe('CertificatePreviewModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    previewUrl: 'https://example.com/cert.png',
  };

  it('returns null when open is false', () => {
    const { container } = render(
      <CertificatePreviewModal open={false} onClose={vi.fn()} previewUrl="https://example.com/cert.png" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders dialog when open is true', () => {
    render(<CertificatePreviewModal {...defaultProps} />);
    expect(screen.getByRole('dialog', { name: 'courseDetails.previewCertificate' })).toBeInTheDocument();
    expect(screen.getByText('courseDetails.previewCertificate')).toBeInTheDocument();
    expect(screen.getByAltText('courseDetails.previewCertificate')).toHaveAttribute('src', 'https://example.com/cert.png');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<CertificatePreviewModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay (dialog) is clicked', () => {
    const onClose = vi.fn();
    render(<CertificatePreviewModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when inner content is clicked', () => {
    const onClose = vi.fn();
    render(<CertificatePreviewModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('courseDetails.previewCertificate'));
    expect(onClose).not.toHaveBeenCalled();
  });

  describe('with details and fetch', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('shows img with blob URL when fetch returns SVG with recipientName replaced', async () => {
      const svgBody =
        '<svg xmlns="http://www.w3.org/2000/svg"><text>{{credentialSubject.recipientName}}</text></svg>';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          headers: { get: (name: string) => (name === 'Content-Type' ? 'image/svg+xml' : null) },
          text: () => Promise.resolve(svgBody),
        })
      );

      render(
        <CertificatePreviewModal
          {...defaultProps}
          previewUrl="https://example.com/template.svg"
          details={{ recipientName: 'Jane' }}
        />
      );

      await waitFor(
        () => {
          const img = screen.getByAltText('courseDetails.previewCertificate');
          expect(img).toBeInTheDocument();
          expect(img.getAttribute('src')).toMatch(/^blob:/);
        },
        { timeout: 2000 }
      );
    });

    it('keeps original previewUrl in img when fetch returns text without placeholders', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('<p>No placeholders here</p>') })
      );

      render(
        <CertificatePreviewModal
          {...defaultProps}
          previewUrl="https://example.com/plain.html"
          details={{ recipientName: 'Jane' }}
        />
      );

      await waitFor(() => {
        const img = screen.getByAltText('courseDetails.previewCertificate');
        expect(img.getAttribute('src')).toBe('https://example.com/plain.html');
      });
    });

    it('keeps original previewUrl in img when fetch fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

      render(
        <CertificatePreviewModal
          {...defaultProps}
          previewUrl="https://example.com/cert.png"
          details={{ recipientName: 'Jane' }}
        />
      );

      await waitFor(() => {
        const img = screen.getByAltText('courseDetails.previewCertificate');
        expect(img.getAttribute('src')).toBe('https://example.com/cert.png');
      });
    });

    it('keeps original previewUrl when fetch returns non-ok response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

      render(
        <CertificatePreviewModal
          {...defaultProps}
          previewUrl="https://example.com/cert.png"
          details={{}}
        />
      );

      await waitFor(() => {
        const img = screen.getByAltText('courseDetails.previewCertificate');
        expect(img.getAttribute('src')).toBe('https://example.com/cert.png');
      });
    });
  });
});

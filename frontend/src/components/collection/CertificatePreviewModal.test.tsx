import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CertificatePreviewModal, {
  formatIssuanceDateLong,
  replacePlaceholders,
} from './CertificatePreviewModal';

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

describe('formatIssuanceDateLong', () => {
  it('formats date as DD MMMM YYYY', () => {
    expect(formatIssuanceDateLong(new Date(2025, 1, 18))).toBe('18 February 2025');
  });

  it('pads single-digit day with zero', () => {
    expect(formatIssuanceDateLong(new Date(2025, 0, 5))).toBe('05 January 2025');
  });

  it('uses full month names', () => {
    expect(formatIssuanceDateLong(new Date(2024, 11, 31))).toBe('31 December 2024');
  });
});

describe('replacePlaceholders', () => {
  it('replaces credentialSubject.recipientName', () => {
    const text = 'Hello {{credentialSubject.recipientName}}!';
    expect(replacePlaceholders(text, 'Jane Doe', '', '')).toBe('Hello Jane Doe!');
  });

  it('replaces credentialSubject.trainingName', () => {
    const text = 'Course: {{credentialSubject.trainingName}}';
    expect(replacePlaceholders(text, '', 'Math 101', '')).toBe('Course: Math 101');
  });

  it('replaces dateFormat issuanceDate with double quotes', () => {
    const text = 'Date: {{dateFormat issuanceDate "DD MMMM YYYY"}}';
    expect(replacePlaceholders(text, '', '', '18 February 2025')).toBe('Date: 18 February 2025');
  });

  it('replaces dateFormat issuanceDate with single quotes', () => {
    const text = "Date: {{dateFormat issuanceDate 'DD MMMM YYYY'}}";
    expect(replacePlaceholders(text, '', '', '01 January 2025')).toBe('Date: 01 January 2025');
  });

  it('replaces dateFormat(issuanceDate, "format") parenthesized form', () => {
    const text = 'Issued on {{dateFormat(issuanceDate, "DD MMMM YYYY")}}';
    expect(replacePlaceholders(text, '', '', '25 December 2024')).toBe('Issued on 25 December 2024');
  });

  it('replaces all three placeholders in one string', () => {
    const text =
      '{{credentialSubject.recipientName}} completed {{credentialSubject.trainingName}} on {{dateFormat issuanceDate "DD MMMM YYYY"}}';
    const out = replacePlaceholders(text, 'Alice', 'Science', '10 March 2025');
    expect(out).toBe('Alice completed Science on 10 March 2025');
    expect(out).not.toContain('{{');
  });

  it('handles placeholders with optional spaces', () => {
    const text = 'Name: {{ credentialSubject.recipientName }}';
    expect(replacePlaceholders(text, 'Bob', '', '')).toBe('Name: Bob');
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

    it('shows iframe with replaced placeholders when fetch returns HTML', async () => {
      const htmlBody =
        '<html><body>Name: {{credentialSubject.recipientName}}, Course: {{credentialSubject.trainingName}}, Date: {{dateFormat issuanceDate "DD MMMM YYYY"}}</body></html>';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(htmlBody) })
      );

      render(
        <CertificatePreviewModal
          {...defaultProps}
          previewUrl="https://example.com/template.html"
          details={{
            recipientName: 'Jane',
            trainingName: 'Math',
            issuanceDate: '18 February 2025',
          }}
        />
      );

      await waitFor(() => {
        const iframe = screen.getByTitle('courseDetails.previewCertificate');
        expect(iframe).toBeInTheDocument();
        const srcdoc = iframe.getAttribute('srcdoc') ?? '';
        expect(srcdoc).toContain('Jane');
        expect(srcdoc).toContain('Math');
        expect(srcdoc).toContain('18 February 2025');
        expect(srcdoc).not.toContain('{{credentialSubject');
        expect(srcdoc).not.toContain('{{dateFormat');
      });
    });

    it('shows img with blob URL when fetch returns SVG with placeholders', async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><text>{{credentialSubject.recipientName}}</text><text>{{dateFormat issuanceDate "DD MMMM YYYY"}}</text></svg>';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(svg) })
      );

      render(
        <CertificatePreviewModal
          {...defaultProps}
          previewUrl="https://example.com/template.svg"
          details={{ recipientName: 'Alice', issuanceDate: '01 January 2025' }}
        />
      );

      await waitFor(() => {
        const img = screen.getByAltText('courseDetails.previewCertificate');
        expect(img).toBeInTheDocument();
        const src = img.getAttribute('src') ?? '';
        expect(src).toMatch(/^blob:/);
      });
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
          details={{ recipientName: 'Jane', issuanceDate: '18 February 2025' }}
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
          details={{ recipientName: 'Jane', trainingName: 'Math', issuanceDate: '18 February 2025' }}
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
          details={{ issuanceDate: '18 February 2025' }}
        />
      );

      await waitFor(() => {
        const img = screen.getByAltText('courseDetails.previewCertificate');
        expect(img.getAttribute('src')).toBe('https://example.com/cert.png');
      });
    });
  });
});

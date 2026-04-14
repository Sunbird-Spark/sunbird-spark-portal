import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CertificateCard from './CertificateCard';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('CertificateCard', () => {
  it('renders certificate card with test id', () => {
    render(<CertificateCard hasCertificate={false} />);
    expect(screen.getByTestId('certificate-card')).toBeInTheDocument();
  });

  it('when hasCertificate is false, shows certificate not available message', () => {
    render(<CertificateCard hasCertificate={false} />);
    expect(screen.getByText('courseDetails.certificate')).toBeInTheDocument();
    expect(screen.getByText('courseDetails.certificateNotAvailable')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'courseDetails.previewCertificate' })).not.toBeInTheDocument();
  });

  it('when hasCertificate is true, shows earn description and preview button', () => {
    render(<CertificateCard hasCertificate={true} previewUrl="https://example.com/cert.pdf" />);
    expect(screen.getByText('courseDetails.certificate')).toBeInTheDocument();
    expect(screen.getByText('courseDetails.certificateEarnDescription')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'courseDetails.previewCertificate' })).toBeInTheDocument();
  });

  it('calls onPreviewClick when preview button is clicked and previewUrl and onPreviewClick are set', () => {
    const onPreviewClick = vi.fn();
    render(
      <CertificateCard
        hasCertificate={true}
        previewUrl="https://example.com/cert.pdf"
        onPreviewClick={onPreviewClick}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'courseDetails.previewCertificate' }));
    expect(onPreviewClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onPreviewClick when previewUrl is missing', () => {
    const onPreviewClick = vi.fn();
    render(
      <CertificateCard hasCertificate={true} onPreviewClick={onPreviewClick} />
    );
    const button = screen.getByRole('button', { name: 'courseDetails.previewCertificate' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onPreviewClick).not.toHaveBeenCalled();
  });

  it('preview button is disabled when previewUrl is not provided', () => {
    render(<CertificateCard hasCertificate={true} />);
    expect(screen.getByRole('button', { name: 'courseDetails.previewCertificate' })).toBeDisabled();
  });
});

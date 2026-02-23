import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CurrentCertificatePanel } from './CurrentCertificatePanel';

describe('CurrentCertificatePanel', () => {
  it('renders the "Attached Certificate Templates" heading', () => {
    render(<CurrentCertificatePanel existingCertTemplates={{}} />);
    expect(screen.getByText('Attached Certificate Templates')).toBeInTheDocument();
  });

  it('renders the replace guidance text', () => {
    render(<CurrentCertificatePanel existingCertTemplates={{}} />);
    expect(screen.getByText(/To replace this certificate/i)).toBeInTheDocument();
  });

  it('renders certificate entry with name and preview image when artifactUrl is set', () => {
    const templates = {
      'tmpl-1': { name: 'Certificate of Achievement', artifactUrl: 'https://example.com/cert.png' },
    };
    render(<CurrentCertificatePanel existingCertTemplates={templates} />);
    expect(screen.getByText('Certificate of Achievement')).toBeInTheDocument();
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/cert.png');
    expect(img).toHaveAttribute('alt', 'Certificate of Achievement');
  });

  it('renders template identifier as subtitle', () => {
    const templates = {
      'tmpl-abc-123': { name: 'My Cert' },
    };
    render(<CurrentCertificatePanel existingCertTemplates={templates} />);
    expect(screen.getByText('tmpl-abc-123')).toBeInTheDocument();
  });

  it('shows "No preview available" when no previewUrl or artifactUrl', () => {
    const templates = {
      'tmpl-1': { name: 'My Template' },
    };
    render(<CurrentCertificatePanel existingCertTemplates={templates} />);
    expect(screen.getByText('No preview available')).toBeInTheDocument();
  });

  it('uses previewUrl when artifactUrl is absent', () => {
    const templates = {
      'tmpl-2': { name: 'Preview Only', previewUrl: 'https://example.com/preview.png' },
    };
    render(<CurrentCertificatePanel existingCertTemplates={templates} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/preview.png');
  });

  it('falls back to identifier as name when name is missing', () => {
    const templates = {
      'tmpl-no-name': {},
    };
    render(<CurrentCertificatePanel existingCertTemplates={templates} />);
    expect(screen.getAllByText('tmpl-no-name').length).toBeGreaterThanOrEqual(1);
  });

  it('renders multiple certificate entries', () => {
    const templates = {
      'tmpl-1': { name: 'Cert One', artifactUrl: 'https://example.com/1.png' },
      'tmpl-2': { name: 'Cert Two', artifactUrl: 'https://example.com/2.png' },
    };
    render(<CurrentCertificatePanel existingCertTemplates={templates} />);
    expect(screen.getByText('Cert One')).toBeInTheDocument();
    expect(screen.getByText('Cert Two')).toBeInTheDocument();
  });
});

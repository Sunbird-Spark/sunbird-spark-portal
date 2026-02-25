import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrentCertificatePanel } from './CurrentCertificatePanel';

describe('CurrentCertificatePanel', () => {
  it('renders the "Attached Certificate Template" heading', () => {
    render(<CurrentCertificatePanel setCertTab={vi.fn()} existingCertTemplates={{}} />);
    expect(screen.queryByText('Attached Certificate Template')).not.toBeInTheDocument();
  });

  it('renders the replace guidance text', () => {
    const templates = { 'tmpl-1': { name: 'Cert' } };
    render(<CurrentCertificatePanel setCertTab={vi.fn()} existingCertTemplates={templates} />);
    expect(screen.getByText(/This is the active certificate template/i)).toBeInTheDocument();
  });

  it('renders certificate entry with name and preview image when artifactUrl is set', () => {
    const templates = {
      'tmpl-1': { name: 'Certificate of Achievement', artifactUrl: 'https://example.com/cert.png' },
    };
    render(<CurrentCertificatePanel setCertTab={vi.fn()} existingCertTemplates={templates} />);
    expect(screen.getByText('Certificate of Achievement')).toBeInTheDocument();
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/cert.png');
    expect(img).toHaveAttribute('alt', 'Certificate of Achievement');
  });

  it('renders template identifier as subtitle', () => {
    const templates = {
      'tmpl-abc-123': { name: 'My Cert' },
    };
    render(<CurrentCertificatePanel setCertTab={vi.fn()} existingCertTemplates={templates} />);
    expect(screen.getByText('tmpl-abc-123')).toBeInTheDocument();
  });

  it('shows "No preview available" when no previewUrl or artifactUrl', () => {
    const templates = {
      'tmpl-1': { name: 'My Template' },
    };
    render(<CurrentCertificatePanel setCertTab={vi.fn()} existingCertTemplates={templates} />);
    expect(screen.getByText('No preview available')).toBeInTheDocument();
  });

  it('uses previewUrl when artifactUrl is absent', () => {
    const templates = {
      'tmpl-2': { name: 'Preview Only', previewUrl: 'https://example.com/preview.png' },
    };
    render(<CurrentCertificatePanel setCertTab={vi.fn()} existingCertTemplates={templates} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/preview.png');
  });

  it('falls back to identifier as name when name is missing', () => {
    const templates = {
      'tmpl-no-name': {},
    };
    render(<CurrentCertificatePanel setCertTab={vi.fn()} existingCertTemplates={templates} />);
    expect(screen.getAllByText('tmpl-no-name').length).toBeGreaterThanOrEqual(1);
  });

  it('renders only the latest certificate entry', () => {
    const templates = {
      'tmpl-1': { name: 'Cert One', artifactUrl: 'https://example.com/1.png' },
      'tmpl-2': { name: 'Cert Two', artifactUrl: 'https://example.com/2.png' },
    };
    render(<CurrentCertificatePanel setCertTab={vi.fn()} existingCertTemplates={templates} />);
    expect(screen.queryByText('Cert One')).not.toBeInTheDocument();
    expect(screen.getByText('Cert Two')).toBeInTheDocument();
  });

  it('calls setCertTab with "change" when Edit Certificate button is clicked', () => {
    const setCertTab = vi.fn();
    const templates = { 'tmpl-1': { name: 'Cert One' } };
    render(<CurrentCertificatePanel setCertTab={setCertTab} existingCertTemplates={templates} />);
    const editBtn = screen.getByRole('button', { name: /Edit Certificate/i });
    fireEvent.click(editBtn);
    expect(setCertTab).toHaveBeenCalledWith('change');
  });
});

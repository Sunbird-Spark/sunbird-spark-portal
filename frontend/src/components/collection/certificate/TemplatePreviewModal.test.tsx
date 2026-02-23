import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplatePreviewModal } from './TemplatePreviewModal';

const mockTemplates = [
  { identifier: 'tmpl-1', name: 'Template One', previewUrl: 'https://example.com/t1.png' },
  { identifier: 'tmpl-2', name: 'Template Two' },
];

const defaultProps = {
  previewTemplate: null,
  setPreviewTemplate: vi.fn(),
  certTemplates: mockTemplates,
  setSelectedTemplateId: vi.fn(),
};

describe('TemplatePreviewModal', () => {
  it('returns null when previewTemplate is null', () => {
    const { container } = render(<TemplatePreviewModal {...defaultProps} previewTemplate={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when previewTemplate identifier does not match any template', () => {
    const { container } = render(
      <TemplatePreviewModal {...defaultProps} previewTemplate="nonexistent-id" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders template name in dialog title', () => {
    render(<TemplatePreviewModal {...defaultProps} previewTemplate="tmpl-1" />);
    expect(screen.getByText('Template One')).toBeInTheDocument();
  });

  it('renders preview image when previewUrl is available', () => {
    render(<TemplatePreviewModal {...defaultProps} previewTemplate="tmpl-1" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/t1.png');
  });

  it('shows "No preview available" when previewUrl is absent', () => {
    render(<TemplatePreviewModal {...defaultProps} previewTemplate="tmpl-2" />);
    expect(screen.getByText('No preview available')).toBeInTheDocument();
  });

  it('calls setSelectedTemplateId and setPreviewTemplate when Select is clicked', () => {
    const setSelectedTemplateId = vi.fn();
    const setPreviewTemplate = vi.fn();
    render(
      <TemplatePreviewModal
        {...defaultProps}
        previewTemplate="tmpl-1"
        setSelectedTemplateId={setSelectedTemplateId}
        setPreviewTemplate={setPreviewTemplate}
      />
    );
    fireEvent.click(screen.getByText('Select'));
    expect(setSelectedTemplateId).toHaveBeenCalledWith('tmpl-1');
    expect(setPreviewTemplate).toHaveBeenCalledWith(null);
  });

  it('calls setPreviewTemplate(null) when Close button is clicked', () => {
    const setPreviewTemplate = vi.fn();
    render(
      <TemplatePreviewModal
        {...defaultProps}
        previewTemplate="tmpl-1"
        setPreviewTemplate={setPreviewTemplate}
      />
    );
    fireEvent.click(screen.getByText('Close'));
    expect(setPreviewTemplate).toHaveBeenCalledWith(null);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CertificateTemplatesPanel } from './CertificateTemplatesPanel';

vi.mock('../TemplateThumbnail', () => ({
  TemplateThumbnail: ({ name, selected, onClick }: { name: string; selected: boolean; onClick: () => void }) => (
    <button type="button" onClick={onClick} data-selected={selected}>
      {name}
    </button>
  ),
}));

const defaultProps = {
  handleRefreshTemplates: vi.fn().mockResolvedValue(undefined),
  templatesRefreshing: false,
  setView: vi.fn(),
  setErrorMsg: vi.fn(),
  templatesLoading: false,
  certTemplates: [],
  selectedTemplateId: null,
  setPreviewTemplate: vi.fn(),
};

describe('CertificateTemplatesPanel', () => {
  it('renders Certificate Template heading', () => {
    render(<CertificateTemplatesPanel {...defaultProps} />);
    expect(screen.getByText('Certificate Template')).toBeInTheDocument();
  });

  it('shows loading spinner when templatesLoading is true', () => {
    const { container } = render(
      <CertificateTemplatesPanel {...defaultProps} templatesLoading={true} />
    );
    // The loader should be rendered
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows empty state message when no templates available', () => {
    render(<CertificateTemplatesPanel {...defaultProps} certTemplates={[]} />);
    expect(screen.getByText('No templates available.')).toBeInTheDocument();
  });

  it('shows "Create New Template" button in empty state', () => {
    render(<CertificateTemplatesPanel {...defaultProps} certTemplates={[]} />);
    expect(screen.getByText('Create New Template')).toBeInTheDocument();
  });

  it('calls setView and setErrorMsg when "Create New Template" is clicked in empty state', () => {
    const setView = vi.fn();
    const setErrorMsg = vi.fn();
    render(
      <CertificateTemplatesPanel
        {...defaultProps}
        certTemplates={[]}
        setView={setView}
        setErrorMsg={setErrorMsg}
      />
    );
    fireEvent.click(screen.getByText('Create New Template'));
    expect(setView).toHaveBeenCalledWith('createTemplate');
    expect(setErrorMsg).toHaveBeenCalledWith('');
  });

  it('renders template thumbnails when templates available', () => {
    const templates = [
      { identifier: 't1', name: 'Template 1', previewUrl: 'url1' },
      { identifier: 't2', name: 'Template 2' },
    ];
    render(<CertificateTemplatesPanel {...defaultProps} certTemplates={templates} />);
    expect(screen.getByText('Template 1')).toBeInTheDocument();
    expect(screen.getByText('Template 2')).toBeInTheDocument();
  });

  it('calls setPreviewTemplate when template is clicked', () => {
    const setPreviewTemplate = vi.fn();
    const templates = [{ identifier: 't1', name: 'Template 1' }];
    render(
      <CertificateTemplatesPanel
        {...defaultProps}
        certTemplates={templates}
        setPreviewTemplate={setPreviewTemplate}
      />
    );
    fireEvent.click(screen.getByText('Template 1'));
    expect(setPreviewTemplate).toHaveBeenCalledWith('t1');
  });

  it('calls handleRefreshTemplates when refresh button is clicked', () => {
    const handleRefreshTemplates = vi.fn().mockResolvedValue(undefined);
    render(
      <CertificateTemplatesPanel {...defaultProps} handleRefreshTemplates={handleRefreshTemplates} />
    );
    const refreshBtn = screen.getByTitle('Refresh templates');
    fireEvent.click(refreshBtn);
    expect(handleRefreshTemplates).toHaveBeenCalledTimes(1);
  });

  it('calls setView and setErrorMsg when + (create) button is clicked', () => {
    const setView = vi.fn();
    const setErrorMsg = vi.fn();
    render(
      <CertificateTemplatesPanel {...defaultProps} setView={setView} setErrorMsg={setErrorMsg} />
    );
    const createBtn = screen.getByTitle('Create new template');
    fireEvent.click(createBtn);
    expect(setView).toHaveBeenCalledWith('createTemplate');
    expect(setErrorMsg).toHaveBeenCalledWith('');
  });

  it('disables refresh button when templatesRefreshing is true', () => {
    render(<CertificateTemplatesPanel {...defaultProps} templatesRefreshing={true} />);
    const refreshBtn = screen.getByTitle('Refresh templates');
    expect(refreshBtn).toBeDisabled();
  });

  it('passes correct selected prop to template thumbnail', () => {
    const templates = [
      { identifier: 't1', name: 'Template 1' },
      { identifier: 't2', name: 'Template 2' },
    ];
    render(
      <CertificateTemplatesPanel
        {...defaultProps}
        certTemplates={templates}
        selectedTemplateId="t1"
      />
    );
    const t1Btn = screen.getByText('Template 1').closest('button');
    const t2Btn = screen.getByText('Template 2').closest('button');
    expect(t1Btn).toHaveAttribute('data-selected', 'true');
    expect(t2Btn).toHaveAttribute('data-selected', 'false');
  });
});

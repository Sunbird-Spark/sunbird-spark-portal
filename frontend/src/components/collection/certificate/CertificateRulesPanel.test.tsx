import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CertificateRulesPanel } from './CertificateRulesPanel';

const defaultProps = {
  issueTo: 'all' as const,
  setIssueTo: vi.fn(),
  progressRule: '100',
  setProgressRule: vi.fn(),
  issueToAccepted: false,
  setIssueToAccepted: vi.fn(),
  selectedTemplate: null,
};

describe('CertificateRulesPanel', () => {
  it('renders Certificate Rules heading', () => {
    render(<CertificateRulesPanel {...defaultProps} />);
    expect(screen.getByText('Certificate Rules')).toBeInTheDocument();
  });

  it('renders Issue Certificate To select with correct value', () => {
    render(<CertificateRulesPanel {...defaultProps} issueTo="all" />);
    const select = screen.getByRole('combobox', { name: /issue certificate to/i });
    expect(select).toHaveValue('all');
  });

  it('renders Issue Certificate To select with org value', () => {
    render(<CertificateRulesPanel {...defaultProps} issueTo="org" />);
    const select = screen.getByRole('combobox', { name: /issue certificate to/i });
    expect(select).toHaveValue('org');
  });

  it('calls setIssueTo when select changes', () => {
    const setIssueTo = vi.fn();
    render(<CertificateRulesPanel {...defaultProps} setIssueTo={setIssueTo} />);
    const select = screen.getByRole('combobox', { name: /issue certificate to/i });
    fireEvent.change(select, { target: { value: 'org' } });
    expect(setIssueTo).toHaveBeenCalledWith('org');
  });

  it('renders Progress Rule input with correct value', () => {
    render(<CertificateRulesPanel {...defaultProps} progressRule="80" />);
    const input = screen.getByRole('spinbutton', { name: /progress rule/i });
    expect(input).toHaveValue(80);
  });

  it('calls setProgressRule when progress input changes', () => {
    const setProgressRule = vi.fn();
    render(<CertificateRulesPanel {...defaultProps} setProgressRule={setProgressRule} />);
    const input = screen.getByRole('spinbutton', { name: /progress rule/i });
    fireEvent.change(input, { target: { value: '75' } });
    expect(setProgressRule).toHaveBeenCalledWith('75');
  });

  it('renders condition checkbox unchecked by default', () => {
    render(<CertificateRulesPanel {...defaultProps} issueToAccepted={false} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('renders condition checkbox checked when issueToAccepted is true', () => {
    render(<CertificateRulesPanel {...defaultProps} issueToAccepted={true} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('calls setIssueToAccepted when checkbox changes', () => {
    const setIssueToAccepted = vi.fn();
    render(<CertificateRulesPanel {...defaultProps} setIssueToAccepted={setIssueToAccepted} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(setIssueToAccepted).toHaveBeenCalled();
  });

  it('shows "Select a template from the right panel" when no selectedTemplate', () => {
    render(<CertificateRulesPanel {...defaultProps} selectedTemplate={null} />);
    expect(screen.getByText('Select a template from the right panel')).toBeInTheDocument();
  });

  it('shows selected template name when template has no previewUrl', () => {
    const template = { identifier: 't1', name: 'My Cert Template' };
    render(<CertificateRulesPanel {...defaultProps} selectedTemplate={template} />);
    expect(screen.getByText('My Cert Template')).toBeInTheDocument();
  });

  it('shows template image when template has previewUrl', () => {
    const template = { identifier: 't1', name: 'My Cert', previewUrl: 'https://example.com/cert.png' };
    render(<CertificateRulesPanel {...defaultProps} selectedTemplate={template} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/cert.png');
    expect(img).toHaveAttribute('alt', 'My Cert');
  });

  it('shows "No preview" text when template has no previewUrl', () => {
    const template = { identifier: 't1', name: 'My Cert Template' };
    render(<CertificateRulesPanel {...defaultProps} selectedTemplate={template} />);
    expect(screen.getByText('No preview')).toBeInTheDocument();
  });
});

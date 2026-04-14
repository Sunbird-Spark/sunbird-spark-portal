import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CertificateRulesPanel } from './CertificateRulesPanel';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'certificate.rules': 'Certificate Rules',
        'certificate.issueTo': 'Issue Certificate To',
        'certificate.issueToAll': 'All Attendees',
        'certificate.issueToOrg': 'My Organisation',
        'certificate.progressRule': 'Progress Rule',
        'certificate.scoreRule': 'Score Rule',
        'certificate.addScoreRule': '+ Add Score Rule Condition',
        'certificate.bestAttemptedScore': 'Best attempted score minimum criteria is',
        'certificate.removeScoreRule': 'Remove Score Rule',
        'certificate.condition': 'Condition',
        'certificate.rulesConsent': 'I accept the Terms & Conditions for creating this batch',
        'certificate.selectedTemplate': 'Selected Template',
        'certificate.noPreview': 'No preview available',
        'certificate.selectFromPanel': 'Select a template from the right panel',
      };
      return translations[key] || key;
    },
  }),
}));

const defaultProps = {
  issueTo: 'all' as const,
  setIssueTo: vi.fn(),
  issueToAccepted: false,
  setIssueToAccepted: vi.fn(),
  selectedTemplate: null,
  showScoreRuleComponent: true,
  enableScoreRule: false,
  setEnableScoreRule: vi.fn(),
  scoreRuleValue: '90',
  setScoreRuleValue: vi.fn(),
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

  it('renders Progress Rule input as disabled with value 100', () => {
    render(<CertificateRulesPanel {...defaultProps} />);
    const input = screen.getByRole('spinbutton', { name: /progress rule/i });
    expect(input).toHaveValue(100);
    expect(input).toBeDisabled();
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

  it('shows Add Score Rule Condition button when component is enabled but rule is disabled', () => {
    render(<CertificateRulesPanel {...defaultProps} showScoreRuleComponent={true} enableScoreRule={false} />);
    const button = screen.getByRole('button', { name: /\+ Add Score Rule Condition/i });
    expect(button).toBeInTheDocument();
  });

  it('calls setEnableScoreRule when Add Score Rule Condition button is clicked', () => {
    const setEnableScoreRule = vi.fn();
    render(<CertificateRulesPanel {...defaultProps} showScoreRuleComponent={true} enableScoreRule={false} setEnableScoreRule={setEnableScoreRule} />);
    const button = screen.getByRole('button', { name: /\+ Add Score Rule Condition/i });
    fireEvent.click(button);
    expect(setEnableScoreRule).toHaveBeenCalledWith(true);
  });

  it('renders Score Rule input when rule is enabled', () => {
    render(<CertificateRulesPanel {...defaultProps} showScoreRuleComponent={true} enableScoreRule={true} scoreRuleValue="85" />);
    const input = screen.getByRole('spinbutton', { name: /best attempted score/i });
    expect(input).toHaveValue(85);
  });

  it('calls setScoreRuleValue when Score Rule input changes', () => {
    const setScoreRuleValue = vi.fn();
    render(<CertificateRulesPanel {...defaultProps} showScoreRuleComponent={true} enableScoreRule={true} setScoreRuleValue={setScoreRuleValue} />);
    const input = screen.getByRole('spinbutton', { name: /best attempted score/i });
    fireEvent.change(input, { target: { value: '95' } });
    expect(setScoreRuleValue).toHaveBeenCalledWith('95');
  });

  it('calls setEnableScoreRule and resets scoreRuleValue when remove score rule button is clicked', () => {
    const setEnableScoreRule = vi.fn();
    const setScoreRuleValue = vi.fn();
    render(<CertificateRulesPanel {...defaultProps} showScoreRuleComponent={true} enableScoreRule={true} setEnableScoreRule={setEnableScoreRule} setScoreRuleValue={setScoreRuleValue} />);
    const button = screen.getByRole('button', { name: /remove score rule/i });
    fireEvent.click(button);
    expect(setEnableScoreRule).toHaveBeenCalledWith(false);
    expect(setScoreRuleValue).toHaveBeenCalledWith('90');
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
    expect(screen.getByText('No preview available')).toBeInTheDocument();
  });
});

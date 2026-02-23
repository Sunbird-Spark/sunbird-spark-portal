import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddCertificateModal from './AddCertificateModal';
import type { ModalView, Step, IssueTo } from './certificate/types';

type CertTab = 'current' | 'change';

/* ── Mock useCertificateModalState ── */
const mockState: {
  view: ModalView;
  setView: ReturnType<typeof vi.fn>;
  issueTo: IssueTo;
  setIssueTo: ReturnType<typeof vi.fn>;
  issueToAccepted: boolean;
  setIssueToAccepted: ReturnType<typeof vi.fn>;
  progressRule: string;
  setProgressRule: ReturnType<typeof vi.fn>;
  selectedTemplateId: string | null;
  setSelectedTemplateId: ReturnType<typeof vi.fn>;
  previewTemplate: string | null;
  setPreviewTemplate: ReturnType<typeof vi.fn>;
  newTmpl: {
    certTitle: string;
    name: string;
    logo1: { preview: null; artifactUrl: null; file: null };
    logo2: { preview: null; artifactUrl: null; file: null };
    sig1: { preview: null; artifactUrl: null; file: null };
    sig1Designation: string;
    sig2: { preview: null; artifactUrl: null; file: null };
    sig2Designation: string;
    termsAccepted: boolean;
  };
  step: Step;
  setStep: ReturnType<typeof vi.fn>;
  stepLabel: string;
  errorMsg: string;
  setErrorMsg: ReturnType<typeof vi.fn>;
  createLoading: boolean;
  templatesRefreshing: boolean;
  certTab: CertTab;
  setCertTab: ReturnType<typeof vi.fn>;
  certTemplates: any[];
  templatesLoading: boolean;
  selectedTemplate: null;
  hasExistingCert: boolean;
  handleClose: ReturnType<typeof vi.fn>;
  handleNewTmplField: ReturnType<typeof vi.fn>;
  handleSaveNewTemplate: ReturnType<typeof vi.fn>;
  handleAddCertificate: ReturnType<typeof vi.fn>;
  isNewTmplValid: boolean;
  handleRefreshTemplates: ReturnType<typeof vi.fn>;
  isAddCertEnabled: boolean;
} = {
  view: 'main',
  setView: vi.fn(),
  issueTo: 'all',
  setIssueTo: vi.fn(),
  issueToAccepted: false,
  setIssueToAccepted: vi.fn(),
  progressRule: '100',
  setProgressRule: vi.fn(),
  selectedTemplateId: null,
  setSelectedTemplateId: vi.fn(),
  previewTemplate: null,
  setPreviewTemplate: vi.fn(),
  newTmpl: {
    certTitle: '',
    name: '',
    logo1: { preview: null, artifactUrl: null, file: null },
    logo2: { preview: null, artifactUrl: null, file: null },
    sig1: { preview: null, artifactUrl: null, file: null },
    sig1Designation: '',
    sig2: { preview: null, artifactUrl: null, file: null },
    sig2Designation: '',
    termsAccepted: false,
  },
  step: 'idle',
  setStep: vi.fn(),
  stepLabel: '',
  errorMsg: '',
  setErrorMsg: vi.fn(),
  createLoading: false,
  templatesRefreshing: false,
  certTab: 'change',
  setCertTab: vi.fn(),
  certTemplates: [],
  templatesLoading: false,
  selectedTemplate: null,
  hasExistingCert: false,
  handleClose: vi.fn(),
  handleNewTmplField: vi.fn(),
  handleSaveNewTemplate: vi.fn().mockResolvedValue(undefined),
  handleAddCertificate: vi.fn().mockResolvedValue(undefined),
  isNewTmplValid: false,
  handleRefreshTemplates: vi.fn().mockResolvedValue(undefined),
  isAddCertEnabled: false,
};

vi.mock('./certificate/useCertificateModalState', () => ({
  useCertificateModalState: () => mockState,
}));

vi.mock('./certificate/CertificateRulesPanel', () => ({
  CertificateRulesPanel: () => <div data-testid="certificate-rules-panel" />,
}));

vi.mock('./certificate/CertificateTemplatesPanel', () => ({
  CertificateTemplatesPanel: () => <div data-testid="certificate-templates-panel" />,
}));

vi.mock('./certificate/CreateTemplatePanel', () => ({
  CreateTemplatePanel: () => <div data-testid="create-template-panel" />,
}));

vi.mock('./certificate/TemplatePreviewModal', () => ({
  TemplatePreviewModal: () => <div data-testid="template-preview-modal" />,
}));

vi.mock('./certificate/ModalStatusOverlay', () => ({
  ModalStatusOverlay: ({ step }: { step: string }) => (
    <div data-testid="modal-status-overlay" data-step={step} />
  ),
}));

vi.mock('./certificate/CurrentCertificatePanel', () => ({
  CurrentCertificatePanel: () => <div data-testid="current-certificate-panel" />,
}));

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  courseId: 'course-123',
  batchId: 'batch-456',
};

describe('AddCertificateModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.view = 'main';
    mockState.step = 'idle';
    mockState.hasExistingCert = false;
    mockState.certTab = 'change';
    mockState.previewTemplate = null;
    mockState.isAddCertEnabled = false;
  });

  it('renders the Certificate dialog title when open is true', () => {
    render(<AddCertificateModal {...defaultProps} />);
    expect(screen.getByText('Certificate')).toBeInTheDocument();
  });

  it('does not render dialog content when open is false', () => {
    render(<AddCertificateModal {...defaultProps} open={false} />);
    expect(screen.queryByText('Certificate')).not.toBeInTheDocument();
  });

  it('renders CertificateRulesPanel and CertificateTemplatesPanel in main view', () => {
    render(<AddCertificateModal {...defaultProps} />);
    expect(screen.getByTestId('certificate-rules-panel')).toBeInTheDocument();
    expect(screen.getByTestId('certificate-templates-panel')).toBeInTheDocument();
  });

  it('renders CreateTemplatePanel when view is createTemplate', () => {
    mockState.view = 'createTemplate';
    render(<AddCertificateModal {...defaultProps} />);
    expect(screen.getByTestId('create-template-panel')).toBeInTheDocument();
  });

  it('shows "Create Certificate Template" title when view is createTemplate', () => {
    mockState.view = 'createTemplate';
    render(<AddCertificateModal {...defaultProps} />);
    expect(screen.getByText('Create Certificate Template')).toBeInTheDocument();
  });

  it('shows Back button when view is createTemplate', () => {
    mockState.view = 'createTemplate';
    render(<AddCertificateModal {...defaultProps} />);
    expect(screen.getByText('← Back')).toBeInTheDocument();
  });

  it('calls setView and setErrorMsg when Back is clicked from createTemplate view', () => {
    mockState.view = 'createTemplate';
    render(<AddCertificateModal {...defaultProps} />);
    fireEvent.click(screen.getByText('← Back'));
    expect(mockState.setView).toHaveBeenCalledWith('main');
    expect(mockState.setErrorMsg).toHaveBeenCalledWith('');
  });

  it('renders "Add Certificate" button as disabled when isAddCertEnabled is false', () => {
    render(<AddCertificateModal {...defaultProps} />);
    const addBtn = screen.getByText('Add Certificate');
    expect(addBtn).toBeDisabled();
  });

  it('enables "Add Certificate" button when isAddCertEnabled is true', () => {
    mockState.isAddCertEnabled = true;
    render(<AddCertificateModal {...defaultProps} />);
    const addBtn = screen.getByText('Add Certificate');
    expect(addBtn).not.toBeDisabled();
  });

  it('calls handleAddCertificate when "Add Certificate" is clicked', () => {
    mockState.isAddCertEnabled = true;
    render(<AddCertificateModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Add Certificate'));
    expect(mockState.handleAddCertificate).toHaveBeenCalledTimes(1);
  });

  it('calls handleClose when Cancel is clicked', () => {
    render(<AddCertificateModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockState.handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders tab bar when hasExistingCert is true', () => {
    mockState.hasExistingCert = true;
    mockState.certTab = 'current';
    render(<AddCertificateModal {...defaultProps} />);
    expect(screen.getByText('Current Certificate')).toBeInTheDocument();
    expect(screen.getByText('Change Certificate')).toBeInTheDocument();
  });

  it('shows CurrentCertificatePanel when hasExistingCert and certTab is current', () => {
    mockState.hasExistingCert = true;
    mockState.certTab = 'current';
    render(<AddCertificateModal {...defaultProps} />);
    expect(screen.getByTestId('current-certificate-panel')).toBeInTheDocument();
  });

  it('calls setCertTab when tab is clicked', () => {
    mockState.hasExistingCert = true;
    mockState.certTab = 'current';
    render(<AddCertificateModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Change Certificate'));
    expect(mockState.setCertTab).toHaveBeenCalledWith('change');
  });

  it('renders TemplatePreviewModal component', () => {
    render(<AddCertificateModal {...defaultProps} />);
    expect(screen.getByTestId('template-preview-modal')).toBeInTheDocument();
  });

  it('renders ModalStatusOverlay with idle step', () => {
    render(<AddCertificateModal {...defaultProps} />);
    const overlay = screen.getByTestId('modal-status-overlay');
    expect(overlay).toHaveAttribute('data-step', 'idle');
  });

  it('hides main panel when step is not idle', () => {
    mockState.step = 'submitting';
    render(<AddCertificateModal {...defaultProps} />);
    expect(screen.queryByTestId('certificate-rules-panel')).not.toBeInTheDocument();
  });
});

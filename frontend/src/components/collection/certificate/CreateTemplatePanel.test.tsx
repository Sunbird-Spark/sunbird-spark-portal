import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateTemplatePanel } from './CreateTemplatePanel';
import { emptyNewTemplate } from './utils';

vi.mock('./ImagePickerDialog', () => ({
  ImagePickerDialog: ({
    label,
    required,
    onChange,
  }: {
    label: string;
    required?: boolean;
    value: any;
    onChange: (v: any) => void;
  }) => (
    <div>
      <span>{label}{required ? ' *' : ''}</span>
      <button
        type="button"
        onClick={() => onChange({ preview: 'https://example.com/img.png', artifactUrl: null, file: null })}
      >
        Pick {label}
      </button>
    </div>
  ),
}));

const defaultProps = {
  newTmpl: emptyNewTemplate(),
  handleNewTmplField: vi.fn(),
  errorMsg: '',
  setView: vi.fn(),
  setErrorMsg: vi.fn(),
  isNewTmplValid: false,
  createLoading: false,
  handleSaveNewTemplate: vi.fn().mockResolvedValue(undefined),
};

describe('CreateTemplatePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Certificate Title input', () => {
    render(<CreateTemplatePanel {...defaultProps} />);
    expect(screen.getByPlaceholderText('e.g. Certificate of Completion')).toBeInTheDocument();
  });

  it('renders Name input', () => {
    render(<CreateTemplatePanel {...defaultProps} />);
    expect(screen.getByPlaceholderText('e.g. Signatory full name')).toBeInTheDocument();
  });

  it('calls handleNewTmplField when cert title changes', () => {
    const handleNewTmplField = vi.fn();
    render(<CreateTemplatePanel {...defaultProps} handleNewTmplField={handleNewTmplField} />);
    const input = screen.getByPlaceholderText('e.g. Certificate of Completion');
    fireEvent.change(input, { target: { value: 'My Certificate' } });
    expect(handleNewTmplField).toHaveBeenCalledWith('certTitle', 'My Certificate');
  });

  it('calls handleNewTmplField when name changes', () => {
    const handleNewTmplField = vi.fn();
    render(<CreateTemplatePanel {...defaultProps} handleNewTmplField={handleNewTmplField} />);
    const input = screen.getByPlaceholderText('e.g. Signatory full name');
    fireEvent.change(input, { target: { value: 'John Doe' } });
    expect(handleNewTmplField).toHaveBeenCalledWith('name', 'John Doe');
  });

  it('renders termsAccepted checkbox', () => {
    render(<CreateTemplatePanel {...defaultProps} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('calls handleNewTmplField when terms checkbox changes', () => {
    const handleNewTmplField = vi.fn();
    render(<CreateTemplatePanel {...defaultProps} handleNewTmplField={handleNewTmplField} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(handleNewTmplField).toHaveBeenCalledWith('termsAccepted', true);
  });

  it('Save Template button is disabled when isNewTmplValid is false', () => {
    render(<CreateTemplatePanel {...defaultProps} isNewTmplValid={false} />);
    const saveBtn = screen.getByText('Save Template');
    expect(saveBtn).toBeDisabled();
  });

  it('Save Template button is enabled when isNewTmplValid is true', () => {
    render(<CreateTemplatePanel {...defaultProps} isNewTmplValid={true} />);
    const saveBtn = screen.getByText('Save Template');
    expect(saveBtn).not.toBeDisabled();
  });

  it('calls handleSaveNewTemplate when Save Template is clicked', () => {
    const handleSaveNewTemplate = vi.fn().mockResolvedValue(undefined);
    render(
      <CreateTemplatePanel {...defaultProps} isNewTmplValid={true} handleSaveNewTemplate={handleSaveNewTemplate} />
    );
    fireEvent.click(screen.getByText('Save Template'));
    expect(handleSaveNewTemplate).toHaveBeenCalledTimes(1);
  });

  it('calls setView and setErrorMsg when Cancel is clicked', () => {
    const setView = vi.fn();
    const setErrorMsg = vi.fn();
    render(<CreateTemplatePanel {...defaultProps} setView={setView} setErrorMsg={setErrorMsg} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(setView).toHaveBeenCalledWith('main');
    expect(setErrorMsg).toHaveBeenCalledWith('');
  });

  it('displays error message when errorMsg is not empty', () => {
    render(<CreateTemplatePanel {...defaultProps} errorMsg="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('does not display error message when errorMsg is empty', () => {
    render(<CreateTemplatePanel {...defaultProps} errorMsg="" />);
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('shows loader when createLoading is true', () => {
    render(<CreateTemplatePanel {...defaultProps} isNewTmplValid={true} createLoading={true} />);
    const saveBtn = screen.getByText('Save Template');
    expect(saveBtn).toBeDisabled();
  });

  it('renders Signatory 1 Designation input', () => {
    render(<CreateTemplatePanel {...defaultProps} />);
    expect(screen.getByPlaceholderText('e.g. Director')).toBeInTheDocument();
  });

  it('calls handleNewTmplField when sig1Designation changes', () => {
    const handleNewTmplField = vi.fn();
    render(<CreateTemplatePanel {...defaultProps} handleNewTmplField={handleNewTmplField} />);
    const input = screen.getByPlaceholderText('e.g. Director');
    fireEvent.change(input, { target: { value: 'CEO' } });
    expect(handleNewTmplField).toHaveBeenCalledWith('sig1Designation', 'CEO');
  });

  it('renders Signatory 2 Designation input', () => {
    render(<CreateTemplatePanel {...defaultProps} />);
    expect(screen.getByPlaceholderText('e.g. CEO')).toBeInTheDocument();
  });

  it('calls handleNewTmplField when sig2Designation changes', () => {
    const handleNewTmplField = vi.fn();
    render(<CreateTemplatePanel {...defaultProps} handleNewTmplField={handleNewTmplField} />);
    const input = screen.getByPlaceholderText('e.g. CEO');
    fireEvent.change(input, { target: { value: 'Director' } });
    expect(handleNewTmplField).toHaveBeenCalledWith('sig2Designation', 'Director');
  });
});

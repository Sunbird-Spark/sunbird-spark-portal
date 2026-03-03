import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModalStatusOverlay } from './ModalStatusOverlay';

const defaultProps = {
  step: 'idle' as const,
  stepLabel: '',
  view: 'main' as const,
  errorMsg: '',
  handleRefreshTemplates: vi.fn().mockResolvedValue(undefined),
  setStep: vi.fn(),
  setView: vi.fn(),
  handleClose: vi.fn(),
};

describe('ModalStatusOverlay', () => {
  it('returns null when step is idle', () => {
    const { container } = render(<ModalStatusOverlay {...defaultProps} step="idle" />);
    expect(container.firstChild).toBeNull();
  });

  it('shows loader with stepLabel when step is submitting', () => {
    render(
      <ModalStatusOverlay {...defaultProps} step="submitting" stepLabel="Attaching certificate…" />
    );
    expect(screen.getByText('Attaching certificate…')).toBeInTheDocument();
  });

  it('shows "Template Created Successfully!" when step is templateCreated', () => {
    render(<ModalStatusOverlay {...defaultProps} step="templateCreated" />);
    expect(screen.getByText('Template Created Successfully!')).toBeInTheDocument();
  });

  it('Refresh button calls handleRefreshTemplates, setStep, setView when step is templateCreated', async () => {
    const handleRefreshTemplates = vi.fn().mockResolvedValue(undefined);
    const setStep = vi.fn();
    const setView = vi.fn();
    render(
      <ModalStatusOverlay
        {...defaultProps}
        step="templateCreated"
        handleRefreshTemplates={handleRefreshTemplates}
        setStep={setStep}
        setView={setView}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    await vi.waitFor(() => {
      expect(handleRefreshTemplates).toHaveBeenCalledTimes(1);
      expect(setStep).toHaveBeenCalledWith('idle');
      expect(setView).toHaveBeenCalledWith('main');
    });
  });

  it('"Proceed Anyway" button calls setStep and setView when step is templateCreated', () => {
    const setStep = vi.fn();
    const setView = vi.fn();
    render(
      <ModalStatusOverlay {...defaultProps} step="templateCreated" setStep={setStep} setView={setView} />
    );
    fireEvent.click(screen.getByText('Proceed Anyway'));
    expect(setStep).toHaveBeenCalledWith('idle');
    expect(setView).toHaveBeenCalledWith('main');
  });

  it('shows "Certificate Added!" when step is done', () => {
    render(<ModalStatusOverlay {...defaultProps} step="done" />);
    expect(screen.getByText('Certificate Added!')).toBeInTheDocument();
  });

  it('calls handleClose when Done button is clicked', () => {
    const handleClose = vi.fn();
    render(<ModalStatusOverlay {...defaultProps} step="done" handleClose={handleClose} />);
    fireEvent.click(screen.getByText('Done'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('shows "Something went wrong" when step is error', () => {
    render(<ModalStatusOverlay {...defaultProps} step="error" errorMsg="Network error" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('calls handleClose when Cancel is clicked on error step', () => {
    const handleClose = vi.fn();
    render(
      <ModalStatusOverlay {...defaultProps} step="error" errorMsg="Error" handleClose={handleClose} />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls setStep("idle") when "Try Again" is clicked on error step', () => {
    const setStep = vi.fn();
    render(
      <ModalStatusOverlay {...defaultProps} step="error" errorMsg="Error" setStep={setStep} />
    );
    fireEvent.click(screen.getByText('Try Again'));
    expect(setStep).toHaveBeenCalledWith('idle');
  });
});

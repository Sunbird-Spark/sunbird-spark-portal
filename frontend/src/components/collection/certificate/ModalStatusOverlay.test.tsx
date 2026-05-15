import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModalStatusOverlay } from './ModalStatusOverlay';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

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
  it('returns null when step="idle"', () => {
    const { container } = render(<ModalStatusOverlay {...defaultProps} step="idle" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders spinner and stepLabel when step="submitting"', () => {
    render(
      <ModalStatusOverlay {...defaultProps} step="submitting" stepLabel="Attaching certificate…" />
    );
    expect(screen.getByText('Attaching certificate…')).toBeInTheDocument();
  });

  it('renders templateCreated success view with two buttons when step="templateCreated"', () => {
    render(<ModalStatusOverlay {...defaultProps} step="templateCreated" />);
    expect(screen.getByText('certificate.templateCreatedTitle')).toBeInTheDocument();
    expect(screen.getByText('certificate.refresh')).toBeInTheDocument();
    expect(screen.getByText('certificate.proceedAnyway')).toBeInTheDocument();
  });

  it('Refresh button calls handleRefreshTemplates, then setStep("idle"), then setView("main")', async () => {
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
    fireEvent.click(screen.getByText('certificate.refresh'));
    await vi.waitFor(() => {
      expect(handleRefreshTemplates).toHaveBeenCalledTimes(1);
      expect(setStep).toHaveBeenCalledWith('idle');
      expect(setView).toHaveBeenCalledWith('main');
    });
  });

  it('"Proceed Anyway" button calls setStep("idle") and setView("main")', () => {
    const setStep = vi.fn();
    const setView = vi.fn();
    render(
      <ModalStatusOverlay {...defaultProps} step="templateCreated" setStep={setStep} setView={setView} />
    );
    fireEvent.click(screen.getByText('certificate.proceedAnyway'));
    expect(setStep).toHaveBeenCalledWith('idle');
    expect(setView).toHaveBeenCalledWith('main');
  });

  it('renders done view when step="done"', () => {
    render(<ModalStatusOverlay {...defaultProps} step="done" />);
    expect(screen.getByText('certificate.certificateAddedTitle')).toBeInTheDocument();
    expect(screen.getByText('certificate.done')).toBeInTheDocument();
  });

  it('Done button calls handleClose', () => {
    const handleClose = vi.fn();
    render(<ModalStatusOverlay {...defaultProps} step="done" handleClose={handleClose} />);
    fireEvent.click(screen.getByText('certificate.done'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders error view with errorMsg when step="error"', () => {
    render(<ModalStatusOverlay {...defaultProps} step="error" errorMsg="Network error" />);
    expect(screen.getByText('certificate.somethingWentWrong')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('Cancel button in error view calls handleClose', () => {
    const handleClose = vi.fn();
    render(
      <ModalStatusOverlay {...defaultProps} step="error" errorMsg="Error" handleClose={handleClose} />
    );
    fireEvent.click(screen.getByText('certificate.cancelButton2'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('Try Again button in error view calls setStep("idle")', () => {
    const setStep = vi.fn();
    render(
      <ModalStatusOverlay {...defaultProps} step="error" errorMsg="Error" setStep={setStep} />
    );
    fireEvent.click(screen.getByText('certificate.tryAgain'));
    expect(setStep).toHaveBeenCalledWith('idle');
  });
});

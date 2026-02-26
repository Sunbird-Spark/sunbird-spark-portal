import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import EditorErrorState from './EditorErrorState';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component: ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('EditorErrorState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render error message', () => {
    renderWithRouter(<EditorErrorState message="Content not found" />);

    expect(screen.getByText('Content not found')).toBeInTheDocument();
  });

  it('should render back to workspace button', () => {
    renderWithRouter(<EditorErrorState message="Error occurred" />);

    const backButton = screen.getByRole('button', { name: 'Back to workspace' });
    expect(backButton).toBeInTheDocument();
  });

  it('should navigate to workspace when back button is clicked', () => {
    renderWithRouter(<EditorErrorState message="Error occurred" />);

    const backButton = screen.getByRole('button', { name: 'Back to workspace' });
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/workspace');
  });

  it('should not render retry button by default', () => {
    renderWithRouter(<EditorErrorState message="Error occurred" />);

    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('should render retry button when showRetry is true', () => {
    renderWithRouter(<EditorErrorState message="Error occurred" showRetry={true} />);

    const retryButton = screen.getByRole('button', { name: 'Retry' });
    expect(retryButton).toBeInTheDocument();
  });

  it('should not render retry button when showRetry is false', () => {
    renderWithRouter(<EditorErrorState message="Error occurred" showRetry={false} />);

    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('should reload page when retry button is clicked', () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true,
    });

    renderWithRouter(<EditorErrorState message="Error occurred" showRetry={true} />);

    const retryButton = screen.getByRole('button', { name: 'Retry' });
    fireEvent.click(retryButton);

    expect(reloadSpy).toHaveBeenCalled();
  });

  it('should render with lock error message', () => {
    renderWithRouter(
      <EditorErrorState message="Content is locked by another user" showRetry={false} />
    );

    expect(screen.getByText('Content is locked by another user')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('should render with metadata load error and retry button', () => {
    renderWithRouter(
      <EditorErrorState message="Failed to load content metadata" showRetry={true} />
    );

    expect(screen.getByText('Failed to load content metadata')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('should have correct styling classes', () => {
    const { container } = renderWithRouter(<EditorErrorState message="Error" />);

    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('flex', 'h-screen', 'w-full', 'flex-col', 'items-center', 'justify-center', 'gap-4');
  });

  it('should render error message with red text', () => {
    renderWithRouter(<EditorErrorState message="Error occurred" />);

    const errorText = screen.getByText('Error occurred');
    expect(errorText).toHaveClass('text-red-600', 'font-semibold');
  });

  it('should render buttons in a flex container', () => {
    renderWithRouter(<EditorErrorState message="Error" showRetry={true} />);

    const retryButton = screen.getByRole('button', { name: 'Retry' });
    const backButton = screen.getByRole('button', { name: 'Back to workspace' });

    expect(retryButton.parentElement).toHaveClass('flex', 'gap-2');
    expect(backButton.parentElement).toHaveClass('flex', 'gap-2');
  });

  it('should render retry button with blue styling', () => {
    renderWithRouter(<EditorErrorState message="Error" showRetry={true} />);

    const retryButton = screen.getByRole('button', { name: 'Retry' });
    expect(retryButton).toHaveClass('rounded', 'bg-blue-600', 'px-4', 'py-2', 'text-white', 'hover:bg-blue-700');
  });

  it('should render back button with gray styling', () => {
    renderWithRouter(<EditorErrorState message="Error" />);

    const backButton = screen.getByRole('button', { name: 'Back to workspace' });
    expect(backButton).toHaveClass('rounded', 'bg-gray-200', 'px-4', 'py-2', 'text-gray-800', 'hover:bg-gray-300');
  });

  it('should handle long error messages', () => {
    const longMessage = 'This is a very long error message that describes in detail what went wrong with the content loading process and provides additional context about the failure';
    
    renderWithRouter(<EditorErrorState message={longMessage} />);

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('should handle empty error message', () => {
    const { container } = renderWithRouter(<EditorErrorState message="" />);

    const errorDiv = container.querySelector('.text-red-600.font-semibold');
    expect(errorDiv).toBeInTheDocument();
    expect(errorDiv).toHaveTextContent('');
  });

  it('should render both buttons when showRetry is true', () => {
    renderWithRouter(<EditorErrorState message="Error" showRetry={true} />);

    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to workspace' })).toBeInTheDocument();
  });

  it('should only call navigate once when back button is clicked', () => {
    renderWithRouter(<EditorErrorState message="Error" />);

    const backButton = screen.getByRole('button', { name: 'Back to workspace' });
    fireEvent.click(backButton);
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledTimes(2);
    expect(mockNavigate).toHaveBeenCalledWith('/workspace');
  });

  it('should render with missing content identifier message', () => {
    renderWithRouter(<EditorErrorState message="Missing content identifier" />);

    expect(screen.getByText('Missing content identifier')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to workspace' })).toBeInTheDocument();
  });
});

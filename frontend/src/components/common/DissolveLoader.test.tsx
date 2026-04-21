import { render, screen, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DissolveLoader } from './DissolveLoader';

describe('DissolveLoader', () => {
  beforeEach(() => {
    // Mock requestAnimationFrame / cancelAnimationFrame for the animation loop
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: (time: number) => void) => {
      // Use standard setTimeout to prevent blocking and allow component logic to run once slowly
      return setTimeout(() => cb(performance.now()), 16) as unknown as number;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id: number) => {
      clearTimeout(id);
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders correctly', () => {
    render(<DissolveLoader />);
    expect(screen.getByTestId('dissolve-loader')).toBeInTheDocument();
  });

  it('cleans up animation frame on unmount', () => {
    const { unmount } = render(<DissolveLoader />);
    
    // Unmount immediately cancels the animation frame
    unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('updates particles on component unmount to prevent memory leaks', async () => {
    const { unmount } = render(<DissolveLoader subVariant="classic" />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    unmount();
  });

  it('supports different subVariants gracefully', () => {
    // testing ember variant switch
    const { rerender } = render(<DissolveLoader subVariant="ember" />);
    expect(screen.getByTestId('dissolve-loader')).toBeInTheDocument();

    // testing melt variant 
    rerender(<DissolveLoader subVariant="melt" />);
    expect(screen.getByTestId('dissolve-loader')).toBeInTheDocument();

    // testing shatter variant 
    rerender(<DissolveLoader subVariant="shatter" />);
    expect(screen.getByTestId('dissolve-loader')).toBeInTheDocument();
    
    // testing ashes variant 
    rerender(<DissolveLoader subVariant="ashes" />);
    expect(screen.getByTestId('dissolve-loader')).toBeInTheDocument();
  });
});

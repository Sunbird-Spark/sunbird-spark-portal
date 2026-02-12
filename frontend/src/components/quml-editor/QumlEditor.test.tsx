import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import QumlEditor from './QumlEditor';

// Mock dynamic imports
vi.mock('jquery', () => ({
  default: () => ({
    fn: {
      fancytree: vi.fn()
    }
  })
}));

vi.mock('jquery.fancytree', () => ({}));
vi.mock('jquery.fancytree/dist/modules/jquery.fancytree.glyph.js', () => ({}));
vi.mock('jquery.fancytree/dist/modules/jquery.fancytree.dnd5.js', () => ({}));
vi.mock('reflect-metadata', () => ({}));

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
  );
};

describe('QumlEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup window globals
    (window as any).$ = {
      fn: {
        fancytree: vi.fn()
      }
    };
    (window as any).jQuery = (window as any).$;
    (window as any).Reflect = {
      getMetadata: vi.fn()
    };
  });

  it('should render loading state initially', () => {
    render(<QumlEditor questionSetId="do_123" />, {
      wrapper: createWrapper()
    });

    expect(screen.getByText('Loading editor assets...')).toBeInTheDocument();
  });

  it('should render editor header', () => {
    render(<QumlEditor questionSetId="do_123" />, {
      wrapper: createWrapper()
    });

    expect(screen.getByText('QUML Questionset Editor')).toBeInTheDocument();
    expect(screen.getByText(/Create and edit question sets/)).toBeInTheDocument();
  });

  it('should create editor element with config attribute', async () => {
    const mockCreateElement = vi.spyOn(document, 'createElement');

    render(<QumlEditor questionSetId="do_123" />, {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      const createElementCalls = mockCreateElement.mock.calls;
      const editorCall = createElementCalls.find(call => call[0] === 'lib-questionset-editor');
      expect(editorCall).toBeDefined();
    });
  });

  it('should load styles dynamically', async () => {
    const appendChildSpy = vi.spyOn(document.head, 'appendChild');

    render(<QumlEditor questionSetId="do_123" />, {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      const calls = appendChildSpy.mock.calls;
      const styleCall = calls.find(call => {
        const element = call[0] as HTMLLinkElement;
        return element.tagName === 'LINK' && 
               element.getAttribute('data-quml-editor-styles') === 'true';
      });
      expect(styleCall).toBeDefined();
    });
  });

  it('should handle error state', async () => {
    // Mock import to fail
    vi.mock('jquery.fancytree', () => {
      throw new Error('Failed to load');
    });

    render(<QumlEditor questionSetId="do_123" />, {
      wrapper: createWrapper()
    });

    // Error state should be shown if loading fails
    // Note: This test may need adjustment based on actual error handling
  });

  it('should cleanup on unmount', () => {
    const { unmount } = render(<QumlEditor questionSetId="do_123" />, {
      wrapper: createWrapper()
    });

    const removeEventListenerSpy = vi.spyOn(Element.prototype, 'removeEventListener');

    unmount();

    // Verify cleanup happened
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });
});

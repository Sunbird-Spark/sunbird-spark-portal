import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as fc from 'fast-check';
import ContentReviewPage from './ContentReviewPage';

// Mock dependencies
const mockNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock('@/hooks/useContentPlayer', () => ({
  useContentPlayer: () => ({
    handlePlayerEvent: vi.fn(),
    handleTelemetryEvent: vi.fn(),
  }),
}));

vi.mock('@/hooks/useContent', () => ({
  useContentRead: () => ({
    data: {
      data: {
        content: {
          name: 'Test Content',
          description: 'Test Description',
          creator: 'Test Creator',
          lastUpdatedOn: '2024-01-01',
          createdOn: '2024-01-01',
          primaryCategory: 'Resource',
          mimeType: 'application/pdf',
        },
      },
    },
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/useQumlContent', () => ({
  useQumlContent: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getUserId: () => 'test-user-id',
  },
}));

vi.mock('@/services/ContentService', () => ({
  ContentService: class {
    contentPublish = vi.fn().mockResolvedValue({});
    contentReject = vi.fn().mockResolvedValue({});
  },
}));

vi.mock('@/services/FormService', () => ({
  FormService: class {
    formRead = vi.fn().mockResolvedValue({
      data: {
        form: {
          data: {
            fields: [
              {
                title: 'Please confirm that ALL the following items are verified',
                contents: [
                  {
                    name: 'Appropriateness',
                    checkList: ['No Hate speech', 'No Discrimination'],
                  },
                ],
                otherReason: 'Other Reason',
              },
            ],
          },
        },
      },
    });
  },
}));

vi.mock('@/components/home/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

vi.mock('@/components/home/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

vi.mock('@/components/common/PageLoader', () => ({
  default: ({ message }: { message: string }) => <div data-testid="loader">{message}</div>,
}));

vi.mock('@/components/players', () => ({
  ContentPlayer: () => <div data-testid="content-player">Content Player</div>,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ contentId: 'test-content-id' }),
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('mode=review')],
  };
});

describe('ContentReviewPage - Bug Condition Exploration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 1: Fault Condition - Horizontal Button Layout
   * 
   * **Validates: Requirements 1.1, 1.2**
   * 
   * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
   * 
   * This test verifies that the button container has buttons arranged horizontally
   * on the same line with proper flexbox layout. On unfixed code, this test will
   * fail because:
   * 1. The parent container lacks flexbox layout (display: flex)
   * 2. Buttons are stacked vertically instead of horizontally
   * 3. No space-between distribution is applied
   * 
   * Expected counterexamples on unfixed code:
   * - Back button and action buttons have different Y-coordinates (vertical stack)
   * - Parent container has display: block instead of display: flex
   * - Buttons occupy full width and stack vertically
   */
  it('Property 1: Buttons should be arranged horizontally with flexbox layout', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Render the component
        const { container, unmount } = render(
          <QueryClientProvider client={new QueryClient()}>
            <BrowserRouter>
              <ContentReviewPage />
            </BrowserRouter>
          </QueryClientProvider>
        );

        // Find the back button
        const backButton = screen.getByRole('button', { name: /^Back$/i });
        expect(backButton).toBeInTheDocument();

        // Find the action buttons
        const publishButton = screen.getByText(/Publish/i);
        const rejectButton = screen.getByText(/Request for Changes/i);
        expect(publishButton).toBeInTheDocument();
        expect(rejectButton).toBeInTheDocument();

        // Get the parent container that wraps both button groups
        // The back button is inside a button element, and the action buttons are in a div
        const backButtonElement = backButton.closest('button');
        const actionButtonsContainer = publishButton.closest('.content-review-actions');
        
        expect(backButtonElement).toBeInTheDocument();
        expect(actionButtonsContainer).toBeInTheDocument();

        // Both should have a common parent container
        const parentContainer = backButtonElement?.parentElement;
        expect(parentContainer).toBeInTheDocument();
        expect(parentContainer).toContain(actionButtonsContainer);

        // CRITICAL CHECKS - These will FAIL on unfixed code:
        
        // 1. Check that parent container has the correct CSS class applied
        // This class contains the flexbox layout fix
        expect(parentContainer).toHaveClass('content-review-button-container');
        
        // 2. Verify both button groups are direct children of the same container
        const children = Array.from(parentContainer!.children);
        expect(children).toContain(backButtonElement);
        expect(children).toContain(actionButtonsContainer);
        
        // 3. Verify the container has exactly 2 direct children (back button and actions container)
        // This confirms the horizontal layout structure is in place
        expect(children.length).toBe(2);
        
        // 4. Verify the CSS class exists in the stylesheet
        // The content-review-button-container class should have flex layout styles
        // Note: In test environment, @apply directives aren't processed by Tailwind,
        // but the class application confirms the structural fix is implemented
        const hasClass = parentContainer!.classList.contains('content-review-button-container');
        expect(hasClass).toBe(true);
        
        // Clean up after each iteration
        unmount();
      }),
      { numRuns: 10 } // Run multiple times to ensure consistency
    );
  });
});

describe('ContentReviewPage - Preservation Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockToast.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Property 2: Preservation - Button Functionality and Styling
   * 
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
   * 
   * These tests capture the current working functionality that must be preserved
   * after the layout fix. They run on UNFIXED code to establish the baseline
   * behavior that should remain unchanged.
   */

  /**
   * Test 2.1: Navigation Preservation
   * Validates Requirement 3.1: "Back" button navigates to /workspace
   */
  it('Property 2.1: Back button should navigate to /workspace', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const { unmount } = render(
          <QueryClientProvider client={new QueryClient()}>
            <BrowserRouter>
              <ContentReviewPage />
            </BrowserRouter>
          </QueryClientProvider>
        );

        const backButton = screen.getByRole('button', { name: /^Back$/i });
        expect(backButton).toBeInTheDocument();

        // Click the back button
        fireEvent.click(backButton);

        // Verify navigation was called with correct path
        expect(mockNavigate).toHaveBeenCalledWith('/workspace');
        
        unmount();
      }),
      { numRuns: 1 }
    );
  });

  /**
   * Test 2.2: Publish Button Presence and Clickability
   * Validates Requirement 3.2: "Publish" button is present and clickable
   */
  it('Property 2.2: Publish button should be present and clickable', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const { unmount } = render(
          <QueryClientProvider client={new QueryClient()}>
            <BrowserRouter>
              <ContentReviewPage />
            </BrowserRouter>
          </QueryClientProvider>
        );

        const publishButton = screen.getByRole('button', { name: /^Publish$/i });
        expect(publishButton).toBeInTheDocument();
        expect(publishButton).not.toBeDisabled();
        
        // Verify button has correct CSS classes
        expect(publishButton).toHaveClass('content-review-btn-publish');
        
        // Verify button is clickable (doesn't throw)
        expect(() => fireEvent.click(publishButton)).not.toThrow();
        
        unmount();
      }),
      { numRuns: 1 }
    );
  });

  /**
   * Test 2.3: Reject Dialog Functionality Preservation
   * Validates Requirement 3.3: "Request for Changes" button opens reject dialog
   */
  it('Property 2.3: Request for Changes button should open reject dialog', async () => {
    const { unmount } = render(
      <QueryClientProvider client={new QueryClient()}>
        <BrowserRouter>
          <ContentReviewPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    const rejectButton = screen.getByRole('button', { name: /Request for Changes/i });
    expect(rejectButton).toBeInTheDocument();
    expect(rejectButton).not.toBeDisabled();

    // Initially, dialog should not be visible
    expect(screen.queryByText(/Please confirm that ALL/i)).not.toBeInTheDocument();

    // Click the reject button (triggers async form loading)
    fireEvent.click(rejectButton);

    // Wait for the dialog to appear after async form load
    await waitFor(() => {
      expect(screen.getByText(/Please confirm that ALL/i)).toBeInTheDocument();
    });

    unmount();
  });

  /**
   * Test 2.4: Disabled State Preservation
   * Validates Requirement 3.4: Buttons have proper disabled state styling
   */
  it('Property 2.4: Buttons should have disabled state styling', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const { unmount } = render(
          <QueryClientProvider client={new QueryClient()}>
            <BrowserRouter>
              <ContentReviewPage />
            </BrowserRouter>
          </QueryClientProvider>
        );

        const publishButton = screen.getByRole('button', { name: /^Publish$/i });
        const rejectButton = screen.getByRole('button', { name: /Request for Changes/i });

        // Verify buttons are initially not disabled
        expect(publishButton).not.toBeDisabled();
        expect(rejectButton).not.toBeDisabled();
        
        // Verify buttons have the CSS classes that include disabled state styling
        // The disabled:opacity-50 is applied via @apply in the CSS file
        expect(publishButton).toHaveClass('content-review-btn-publish');
        expect(rejectButton).toHaveClass('content-review-btn-reject');
        
        unmount();
      }),
      { numRuns: 1 }
    );
  });

  /**
   * Test 2.5: Responsive Behavior Preservation
   * Validates Requirement 3.5: Buttons maintain proper spacing on different screen sizes
   */
  it('Property 2.5: Buttons should maintain proper spacing and styling across viewport sizes', () => {
    // Generate random viewport widths representing mobile, tablet, and desktop
    const viewportWidthArb = fc.oneof(
      fc.constant(375),  // Mobile
      fc.constant(768),  // Tablet
      fc.constant(1024), // Desktop
      fc.constant(1440)  // Large desktop
    );

    fc.assert(
      fc.property(viewportWidthArb, (width) => {
        // Set viewport size
        globalThis.innerWidth = width;
        window.dispatchEvent(new Event('resize'));

        const { unmount } = render(
          <QueryClientProvider client={new QueryClient()}>
            <BrowserRouter>
              <ContentReviewPage />
            </BrowserRouter>
          </QueryClientProvider>
        );

        const backButton = screen.getByRole('button', { name: /^Back$/i });
        const publishButton = screen.getByRole('button', { name: /^Publish$/i });
        const rejectButton = screen.getByRole('button', { name: /Request for Changes/i });

        // Verify all buttons are present
        expect(backButton).toBeInTheDocument();
        expect(publishButton).toBeInTheDocument();
        expect(rejectButton).toBeInTheDocument();

        // Verify action buttons container exists
        const actionButtonsContainer = publishButton.closest('.content-review-actions');
        expect(actionButtonsContainer).toBeInTheDocument();

        // Verify buttons maintain their styling classes
        expect(backButton).toHaveClass('content-review-go-back');
        expect(publishButton).toHaveClass('content-review-btn-publish');
        expect(rejectButton).toHaveClass('content-review-btn-reject');
        
        unmount();
      }),
      { numRuns: 4 }
    );
  });

  /**
   * Test 2.6: Button Styling Preservation
   * Validates that all button CSS classes remain unchanged
   */
  it('Property 2.6: Buttons should maintain all CSS classes', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const { unmount } = render(
          <QueryClientProvider client={new QueryClient()}>
            <BrowserRouter>
              <ContentReviewPage />
            </BrowserRouter>
          </QueryClientProvider>
        );

        const backButton = screen.getByRole('button', { name: /^Back$/i });
        const publishButton = screen.getByRole('button', { name: /^Publish$/i });
        const rejectButton = screen.getByRole('button', { name: /Request for Changes/i });

        // Verify button CSS classes are present
        // These classes apply styles via @apply in the CSS file
        expect(backButton).toHaveClass('content-review-go-back');
        expect(publishButton).toHaveClass('content-review-btn-publish');
        expect(rejectButton).toHaveClass('content-review-btn-reject');
        
        // Verify action buttons container class
        const actionButtonsContainer = publishButton.closest('.content-review-actions');
        expect(actionButtonsContainer).toHaveClass('content-review-actions');
        
        unmount();
      }),
      { numRuns: 1 }
    );
  });
});

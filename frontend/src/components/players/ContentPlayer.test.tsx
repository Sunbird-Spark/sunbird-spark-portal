import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ContentPlayer } from './ContentPlayer';

// ── Player stubs ──────────────────────────────────────────────────────────────

let capturedOnTelemetry: ((event: unknown) => void) | undefined;

vi.mock('./VideoPlayer', () => ({
  VideoPlayer: ({ onTelemetryEvent }: { onTelemetryEvent?: (e: unknown) => void }) => {
    capturedOnTelemetry = onTelemetryEvent;
    return <div data-testid="video-player" />;
  },
}));
vi.mock('./EpubPlayer', () => ({
  EpubPlayer: () => <div data-testid="epub-player" />,
}));
vi.mock('./EcmlPlayer', () => ({
  EcmlPlayer: () => <div data-testid="ecml-player" />,
}));
vi.mock('../content-player/pdf-player/PdfPlayer', () => ({
  PdfPlayer: () => <div data-testid="pdf-player" />,
}));
vi.mock('./quml/QumlPlayer', () => ({
  default: () => <div data-testid="quml-player" />,
}));

// ── RatingDialog stub ─────────────────────────────────────────────────────────

vi.mock('@/components/common/RatingDialog', () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="rating-dialog">
        <button onClick={onClose}>Close Rating</button>
      </div>
    ) : null,
}));

// ── useRatingTimer stub ───────────────────────────────────────────────────────

let capturedOnOpen: (() => void) | undefined;
let stubbedOnContentEnd: () => void;
let stubbedOnContentStart: () => void;

vi.mock('@/hooks/useRatingTimer', () => ({
  useRatingTimer: (onOpen: () => void) => {
    capturedOnOpen = onOpen;
    return {
      onContentEnd: () => stubbedOnContentEnd(),
      onContentStart: () => stubbedOnContentStart(),
    };
  },
}));

// ── helpers ───────────────────────────────────────────────────────────────────

const defaultProps = {
  mimeType: 'video/mp4',
  metadata: { identifier: 'c1', mimeType: 'video/mp4', name: 'Test Video' },
};

describe('ContentPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnTelemetry = undefined;
    capturedOnOpen = undefined;
    // Default stub: immediately call onOpen (simulates timer firing)
    stubbedOnContentEnd = () => capturedOnOpen?.();
    stubbedOnContentStart = () => {};
  });

  it('renders the correct player for the given mimeType', () => {
    render(<ContentPlayer {...defaultProps} />);
    expect(screen.getByTestId('video-player')).toBeInTheDocument();
  });

  it('wraps player in a relative container', () => {
    const { container } = render(<ContentPlayer {...defaultProps} />);
    expect(container.firstChild).toHaveClass('content-player-wrapper');
  });

  it('does not show RatingDialog initially', () => {
    stubbedOnContentEnd = () => {}; // don't fire onOpen
    render(<ContentPlayer {...defaultProps} />);
    expect(screen.queryByTestId('rating-dialog')).not.toBeInTheDocument();
  });

  it('shows RatingDialog after END event triggers onOpen', () => {
    render(<ContentPlayer {...defaultProps} />);
    act(() => { capturedOnTelemetry?.({ eid: 'END' }); });
    expect(screen.getByTestId('rating-dialog')).toBeInTheDocument();
  });

  it('does not show RatingDialog for non-END events', () => {
    stubbedOnContentEnd = () => {}; // guard: END must be the trigger
    render(<ContentPlayer {...defaultProps} />);
    act(() => { capturedOnTelemetry?.({ eid: 'INTERACT' }); });
    act(() => { capturedOnTelemetry?.({ eid: 'START' }); });
    expect(screen.queryByTestId('rating-dialog')).not.toBeInTheDocument();
  });

  it('calls onContentStart when START event is received', () => {
    const startSpy = vi.fn();
    stubbedOnContentStart = startSpy;
    render(<ContentPlayer {...defaultProps} />);
    act(() => { capturedOnTelemetry?.({ eid: 'START' }); });
    expect(startSpy).toHaveBeenCalledTimes(1);
  });

  it('closes RatingDialog when close button is clicked', () => {
    render(<ContentPlayer {...defaultProps} />);
    act(() => { capturedOnTelemetry?.({ eid: 'END' }); });
    expect(screen.getByTestId('rating-dialog')).toBeInTheDocument();
    act(() => { screen.getByRole('button', { name: 'Close Rating' }).click(); });
    expect(screen.queryByTestId('rating-dialog')).not.toBeInTheDocument();
  });

  it('passes telemetry events through to onTelemetryEvent prop', () => {
    const onTelemetryEvent = vi.fn();
    render(<ContentPlayer {...defaultProps} onTelemetryEvent={onTelemetryEvent} />);
    const event = { eid: 'END' };
    act(() => { capturedOnTelemetry?.(event); });
    expect(onTelemetryEvent).toHaveBeenCalledWith(event);
  });

  it('detects END event from data.eid path', () => {
    render(<ContentPlayer {...defaultProps} />);
    act(() => { capturedOnTelemetry?.({ data: { eid: 'END' } }); });
    expect(screen.getByTestId('rating-dialog')).toBeInTheDocument();
  });

  it('detects END event from type path', () => {
    render(<ContentPlayer {...defaultProps} />);
    act(() => { capturedOnTelemetry?.({ type: 'end' }); });
    expect(screen.getByTestId('rating-dialog')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCollectionDetailPlayer } from './useCollectionDetailPlayer';
import { useContentStateUpdate } from './useContentStateUpdate';
import { useContentPlayer } from './useContentPlayer';

const mockHandleContentStateFromTelemetry = vi.fn();
vi.mock('./useContentStateUpdate', () => ({
  useContentStateUpdate: vi.fn(() => mockHandleContentStateFromTelemetry),
}));

vi.mock('./useContentPlayer', () => ({
  useContentPlayer: vi.fn(() => ({
    handlePlayerEvent: vi.fn(),
    handleTelemetryEvent: vi.fn(),
  })),
}));

describe('useCollectionDetailPlayer', () => {
  const defaultParams = {
    collectionId: 'course_1',
    contentId: 'content_1',
    effectiveBatchId: 'batch_1',
    isEnrolledInCurrentBatch: true,
    mimeType: 'video/mp4',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns handlePlayerEvent and handleTelemetryEvent from useContentPlayer', () => {
    const mockHandlers = {
      handlePlayerEvent: vi.fn(),
      handleTelemetryEvent: vi.fn(),
    };
    (useContentPlayer as ReturnType<typeof vi.fn>).mockReturnValue(mockHandlers);

    const { result } = renderHook(() => useCollectionDetailPlayer(defaultParams));

    expect(result.current).toHaveProperty('handlePlayerEvent', mockHandlers.handlePlayerEvent);
    expect(result.current).toHaveProperty('handleTelemetryEvent', mockHandlers.handleTelemetryEvent);
  });

  it('calls useContentStateUpdate with all params including isBatchEnded and currentContentStatus', () => {
    renderHook(() =>
      useCollectionDetailPlayer({
        ...defaultParams,
        isBatchEnded: true,
        currentContentStatus: 2,
      })
    );

    expect(useContentStateUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionId: 'course_1',
        contentId: 'content_1',
        effectiveBatchId: 'batch_1',
        isEnrolledInCurrentBatch: true,
        isBatchEnded: true,
        mimeType: 'video/mp4',
        currentContentStatus: 2,
      })
    );
  });

  it('calls useContentStateUpdate with skipContentStateUpdate when provided', () => {
    renderHook(() =>
      useCollectionDetailPlayer({
        ...defaultParams,
        skipContentStateUpdate: true,
      })
    );

    expect(useContentStateUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        skipContentStateUpdate: true,
      })
    );
  });

  it('calls useContentPlayer with onTelemetryEvent and enableLogging false', () => {
    renderHook(() => useCollectionDetailPlayer(defaultParams));

    expect(useContentPlayer).toHaveBeenCalledWith(
      expect.objectContaining({
        onTelemetryEvent: expect.any(Function),
        enableLogging: false,
      })
    );
  });

  it('forwards telemetry events to handleContentStateFromTelemetry when handleTelemetryEvent is invoked', () => {
    const mockHandleTelemetryEvent = vi.fn();
    (useContentPlayer as ReturnType<typeof vi.fn>).mockReturnValue({
      handlePlayerEvent: vi.fn(),
      handleTelemetryEvent: mockHandleTelemetryEvent,
    });

    renderHook(() => useCollectionDetailPlayer(defaultParams));

    const callArgs = (useContentPlayer as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    if (!callArgs) throw new Error('useContentPlayer was not called');
    const onTelemetryEvent = callArgs.onTelemetryEvent;
    const event = { eid: 'START' };
    onTelemetryEvent(event);

    expect(mockHandleContentStateFromTelemetry).toHaveBeenCalledWith(event);
  });

  it('calls onContentEnd when END telemetry event is received', () => {
    const onContentEnd = vi.fn();
    renderHook(() => useCollectionDetailPlayer({ ...defaultParams, onContentEnd }));

    const callArgs = (useContentPlayer as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    if (!callArgs) throw new Error('useContentPlayer was not called');
    callArgs.onTelemetryEvent({ eid: 'END' });

    expect(onContentEnd).toHaveBeenCalledTimes(1);
  });

  it('does not call onContentEnd for non-END events', () => {
    const onContentEnd = vi.fn();
    renderHook(() => useCollectionDetailPlayer({ ...defaultParams, onContentEnd }));

    const callArgs = (useContentPlayer as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    if (!callArgs) throw new Error('useContentPlayer was not called');
    callArgs.onTelemetryEvent({ eid: 'START' });
    callArgs.onTelemetryEvent({ eid: 'INTERACT' });

    expect(onContentEnd).not.toHaveBeenCalled();
  });

  it('calls onContentStart when START telemetry event is received', () => {
    const onContentStart = vi.fn();
    renderHook(() => useCollectionDetailPlayer({ ...defaultParams, onContentStart }));

    const callArgs = (useContentPlayer as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    if (!callArgs) throw new Error('useContentPlayer was not called');
    callArgs.onTelemetryEvent({ eid: 'START' });

    expect(onContentStart).toHaveBeenCalledTimes(1);
  });

  it('does not call onContentStart for non-START events', () => {
    const onContentStart = vi.fn();
    renderHook(() => useCollectionDetailPlayer({ ...defaultParams, onContentStart }));

    const callArgs = (useContentPlayer as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    if (!callArgs) throw new Error('useContentPlayer was not called');
    callArgs.onTelemetryEvent({ eid: 'END' });
    callArgs.onTelemetryEvent({ eid: 'INTERACT' });

    expect(onContentStart).not.toHaveBeenCalled();
  });
});

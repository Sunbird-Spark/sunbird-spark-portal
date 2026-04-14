import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGenericEditor } from './useGenericEditor';
import type { ContentDetails } from '@/services/editors/generic-editor';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockService, mockUserAuth } = vi.hoisted(() => ({
  mockService: {
    getEditorUrl: vi.fn(),
    getContentDetails: vi.fn(),
    lockContent: vi.fn(),
    retireLock: vi.fn(),
    validateRequest: vi.fn(),
    shouldLockContent: vi.fn(),
    buildEditorContext: vi.fn(),
    buildEditorConfig: vi.fn(),
    setWindowGlobals: vi.fn(),
    clearWindowGlobals: vi.fn(),
  },
  mockUserAuth: {
    getUserId: vi.fn(),
    getSessionId: vi.fn(),
  },
}));

vi.mock('@/services/editors/generic-editor', () => {
  return {
    GenericEditorService: class {
      getEditorUrl = mockService.getEditorUrl;
      getContentDetails = mockService.getContentDetails;
      lockContent = mockService.lockContent;
      retireLock = mockService.retireLock;
      validateRequest = mockService.validateRequest;
      shouldLockContent = mockService.shouldLockContent;
      buildEditorContext = mockService.buildEditorContext;
      buildEditorConfig = mockService.buildEditorConfig;
      setWindowGlobals = mockService.setWindowGlobals;
      clearWindowGlobals = mockService.clearWindowGlobals;
    },
  };
});

vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: mockUserAuth,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultParams = { contentId: undefined, state: undefined, framework: undefined, contentStatus: undefined };

function defaultSetup() {
  mockService.getEditorUrl.mockReturnValue('/generic-editor/index.html');
  mockService.buildEditorContext.mockResolvedValue({ contentId: '' });
  mockService.buildEditorConfig.mockReturnValue({ build_number: '1.0' });
  mockService.shouldLockContent.mockReturnValue(false);
  mockService.validateRequest.mockReturnValue(true);
  mockUserAuth.getUserId.mockReturnValue('user-1');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useGenericEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultSetup();
    sessionStorage.clear();
    delete (window as any).$;
    delete (window as any).jQuery;
    delete (window as any).context;
    delete (window as any).config;
  });

  afterEach(() => {
    delete (window as any).$;
    delete (window as any).jQuery;
    delete (window as any).context;
    delete (window as any).config;
  });

  it('returns correct initial state', () => {
    const { result } = renderHook(() =>
      useGenericEditor({ params: defaultParams }),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.editorUrl).toBeNull();
    expect(result.current.isEditorReady).toBe(false);
    expect(result.current.contentDetails).toBeNull();
    expect(typeof result.current.openEditor).toBe('function');
    expect(typeof result.current.closeEditor).toBe('function');
    expect(result.current.iframeRef).toBeDefined();
  });

  it('openEditor sets up editor in create mode (no contentId)', async () => {
    const { result } = renderHook(() =>
      useGenericEditor({ params: defaultParams }),
    );

    await act(async () => {
      await result.current.openEditor();
    });

    expect(mockService.getContentDetails).not.toHaveBeenCalled();
    expect(mockService.buildEditorContext).toHaveBeenCalled();
    expect(mockService.buildEditorConfig).toHaveBeenCalled();
    expect(mockService.setWindowGlobals).toHaveBeenCalled();
    expect(result.current.editorUrl).toBe('/generic-editor/index.html?1.0');
    expect(result.current.isEditorReady).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('openEditor fetches content details when contentId is provided', async () => {
    const contentDetails: ContentDetails = {
      identifier: 'do_123',
      name: 'Test Content',
      status: 'Draft',
      mimeType: 'application/pdf',
      createdBy: 'user-1',
    };
    mockService.getContentDetails.mockResolvedValue(contentDetails);

    const params = { contentId: 'do_123', state: 'upForReview' };

    const { result } = renderHook(() =>
      useGenericEditor({ params }),
    );

    await act(async () => {
      await result.current.openEditor();
    });

    expect(mockService.getContentDetails).toHaveBeenCalledWith('do_123');
    expect(mockService.validateRequest).toHaveBeenCalledWith(
      contentDetails,
      'user-1',
      'upForReview',
    );
    expect(result.current.contentDetails).toEqual(contentDetails);
    expect(result.current.isEditorReady).toBe(true);
  });

  it('openEditor handles permission validation failure', async () => {
    const contentDetails: ContentDetails = {
      identifier: 'do_123',
      status: 'Draft',
      mimeType: 'application/pdf',
      createdBy: 'other-user',
    };
    mockService.getContentDetails.mockResolvedValue(contentDetails);
    mockService.validateRequest.mockReturnValue(false);

    const onError = vi.fn();
    const params = { contentId: 'do_123', state: 'upForReview' };

    const { result } = renderHook(() =>
      useGenericEditor({ params, onError }),
    );

    await act(async () => {
      await result.current.openEditor();
    });

    expect(result.current.error).toBe(
      'You do not have permission to edit this content.',
    );
    expect(onError).toHaveBeenCalledWith(
      'You do not have permission to edit this content.',
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isEditorReady).toBe(false);
  });

  it('openEditor handles RESOURCE_SELF_LOCKED error', async () => {
    const contentDetails: ContentDetails = {
      identifier: 'do_123',
      status: 'Draft',
      mimeType: 'application/pdf',
      createdBy: 'user-1',
    };
    mockService.getContentDetails.mockResolvedValue(contentDetails);
    mockService.shouldLockContent.mockReturnValue(true);
    mockService.lockContent.mockRejectedValue({
      response: {
        data: {
          params: {
            err: 'RESOURCE_SELF_LOCKED',
            errmsg: 'resource is already locked by you',
          },
        },
      },
    });

    const onError = vi.fn();
    const params = { contentId: 'do_123', state: 'upForReview', contentStatus: 'Draft' };

    const { result } = renderHook(() =>
      useGenericEditor({ params, onError }),
    );

    await act(async () => {
      await result.current.openEditor();
    });

    expect(result.current.error).toBe('content is already locked by you');
    expect(onError).toHaveBeenCalledWith('content is already locked by you');
    expect(result.current.isLoading).toBe(false);
  });

  it('openEditor proceeds without lock on non-lock errors', async () => {
    const contentDetails: ContentDetails = {
      identifier: 'do_789',
      status: 'Draft',
      mimeType: 'application/pdf',
      createdBy: 'user-1',
    };
    mockService.getContentDetails.mockResolvedValue(contentDetails);
    mockService.shouldLockContent.mockReturnValue(true);
    mockService.lockContent.mockRejectedValue(new Error('Network error'));

    const params = { contentId: 'do_789', state: 'upForReview', contentStatus: 'Draft' };

    const { result } = renderHook(() =>
      useGenericEditor({ params }),
    );

    await act(async () => {
      await result.current.openEditor();
    });

    expect(result.current.isEditorReady).toBe(true);
    expect(result.current.editorUrl).toBe('/generic-editor/index.html?1.0');
    expect(result.current.error).toBeNull();
  });

  it('closeEditor cleans up state and calls onClose', async () => {
    const onClose = vi.fn();
    mockService.retireLock.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useGenericEditor({ params: defaultParams, onClose }),
    );

    await act(async () => {
      await result.current.openEditor();
    });

    expect(result.current.isEditorReady).toBe(true);

    act(() => {
      result.current.closeEditor();
    });

    expect(mockService.clearWindowGlobals).toHaveBeenCalled();
    expect(result.current.editorUrl).toBeNull();
    expect(result.current.isEditorReady).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.contentDetails).toBeNull();
    expect(onClose).toHaveBeenCalled();
    expect(sessionStorage.getItem('inEditor')).toBe('false');
  });

  it('sets jQuery shim on window during lifecycle', () => {
    const { unmount } = renderHook(() =>
      useGenericEditor({ params: defaultParams }),
    );

    expect((window as any).$).toBeDefined();
    expect((window as any).jQuery).toBeDefined();

    const result = (window as any).$('#genericEditor');
    expect(result).toBeDefined();
    expect(typeof result.iziModal).toBe('function');

    unmount();

    expect((window as any).$).toBeUndefined();
    expect((window as any).jQuery).toBeUndefined();
  });

  it('prevents double initialization', async () => {
    const { result } = renderHook(() =>
      useGenericEditor({ params: defaultParams }),
    );

    await act(async () => {
      await result.current.openEditor();
    });

    mockService.buildEditorContext.mockClear();

    await act(async () => {
      await result.current.openEditor();
    });

    expect(mockService.buildEditorContext).not.toHaveBeenCalled();
  });

  it('sets sessionStorage inEditor flag on mount and clears on unmount', () => {
    const { unmount } = renderHook(() =>
      useGenericEditor({ params: defaultParams }),
    );

    expect(sessionStorage.getItem('inEditor')).toBe('true');

    unmount();

    expect(sessionStorage.getItem('inEditor')).toBe('false');
  });

  it('openEditor handles getContentDetails failure', async () => {
    mockService.getContentDetails.mockRejectedValue(new Error('Not found'));

    const onError = vi.fn();
    const params = { contentId: 'do_missing' };

    const { result } = renderHook(() =>
      useGenericEditor({ params, onError }),
    );

    await act(async () => {
      await result.current.openEditor();
    });

    expect(result.current.error).toBe(
      'Failed to load content details. You may not have permission to edit this content.',
    );
    expect(onError).toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('openEditor handles general initialization failure', async () => {
    mockService.buildEditorContext.mockRejectedValue(new Error('Build failed'));

    const onError = vi.fn();

    const { result } = renderHook(() =>
      useGenericEditor({ params: defaultParams, onError }),
    );

    await act(async () => {
      await result.current.openEditor();
    });

    expect(result.current.error).toBe(
      'Failed to initialize the editor. Please try again.',
    );
    expect(onError).toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { ContentEditor } from './ContentEditor';
import type { ContentEditorMetadata } from '../../services/editors/content-editor';

const mockBuildConfig = vi.fn();
const mockGetEditorUrl = vi.fn();

vi.mock('../../services/editors/content-editor', () => {
  const MockContentEditorService = vi.fn(function (this: any) {
    this.buildConfig = mockBuildConfig;
    this.getEditorUrl = mockGetEditorUrl;
  });

  return {
    ContentEditorService: MockContentEditorService,
  };
});

describe('ContentEditor', () => {
  const mockMetadata: ContentEditorMetadata = {
    identifier: 'test-content-123',
    name: 'Test Content',
    mimeType: 'application/vnd.ekstep.ecml-archive',
  };

  const mockConfig = {
    context: {
      user: { id: 'user-1', name: 'anonymous', orgIds: [], organisations: {} },
      sid: 'session-1',
      contentId: 'test-content-123',
      pdata: { id: 'test', ver: '1.0', pid: 'test' },
      channel: 'test-channel',
      framework: 'NCF',
      uid: 'user-1',
      did: 'device-1',
      defaultLicense: 'CC BY 4.0',
      contextRollup: { l1: 'test-channel' },
      tags: ['test-channel'],
      timeDiff: 0,
    },
    config: {
      baseURL: '',
      apislug: '/portal',
      build_number: '1.0',
      pluginRepo: '/content-plugins',
      plugins: [],
      modalId: 'contentEditor',
    },
  };

  beforeEach(() => {
    mockBuildConfig.mockResolvedValue(mockConfig);
    mockGetEditorUrl.mockReturnValue('/content-editor/index.html');
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete (window as any).context;
    delete (window as any).config;
    delete (window as any).$;
  });

  it('should render an iframe with correct attributes', () => {
    const { container } = render(<ContentEditor metadata={mockMetadata} />);
    const iframe = container.querySelector('iframe');

    expect(iframe).toBeInTheDocument();
    expect(iframe?.id).toBe('contentEditor');
    expect(iframe?.name).toBe('contentEditor');
    expect(iframe?.title).toBe('Content Editor');
  });

  it('should call buildConfig with metadata', async () => {
    render(<ContentEditor metadata={mockMetadata} />);

    await waitFor(() => {
      expect(mockBuildConfig).toHaveBeenCalledWith(mockMetadata);
    });
  });

  it('should set window.context and window.config before loading iframe', async () => {
    const { container } = render(<ContentEditor metadata={mockMetadata} />);

    await waitFor(() => {
      expect((window as any).context).toEqual(mockConfig.context);
      expect((window as any).config).toEqual(mockConfig.config);
      const iframe = container.querySelector('iframe');
      expect(iframe?.src).toContain('/content-editor/index.html');
    });
  });

  it('should install jQuery shim on window.$', async () => {
    render(<ContentEditor metadata={mockMetadata} />);

    await waitFor(() => {
      expect((window as any).$).toBeDefined();
    });

    const $result = (window as any).$('#contentEditor');
    expect($result).toHaveProperty('iziModal');
    expect($result).toHaveProperty('css');
    expect($result).toHaveProperty('find');
    expect($result).toHaveProperty('attr');
  });

  it('should call onClose when jQuery shim iziModal("close") is called for #contentEditor', async () => {
    const onClose = vi.fn();
    render(<ContentEditor metadata={mockMetadata} onClose={onClose} />);

    await waitFor(() => {
      expect((window as any).$).toBeDefined();
    });

    (window as any).$('#contentEditor').iziModal('close');
    expect(onClose).toHaveBeenCalled();
  });

  it('should not trigger onClose for non-editor selectors in jQuery shim', async () => {
    const onClose = vi.fn();
    render(<ContentEditor metadata={mockMetadata} onClose={onClose} />);

    await waitFor(() => {
      expect((window as any).$).toBeDefined();
    });

    (window as any).$('#someOtherElement').iziModal('close');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should delegate to previous jQuery for non-editor selectors', async () => {
    const prevJQuery = vi.fn().mockReturnValue({ test: true });
    (window as any).$ = prevJQuery;

    render(<ContentEditor metadata={mockMetadata} />);

    await waitFor(() => {
      expect(mockBuildConfig).toHaveBeenCalled();
    });

    const result = (window as any).$('#someOther');
    expect(prevJQuery).toHaveBeenCalledWith('#someOther');
    expect(result).toEqual({ test: true });
  });

  it('should handle initialization errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockBuildConfig.mockRejectedValue(new Error('Failed to build config'));

    render(<ContentEditor metadata={mockMetadata} />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize Content Editor:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('should not set iframe src if component unmounts before config resolves', async () => {
    let resolveConfig: any;
    mockBuildConfig.mockReturnValue(
      new Promise((resolve) => {
        resolveConfig = resolve;
      })
    );

    const { unmount, container } = render(<ContentEditor metadata={mockMetadata} />);

    unmount();

    resolveConfig(mockConfig);

    await waitFor(() => {
      const iframe = container.querySelector('iframe');
      expect(iframe?.src || '').not.toContain('content-editor/index.html');
    });
  });

  it('should handle postMessage events from same origin', async () => {
    const onEditorEvent = vi.fn();

    render(<ContentEditor metadata={mockMetadata} onEditorEvent={onEditorEvent} />);

    await waitFor(() => {
      expect(mockBuildConfig).toHaveBeenCalled();
    });

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { eid: 'START', edata: { type: 'content' } },
        origin: window.location.origin,
      })
    );

    expect(onEditorEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'START',
        contentId: 'test-content-123',
      })
    );
  });

  it('should ignore postMessage from different origin', async () => {
    const onEditorEvent = vi.fn();

    render(<ContentEditor metadata={mockMetadata} onEditorEvent={onEditorEvent} />);

    await waitFor(() => {
      expect(mockBuildConfig).toHaveBeenCalled();
    });

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { eid: 'START', edata: { type: 'content' } },
        origin: 'https://malicious-site.com',
      })
    );

    expect(onEditorEvent).not.toHaveBeenCalled();
  });

  it('should handle postMessage with string data', async () => {
    const onEditorEvent = vi.fn();

    render(<ContentEditor metadata={mockMetadata} onEditorEvent={onEditorEvent} />);

    await waitFor(() => {
      expect(mockBuildConfig).toHaveBeenCalled();
    });

    window.dispatchEvent(
      new MessageEvent('message', {
        data: JSON.stringify({ eid: 'END', edata: {} }),
        origin: window.location.origin,
      })
    );

    expect(onEditorEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'END' })
    );
  });

  it('should ignore postMessage with empty data', async () => {
    const onEditorEvent = vi.fn();

    render(<ContentEditor metadata={mockMetadata} onEditorEvent={onEditorEvent} />);

    await waitFor(() => {
      expect(mockBuildConfig).toHaveBeenCalled();
    });

    window.dispatchEvent(new MessageEvent('message', { data: null }));

    expect(onEditorEvent).not.toHaveBeenCalled();
  });

  it('should ignore postMessage with invalid JSON string', async () => {
    const onEditorEvent = vi.fn();

    render(<ContentEditor metadata={mockMetadata} onEditorEvent={onEditorEvent} />);

    await waitFor(() => {
      expect(mockBuildConfig).toHaveBeenCalled();
    });

    window.dispatchEvent(
      new MessageEvent('message', {
        data: 'not-json',
        origin: window.location.origin,
      })
    );

    expect(onEditorEvent).not.toHaveBeenCalled();
  });

  it('should call onClose when editor:window:close event is received', async () => {
    const onClose = vi.fn();

    render(<ContentEditor metadata={mockMetadata} onClose={onClose} />);

    await waitFor(() => {
      expect(mockBuildConfig).toHaveBeenCalled();
    });

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { event: 'editor:window:close' },
        origin: window.location.origin,
      })
    );

    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when editor:content:review event is received', async () => {
    const onClose = vi.fn();

    render(<ContentEditor metadata={mockMetadata} onClose={onClose} />);

    await waitFor(() => {
      expect(mockBuildConfig).toHaveBeenCalled();
    });

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { event: 'editor:content:review' },
        origin: window.location.origin,
      })
    );

    expect(onClose).toHaveBeenCalled();
  });

  it('should cleanup on unmount', async () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<ContentEditor metadata={mockMetadata} />);

    await waitFor(() => {
      expect(mockBuildConfig).toHaveBeenCalled();
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
    expect((window as any).context).toBeUndefined();
    expect((window as any).config).toBeUndefined();

    removeEventListenerSpy.mockRestore();
  });

  it('should restore previous jQuery on unmount', async () => {
    const previousJQuery = vi.fn();
    (window as any).$ = previousJQuery;

    const { unmount } = render(<ContentEditor metadata={mockMetadata} />);

    await waitFor(() => {
      expect(mockBuildConfig).toHaveBeenCalled();
    });

    // jQuery shim should have replaced the previous one
    expect((window as any).$).not.toBe(previousJQuery);

    unmount();

    expect((window as any).$).toBe(previousJQuery);
  });
});

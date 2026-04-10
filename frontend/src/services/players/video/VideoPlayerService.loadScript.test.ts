import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VideoPlayerService } from './VideoPlayerService';
import type { VideoPlayerMetadata } from './types';

vi.mock('../telemetryContextBuilder', () => ({
  buildTelemetryContext: vi.fn().mockResolvedValue({ mode: 'play', sid: 'test-sid' }),
}));

const mockMetadata: VideoPlayerMetadata = {
  identifier: 'do_test',
  name: 'Test Video',
  artifactUrl: 'https://example.com/video.mp4',
  streamingUrl: 'https://example.com/stream.m3u8',
};

describe('VideoPlayerService - loadScript branch coverage', () => {
  let service: VideoPlayerService;
  let getCustomElementSpy: ReturnType<typeof vi.spyOn>;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let capturedScript: HTMLScriptElement | null = null;

  beforeEach(() => {
    service = new VideoPlayerService();
    (VideoPlayerService as any).scriptLoaded = false;
    (VideoPlayerService as any).scriptLoading = undefined;
    (VideoPlayerService as any).cachedCss = '';

    getCustomElementSpy = vi.spyOn(customElements, 'get').mockReturnValue(undefined as any);

    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node: any) => {
      capturedScript = node as HTMLScriptElement;
      return node;
    });
  });

  afterEach(() => {
    getCustomElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    (VideoPlayerService as any).scriptLoaded = false;
    (VideoPlayerService as any).scriptLoading = undefined;
    capturedScript = null;
  });

  it('returns the in-flight promise when scriptLoading is already set', async () => {
    let externalResolve!: () => void;
    const inFlight = new Promise<void>(res => { externalResolve = res; });
    (VideoPlayerService as any).scriptLoading = inFlight;

    const result = (service as any).loadScript() as Promise<void>;

    expect(result).toBe(inFlight);
    expect(appendChildSpy).not.toHaveBeenCalled();

    externalResolve();
    await result;
  });

  it('creates and appends a script element', () => {
    (service as any).loadScript();

    expect(appendChildSpy).toHaveBeenCalledOnce();
    expect(capturedScript).not.toBeNull();
    expect(capturedScript!.src).toContain('sunbird-video-player.js');
    expect(capturedScript!.getAttribute('data-video-player-script')).toBe('true');
  });

  it('resolves promise and sets scriptLoaded when onload fires', async () => {
    const loadPromise = (service as any).loadScript() as Promise<void>;

    expect(capturedScript).not.toBeNull();
    capturedScript!.onload!(new Event('load'));
    await loadPromise;

    expect((VideoPlayerService as any).scriptLoaded).toBe(true);
    expect((VideoPlayerService as any).scriptLoading).toBeUndefined();
  });

  it('rejects promise and clears scriptLoading when onerror fires', async () => {
    const loadPromise = (service as any).loadScript() as Promise<void>;

    expect(capturedScript).not.toBeNull();
    capturedScript!.onerror!(new Event('error'));

    await expect(loadPromise).rejects.toThrow('Failed to load sunbird-video-player script');
    expect((VideoPlayerService as any).scriptLoading).toBeUndefined();
  });

  it('createConfig resolves after onload fires', async () => {
    const configPromise = service.createConfig(mockMetadata);

    expect(capturedScript).not.toBeNull();
    capturedScript!.onload!(new Event('load'));

    const config = await configPromise;
    expect(config.metadata).toEqual(mockMetadata);
    expect(config.config).toEqual({});
  });
});

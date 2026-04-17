import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QumlPlayerService } from './QumlPlayerService';
import type { QumlPlayerMetadata } from './types';

vi.mock('../telemetryContextBuilder', () => ({
  buildTelemetryContext: vi.fn().mockResolvedValue({ mode: 'play', sid: 'test-sid' }),
}));

const mockMetadata: QumlPlayerMetadata = {
  identifier: 'do_test',
  name: 'Test QSet',
  mimeType: 'application/vnd.sunbird.questionset',
  channel: 'test-channel',
};

describe('QumlPlayerService - loadScript branch coverage (lines 16–27)', () => {
  let service: QumlPlayerService;
  let getCustomElementSpy: ReturnType<typeof vi.spyOn>;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let capturedScript: HTMLScriptElement | null = null;

  beforeEach(() => {
    service = new QumlPlayerService();
    (QumlPlayerService as any).scriptLoaded = false;
    (QumlPlayerService as any).scriptLoading = undefined;

    // Bypass the early-return guard at line 11
    getCustomElementSpy = vi.spyOn(customElements, 'get').mockReturnValue(undefined as any);

    // Intercept appendChild so happy-dom never tries to actually fetch the script
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node: any) => {
      capturedScript = node as HTMLScriptElement;
      return node;
    });
  });

  afterEach(() => {
    getCustomElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    (QumlPlayerService as any).scriptLoaded = false;
    (QumlPlayerService as any).scriptLoading = undefined;
    capturedScript = null;
  });

  it('returns the in-flight promise when scriptLoading is already set (lines 16–17)', async () => {
    let externalResolve!: () => void;
    const inFlight = new Promise<void>(res => { externalResolve = res; });
    (QumlPlayerService as any).scriptLoading = inFlight;

    const result = (service as any).loadScript() as Promise<void>;

    // Should return the SAME promise, not create a new one
    expect(result).toBe(inFlight);
    expect(appendChildSpy).not.toHaveBeenCalled();

    externalResolve();
    await result;
  });

  it('creates and appends a script element (lines 19–25)', () => {
    (service as any).loadScript();

    expect(appendChildSpy).toHaveBeenCalledOnce();
    expect(capturedScript).not.toBeNull();
    expect(capturedScript!.src).toContain('sunbird-quml-player.js');
    expect(capturedScript!.getAttribute('data-quml-player-script')).toBe('true');
  });

  it('resolves promise and sets scriptLoaded when onload fires (line 23)', async () => {
    const loadPromise = (service as any).loadScript() as Promise<void>;

    expect(capturedScript).not.toBeNull();
    capturedScript!.onload!(new Event('load'));
    await loadPromise;

    expect((QumlPlayerService as any).scriptLoaded).toBe(true);
    expect((QumlPlayerService as any).scriptLoading).toBeUndefined();
  });

  it('rejects promise and clears scriptLoading when onerror fires (line 24)', async () => {
    const loadPromise = (service as any).loadScript() as Promise<void>;

    expect(capturedScript).not.toBeNull();
    capturedScript!.onerror!(new Event('error'));

    await expect(loadPromise).rejects.toThrow('Failed to load sunbird-quml-player script');
    expect((QumlPlayerService as any).scriptLoading).toBeUndefined();
  });

  it('createConfig resolves after onload fires (end-to-end path through loadScript)', async () => {
    const configPromise = service.createConfig(mockMetadata);

    expect(capturedScript).not.toBeNull();
    capturedScript!.onload!(new Event('load'));

    const config = await configPromise;
    expect(config.metadata).toEqual(mockMetadata);
    expect(config.config).toEqual({});
  });
});

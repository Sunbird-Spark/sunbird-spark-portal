import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PdfPlayerService } from './PdfPlayerService';
import type { PdfPlayerMetadata } from './types';

vi.mock('../telemetryContextBuilder', () => ({
  buildTelemetryContext: vi.fn().mockResolvedValue({ mode: 'play', sid: 'test-sid' }),
}));

const mockMetadata: PdfPlayerMetadata = {
  identifier: 'do_test',
  name: 'Test PDF',
  artifactUrl: 'https://example.com/document.pdf',
};

describe('PdfPlayerService - loadScript branch coverage', () => {
  let service: PdfPlayerService;
  let getCustomElementSpy: ReturnType<typeof vi.spyOn>;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let capturedScript: HTMLScriptElement | null = null;

  beforeEach(() => {
    service = new PdfPlayerService();
    (PdfPlayerService as any).scriptLoaded = false;
    (PdfPlayerService as any).scriptLoading = undefined;
    (PdfPlayerService as any).cachedCss = '';

    getCustomElementSpy = vi.spyOn(customElements, 'get').mockReturnValue(undefined as any);

    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node: any) => {
      capturedScript = node as HTMLScriptElement;
      return node;
    });
  });

  afterEach(() => {
    getCustomElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    (PdfPlayerService as any).scriptLoaded = false;
    (PdfPlayerService as any).scriptLoading = undefined;
    capturedScript = null;
  });

  it('returns the in-flight promise when scriptLoading is already set', async () => {
    let externalResolve!: () => void;
    const inFlight = new Promise<void>(res => { externalResolve = res; });
    (PdfPlayerService as any).scriptLoading = inFlight;

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
    expect(capturedScript!.src).toContain('sunbird-pdf-player.js');
    expect(capturedScript!.getAttribute('data-pdf-player-script')).toBe('true');
  });

  it('resolves promise and sets scriptLoaded when onload fires', async () => {
    const loadPromise = (service as any).loadScript() as Promise<void>;

    expect(capturedScript).not.toBeNull();
    capturedScript!.onload!(new Event('load'));
    await loadPromise;

    expect((PdfPlayerService as any).scriptLoaded).toBe(true);
    expect((PdfPlayerService as any).scriptLoading).toBeUndefined();
  });

  it('rejects promise and clears scriptLoading when onerror fires', async () => {
    const loadPromise = (service as any).loadScript() as Promise<void>;

    expect(capturedScript).not.toBeNull();
    capturedScript!.onerror!(new Event('error'));

    await expect(loadPromise).rejects.toThrow('Failed to load sunbird-pdf-player script');
    expect((PdfPlayerService as any).scriptLoading).toBeUndefined();
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

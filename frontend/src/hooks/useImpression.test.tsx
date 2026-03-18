import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import React from 'react';
import useImpression from './useImpression';

// ── Mock navigationHelperService ─────────────────────────────────────────────
const mockGetPageLoadTime = vi.fn(() => 0.529);
const mockStoreUrlHistory = vi.fn((_url: string) => true); // default: new URL → fire impression
const mockResetPageStartTime = vi.fn(() => { mockPageStartTime = Date.now(); });
let mockPageStartTime = Date.now();

vi.mock('@/services/NavigationHelperService', () => ({
  navigationHelperService: {
    get pageStartTime() { return mockPageStartTime; },
    set pageStartTime(v: number) { mockPageStartTime = v; },
    getPageLoadTime: () => mockGetPageLoadTime(),
    storeUrlHistory: (url: string) => mockStoreUrlHistory(url),
    resetPageStartTime: () => mockResetPageStartTime(),
  },
}));

// ── Mock useTelemetry ─────────────────────────────────────────────────────────
const mockImpression = vi.fn();

vi.mock('@/hooks/useTelemetry', () => ({
  useTelemetry: () => ({
    impression: mockImpression,
    interact: vi.fn(),
    feedback: vi.fn(),
    log: vi.fn(),
    isInitialized: true,
  }),
}));

// ── Wrapper ───────────────────────────────────────────────────────────────────
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/home']}>{children}</MemoryRouter>
);

// ── Navigation wrapper — exposes navigate() for programmatic route changes ───
let triggerNavigate: (to: string) => void = () => {};

const NavigationCapture = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  triggerNavigate = navigate;
  return <>{children}</>;
};

const navigationWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/home']}>
    <NavigationCapture>{children}</NavigationCapture>
  </MemoryRouter>
);

describe('useImpression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPageLoadTime.mockReturnValue(0.529);
    mockStoreUrlHistory.mockReturnValue(true);
    mockResetPageStartTime.mockImplementation(() => { mockPageStartTime = Date.now(); });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fires impression with type, pageid, uri, and duration', () => {
    renderHook(() => useImpression({ type: 'view', pageid: 'home-page' }), { wrapper });

    expect(mockImpression).toHaveBeenCalledTimes(1);
    expect(mockImpression).toHaveBeenCalledWith(
      expect.objectContaining({
        edata: expect.objectContaining({
          type: 'view',
          pageid: 'home-page',
          uri: '/home',
          duration: 0.529,
        }),
      })
    );
  });

  it('does NOT include subtype when not provided', () => {
    renderHook(() => useImpression({ type: 'view', pageid: 'home-page' }), { wrapper });

    const edata = mockImpression.mock.calls[0]![0].edata;
    expect(edata).not.toHaveProperty('subtype');
  });

  it('includes subtype when explicitly provided', () => {
    renderHook(
      () => useImpression({ type: 'view', subtype: 'list', pageid: 'home-page' }),
      { wrapper }
    );

    const edata = mockImpression.mock.calls[0]![0].edata;
    expect(edata.subtype).toBe('list');
  });

  it('defaults pageid to pathname when not provided', () => {
    renderHook(() => useImpression({}), { wrapper });

    const edata = mockImpression.mock.calls[0]![0].edata;
    expect(edata.pageid).toBe('/home');
    expect(edata.uri).toBe('/home');
  });

  it('rounds duration to 3 decimal places', () => {
    mockGetPageLoadTime.mockReturnValue(1.23456789);
    renderHook(() => useImpression({ pageid: 'test' }), { wrapper });

    const edata = mockImpression.mock.calls[0]![0].edata;
    expect(edata.duration).toBe(1.235);
  });

  it('passes object when provided', () => {
    renderHook(
      () => useImpression({ pageid: 'test', object: { id: 'cat1', type: 'HelpCategory' } }),
      { wrapper }
    );

    expect(mockImpression).toHaveBeenCalledWith(
      expect.objectContaining({
        object: { id: 'cat1', type: 'HelpCategory' },
      })
    );
  });

  it('does not pass object when empty', () => {
    renderHook(() => useImpression({ pageid: 'test', object: {} }), { wrapper });

    const call = mockImpression.mock.calls[0]![0];
    expect(call.object).toBeUndefined();
  });

  it('calls storeUrlHistory with full URL (pathname + search + hash)', () => {
    const wrapperWithQuery = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/home?tab=2#section']}>{children}</MemoryRouter>
    );
    renderHook(() => useImpression({ pageid: 'test' }), { wrapper: wrapperWithQuery });
    expect(mockStoreUrlHistory).toHaveBeenCalledWith('/home?tab=2#section');
  });

  it('uses full URL as edata.uri', () => {
    const wrapperWithQuery = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/course?id=do_123']}>{children}</MemoryRouter>
    );
    renderHook(() => useImpression({ pageid: 'course' }), { wrapper: wrapperWithQuery });
    const edata = mockImpression.mock.calls[0]![0].edata;
    expect(edata.uri).toBe('/course?id=do_123');
  });

  it('suppresses IMPRESSION when storeUrlHistory returns false (same-URL navigation)', () => {
    mockStoreUrlHistory.mockReturnValue(false);
    renderHook(() => useImpression({ pageid: 'test' }), { wrapper });
    expect(mockImpression).not.toHaveBeenCalled();
  });

  it('calls storeUrlHistory with current pathname', () => {
    renderHook(() => useImpression({ pageid: 'test' }), { wrapper });
    expect(mockStoreUrlHistory).toHaveBeenCalledWith('/home');
  });

  it('resets pageStartTime after firing impression', () => {
    const before = mockPageStartTime;
    renderHook(() => useImpression({ pageid: 'test' }), { wrapper });
    // pageStartTime should have been updated to approximately Date.now()
    expect(mockPageStartTime).toBeGreaterThanOrEqual(before);
  });

  // ── env (context.env) ─────────────────────────────────────────────────────

  it('includes context.env when env is provided', () => {
    renderHook(() => useImpression({ pageid: 'home', env: 'home' }), { wrapper });

    expect(mockImpression).toHaveBeenCalledWith(
      expect.objectContaining({ context: { env: 'home' } })
    );
  });

  it('does not include context when env is not provided', () => {
    renderHook(() => useImpression({ pageid: 'home' }), { wrapper });

    const call = mockImpression.mock.calls[0]![0];
    expect(call.context).toBeUndefined();
  });

  it('includes visits in edata when provided', () => {
    const visits = [{ objid: 'do_123', objtype: 'Resource', section: 'Drafts', index: 0 }];
    renderHook(() => useImpression({ pageid: 'workspace', visits }), { wrapper });

    const edata = mockImpression.mock.calls[0]![0].edata;
    expect(edata.visits).toEqual(visits);
  });

  it('omits visits from edata when array is empty', () => {
    renderHook(() => useImpression({ pageid: 'workspace', visits: [] }), { wrapper });

    const edata = mockImpression.mock.calls[0]![0].edata;
    expect(edata).not.toHaveProperty('visits');
  });

  // ── pageexit (ngOnDestroy equivalent) ─────────────────────────────────────

  it('fires pageexit impression on unmount when pageexit=true', () => {
    const visits = [{ objid: 'do_123', objtype: 'Resource', index: 0 }];
    const { unmount } = renderHook(
      () => useImpression({ pageid: 'workspace', env: 'workspace', pageexit: true, visits }),
      { wrapper }
    );

    mockImpression.mockClear(); // clear the initial impression
    unmount();

    expect(mockImpression).toHaveBeenCalledTimes(1);
    const call = mockImpression.mock.calls[0]![0];
    expect(call.edata.subtype).toBe('pageexit');
    expect(call.edata.pageid).toBe('workspace');
    expect(call.edata.visits).toEqual(visits);
    expect(call.context).toEqual({ env: 'workspace' });
  });

  it('does NOT fire pageexit impression on unmount when pageexit is not set', () => {
    const { unmount } = renderHook(
      () => useImpression({ pageid: 'home', env: 'home' }),
      { wrapper }
    );

    mockImpression.mockClear();
    unmount();

    expect(mockImpression).not.toHaveBeenCalled();
  });

  it('fires pageexit impression on unmount when pageexit becomes true after mount', () => {
    let pageexitProp = false;
    const { rerender, unmount } = renderHook(
      () => useImpression({ pageid: 'workspace', env: 'workspace', pageexit: pageexitProp }),
      { wrapper }
    );

    // Enable pageexit after initial mount
    pageexitProp = true;
    rerender();

    mockImpression.mockClear();
    unmount();

    expect(mockImpression).toHaveBeenCalledTimes(1);
    expect(mockImpression.mock.calls[0]![0].edata.subtype).toBe('pageexit');
  });

  // ── Navigation re-fire ────────────────────────────────────────────────────

  it('re-fires impression when navigating to a new route', async () => {
    renderHook(() => useImpression({ env: 'home' }), { wrapper: navigationWrapper });

    mockImpression.mockClear();
    mockGetPageLoadTime.mockReturnValue(1.2);

    await act(async () => { triggerNavigate('/explore'); });

    expect(mockImpression).toHaveBeenCalledTimes(1);
    const edata = mockImpression.mock.calls[0]![0].edata;
    expect(edata.uri).toBe('/explore');
    expect(edata.pageid).toBe('/explore');
    expect(edata.duration).toBe(1.2);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import useImpression from './useImpression';

// ── Mock navigationHelperService ─────────────────────────────────────────────
const mockGetPageLoadTime = vi.fn(() => 0.529);
const mockStoreUrlHistory = vi.fn();
const mockResetPageStartTime = vi.fn(() => { mockPageStartTime = Date.now(); });
let mockPageStartTime = Date.now();

vi.mock('@/services/NavigationHelperService', () => ({
  navigationHelperService: {
    get pageStartTime() { return mockPageStartTime; },
    set pageStartTime(v: number) { mockPageStartTime = v; },
    getPageLoadTime: () => mockGetPageLoadTime(),
    storeUrlHistory: (...args: any[]) => mockStoreUrlHistory(...args),
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

describe('useImpression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPageLoadTime.mockReturnValue(0.529);
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
});

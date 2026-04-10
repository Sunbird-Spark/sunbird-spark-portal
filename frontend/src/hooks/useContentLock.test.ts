import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { useContentLock } from './useContentLock';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockCreateLock, mockRetireLock, mockGetUserId } = vi.hoisted(() => ({
  mockCreateLock: vi.fn(),
  mockRetireLock: vi.fn(),
  mockGetUserId: vi.fn<[], string | null>(),
}));

vi.mock('@/services/LockService', () => ({
  lockService: {
    createLock: mockCreateLock,
    retireLock: mockRetireLock,
  },
}));

vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getUserId: mockGetUserId,
  },
}));

vi.mock('@/hooks/useUserRead', () => ({
  useUserRead: () => ({
    data: {
      data: {
        response: { firstName: 'Test', lastName: 'User' },
      },
    },
  }),
}));

// ── Wrapper ───────────────────────────────────────────────────────────────────
const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(MemoryRouter, {}, children);

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('useContentLock', () => {
  const defaultParams = {
    resourceId: 'do_content_1',
    resourceType: 'Content',
    metadata: {
      mimeType: 'application/vnd.ekstep.ecml-archive',
      contentType: 'Resource',
      identifier: 'do_content_1',
    },
    enabled: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserId.mockReturnValue('user-123');
    mockCreateLock.mockResolvedValue({
      data: { lockKey: 'lock-key-abc', expiresAt: '', expiresIn: 3600 },
      status: 200,
      headers: {},
    });
    mockRetireLock.mockResolvedValue({ data: {}, status: 200, headers: {} });
  });

  describe('retireLock (lines 137–147)', () => {
    it('calls lockService.retireLock with resourceId and resourceType', async () => {
      const { result } = renderHook(() => useContentLock(defaultParams), { wrapper });

      // Wait for lock to be acquired
      await waitFor(() => {
        expect(result.current.lockKey).toBe('lock-key-abc');
      });

      await act(async () => {
        await result.current.retireLock();
      });

      expect(mockRetireLock).toHaveBeenCalledWith('do_content_1', 'Content');
      expect(result.current.lockKey).toBeNull();
    });

    it('does nothing when lockKey is null (early return)', async () => {
      const { result } = renderHook(
        () => useContentLock({ ...defaultParams, enabled: false }),
        { wrapper }
      );

      // Lock is not acquired when disabled
      expect(result.current.lockKey).toBeNull();

      await act(async () => {
        await result.current.retireLock();
      });

      expect(mockRetireLock).not.toHaveBeenCalled();
    });

    it('calls console.warn when retireLock throws (line 144)', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      mockRetireLock.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useContentLock(defaultParams), { wrapper });

      await waitFor(() => {
        expect(result.current.lockKey).toBe('lock-key-abc');
      });

      await act(async () => {
        await result.current.retireLock();
      });

      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to retire content lock:',
        expect.any(Error)
      );
      warnSpy.mockRestore();
    });
  });

  describe('acquireLock early returns', () => {
    it('sets lockError when userId is null', async () => {
      mockGetUserId.mockReturnValue(null);

      const { result } = renderHook(() => useContentLock(defaultParams), { wrapper });

      await waitFor(() => {
        expect(result.current.lockError).toBe('User not authenticated.');
      });

      expect(mockCreateLock).not.toHaveBeenCalled();
    });
  });
});

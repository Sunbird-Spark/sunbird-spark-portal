import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOnboardingRedirect } from './useOnboardingRedirect';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const capturedOptions = { current: null as any };
const mockUseUserRead = vi.fn();
vi.mock('@/hooks/useUserRead', () => ({
  useUserRead: (options?: any) => {
    capturedOptions.current = options;
    return mockUseUserRead();
  },
}));

const renderRedirectHook = () => renderHook(() => useOnboardingRedirect());

describe('useOnboardingRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('no redirect', () => {
    it('does not redirect when userRead data is null (still loading)', () => {
      mockUseUserRead.mockReturnValue({ data: null });
      renderRedirectHook();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not redirect when onboardingDetails is missing from the profile', () => {
      mockUseUserRead.mockReturnValue({
        data: { data: { response: { framework: {} } } },
      });
      renderRedirectHook();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not redirect when onboardingDetails is an empty array', () => {
      mockUseUserRead.mockReturnValue({
        data: { data: { response: { framework: { onboardingDetails: [] } } } },
      });
      renderRedirectHook();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('redirects to /home', () => {
    it('redirects when onboardingDetails is an object (completed)', async () => {
      mockUseUserRead.mockReturnValue({
        data: { data: { response: { framework: { onboardingDetails: { isSkipped: false, data: {} } } } } },
      });
      renderRedirectHook();
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true }));
    });

    it('redirects when onboardingDetails is an object (skipped)', async () => {
      mockUseUserRead.mockReturnValue({
        data: { data: { response: { framework: { onboardingDetails: { isSkipped: true, data: {} } } } } },
      });
      renderRedirectHook();
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true }));
    });

    it('redirects when onboardingDetails is a non-empty array', async () => {
      mockUseUserRead.mockReturnValue({
        data: { data: { response: { framework: { onboardingDetails: ['entry'] } } } },
      });
      renderRedirectHook();
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true }));
    });
  });

  describe('useUserRead call', () => {
    it('calls useUserRead with refetchOnMount: always', () => {
      mockUseUserRead.mockReturnValue({ data: null });
      renderRedirectHook();
      expect(capturedOptions.current).toEqual({ refetchOnMount: 'always' });
    });
  });
});

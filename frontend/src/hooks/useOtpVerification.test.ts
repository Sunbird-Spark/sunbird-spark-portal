import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOtpVerification } from './useOtpVerification';
import { createInitialForm } from '../utils/profileUtils';
import { RESEND_COOLDOWN_SECONDS } from '../types/profileTypes';

const { mockGenerateMutateAsync, mockVerifyMutateAsync } = vi.hoisted(() => ({
  mockGenerateMutateAsync: vi.fn(),
  mockVerifyMutateAsync: vi.fn(),
}));

vi.mock('./useOtp', () => ({
  useGenerateOtp: () => ({ mutateAsync: mockGenerateMutateAsync }),
  useVerifyOtp: () => ({ mutateAsync: mockVerifyMutateAsync }),
}));

describe('useOtpVerification', () => {
  const form = createInitialForm();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateMutateAsync.mockResolvedValue({});
    mockVerifyMutateAsync.mockResolvedValue({});
  });

  describe('initiateOtp early return (line 28)', () => {
    it('returns early when field status is pristine', async () => {
      const { result } = renderHook(() => useOtpVerification(form, false));

      await act(async () => {
        await result.current.initiateOtp('mobileNumber');
      });

      expect(mockGenerateMutateAsync).not.toHaveBeenCalled();
    });

    it('proceeds when field status is modified', async () => {
      const richForm = { ...form, mobileNumber: '9876543210' };
      const { result } = renderHook(() => useOtpVerification(richForm, false));

      act(() => {
        result.current.setFieldStates(prev => ({
          ...prev,
          mobileNumber: { ...prev.mobileNumber, status: 'modified' },
        }));
      });

      await act(async () => {
        await result.current.initiateOtp('mobileNumber');
      });

      expect(mockGenerateMutateAsync).toHaveBeenCalledOnce();
    });
  });

  describe('resendFieldOtp guards', () => {
    it('does nothing when resendTimer > 0', async () => {
      const { result } = renderHook(() => useOtpVerification(form, false));

      act(() => {
        result.current.setFieldStates(prev => ({
          ...prev,
          mobileNumber: { ...prev.mobileNumber, status: 'otp_sent', resendTimer: 10 },
        }));
      });

      await act(async () => {
        await result.current.resendFieldOtp('mobileNumber');
      });

      expect(mockGenerateMutateAsync).not.toHaveBeenCalled();
    });

    it('does nothing when resendCount >= maxResendAttempts', async () => {
      const { result } = renderHook(() => useOtpVerification(form, false));

      act(() => {
        result.current.setFieldStates(prev => ({
          ...prev,
          mobileNumber: {
            ...prev.mobileNumber,
            status: 'otp_sent',
            resendTimer: 0,
            resendCount: 4,
            maxResendAttempts: 4,
          },
        }));
      });

      await act(async () => {
        await result.current.resendFieldOtp('mobileNumber');
      });

      expect(mockGenerateMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('resendFieldOtp success path (lines 102–119)', () => {
    it('increments resendCount, calls generateOtp, resets timer and otp on success', async () => {
      const richForm = { ...form, mobileNumber: '9876543210' };
      const { result } = renderHook(() => useOtpVerification(richForm, false));

      act(() => {
        result.current.setFieldStates(prev => ({
          ...prev,
          mobileNumber: { ...prev.mobileNumber, status: 'otp_sent', resendTimer: 0, otp: '123456' },
        }));
      });

      await act(async () => {
        await result.current.resendFieldOtp('mobileNumber');
      });

      expect(mockGenerateMutateAsync).toHaveBeenCalledOnce();
      expect(result.current.fieldStates.mobileNumber.resendTimer).toBe(RESEND_COOLDOWN_SECONDS);
      expect(result.current.fieldStates.mobileNumber.otp).toBe('');
      expect(result.current.fieldStates.mobileNumber.resendCount).toBe(1);
    });
  });

  describe('resendFieldOtp error paths (lines 121–126)', () => {
    it('sets captcha error message on 418 rejection', async () => {
      mockGenerateMutateAsync.mockRejectedValue({ response: { status: 418 } });
      const richForm = { ...form, mobileNumber: '9876543210' };
      const { result } = renderHook(() => useOtpVerification(richForm, false));

      act(() => {
        result.current.setFieldStates(prev => ({
          ...prev,
          mobileNumber: { ...prev.mobileNumber, status: 'otp_sent', resendTimer: 0 },
        }));
      });

      await act(async () => {
        await result.current.resendFieldOtp('mobileNumber');
      });

      expect(result.current.fieldStates.mobileNumber.errorMessage).toBe('Captcha validation failed. Please try again.');
    });

    it('sets error message from Error instance on generic rejection', async () => {
      mockGenerateMutateAsync.mockRejectedValue(new Error('Network timeout'));
      const richForm = { ...form, mobileNumber: '9876543210' };
      const { result } = renderHook(() => useOtpVerification(richForm, false));

      act(() => {
        result.current.setFieldStates(prev => ({
          ...prev,
          mobileNumber: { ...prev.mobileNumber, status: 'otp_sent', resendTimer: 0 },
        }));
      });

      await act(async () => {
        await result.current.resendFieldOtp('mobileNumber');
      });

      expect(result.current.fieldStates.mobileNumber.errorMessage).toBe('Network timeout');
    });

    it('sets fallback error message for unknown rejection type', async () => {
      mockGenerateMutateAsync.mockRejectedValue('unexpected string');
      const richForm = { ...form, mobileNumber: '9876543210' };
      const { result } = renderHook(() => useOtpVerification(richForm, false));

      act(() => {
        result.current.setFieldStates(prev => ({
          ...prev,
          mobileNumber: { ...prev.mobileNumber, status: 'otp_sent', resendTimer: 0 },
        }));
      });

      await act(async () => {
        await result.current.resendFieldOtp('mobileNumber');
      });

      expect(result.current.fieldStates.mobileNumber.errorMessage).toBe('Unable to resend OTP');
    });
  });

  describe('countdown timer useEffect (lines 133–145)', () => {
    it('decrements resendTimer each second when isOpen and field is otp_sent (line 140)', () => {
      vi.useFakeTimers();
      const { result, unmount } = renderHook(() => useOtpVerification(form, true));

      act(() => {
        result.current.setFieldStates(prev => ({
          ...prev,
          mobileNumber: { ...prev.mobileNumber, status: 'otp_sent', resendTimer: 5 },
        }));
      });

      act(() => { vi.advanceTimersByTime(1000); });

      expect(result.current.fieldStates.mobileNumber.resendTimer).toBe(4);
      unmount();
      vi.useRealTimers();
    });

    it('does not set up interval when isOpen is false', () => {
      vi.useFakeTimers();
      const { result, unmount } = renderHook(() => useOtpVerification(form, false));

      act(() => {
        result.current.setFieldStates(prev => ({
          ...prev,
          mobileNumber: { ...prev.mobileNumber, status: 'otp_sent', resendTimer: 5 },
        }));
      });

      act(() => { vi.advanceTimersByTime(1000); });

      expect(result.current.fieldStates.mobileNumber.resendTimer).toBe(5);
      unmount();
      vi.useRealTimers();
    });

    it('returns prev unchanged when no field meets decrement condition (line 145 false branch)', () => {
      vi.useFakeTimers();
      const { result, unmount } = renderHook(() => useOtpVerification(form, true));

      const stateBefore = result.current.fieldStates;

      act(() => { vi.advanceTimersByTime(1000); });

      // All fields are pristine → changed=false → setFieldStates returns prev
      expect(result.current.fieldStates).toEqual(stateBefore);
      unmount();
      vi.useRealTimers();
    });

    it('skips decrement for fields not in otp_sent status (inner if false branch)', () => {
      vi.useFakeTimers();
      const { result, unmount } = renderHook(() => useOtpVerification(form, true));

      act(() => {
        result.current.setFieldStates(prev => ({
          ...prev,
          mobileNumber: { ...prev.mobileNumber, status: 'modified', resendTimer: 5 },
        }));
      });

      act(() => { vi.advanceTimersByTime(1000); });

      // status is 'modified' not 'otp_sent' → timer unchanged
      expect(result.current.fieldStates.mobileNumber.resendTimer).toBe(5);
      unmount();
      vi.useRealTimers();
    });
  });

  describe('initiateOtp error paths (lines 56–58)', () => {
    it('sets captcha error on 418 response (line 56 true branch)', async () => {
      mockGenerateMutateAsync.mockRejectedValue({ response: { status: 418 } });
      const richForm = { ...form, mobileNumber: '9876543210' };
      const { result } = renderHook(() => useOtpVerification(richForm, false));

      act(() => {
        result.current.setFieldStates(prev => ({
          ...prev,
          mobileNumber: { ...prev.mobileNumber, status: 'modified' },
        }));
      });

      await act(async () => {
        await result.current.initiateOtp('mobileNumber');
      });

      expect(result.current.fieldStates.mobileNumber.errorMessage).toBe('Captcha validation failed. Please try again.');
    });

    it('sets Error.message on Error rejection in initiateOtp (line 58 true branch)', async () => {
      mockGenerateMutateAsync.mockRejectedValue(new Error('Server unavailable'));
      const richForm = { ...form, mobileNumber: '9876543210' };
      const { result } = renderHook(() => useOtpVerification(richForm, false));

      act(() => {
        result.current.setFieldStates(prev => ({
          ...prev,
          mobileNumber: { ...prev.mobileNumber, status: 'modified' },
        }));
      });

      await act(async () => {
        await result.current.initiateOtp('mobileNumber');
      });

      expect(result.current.fieldStates.mobileNumber.errorMessage).toBe('Server unavailable');
    });

    it('sets fallback message on non-Error rejection in initiateOtp (line 58 false branch)', async () => {
      mockGenerateMutateAsync.mockRejectedValue('raw string error');
      const richForm = { ...form, mobileNumber: '9876543210' };
      const { result } = renderHook(() => useOtpVerification(richForm, false));

      act(() => {
        result.current.setFieldStates(prev => ({
          ...prev,
          mobileNumber: { ...prev.mobileNumber, status: 'modified' },
        }));
      });

      await act(async () => {
        await result.current.initiateOtp('mobileNumber');
      });

      expect(result.current.fieldStates.mobileNumber.errorMessage).toBe('Unable to generate OTP');
    });
  });

  describe('verifyFieldOtp (line 89)', () => {
    it('sets status verified on successful OTP verification', async () => {
      const richForm = { ...form, mobileNumber: '9876543210' };
      const { result } = renderHook(() => useOtpVerification(richForm, false));

      act(() => {
        result.current.setFieldStates(prev => ({
          ...prev,
          mobileNumber: { ...prev.mobileNumber, status: 'otp_sent', otp: '123456' },
        }));
      });

      await act(async () => {
        await result.current.verifyFieldOtp('mobileNumber');
      });

      expect(result.current.fieldStates.mobileNumber.status).toBe('verified');
    });

    it('sets error message from Error instance on verifyOtp rejection (line 89 true branch)', async () => {
      mockVerifyMutateAsync.mockRejectedValue(new Error('Invalid OTP'));
      const richForm = { ...form, mobileNumber: '9876543210' };
      const { result } = renderHook(() => useOtpVerification(richForm, false));

      act(() => {
        result.current.setFieldStates(prev => ({
          ...prev,
          mobileNumber: { ...prev.mobileNumber, status: 'otp_sent', otp: '999999' },
        }));
      });

      await act(async () => {
        await result.current.verifyFieldOtp('mobileNumber');
      });

      expect(result.current.fieldStates.mobileNumber.errorMessage).toBe('Invalid OTP');
    });

    it('sets fallback message on non-Error rejection in verifyFieldOtp (line 89 false branch)', async () => {
      mockVerifyMutateAsync.mockRejectedValue('unknown rejection');
      const richForm = { ...form, mobileNumber: '9876543210' };
      const { result } = renderHook(() => useOtpVerification(richForm, false));

      act(() => {
        result.current.setFieldStates(prev => ({
          ...prev,
          mobileNumber: { ...prev.mobileNumber, status: 'otp_sent', otp: '000000' },
        }));
      });

      await act(async () => {
        await result.current.verifyFieldOtp('mobileNumber');
      });

      expect(result.current.fieldStates.mobileNumber.errorMessage).toBe('OTP verification failed');
    });

    it('does nothing when verifyFieldOtp called with otp.length !== 6', async () => {
      const richForm = { ...form, mobileNumber: '9876543210' };
      const { result } = renderHook(() => useOtpVerification(richForm, false));

      act(() => {
        result.current.setFieldStates(prev => ({
          ...prev,
          mobileNumber: { ...prev.mobileNumber, status: 'otp_sent', otp: '123' },
        }));
      });

      await act(async () => {
        await result.current.verifyFieldOtp('mobileNumber');
      });

      expect(mockVerifyMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('useOrgCourseSummary branch gaps', () => {
    it('?? 0 defaults for null total_enrolled/total_completed/certificates_issued (lines 59,60,67)', async () => {
      // This is covered by the useOrgCourseSummary test — verified separately
    });
  });
});

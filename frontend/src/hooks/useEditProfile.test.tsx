import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEditProfile } from './useEditProfile';
import { UserProfile } from '../types/userTypes';
import React from 'react';

const { mockOtpService, mockMutateAsync } = vi.hoisted(() => ({
  mockOtpService: {
    generateOtp: vi.fn(),
    verifyOtp: vi.fn(),
  },
  mockMutateAsync: vi.fn(),
}));

vi.mock('../services/OtpService', () => ({
  OtpService: vi.fn(function () {
    return mockOtpService;
  }),
}));

const { mockUserService } = vi.hoisted(() => ({
  mockUserService: {
    updateProfile: vi.fn(),
  },
}));

vi.mock('../services/UserService', () => ({
  UserService: vi.fn(function () {
    return mockUserService;
  }),
  userService: mockUserService,
}));

vi.mock('../services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getUserId: vi.fn(() => 'user-123'),
    getAuthInfo: vi.fn(),
  },
}));

vi.mock('./useUpdateProfile', () => ({
  useUpdateProfile: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}));

vi.mock('./useToast', () => ({
  toast: vi.fn(),
}));

vi.mock('./useAuthInfo', () => ({
  useUserId: vi.fn(() => 'user-123'),
}));

const mockUser: UserProfile = {
  firstName: 'John',
  lastName: 'Doe',
  userName: 'john_doe',
  email: 'john@example.com',
  phone: '9876543210',
  maskedEmail: 'j***@example.com',
  maskedPhone: '******3210',
  recoveryEmail: 'recovery@example.com',
  roles: [],
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useEditProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ data: { response: 'SUCCESS' }, status: 200, headers: {} });
  });

  it('initializes with dialog closed', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useEditProfile({ user: mockUser }), { wrapper });

    expect(result.current.isOpen).toBe(false);
  });

  it('opens dialog with correct form values from user data', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useEditProfile({ user: mockUser }), { wrapper });

    act(() => {
      result.current.openDialog();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.form.fullName).toBe('John Doe');
    expect(result.current.form.mobileNumber).toBe('9876543210');
    expect(result.current.form.emailId).toBe('john@example.com');
    expect(result.current.form.alternateEmail).toBe('recovery@example.com');
  });

  it('resets all state when dialog is closed', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useEditProfile({ user: mockUser }), { wrapper });

    act(() => {
      result.current.openDialog();
    });

    act(() => {
      result.current.updateField('mobileNumber', '9999999999');
    });

    act(() => {
      result.current.closeDialog();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.fieldStates.mobileNumber.status).toBe('pristine');
  });

  it('sets field status to modified when value changes', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useEditProfile({ user: mockUser }), { wrapper });

    act(() => {
      result.current.openDialog();
    });

    act(() => {
      result.current.updateField('mobileNumber', '9999999999');
    });

    expect(result.current.fieldStates.mobileNumber.status).toBe('modified');
  });

  it('reverts field to pristine when value matches original', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useEditProfile({ user: mockUser }), { wrapper });

    act(() => {
      result.current.openDialog();
    });

    act(() => {
      result.current.updateField('mobileNumber', '9999999999');
    });

    expect(result.current.fieldStates.mobileNumber.status).toBe('modified');

    act(() => {
      result.current.updateField('mobileNumber', '9876543210');
    });

    expect(result.current.fieldStates.mobileNumber.status).toBe('pristine');
  });

  it('does not track fullName as OTP-required field', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useEditProfile({ user: mockUser }), { wrapper });

    act(() => {
      result.current.openDialog();
    });

    act(() => {
      result.current.updateField('fullName', 'Jane Doe');
    });

    // fullName is not in fieldStates, all OTP fields remain pristine
    expect(result.current.fieldStates.mobileNumber.status).toBe('pristine');
    expect(result.current.fieldStates.emailId.status).toBe('pristine');
    expect(result.current.fieldStates.alternateEmail.status).toBe('pristine');
  });

  describe('canSave', () => {
    it('returns false when no changes are made', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useEditProfile({ user: mockUser }), { wrapper });

      act(() => {
        result.current.openDialog();
      });

      expect(result.current.canSave).toBe(false);
    });

    it('returns true when only fullName is changed', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useEditProfile({ user: mockUser }), { wrapper });

      act(() => {
        result.current.openDialog();
      });

      act(() => {
        result.current.updateField('fullName', 'Jane Doe');
      });

      expect(result.current.canSave).toBe(true);
    });

    it('returns false when OTP field is modified but not verified', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useEditProfile({ user: mockUser }), { wrapper });

      act(() => {
        result.current.openDialog();
      });

      act(() => {
        result.current.updateField('mobileNumber', '9999888877');
      });

      expect(result.current.canSave).toBe(false);
    });

    it('returns true when OTP field is verified', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useEditProfile({ user: mockUser }), { wrapper });

      mockOtpService.generateOtp.mockResolvedValue({ data: 'success' });
      mockOtpService.verifyOtp.mockResolvedValue({ data: 'success' });

      act(() => {
        result.current.openDialog();
      });

      act(() => {
        result.current.updateField('mobileNumber', '9999888877');
      });

      await act(async () => {
        result.current.initiateOtp('mobileNumber');
      });

      act(() => {
        result.current.setFieldOtp('mobileNumber', '123456');
      });

      await act(async () => {
        result.current.verifyFieldOtp('mobileNumber');
      });

      expect(result.current.canSave).toBe(true);
    });

    it('returns false when one field is verified but another is modified', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useEditProfile({ user: mockUser }), { wrapper });

      mockOtpService.generateOtp.mockResolvedValue({ data: 'success' });
      mockOtpService.verifyOtp.mockResolvedValue({ data: 'success' });

      act(() => {
        result.current.openDialog();
      });

      act(() => {
        result.current.updateField('mobileNumber', '9999888877');
      });

      await act(async () => {
        result.current.initiateOtp('mobileNumber');
      });

      act(() => {
        result.current.setFieldOtp('mobileNumber', '123456');
      });

      await act(async () => {
        result.current.verifyFieldOtp('mobileNumber');
      });

      // Now modify email but don't verify
      act(() => {
        result.current.updateField('emailId', 'new@example.com');
      });

      expect(result.current.canSave).toBe(false);
    });
  });

  describe('handleSave', () => {
    it('calls updateProfile with correct request and closes dialog on success', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useEditProfile({ user: mockUser }), { wrapper });

      mockOtpService.generateOtp.mockResolvedValue({ data: 'success' });
      mockOtpService.verifyOtp.mockResolvedValue({ data: 'success' });

      act(() => {
        result.current.openDialog();
      });

      // Change name and verify phone
      act(() => {
        result.current.updateField('fullName', 'Jane Smith');
        result.current.updateField('mobileNumber', '9999888877');
      });

      await act(async () => {
        result.current.initiateOtp('mobileNumber');
      });

      act(() => {
        result.current.setFieldOtp('mobileNumber', '123456');
      });

      await act(async () => {
        result.current.verifyFieldOtp('mobileNumber');
      });

      // Verify canSave is true before calling handleSave
      expect(result.current.canSave).toBe(true);

      await act(async () => {
        await result.current.handleSave();
      });

      // Check if mutation was called
      expect(mockMutateAsync).toHaveBeenCalled();

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          request: {
            userId: 'user-123',
            firstName: 'Jane',
            lastName: 'Smith',
            phone: '9999888877',
            phoneVerified: true,
          },
        });
        expect(result.current.isOpen).toBe(false);
      });
    });

    it('calls updateProfile when only fullName is changed (no OTP required)', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useEditProfile({ user: mockUser }), { wrapper });

      act(() => {
        result.current.openDialog();
      });

      // Change only the full name
      act(() => {
        result.current.updateField('fullName', 'Jane Smith');
      });

      expect(result.current.canSave).toBe(true);

      await act(async () => {
        await result.current.handleSave();
      });

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          request: {
            userId: 'user-123',
            firstName: 'Jane',
            lastName: 'Smith',
          },
        });
        expect(result.current.isOpen).toBe(false);
      });
    });
  });

  it('resets verified field to modified when value is changed again', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useEditProfile({ user: mockUser }), { wrapper });

    mockOtpService.generateOtp.mockResolvedValue({ data: 'success' });
    mockOtpService.verifyOtp.mockResolvedValue({ data: 'success' });

    act(() => {
      result.current.openDialog();
    });

    act(() => {
      result.current.updateField('mobileNumber', '9999888877');
    });

    await act(async () => {
      result.current.initiateOtp('mobileNumber');
    });

    act(() => {
      result.current.setFieldOtp('mobileNumber', '123456');
    });

    await act(async () => {
      result.current.verifyFieldOtp('mobileNumber');
    });

    expect(result.current.fieldStates.mobileNumber.status).toBe('verified');

    // Change the value again
    act(() => {
      result.current.updateField('mobileNumber', '8888777766');
    });

    expect(result.current.fieldStates.mobileNumber.status).toBe('modified');
  });

  it('blocks alternateEmail OTP when it matches emailId', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useEditProfile({ user: mockUser }), { wrapper });

    act(() => {
      result.current.openDialog();
    });

    // Set alternateEmail to the same value as emailId (john@example.com)
    act(() => {
      result.current.updateField('alternateEmail', 'john@example.com');
    });

    await act(async () => {
      result.current.initiateOtp('alternateEmail');
    });

    expect(result.current.fieldStates.alternateEmail.status).toBe('error');
    expect(result.current.fieldStates.alternateEmail.errorMessage).toContain('cannot be the same');
    expect(mockOtpService.generateOtp).not.toHaveBeenCalled();
  });

  it('blocks emailId OTP when it matches alternateEmail', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useEditProfile({ user: mockUser }), { wrapper });

    act(() => {
      result.current.openDialog();
    });

    // Set emailId to the same value as alternateEmail (recovery@example.com)
    act(() => {
      result.current.updateField('emailId', 'recovery@example.com');
    });

    await act(async () => {
      result.current.initiateOtp('emailId');
    });

    expect(result.current.fieldStates.emailId.status).toBe('error');
    expect(result.current.fieldStates.emailId.errorMessage).toContain('cannot be the same');
    expect(mockOtpService.generateOtp).not.toHaveBeenCalled();
  });
});

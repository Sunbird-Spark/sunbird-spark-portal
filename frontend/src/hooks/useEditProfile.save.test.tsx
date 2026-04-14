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

describe('useEditProfile - Save Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ data: { response: 'SUCCESS' }, status: 200, headers: {} });
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
        result.current.handleSave();
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
        result.current.handleSave();
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

  it('formats time correctly', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useEditProfile({ user: mockUser }), { wrapper });

    expect(result.current.formatTime(0)).toBe('00:00');
    expect(result.current.formatTime(20)).toBe('00:20');
    expect(result.current.formatTime(90)).toBe('01:30');
  });
});

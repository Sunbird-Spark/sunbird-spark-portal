import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { OtpService } from '../services/OtpService';
import { UserService } from '../services/UserService';
import { ApiResponse } from '../lib/http-client';

const otpService = new OtpService();
const userService = new UserService();

export const useLearnerFuzzySearch = (): UseMutationResult<
  ApiResponse<any>,
  Error,
  { identifier: string; name: string; captchaResponse?: string }
> => {
  return useMutation({
    mutationFn: (variables: { identifier: string; name: string; captchaResponse?: string }) =>
      userService.searchUser(variables.identifier, variables.name, variables.captchaResponse),
  });
};

export const useGenerateOtp = (): UseMutationResult<
  ApiResponse<any>,
  Error,
  { request: any; captchaResponse?: string }
> => {
  return useMutation({
    mutationFn: (variables: { request: any; captchaResponse?: string }) =>
      otpService.generateOtp(variables.request, variables.captchaResponse),
  });
};

export const useVerifyOtp = (): UseMutationResult<
  ApiResponse<any>,
  Error,
  { request: any }
> => {
  return useMutation({
    mutationFn: (variables: { request: any }) =>
      otpService.verifyOtp(variables.request),
  });
};

export const useResetPassword = (): UseMutationResult<
  ApiResponse<any>,
  Error,
  { request: any }
> => {
  return useMutation({
    mutationFn: (variables: { request: any }) =>
      userService.resetPassword(variables.request),
  });
};


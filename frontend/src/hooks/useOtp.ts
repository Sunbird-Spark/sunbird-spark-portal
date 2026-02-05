import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { OtpService } from '../services/OtpService';
import { ApiResponse } from '../lib/http-client';

const otpService = new OtpService();

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

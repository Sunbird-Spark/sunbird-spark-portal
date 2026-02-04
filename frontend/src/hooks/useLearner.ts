import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { LearnerService } from '../services/LearnerService';
import { ApiResponse } from '../lib/http-client';

const learnerService = new LearnerService();

export const useLearnerFuzzySearch = (): UseMutationResult<
  ApiResponse<any>,
  Error,
  { request: any; captchaResponse?: string }
> => {
  return useMutation({
    mutationFn: (variables: { request: any; captchaResponse?: string }) =>
      learnerService.fuzzyUserSearch(variables.request, variables.captchaResponse),
  });
};

export const useGenerateOtp = (): UseMutationResult<
  ApiResponse<any>,
  Error,
  { request: any; captchaResponse?: string }
> => {
  return useMutation({
    mutationFn: (variables: { request: any; captchaResponse?: string }) =>
      learnerService.generateOtp(variables.request, variables.captchaResponse),
  });
};

export const useVerifyOtp = (): UseMutationResult<
  ApiResponse<any>,
  Error,
  { request: any }
> => {
  return useMutation({
    mutationFn: (variables: { request: any }) =>
      learnerService.verifyOtp(variables.request),
  });
};

export const useResetPassword = (): UseMutationResult<
  ApiResponse<any>,
  Error,
  { request: any }
> => {
  return useMutation({
    mutationFn: (variables: { request: any }) =>
      learnerService.resetPassword(variables.request),
  });
};

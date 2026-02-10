import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { UserService } from '../services/UserService';
import { ApiResponse } from '../lib/http-client';

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

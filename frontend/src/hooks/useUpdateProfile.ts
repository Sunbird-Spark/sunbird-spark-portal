import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { UserService } from '../services/UserService';
import { ApiResponse } from '../lib/http-client';
import { UpdateProfileRequest, UpdateProfileResponse } from '../types/profileTypes';

const userService = new UserService();

const PROFILE_REFRESH_DELAY = 1500;

export const useUpdateProfile = (): UseMutationResult<
  ApiResponse<UpdateProfileResponse>,
  Error,
  UpdateProfileRequest
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateProfileRequest) =>
      userService.updateProfile(request),
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['userRead'] });
      }, PROFILE_REFRESH_DELAY);
    },
  });
};

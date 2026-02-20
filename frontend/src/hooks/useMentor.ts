import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { userService } from '../services/UserService';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

export interface MentorUser {
  identifier: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  maskedEmail?: string;
}

/**
 * Fetches all users with COURSE_MENTOR role in the current user's org.
 * Used to populate the Mentors selector in Create/Edit Batch modal.
 */
export const useMentorList = (): UseQueryResult<MentorUser[], Error> => {
  return useQuery({
    queryKey: ['mentorList'],
    queryFn: async (): Promise<MentorUser[]> => {
      // Resolve current user to get rootOrgId
      let userId = userAuthInfoService.getUserId();
      if (!userId) {
        const authInfo = await userAuthInfoService.getAuthInfo();
        userId = authInfo?.uid ?? null;
      }
      if (!userId) return [];

      const userResponse = await userService.userRead(userId);
      const rootOrgId = (userResponse.data.response as Record<string, unknown>).rootOrgId as
        | string
        | undefined;
      if (!rootOrgId) return [];

      const response = await userService.searchMentors(rootOrgId);
      const content: any[] = response?.data?.response?.content ?? [];
      return content.map((u) => ({
        identifier: u.identifier ?? u.userId,
        userId: u.userId ?? u.identifier,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        maskedEmail: u.maskedEmail,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserRead } from './useUserRead';
import { observabilityService } from '@/services/reports/ObservabilityService';
import type { UserCreationCountApiItem } from '@/types/reports';

export function useUserCreationCount(): {
  data: UserCreationCountApiItem[];
  totalUsers: number;
  isLoading: boolean;
  isError: boolean;
} {
  const { data: userReadData, isLoading: isUserLoading } = useUserRead();

  const rootOrgId = userReadData?.data?.response?.rootOrgId ?? null;

  const { data: result, isLoading: isCountLoading, isError } = useQuery({
    queryKey: ['userCreationCount', rootOrgId],
    queryFn: () => observabilityService.getUserCreationCount(rootOrgId!),
    enabled: !!rootOrgId,
    staleTime: 5 * 60_000,
  });

  const data = result?.data ?? [];

  const totalUsers = useMemo(
    () => data.reduce((sum, d) => sum + d.userCount, 0),
    [data],
  );

  return { data, totalUsers, isLoading: isUserLoading || isCountLoading, isError };
}

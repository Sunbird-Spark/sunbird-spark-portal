import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { observabilityService } from '@/services/reports/ObservabilityService';
import type { UserCreationCountApiItem } from '@/types/reports';

export function useUserCreationCount(): {
  data: UserCreationCountApiItem[];
  totalUsers: number;
  isLoading: boolean;
  isError: boolean;
} {
  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['userCreationCount'],
    queryFn: () => observabilityService.getUserCreationCount(),
    staleTime: 5 * 60_000,
  });

  const data = result?.data ?? [];

  const totalUsers = useMemo(
    () => data.reduce((sum, d) => sum + d.userCount, 0),
    [data],
  );

  return { data, totalUsers, isLoading, isError };
}

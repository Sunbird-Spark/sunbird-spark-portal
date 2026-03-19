import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserRead } from './useUserRead';
import { observabilityService } from '@/services/reports/ObservabilityService';
import type { ContentByGroup, ContentStatusCount, TopCreator } from '@/types/reports';
import { capitalize } from '@/utils/stringUtils';

export function useContentStatusSummary(): {
  statusData: ContentStatusCount[];
  topCreatorsData: TopCreator[];
  categoryData: ContentByGroup[];
  isLoading: boolean;
  isError: boolean;
} {
  const { data: userReadData, isPending: isUserLoading } = useUserRead();

  const rootOrgId = useMemo(() => {
    const response = userReadData?.data?.response as Record<string, unknown> | undefined;
    return (response?.rootOrgId as string | undefined) ?? null;
  }, [userReadData]);

  const { data: summaryResult, isLoading: isSummaryLoading, isError: isSummaryError } = useQuery({
    queryKey: ['contentStatusSummary', rootOrgId],
    queryFn: () => observabilityService.getContentStatusSummary(rootOrgId!),
    enabled: !!rootOrgId,
    staleTime: 5 * 60_000,
  });

  const statusData = useMemo<ContentStatusCount[]>(() => {
    const facet = summaryResult?.data.find((f) => f.facet === 'status');
    if (!facet || facet.facet !== 'status') return [];
    return facet.values.map((v) => ({ status: capitalize(v.status), count: v.count }));
  }, [summaryResult]);

  const topCreatorsData = useMemo<TopCreator[]>(() => {
    const facet = summaryResult?.data.find((f) => f.facet === 'createdBy');
    if (!facet || facet.facet !== 'createdBy') return [];
    return facet.values
      .filter((v) => v.userDetails)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((v) => ({
        name: `${v.userDetails!.firstName} ${v.userDetails!.lastName ?? ''}`.trim(),
        count: v.count,
      }));
  }, [summaryResult]);

  const categoryData = useMemo<ContentByGroup[]>(() => {
    const facet = summaryResult?.data.find((f) => f.facet === 'primaryCategory');
    if (!facet || facet.facet !== 'primaryCategory') return [];
    return facet.values.map((v) => ({ group: capitalize(v.primaryCategory), count: v.count }));
  }, [summaryResult]);

  return {
    statusData,
    topCreatorsData,
    categoryData,
    isLoading: isUserLoading || isSummaryLoading,
    isError: isSummaryError,
  };
}

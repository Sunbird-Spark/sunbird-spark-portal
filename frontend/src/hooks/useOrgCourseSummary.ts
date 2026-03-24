import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserRead } from './useUserRead';
import { ContentService } from '@/services/ContentService';
import { observabilityService } from '@/services/reports/ObservabilityService';
import type { AdminCourseSummary } from '@/types/reports';

/**
 * Fetches the org-level course enrolment summary:
 * 1. Gets rootOrgId from the logged-in user's profile
 * 2. Searches all courses for that org via /composite/v1/search
 * 3. Calls /observability/v1/reports with those course IDs
 * Returns AdminCourseSummary[] for the Admin Course Summary table.
 */
export function useOrgCourseSummary(): {
  data: AdminCourseSummary[];
  isLoading: boolean;
  isError: boolean;
} {
  const contentService = useMemo(() => new ContentService(), []);
  const { data: userReadData, isPending: isUserLoading } = useUserRead();

  const rootOrgId = useMemo(() => {
    const response = userReadData?.data?.response as Record<string, unknown> | undefined;
    return (response?.rootOrgId as string | undefined) ?? null;
  }, [userReadData]);

  const { data: courseSearchData, isLoading: isCoursesLoading, isError: isCoursesError } = useQuery({
    queryKey: ['orgCourses', rootOrgId],
    queryFn: () =>
      contentService.contentSearch({
        filters: {
          primaryCategory: ['Course'],
          channel: rootOrgId!,
        },
        fields: ['name', 'channel', 'createdFor'],
        sort_by: { lastUpdatedOn: 'desc' },
        limit: 1000,
      }),
    enabled: !!rootOrgId,
    staleTime: 5 * 60_000,
  });

  const courseIds = useMemo(() => {
    const items = courseSearchData?.data?.content ?? [];
    return items.map((c) => c.identifier).filter(Boolean);
  }, [courseSearchData]);

  const { data: summaryResult, isLoading: isSummaryLoading, isError: isSummaryError } = useQuery({
    queryKey: ['orgCourseSummary', courseIds],
    queryFn: () => observabilityService.getOrgCourseEnrolmentSummary(courseIds),
    enabled: courseIds.length > 0,
    staleTime: 5 * 60_000,
  });

  const data = useMemo<AdminCourseSummary[]>(() => {
    const items = summaryResult?.data ?? [];
    return items.map((item) => {
      const enrolled = item.total_enrolled ?? 0;
      const completed = item.total_completed ?? 0;
      return {
        id: item.courseid,
        courseName: item.collectionDetails?.name ?? item.courseid,
        totalEnrolled: enrolled,
        totalCompleted: completed,
        completionPercent: enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0,
        certificatesIssued: item.certificates_issued ?? 0,
      };
    });
  }, [summaryResult]);

  return {
    data,
    isLoading: isUserLoading || isCoursesLoading || isSummaryLoading,
    isError: isCoursesError || isSummaryError,
  };
}

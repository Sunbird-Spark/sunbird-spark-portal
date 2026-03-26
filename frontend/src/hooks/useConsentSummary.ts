import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { observabilityService } from '@/services/reports/ObservabilityService';
import type { UserConsentApiItem, UserConsentRecord } from '@/types/reports';

function mapApiItem(item: UserConsentApiItem, index: number): UserConsentRecord {
  const { userDetails, user_id, object_id, status, created_on, expiry, collectionDetails } = item;
  return {
    id: `${user_id}_${object_id}_${index}`,
    userId: user_id,
    userName: `${userDetails.firstName} ${userDetails.lastName}`.trim(),
    email: userDetails.maskedEmail,
    consentStatus: status === 'ACTIVE' ? 'Granted' : 'Revoked',
    course: collectionDetails?.name ?? '',
    consentGivenOn: created_on ? created_on.split('T')[0]! : null,
    expiry: expiry ? expiry.split('T')[0]! : '',
  };
}

export function useConsentSummary(): {
  data: UserConsentRecord[];
  isLoading: boolean;
  isError: boolean;
} {
  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['consentSummary'],
    queryFn: () => observabilityService.getConsentSummary(),
    staleTime: 5 * 60_000,
  });

  const data = useMemo<UserConsentRecord[]>(
    () => (result?.data ?? []).map(mapApiItem),
    [result],
  );

  return { data, isLoading, isError };
}

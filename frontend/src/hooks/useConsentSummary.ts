import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { observabilityService } from '@/services/reports/ObservabilityService';
import type { ConsentStatus, UserConsentApiItem, UserConsentRecord } from '@/types/reports';

const STATUS_MAP: Record<ConsentStatus, UserConsentRecord['consentStatus']> = {
  ACTIVE: 'Granted',
  REVOKED: 'Revoked',
};

function mapApiItem(item: UserConsentApiItem): UserConsentRecord {
  const { userDetails, user_id, object_id, status, created_on, expiry, collectionDetails } = item;
  return {
    id: `${user_id}_${object_id}`,
    userId: user_id,
    userName: `${userDetails.firstName} ${userDetails.lastName}`.trim(),
    email: userDetails.maskedEmail,
    consentStatus: STATUS_MAP[status] ?? 'Revoked',
    course: collectionDetails?.name ?? '',
    consentGivenOn: created_on ? created_on.split('T')[0]! : null,
    expiry: expiry ? expiry.split('T')[0]! : null,
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
    () => (result?.data ?? []).map((item) => mapApiItem(item)),
    [result],
  );

  return { data, isLoading, isError };
}

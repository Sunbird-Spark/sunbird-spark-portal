import { useState } from 'react';
import AvailableBatchesCard from '@/components/collection/AvailableBatchesCard';
import LoginToUnlockCard from '@/components/collection/LoginToUnlockCard';
import type { BatchListItem } from '@/types/collectionTypes';

interface EnrolCardProps {
  isAuthenticated: boolean;
  batches: BatchListItem[];
  batchListLoading: boolean;
  batchListError?: string;
  enrolLoading: boolean;
  enrolError?: string;
  onEnrol: (contextId: string) => void;
}

/** Enrol CTA / batch selector for the Learning Path overview — reuses the Course enrol cards as-is. */
export function EnrolCard({
  isAuthenticated,
  batches,
  batchListLoading,
  batchListError,
  enrolLoading,
  enrolError,
  onEnrol,
}: EnrolCardProps) {
  const [selectedBatchId, setSelectedBatchId] = useState('');

  if (!isAuthenticated) return <LoginToUnlockCard />;

  return (
    <AvailableBatchesCard
      batches={batches}
      selectedBatchId={selectedBatchId}
      onBatchSelect={setSelectedBatchId}
      onJoinCourse={() => selectedBatchId && onEnrol(selectedBatchId)}
      isLoading={batchListLoading}
      joinLoading={enrolLoading}
      error={batchListError}
      joinError={enrolError}
    />
  );
}

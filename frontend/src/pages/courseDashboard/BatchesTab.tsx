import React, { useState } from 'react';
import PageLoader from '@/components/common/PageLoader';
import { useBatchListForCreator, useBatchListForMentor, mergeBatches } from '@/hooks/useBatch';
import { useIsMentor, useIsContentCreator } from '@/hooks/useUser';
import type { Batch } from '@/services/BatchService';
import { getBatchStatus } from '@/components/collection/BatchRow';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/Select';
import { cn } from '@/lib/utils';
import CourseReportContent from '@/components/reports/CourseReportContent';
import useInteract from '@/hooks/useInteract';

const STATUS_STYLES: Record<string, string> = {
  Upcoming: "bg-yellow-100 text-yellow-700",
  Ongoing:  "bg-green-100 text-green-700",
  Expired:  "bg-gray-100  text-gray-500",
};

interface BatchesTabProps {
  collectionId: string;
}

const BatchesTab: React.FC<BatchesTabProps> = ({ collectionId }) => {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const isMentor = useIsMentor();
  const isContentCreator = useIsContentCreator();
  const { interact } = useInteract();

  const { data: creatorBatches, isLoading: isLoadingCreator, isError: isErrorCreator, error: creatorError } = useBatchListForCreator(collectionId, { enabled: isContentCreator });
  const { data: mentorBatches, isLoading: isLoadingMentor, isError: isErrorMentor, error: mentorError } = useBatchListForMentor(collectionId, { enabled: isMentor });

  const batches = mergeBatches(creatorBatches, mentorBatches);

  const isLoading = (isContentCreator && isLoadingCreator) || (isMentor && isLoadingMentor);
  const isError = (isContentCreator && isErrorCreator) || (isMentor && isErrorMentor);
  const error = (isContentCreator && creatorError) || (isMentor && mentorError);

  if (isLoading) {
    return (
      <div className="flex flex-1 overflow-hidden min-h-0 bg-white" data-testid="batches-loading">
        <div className="m-6">
          <PageLoader message="Loading batches…" fullPage={false} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 overflow-hidden min-h-0 bg-white" data-testid="batches-error">
        <div className="m-6">
          <PageLoader error={(error as Error)?.message ?? 'Failed to load batches.'} fullPage={false} />
        </div>
      </div>
    );
  }

  const batchList: Batch[] = batches ?? [];

  const handleBatchSelect = (batchId: string) => {
    interact({ id: 'course-dashboard-batch-select', type: 'CLICK', pageid: 'course-dashboard', cdata: [{ id: batchId, type: 'Batch' }] });
    setSelectedBatchId(batchId);
  };

  return (
    <div className="flex flex-col bg-gray-50/50 p-6 gap-6 rounded-2xl" data-testid="batches-tab">

      {/* Batch Selector Dropdown */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-semibold text-foreground font-['Rubik'] shrink-0">
          Select Batch
        </label>
        {batchList.length === 0 ? (
          <p className="text-sm text-muted-foreground font-['Rubik']">No batches found.</p>
        ) : (
          <Select onValueChange={handleBatchSelect}>
            <SelectTrigger
              className="w-full max-w-md bg-white border-border focus:ring-sunbird-brick"
              data-testid="batch-select-trigger"
            >
              <SelectValue placeholder="Choose a batch to view its report…" />
            </SelectTrigger>
            <SelectContent>
              {batchList.map((batch) => {
                const status = getBatchStatus(batch.status);
                return (
                  <SelectItem key={batch.id} value={batch.id}>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{batch.name}</span>
                      <span
                        className={cn(
                          "inline-flex items-center text-[0.625rem] font-medium rounded-full px-2 py-0.5",
                          STATUS_STYLES[status]
                        )}
                      >
                        {status}
                      </span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Report panel */}
      <main
        className="bg-white rounded-2xl shadow-[0_0.125rem_0.75rem_rgba(0,0,0,0.08)] border border-border"
        data-testid="batches-main-panel"
      >
        {selectedBatchId ? (
          <div className="p-6">
            <CourseReportContent
              courseId={collectionId}
              batchId={selectedBatchId}
              batchStartDate={batchList.find((b) => b.id === selectedBatchId)?.startDate}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center py-16 px-8">
            <p className="text-muted-foreground text-sm font-['Rubik']" data-testid="no-batch-selected">
              Select a batch from the dropdown above to view its course report.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default BatchesTab;

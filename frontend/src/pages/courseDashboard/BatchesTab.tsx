import React, { useState } from 'react';
import PageLoader from '@/components/common/PageLoader';
import { useBatchListForCreator } from '@/hooks/useBatch';
import type { Batch } from '@/services/BatchService';
import { getBatchStatus } from '@/components/collection/BatchRow';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  Upcoming: "bg-yellow-100 text-yellow-700",
  Ongoing:  "bg-green-100 text-green-700",
  Expired:  "bg-gray-100  text-gray-500",
};

interface BatchesTabProps {
  collectionId: string;
}

const BatchesTab: React.FC<BatchesTabProps> = ({ collectionId }) => {
  const { data: batches, isLoading, isError, error } = useBatchListForCreator(collectionId);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

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
  const selectedBatch = batchList.find((b) => b.id === selectedBatchId) ?? null;

  return (
    <div className="flex flex-1 overflow-hidden min-h-0 bg-gray-50/50 p-6 gap-6" data-testid="batches-tab">
      
      {/* Left sidebar — styled as BatchCard */}
      <aside className="w-80 min-w-[20rem] flex flex-col bg-white rounded-2xl shadow-[0_0.125rem_0.75rem_rgba(0,0,0,0.08)] border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-white z-10">
          <p className="text-sm font-semibold text-foreground font-['Rubik']">
            Batches
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto w-full p-4 flex flex-col gap-3">
          {batchList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
              <p className="text-xs font-['Rubik']">
                No batches found.
              </p>
            </div>
          ) : (
            batchList.map((batch) => {
              const status = getBatchStatus(batch.status);
              const isSelected = selectedBatchId === batch.id;
              
              return (
                <button
                  key={batch.id}
                  data-testid={`batch-item-${batch.id}`}
                  className={cn(
                    "flex flex-col w-full text-left p-4 rounded-xl border transition-all duration-200",
                    isSelected
                      ? "bg-white border-sunbird-brick shadow-[0_0_0_1px_rgba(179,80,0,1)]"
                      : "bg-white border-border hover:shadow-sm hover:border-sunbird-brick/50"
                  )}
                  onClick={() => setSelectedBatchId(batch.id)}
                >
                  <div className="flex items-start justify-between gap-2 w-full mb-2">
                    <span className={cn(
                      "text-sm font-semibold font-['Rubik'] leading-snug break-words",
                      isSelected ? "text-sunbird-brick" : "text-foreground"
                    )}>
                      {batch.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between w-full mt-auto">
                     <div className="text-xs text-muted-foreground font-['Rubik']">
                       ID: <span className="font-mono">{batch.id.slice(-6)}</span>
                     </div>
                     <span
                      className={cn(
                        "inline-flex items-center text-[0.625rem] font-medium rounded-full px-2 py-0.5 font-['Rubik']",
                        STATUS_STYLES[status]
                      )}
                    >
                      {status}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Main panel */}
      <main className="flex-1 bg-white rounded-2xl shadow-[0_0.125rem_0.75rem_rgba(0,0,0,0.08)] border border-border p-8 overflow-y-auto">
        {selectedBatch ? (
          <div data-testid="selected-batch-panel">
            <h2 className="text-xl font-semibold mb-2 text-foreground font-['Rubik']">
              {selectedBatch.name}
            </h2>
            <p className="text-sm text-muted-foreground font-['Rubik']">
              Batch ID: {selectedBatch.id}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm font-['Rubik']" data-testid="no-batch-selected">
            Select a batch from the list to view details.
          </p>
        )}
      </main>
    </div>
  );
};

export default BatchesTab;

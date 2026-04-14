// Manages local UI state for CollectionDetailPage: certificate preview modal,
// batch selector, accordion expansion, and the telemetry-instrumented toggleModule handler.
import { useState, useCallback } from "react";
import useInteract from "@/hooks/useInteract";

interface UseCollectionPageUIStateProps {
  batchIdParam: string | undefined;
}

export const useCollectionPageUIState = ({ batchIdParam }: UseCollectionPageUIStateProps) => {
  const { interact } = useInteract();
  const [certificatePreviewOpen, setCertificatePreviewOpen] = useState(false);
  const [certificatePreviewUrl, setCertificatePreviewUrl] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  const toggleModule = useCallback((moduleId: string) => {
    interact({
      id: 'collection-unit-toggle',
      type: 'CLICK',
      pageid: batchIdParam ? 'course-consumption' : 'collection-detail',
      cdata: [{ id: moduleId, type: 'Unit' }]
    });
    setExpandedModules((prev) => (prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]));
  }, [interact, batchIdParam]);

  return {
    certificatePreviewOpen,
    setCertificatePreviewOpen,
    certificatePreviewUrl,
    setCertificatePreviewUrl,
    selectedBatchId,
    setSelectedBatchId,
    expandedModules,
    setExpandedModules,
    toggleModule,
  };
};

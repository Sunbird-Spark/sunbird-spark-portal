/**
 * Updates the local batch list cache optimistically when a certificate is attached.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function applyOptimisticBatchCertUpdate(oldBatches: any[] | undefined, batchId: string, selectedTemplateId: string, selectedTemplate: any) {
/* eslint-enable @typescript-eslint/no-explicit-any */
  if (!oldBatches) return oldBatches;
  return oldBatches.map((b) => {
    if (b.id === batchId) {
      return {
        ...b,
        certTemplates: {
          [selectedTemplateId]: {
            identifier: selectedTemplateId,
            name: selectedTemplate.name,
          },
        },
      };
    }
    return b;
  });
}

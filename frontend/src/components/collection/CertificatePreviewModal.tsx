import { Button } from "@/components/common/Button";
import { FiX } from "react-icons/fi";

interface CertificatePreviewModalProps {
  open: boolean;
  onClose: () => void;
  previewUrl: string;
}

export default function CertificatePreviewModal({
  open,
  onClose,
  previewUrl,
}: CertificatePreviewModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Certificate preview"
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-semibold font-rubik text-foreground">
            Certificate Preview
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex-1 min-h-0 p-4 overflow-auto">
          <img
            src={previewUrl}
            alt="Certificate preview"
            className="w-full h-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
}

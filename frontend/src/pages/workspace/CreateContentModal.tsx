import { Button } from "@/components/common/Button";
import CreateOptions from "@/components/workspace/CreateOptions";

interface CreateContentModalProps {
  open: boolean;
  onClose: () => void;
  onOptionSelect: (optionId: string) => void;
}

export default function CreateContentModal({
  open,
  onClose,
  onOptionSelect,
}: CreateContentModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Create content"
    >
      <div
        className="bg-[#F4F4F4] rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-['Rubik'] text-foreground">Create Content</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close dialog"
          >
            ✕
          </Button>
        </div>
        <CreateOptions onOptionSelect={onOptionSelect} />
      </div>
    </div>
  );
}

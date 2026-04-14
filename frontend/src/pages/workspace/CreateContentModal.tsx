import { Button } from "@/components/common/Button";
import CreateOptions from "@/components/workspace/CreateOptions";
import { useAppI18n } from "@/hooks/useAppI18n";

interface CreateContentModalProps {
  open: boolean;
  onClose: () => void;
  onOptionSelect: (optionId: string) => void;
  isBookCreator?: boolean;
}

export default function CreateContentModal({
  open,
  onClose,
  onOptionSelect,
  isBookCreator = false,
}: CreateContentModalProps) {
  const { t } = useAppI18n();
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('workspace.createContent')}
    >
      <div
        className="bg-sunbird-gray-f3 rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-rubik text-foreground">{t('workspace.createContent')}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label={t('workspace.closeDialog')}
          >
            ✕
          </Button>
        </div>
        <CreateOptions onOptionSelect={onOptionSelect} isBookCreator={isBookCreator} />
      </div>
    </div>
  );
}

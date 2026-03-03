import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { useAppI18n } from '@/hooks/useAppI18n';

const COLLECTION_TYPES = [
  { value: 'content-playlist', labelKey: 'collection.contentPlaylist' },
  { value: 'digital-textbook', labelKey: 'collection.digitalTextbook' },
  { value: 'question-paper', labelKey: 'collection.questionPaper' },
] as const;

interface ContentNameDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, extra?: { description?: string; collectionType?: string }) => void;
  isLoading?: boolean;
  optionTitle?: string;
  optionId?: string;
  submitButtonProps?: Record<string, any>;
}

export default function ContentNameDialog({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  optionTitle,
  optionId,
  submitButtonProps,
}: ContentNameDialogProps) {
  const { t } = useAppI18n();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [collectionType, setCollectionType] = useState("");

  const isCollection = optionId === 'collection';

  // Reset fields when dialog is closed
  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setCollectionType("");
    }
  }, [open]);

  const handleClose = useCallback(() => {
    setName("");
    setDescription("");
    setCollectionType("");
    onClose();
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isLoading, handleClose]);

  if (!open) return null;

  const canSubmit = name.trim() && (!isCollection || collectionType);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (isCollection) {
      if (!collectionType) return;
      onSubmit(trimmed, { description: description.trim() || undefined, collectionType });
    } else {
      onSubmit(trimmed);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={isCollection ? `${t('create')} ${t('collection.label')}` : t('workspace.enterContentName')}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold font-rubik text-foreground mb-2">
          {t('create')} {optionTitle || t('content.label')}
        </h2>
        <p className="text-sm text-muted-foreground mb-4 font-rubik">
          {isCollection
            ? t('workspace.fillDetails')
            : t('workspace.fillDetails')}
        </p>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium font-rubik text-foreground mb-1">
            {t('workspace.name')}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('workspace.enterName', { type: optionTitle?.toLowerCase() || "content" })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-rubik focus:outline-none focus:ring-2 focus:ring-sunbird-brick/40 focus:border-sunbird-brick mb-4"
            autoFocus
            disabled={isLoading}
          />

          {isCollection && (
            <>
              <label className="block text-sm font-medium font-rubik text-foreground mb-1">
                {t('workspace.description')}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('workspace.enterDescription')}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-rubik focus:outline-none focus:ring-2 focus:ring-sunbird-wave/50 focus:border-sunbird-wave mb-4"
                disabled={isLoading}
              />

              <label className="block text-sm font-medium font-rubik text-foreground mb-1">
                {t('workspace.collectionType')} <span className="text-red-500">*</span>
              </label>
              <select
                value={collectionType}
                onChange={(e) => setCollectionType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-rubik focus:outline-none focus:ring-2 focus:ring-sunbird-brick/40 focus:border-sunbird-brick mb-4 bg-white"
                disabled={isLoading}
              >
                <option value="" disabled>{t('workspace.selectCollectionType')}</option>
                {COLLECTION_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>{t(ct.labelKey)}</option>
                ))}
              </select>
            </>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isLoading}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!canSubmit || isLoading}
              className="bg-sunbird-brick hover:bg-sunbird-brick/90 text-white"
              {...submitButtonProps}
              data-cdata={submitButtonProps?.['data-cdata'] ? JSON.stringify([...JSON.parse(submitButtonProps['data-cdata']), { id: name, type: 'ContentName' }]) : JSON.stringify([{ id: name, type: 'ContentName' }])}
            >
              {isLoading ? t('workspace.creating') : t('create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

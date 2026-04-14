import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiAward, FiCheck } from "react-icons/fi";
import { useAppI18n } from "@/hooks/useAppI18n";

interface TemplatePreviewModalProps {
  previewTemplate: string | null;
  setPreviewTemplate: (val: string | null) => void;
  certTemplates: any[];
  setSelectedTemplateId: (val: string) => void;
}

export function TemplatePreviewModal({
  previewTemplate,
  setPreviewTemplate,
  certTemplates,
  setSelectedTemplateId,
}: TemplatePreviewModalProps) {
  const { t } = useAppI18n();

  if (!previewTemplate) return null;

  const tmpl = certTemplates.find((t) => t.identifier === previewTemplate);
  if (!tmpl) return null;

  return (
    <Dialog.Root
      open={!!previewTemplate}
      onOpenChange={(o) => { if (!o) setPreviewTemplate(null); }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/60" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[60] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl focus:outline-none overflow-hidden"
          style={{ width: "min(90vw, 44rem)" }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <Dialog.Title className="text-base font-semibold text-sunbird-obsidian font-rubik">
              {tmpl.name}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-gray-100 transition-colors"
                aria-label={t('certificate.closePreview')}
              >
                <FiX className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-5">
            {tmpl.previewUrl ? (
              <img
                src={tmpl.previewUrl}
                alt={tmpl.name}
                className="w-full rounded-lg border border-border object-contain"
                style={{ maxHeight: "60vh" }}
              />
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-3 bg-gray-50 rounded-lg border border-border"
                style={{ height: "16rem" }}
              >
                <FiAward className="w-12 h-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-rubik">{t('certificate.noPreviewAvailable')}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg px-5 py-2 text-sm font-medium text-foreground bg-gray-100 hover:bg-gray-200 transition-colors font-rubik"
              >
                {t('certificate.closeButton')}
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={() => {
                setSelectedTemplateId(tmpl.identifier);
                setPreviewTemplate(null);
              }}
              className="rounded-lg px-5 py-2 text-sm font-medium text-white bg-sunbird-brick hover:bg-opacity-90 transition-colors font-rubik inline-flex items-center gap-2"
            >
              <FiCheck className="w-4 h-4" />
              {t('certificate.selectButton')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

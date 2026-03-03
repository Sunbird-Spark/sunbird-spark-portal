import { FiAward } from "react-icons/fi";
import { useAppI18n } from "@/hooks/useAppI18n";

interface CurrentCertificatePanelProps {
  existingCertTemplates: Record<string, any>;
  setCertTab: (tab: "current" | "change") => void;
}

export function CurrentCertificatePanel({
  existingCertTemplates,
  setCertTab,
}: CurrentCertificatePanelProps) {
  const { t } = useAppI18n();
  const entries = Object.entries(existingCertTemplates);
  if (entries.length === 0) return null;

  // Render only the latest/last certificate to prevent multiple attached templates visually
  const [id, tmpl] = entries[entries.length - 1] as [string, any];
  const preview = tmpl?.artifactUrl ?? tmpl?.previewUrl ?? "";
  const name = tmpl?.name ?? id;
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-sunbird-obsidian font-['Rubik'] uppercase tracking-wide">
          {t('certificate.attachedTemplate')}
        </h3>
        <button
          type="button"
          onClick={() => setCertTab("change")}
          className="text-sm font-medium text-sunbird-brick hover:underline font-['Rubik']"
        >
          {t('certificate.editCertificate')}
        </button>
      </div>

      <div className="max-w-md">
        <div className="rounded-xl border-2 border-sunbird-brick/40 overflow-hidden bg-white shadow-sm">
          <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center relative overflow-hidden">
            {preview ? (
              <img src={preview} alt={name} className="object-cover w-full h-full" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <FiAward className="w-8 h-8" />
                <span className="text-xs font-['Rubik']">{t('certificate.noPreviewAvailable')}</span>
              </div>
            )}
          </div>
          <div className="px-3 py-2 border-t border-border">
            <p className="text-xs font-semibold font-['Rubik'] text-foreground truncate">{name}</p>
            <p className="text-xs text-muted-foreground font-['Rubik'] truncate mt-0.5">{id}</p>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground font-['Rubik'] italic" dangerouslySetInnerHTML={{ __html: t('certificate.activeTemplateDescription') }} />
    </div>
  );
}

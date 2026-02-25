import { FiAward } from "react-icons/fi";

interface CurrentCertificatePanelProps {
  existingCertTemplates: Record<string, any>;
  setCertTab: (tab: "current" | "change") => void;
}

export function CurrentCertificatePanel({
  existingCertTemplates,
  setCertTab,
}: CurrentCertificatePanelProps) {
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
          Attached Certificate Template
        </h3>
        <button
          type="button"
          onClick={() => setCertTab("change")}
          className="text-sm font-medium text-sunbird-brick hover:underline font-['Rubik']"
        >
          Edit Certificate
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
                <span className="text-xs font-['Rubik']">No preview available</span>
              </div>
            )}
          </div>
          <div className="px-3 py-2 border-t border-border">
            <p className="text-xs font-semibold font-['Rubik'] text-foreground truncate">{name}</p>
            <p className="text-xs text-muted-foreground font-['Rubik'] truncate mt-0.5">{id}</p>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground font-['Rubik'] italic">
        This is the active certificate template for this batch. Click <strong>Edit Certificate</strong> to make changes to its configuration or replace it.
      </p>
    </div>
  );
}

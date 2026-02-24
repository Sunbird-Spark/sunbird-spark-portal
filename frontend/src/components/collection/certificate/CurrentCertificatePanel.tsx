import { FiAward } from "react-icons/fi";

interface CurrentCertificatePanelProps {
  existingCertTemplates: Record<string, any>;
}

export function CurrentCertificatePanel({
  existingCertTemplates,
}: CurrentCertificatePanelProps) {
  const entries = Object.entries(existingCertTemplates);
  return (
    <div className="p-6 space-y-5">
      <h3 className="text-sm font-semibold text-sunbird-obsidian font-['Rubik'] uppercase tracking-wide">
        Attached Certificate Templates
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {entries.map(([id, tmpl]: [string, any]) => {
          const preview = tmpl?.artifactUrl ?? tmpl?.previewUrl ?? "";
          const name = tmpl?.name ?? id;
          return (
            <div
              key={id}
              className="rounded-xl border-2 border-sunbird-brick/40 overflow-hidden bg-white shadow-sm"
            >
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
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground font-['Rubik'] italic">
        To replace this certificate, switch to the <strong>Change Certificate</strong> tab.
      </p>
    </div>
  );
}

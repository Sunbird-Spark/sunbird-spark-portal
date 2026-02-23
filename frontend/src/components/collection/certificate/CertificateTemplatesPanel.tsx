import { FiRefreshCw, FiPlus, FiLoader, FiAward } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { TemplateThumbnail } from "../TemplateThumbnail";
import { ModalView } from "./types";

interface CertificateTemplatesPanelProps {
  handleRefreshTemplates: () => Promise<void>;
  templatesRefreshing: boolean;
  setView: (val: ModalView) => void;
  setErrorMsg: (val: string) => void;
  templatesLoading: boolean;
  certTemplates: any[];
  selectedTemplateId: string | null;
  setPreviewTemplate: (id: string) => void;
}

export function CertificateTemplatesPanel({
  handleRefreshTemplates,
  templatesRefreshing,
  setView,
  setErrorMsg,
  templatesLoading,
  certTemplates,
  selectedTemplateId,
  setPreviewTemplate,
}: CertificateTemplatesPanelProps) {
  return (
    <div className="w-72 flex-shrink-0 p-4 space-y-3 overflow-y-auto bg-gray-50/50">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-sunbird-obsidian font-['Rubik'] uppercase tracking-wide">
          Certificate Template
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleRefreshTemplates}
            disabled={templatesRefreshing}
            title="Refresh templates"
            className="p-1.5 rounded-lg border border-border bg-white text-muted-foreground hover:text-sunbird-brick hover:bg-sunbird-brick/8 transition-colors shadow-sm"
          >
            <FiRefreshCw className={cn("w-3.5 h-3.5", templatesRefreshing && "animate-spin")} />
          </button>
          <button
            type="button"
            onClick={() => { setView("createTemplate"); setErrorMsg(""); }}
            title="Create new template"
            className="p-1.5 rounded-lg border border-border bg-white text-sunbird-brick hover:bg-sunbird-brick hover:text-white transition-colors shadow-sm"
          >
            <FiPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {templatesLoading && (
        <div className="flex items-center justify-center py-8">
          <FiLoader className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!templatesLoading && certTemplates.length === 0 && (
        <div className="text-center py-8">
          <FiAward className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground font-['Rubik']">No templates available.</p>
          <button
            type="button"
            onClick={() => { setView("createTemplate"); setErrorMsg(""); }}
            className="mt-2 text-xs text-sunbird-brick hover:underline font-['Rubik']"
          >
            Create New Template
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {certTemplates.map((tmpl) => (
          <TemplateThumbnail
            key={tmpl.identifier}
            name={tmpl.name}
            previewUrl={tmpl.previewUrl}
            selected={selectedTemplateId === tmpl.identifier}
            onClick={() => setPreviewTemplate(tmpl.identifier)}
          />
        ))}
      </div>
    </div>
  );
}

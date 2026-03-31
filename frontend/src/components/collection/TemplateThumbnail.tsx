import { FiAward, FiCheck } from "react-icons/fi";
import { cn } from "@/lib/utils";

interface TemplateThumbnailProps {
  name: string;
  previewUrl?: string;
  selected?: boolean;
  onClick: () => void;
}

export function TemplateThumbnail({ name, previewUrl, selected, onClick }: TemplateThumbnailProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-edataid="cert-template-preview"
      data-pageid="course-consumption"
      className={cn(
        "rounded-lg border-2 overflow-hidden transition-all text-left w-full",
        selected
          ? "border-sunbird-brick shadow-md"
          : "border-border hover:border-sunbird-brick/50"
      )}
    >
      <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center relative overflow-hidden">
        {previewUrl ? (
          <img src={previewUrl} alt={name} className="object-cover w-full h-full" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <FiAward className="w-6 h-6" />
            <span className="text-xs font-rubik">Preview</span>
          </div>
        )}
        {selected && (
          <div className="absolute top-1 right-1 bg-sunbird-brick text-white rounded-full p-0.5">
            <FiCheck className="w-3 h-3" />
          </div>
        )}
      </div>
      <div className="px-2 py-1.5 border-t border-border bg-white">
        <p className="text-xs font-medium font-rubik text-foreground truncate">{name}</p>
      </div>
    </button>
  );
}

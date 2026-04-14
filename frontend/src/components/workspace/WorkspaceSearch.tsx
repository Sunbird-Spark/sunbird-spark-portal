import { useState, useEffect, useRef } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { Button } from "@/components/common/Button";
import { useAppI18n } from "@/hooks/useAppI18n";

interface WorkspaceSearchProps {
  query: string;
  onChange: (value: string) => void;
}

const WorkspaceSearch = ({ query, onChange }: WorkspaceSearchProps) => {
  const { t } = useAppI18n();
  const [isOpen, setIsOpen] = useState(!!query);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close the search bar when the parent clears the query (e.g. on role change)
  useEffect(() => {
    if (!query) setIsOpen(false);
  }, [query]);

  const handleClear = () => { onChange(''); setIsOpen(false); };

  if (!isOpen) {
    return (
      <Button
        variant="outline" size="sm" className="font-rubik rounded-xl"
        aria-label={t('workspace.searchPlaceholder')}
        onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}
      >
        <FiSearch className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 h-9 transition-all border border-transparent min-w-0 flex-1 md:w-56">
      <FiSearch className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <input
        ref={inputRef} type="text" value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('workspace.searchPlaceholder')}
        aria-label={t('workspace.searchPlaceholder')}
        className="bg-transparent border-none outline-none text-sm font-rubik min-w-0 flex-1 placeholder:text-muted-foreground"
        onKeyDown={(e) => { if (e.key === 'Escape') handleClear(); }}
      />
      <Button variant="ghost" size="icon" onClick={handleClear} aria-label={t('workspace.clearSearch')}
        className="p-0.5 h-auto w-auto text-muted-foreground hover:text-foreground transition-colors">
        <FiX className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

export default WorkspaceSearch;

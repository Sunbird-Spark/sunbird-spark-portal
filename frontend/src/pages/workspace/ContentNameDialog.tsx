import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/common/Button";

interface ContentNameDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  isLoading?: boolean;
  optionTitle?: string;
}

export default function ContentNameDialog({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  optionTitle,
}: ContentNameDialogProps) {
  const [name, setName] = useState("");

  // Reset name when dialog is closed (including from parent via open prop)
  useEffect(() => {
    if (!open) {
      setName("");
    }
  }, [open]);

  const handleClose = useCallback(() => {
    setName("");
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Enter content name"
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold font-rubik text-foreground mb-2">
          Create {optionTitle || "Content"}
        </h2>
        <p className="text-sm text-muted-foreground mb-4 font-rubik">
          Enter a name for your new content
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Untitled Content"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-rubik focus:outline-none focus:ring-2 focus:ring-sunbird-wave/50 focus:border-sunbird-wave mb-4"
            autoFocus
            disabled={isLoading}
          />
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!name.trim() || isLoading}
              className="bg-sunbird-brick hover:bg-sunbird-brick/90 text-white"
            >
              {isLoading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React from "react";
import { FiLoader, FiImage } from "react-icons/fi";
import { cn } from "@/lib/utils";

interface ImageItem {
  identifier: string;
  name: string;
  url: string;
}

interface ImageGalleryProps {
  loading: boolean;
  images: ImageItem[];
  emptyMessage: string;
  selectedUrl: string | null;
  onSelect: (url: string) => void;
}

export function ImageGallery({ loading, images, emptyMessage, selectedUrl, onSelect }: ImageGalleryProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <FiLoader className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FiImage className="w-8 h-8 mx-auto mb-2" />
        <p className="text-xs font-['Rubik']">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {images.map((img) => (
        <button
          key={img.identifier}
          type="button"
          title={img.name}
          onClick={() => onSelect(img.url)}
          className={cn(
            "aspect-square rounded-lg overflow-hidden border-2 transition-colors",
            selectedUrl === img.url
              ? "border-sunbird-brick"
              : "border-transparent hover:border-border"
          )}
        >
          <img src={img.url} alt={img.name} className="object-cover w-full h-full" />
        </button>
      ))}
    </div>
  );
}

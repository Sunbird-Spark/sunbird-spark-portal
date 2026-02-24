import React from "react";
import { cn } from "@/lib/utils";
import { getPrimaryCategoryIcon } from "@/services/workspace";
import type { WorkspaceItem } from "@/types/workspaceTypes";
import { getPrimaryCategoryCardTheme, type CardTheme } from "@/services/workspace/contentDisplayConfig";
import {
  WavePatternSVG,
  BlobPatternSVG,
  OrbPatternSVG,
  DiamondPatternSVG,
} from "./CardThumbnailPatterns";

interface CardThumbnailBackgroundProps {
  type: WorkspaceItem["type"];
  primaryCategory?: string;
  iconSize?: "sm" | "lg";
}

/**
 * Light-themed abstract SVG backgrounds for workspace content cards.
 * Each primaryCategory gets a distinct color scheme from the Sunbird design tokens.
 * Falls back to type-based theming when primaryCategory is not provided.
 *
 * Color assignments (from Figma design tokens):
 *  - Course / Digital Textbook  → Wave (#70adbf) + Ink (#376673)
 *  - Textbook / eTextbook       → Sunflower (#ffdb73) + Ginger (#cc8545)
 *  - Video / Learning Resource   → Ginger (#cc8545) + Brick (#a85236)
 *  - PDF / Teacher Resource      → Forest (#82a668) + Moss (#66a682)
 *  - Quiz / Assessment           → Lavender (#99708a) + Jamun (#540f3b)
 *  - Collection / Playlist       → Leaf (#a1a603) + Forest (#82a668)
 */

/**
 * Map of content type → SVG pattern component.
 * Each type gets a visually distinct pattern shape:
 *  - course  → waves (fluid learning journey)
 *  - content → blobs (organic/creative resources)
 *  - quiz    → orbs  (question bubbles / thought circles)
 *  - collection → diamonds (structured, organized)
 */
const PATTERN_FOR_TYPE: Record<WorkspaceItem["type"], React.FC<{ theme: CardTheme }>> = {
  course: WavePatternSVG,
  content: BlobPatternSVG,
  quiz: OrbPatternSVG,
  collection: DiamondPatternSVG,
};

const CardThumbnailBackground = ({
  type,
  primaryCategory,
  iconSize = "lg",
}: CardThumbnailBackgroundProps) => {
  const theme = getPrimaryCategoryCardTheme(primaryCategory, type);
  const PatternSVG = PATTERN_FOR_TYPE[type];
  const CategoryIcon = getPrimaryCategoryIcon(primaryCategory, type);

  return (
    <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-500">
      <PatternSVG theme={theme} />
      <div className="absolute inset-0 flex items-center justify-center">
        <CategoryIcon
          className={cn("relative z-10", iconSize === "sm" ? "w-4 h-4" : "w-12 h-12")}
          style={{
            color: theme.iconColor,
            opacity: 0.7,
            filter: `drop-shadow(0 2px 8px ${theme.accent}33)`,
          }}
        />
      </div>
    </div>
  );
};

export default CardThumbnailBackground;

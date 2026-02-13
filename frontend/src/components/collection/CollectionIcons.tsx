// Import video and document icons
import iconVideo from "@/assets/icon-video.svg";
import iconDocument from "@/assets/icon-document.svg";

// Video/Document icons using imported images
export const VideoIcon = () => (
  <img src={iconVideo} alt="Video" className="flex-shrink-0 w-[1.375rem] h-[0.875rem]" />
);

export const DocumentIcon = () => (
  <img src={iconDocument} alt="Document" className="flex-shrink-0 w-[1.0625rem] h-[1.3125rem]" />
);

export const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-sunbird-brick flex-shrink-0">
    <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

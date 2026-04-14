import { FiVideo, FiFileText } from "react-icons/fi";

const iconWrapperClass = "inline-flex items-center flex-shrink-0";

export const VideoIcon = () => (
  <span className={`${iconWrapperClass} w-8 h-5 text-sunbird-brick`} aria-hidden>
    <FiVideo className="w-full h-full" />
  </span>
);

export const DocumentIcon = () => (
  <span className={`${iconWrapperClass} w-6 h-7 text-sunbird-brick`} aria-hidden>
    <FiFileText className="w-full h-full" />
  </span>
);

export const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-sunbird-brick flex-shrink-0">
    <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

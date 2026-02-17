import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Allows all safe HTML tags by default, but blocks dangerous elements like scripts
 * @param html - Raw HTML string to sanitize
 * @returns Sanitized HTML string safe for rendering
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  
  // Use DOMPurify's default configuration which allows most HTML tags
  // but automatically removes dangerous elements like <script>, <iframe>, event handlers, etc.
  const sanitized = DOMPurify.sanitize(html);

  return sanitized;
};

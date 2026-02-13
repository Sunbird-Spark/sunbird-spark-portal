/**
 * TypeScript declaration for sunbird-video-player web component
 * This allows TypeScript to recognize the custom element in JSX
 */
import type React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'sunbird-video-player': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

export {};

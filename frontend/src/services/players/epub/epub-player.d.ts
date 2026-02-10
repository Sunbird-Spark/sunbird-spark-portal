/**
 * TypeScript declaration for sunbird-epub-player web component
 * This allows TypeScript to recognize the custom element in JSX
 */
import type React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'sunbird-epub-player': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

export {};

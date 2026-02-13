/**
 * TypeScript declaration for sunbird-quml-player web component
 * and related globals used by the QUML player.
 */
import type React from 'react';

declare global {
  interface Window {
    questionListUrl: string;
  }

  namespace JSX {
    interface IntrinsicElements {
      'sunbird-quml-player': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

export {};

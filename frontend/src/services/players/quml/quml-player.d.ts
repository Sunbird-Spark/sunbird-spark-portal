/**
 * TypeScript declaration for sunbird-quml-player web component
 * and related globals used by the QUML player.
 */
import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'sunbird-quml-player': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

declare global {
  interface Window {
    questionListUrl: string;
  }
}

import React from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'sunbird-quml-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'player-config'?: string;
      };
    }
  }
}

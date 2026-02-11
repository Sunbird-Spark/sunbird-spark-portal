/// <reference types="vite/client" />
import React from 'react';

declare global {
  interface Window {
    questionListUrl: string;
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'sunbird-quml-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

/**
 * Type declarations for Sunbird web components and global types
 */

import type { JQueryStatic } from 'jquery';

declare global {
  interface Window {
    $: JQueryStatic;
    jQuery: JQueryStatic;
  }

  namespace NodeJS {
    interface Timeout {}
  }
}

declare module 'jquery.fancytree' {
  const content: any;
  export default content;
}

declare module 'jquery.fancytree/dist/modules/jquery.fancytree.glyph.js' {
  const content: any;
  export default content;
}

declare module 'jquery.fancytree/dist/modules/jquery.fancytree.dnd5.js' {
  const content: any;
  export default content;
}

declare namespace JSX {
  interface IntrinsicElements {
    'sunbird-quml-player': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      ref?: React.Ref<HTMLElement>;
    };
    'sunbird-quml-editor': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      ref?: React.Ref<HTMLElement>;
    };
    'lib-questionset-editor': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      ref?: React.Ref<HTMLElement>;
    };
  }
}

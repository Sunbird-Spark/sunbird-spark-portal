// Setup jQuery globally before any jQuery UI imports
// This must be imported first in any file that uses jQuery UI
import jQuery from 'jquery';

// Make jQuery available globally for jQuery UI and FancyTree
(globalThis as any).$ = jQuery;
(globalThis as any).jQuery = jQuery;

export default jQuery;

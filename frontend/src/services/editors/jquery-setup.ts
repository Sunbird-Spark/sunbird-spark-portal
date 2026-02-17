/**
 * jQuery Global Setup
 * 
 * This module MUST be imported first before any jQuery UI imports.
 * It ensures jQuery is available on globalThis before jQuery UI tries to access it.
 * 
 * Why this is needed:
 * - jQuery UI expects jQuery to be globally available as `window.$` or `window.jQuery`
 * - When using ES modules, jQuery doesn't automatically set itself globally
 * - This module explicitly sets jQuery on globalThis before jQuery UI loads
 */

import $ from 'jquery';

// Make jQuery globally available
(globalThis as any).$ = $;
(globalThis as any).jQuery = $;

// Export jQuery as default for convenience
export default $;

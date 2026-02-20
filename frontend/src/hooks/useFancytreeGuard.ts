/**
 * useFancytreeGuard
 *
 * Keeps the FancyTree-capable jQuery instance alive on `globalThis.$` / `globalThis.jQuery`.
 *
 * Problem context
 * ---------------
 * Editor Angular bundles (loaded as web-components) sometimes overwrite the
 * global `$` / `jQuery` with a plain jQuery that has no FancyTree plugin
 * attached.  When that happens the tree widget breaks silently.
 *
 * Strategy — property setter trap (no polling)
 * --------------------------------------------
 * Instead of polling we use `Object.defineProperty` to replace the plain data
 * properties `globalThis.$` and `globalThis.jQuery` with accessor descriptors
 * (getter + setter).  The setter fires synchronously the instant any code writes
 * to those globals.  If the incoming value lacks FancyTree we silently swap it
 * for the saved FancyTree-capable reference before the write completes.
 *
 * This is zero-overhead between writes and reacts in O(1) time — no timers,
 * no intervals, no exponential back-off needed.
 *
 * Teardown
 * --------
 * On unmount we restore the original property descriptors so the trap does not
 * outlive the editor.
 */

import { useEffect } from 'react';

/** Names we want to intercept on the global object. */
const GLOBALS = ['$', 'jQuery'] as const;

/**
 * @param enabled - Install the trap only when the editor is fully mounted.
 */
export function useFancytreeGuard(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    // Snapshot the original descriptors so we can restore them on cleanup.
    const originalDescriptors = new Map<string, PropertyDescriptor | undefined>();
    let fancytreeJQueryRef: any = null;

    // Capture the current FancyTree-capable jQuery reference
    const currentJQuery = (globalThis as any).$ || (globalThis as any).jQuery;
    if (currentJQuery?.fn?.fancytree) {
      fancytreeJQueryRef = currentJQuery;
    }

    for (const key of GLOBALS) {
      originalDescriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key));

      // Seed the internal slot with whatever is currently on the global.
      let _value: any = (globalThis as any)[key];

      Object.defineProperty(globalThis, key, {
        configurable: true,
        enumerable: true,

        get() {
          return _value;
        },

        set(incoming: any) {
          if (incoming?.fn?.fancytree) {
            // The incoming value already has FancyTree — accept it.
            _value = incoming;
            fancytreeJQueryRef = incoming;
          } else {
            // Strip detected: keep the FancyTree-capable reference instead.
            _value = fancytreeJQueryRef ?? incoming; // fall back to incoming if nothing saved yet
          }
        },
      });
    }

    return () => {
      // Remove the traps and put the original descriptors back.
      for (const key of GLOBALS) {
        const original = originalDescriptors.get(key);
        if (original) {
          Object.defineProperty(globalThis, key, original);
        } else {
          // Property didn't exist before — delete the trap descriptor.
          try {
            delete (globalThis as any)[key];
          } catch {
            // Non-configurable in some environments; leave it.
          }
        }
      }
    };
  }, [enabled]);
}

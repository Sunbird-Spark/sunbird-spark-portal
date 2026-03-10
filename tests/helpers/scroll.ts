import { Page, ElementHandle } from '@playwright/test';

// Scroll the given element into the vertical center of its nearest scrollable ancestor.
// This is more reliable than `scrollIntoView` when there are sticky headers or overlays.
export async function scrollElementToCenter(page: Page, elHandle: ElementHandle<Element>, rootHandle?: ElementHandle<Element>) {
  // If a rootHandle is provided, center within that ancestor; otherwise search up to the document root.
  if (rootHandle) {
    // Retry a few times to let any animations/layout settle
    for (let attempt = 0; attempt < 3; attempt++) {
      const visible = await elHandle.evaluate((element: Element, root: Element) => {
        function getScrollableAncestorWithin(rootNode: Element, node: Element | null): Element | Document {
          while (node && node !== rootNode) {
            try {
              const style = window.getComputedStyle(node);
              const overflowY = style.overflowY || '';
              if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > (node as HTMLElement).clientHeight) {
                return node;
              }
            } catch {}
            node = node.parentElement;
          }
          // fallback to the rootNode itself
          return rootNode;
        }

        const elEl = element as HTMLElement;
        const rootNode = root as Element;
        const container = getScrollableAncestorWithin(rootNode, elEl.parentElement);
        const elRect = elEl.getBoundingClientRect();
        const containerRect = (container instanceof Element) ? (container as Element).getBoundingClientRect() : { top: 0, height: window.innerHeight } as DOMRect;
        const containerClientHeight = (container instanceof Element) ? (container as HTMLElement).clientHeight : window.innerHeight;

        const offset = (elRect.top - containerRect.top) - (containerClientHeight / 2) + (elRect.height / 2);
        try {
          if (container === document.scrollingElement || container === document.documentElement) {
            window.scrollBy({ top: offset, left: 0, behavior: 'auto' });
          } else {
            (container as HTMLElement).scrollTop = (container as HTMLElement).scrollTop + offset;
          }
        } catch {}

        try { elEl.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch {}

        // Check visibility inside container
        const newRect = elEl.getBoundingClientRect();
        return newRect.top >= containerRect.top && newRect.bottom <= containerRect.bottom;
      }, rootHandle);

      if (visible) break;
      await page.waitForTimeout(150);
    }
  } else {
    for (let attempt = 0; attempt < 3; attempt++) {
      const visible = await elHandle.evaluate((element: Element) => {
        function getScrollableAncestor(node: Element | null): Element | Document {
          while (node && node !== document.documentElement) {
            try {
              const style = window.getComputedStyle(node);
              const overflowY = style.overflowY || '';
              if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > (node as HTMLElement).clientHeight) {
                return node;
              }
            } catch {}
            node = node.parentElement;
          }
          return document.scrollingElement || document.documentElement;
        }

        const elEl = element as HTMLElement;
        const container = getScrollableAncestor(elEl);
        const elRect = elEl.getBoundingClientRect();
        const containerRect = (container instanceof Element) ? (container as Element).getBoundingClientRect() : { top: 0, height: window.innerHeight } as DOMRect;
        const containerClientHeight = (container instanceof Element) ? (container as HTMLElement).clientHeight : window.innerHeight;

        const offset = (elRect.top - containerRect.top) - (containerClientHeight / 2) + (elRect.height / 2);
        try {
          if (container === document.scrollingElement || container === document.documentElement) {
            window.scrollBy({ top: offset, left: 0, behavior: 'auto' });
          } else {
            (container as HTMLElement).scrollTop = (container as HTMLElement).scrollTop + offset;
          }
        } catch {}

        try { elEl.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch {}

        const newRect = elEl.getBoundingClientRect();
        return newRect.top >= containerRect.top && newRect.bottom <= containerRect.bottom;
      });

      if (visible) break;
      await page.waitForTimeout(150);
    }
  }
}

import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useTelemetry } from '@/hooks/useTelemetry';

interface InteractData {
    id: string;
    type?: string;
    subtype?: string;
    pageid?: string;
    extra?: Record<string, any>;
    object?: { id: string; type: string; ver?: string };
    cdata?: Array<{ id: string; type: string }>;
}

/**
 * Custom hook for programmatic telemetry INTERACT events.
 * Returns a stable `interact` function to call on user actions.
 *
 * Use this when you need to pass dynamic data that can't be expressed
 * via declarative `data-edataid` attributes (e.g. editor events, search queries).
 *
 * For simple button/click tracking, prefer the declarative approach:
 *   <button data-edataid="my-button" data-pageid="home">Click</button>
 *
 * @example
 * const { interact } = useInteract();
 * interact({ id: 'search-query', type: 'SEARCH', cdata: [{ id: query, type: 'Query' }] });
 * interact({ id: 'faq', type: 'TOUCH', subtype: 'toggle-clicked', extra: { values: { ... } } });
 */
const useInteract = () => {
    const location = useLocation();
    const telemetry = useTelemetry();

    const interact = useCallback(
        ({ id, type = 'CLICK', subtype, pageid, extra, object, cdata }: InteractData) => {
            const effectivePageId = pageid || location.pathname;

            telemetry.interact({
                edata: {
                    type,
                    id,
                    ...(subtype && { subtype }),
                    pageid: effectivePageId,
                    extra,
                },
                ...(object && { object }),
                ...(cdata && { options: { context: { cdata } } }),
            });
        },
        [telemetry, location.pathname]
    );

    return { interact };
};

export default useInteract;

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTelemetry } from '@/hooks/useTelemetry';
import { navigationHelperService } from '@/services/NavigationHelperService';

interface ImpressionData {
    type?: string;
    subtype?: string;
    pageid?: string;
    object?: Record<string, any>;
}

/**
 * Custom hook to generate telemetry impression events automatically on navigation.
 * Uses React context (`useTelemetry`) to construct and send standard Sunbird
 * telemetry IMPRESSION structures.
 *
 * Duration tracking:
 *   - On each route change, reads elapsed time since the last pageStartTime
 *     via navigationHelperService.getPageLoadTime().
 *   - After firing the impression, resets pageStartTime so the next page's
 *     impression captures dwell time on the current page.
 *   - storeUrlHistory() deduplicates same-URL navigations (refresh / same-page links).
 */
const useImpression = ({ type = "view", subtype, pageid, object = {} }: ImpressionData) => {
    const location = useLocation();
    const { pathname } = location;
    const telemetry = useTelemetry();

    // Default the page identification to the path name (removing leading slash if desired, or verbatim)
    const effectivePageId = pageid || pathname;

    useEffect(() => {
        // Deduplicate same-URL navigations (mirrors storeUrlHistory from reference service)
        navigationHelperService.storeUrlHistory(pathname);

        // Duration = seconds elapsed since last pageStartTime (set at module load or after prev impression)
        const duration = parseFloat(navigationHelperService.getPageLoadTime().toFixed(3));

        const edata: Record<string, any> = {
            type,
            pageid: effectivePageId,
            uri: pathname,
            duration
        };
        // Only include subtype when explicitly provided — sample structure omits it
        if (subtype) {
            edata.subtype = subtype;
        }

        telemetry.impression({
            edata,
            object: Object.keys(object).length > 0 ? object : undefined
        });

        // Reset pageStartTime after firing so the NEXT page's impression captures
        // how long the user spent on this page (mirrors NavigationStart recording in reference)
        navigationHelperService.pageStartTime = Date.now();
    }, [effectivePageId, pathname, telemetry]);

};

export default useImpression;

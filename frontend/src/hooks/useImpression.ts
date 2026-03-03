import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTelemetry } from '@/hooks/useTelemetry';

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
 */
const useImpression = ({ type = "view", subtype, pageid, object = {} }: ImpressionData) => {
    const location = useLocation();
    const { pathname } = location;
    const telemetry = useTelemetry();

    // Default the page identification to the path name (removing leading slash if desired, or verbatim)
    const effectivePageId = pageid || pathname;

    useEffect(() => {
        const edata = { 
            type, 
            subtype, 
            pageid: effectivePageId, 
            uri: pathname 
        };

        telemetry.impression({
            edata,
            object: Object.keys(object).length > 0 ? object : undefined
        });
    }, [effectivePageId, pathname, telemetry]);

};

export default useImpression;

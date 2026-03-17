import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTelemetry } from '@/hooks/useTelemetry';
import { type TelemetryEventInput } from '@/services/TelemetryService';
import { navigationHelperService } from '@/services/NavigationHelperService';

// ── Module-level helper: pure function, no hook state ───────────────────────
function buildImpressionInput(
    edataOverrides: Record<string, unknown>,
    currentObject: Record<string, unknown>,
    currentEnv?: string
): TelemetryEventInput {
    const impressionInput: TelemetryEventInput = { edata: edataOverrides };
    // context.env mirrors IImpressionEventInput.context.env from SunbirdEd spec
    if (currentEnv) {
        impressionInput.context = { env: currentEnv };
    }
    if (Object.keys(currentObject).length > 0) {
        impressionInput.object = currentObject;
    }
    return impressionInput;
}

/** Mirrors IImpressionEventVisits from SunbirdEd-portal telemetry interfaces */
export interface ImpressionEventVisit {
    objid: string;
    objtype: string;
    objver?: string;
    section?: string;
    index: string | number;
}

interface ImpressionData {
    type?: string;
    subtype?: string;
    pageid?: string;
    /**
     * Maps to context.env in IImpressionEventInput.
     * Required by SunbirdEd telemetry spec to identify which section of the
     * portal the user is in (e.g. 'home', 'explore', 'course', 'workspace').
     */
    env?: string;
    object?: Record<string, unknown>;
    /**
     * Items visible in the viewport on this page (inview tracking).
     * Mirrors IImpressionEventVisits[] from the SunbirdEd portal spec.
     * Included in edata.visits when provided.
     */
    visits?: ImpressionEventVisit[];
    /**
     * When true, fires a second IMPRESSION with subtype='pageexit' on component
     * unmount — mirrors ngOnDestroy behaviour of TelemetryImpressionDirective.
     */
    pageexit?: boolean;
}

/**
 * Custom hook to generate telemetry impression events automatically on navigation.
 * Uses React context (`useTelemetry`) to construct and send standard Sunbird
 * telemetry IMPRESSION structures.
 *
 * Aligns with SunbirdEd-portal TelemetryImpressionDirective:
 *   - `env`     → context.env (mandatory in original spec, optional here for compat)
 *   - `visits`  → edata.visits (viewport-visible items, mirrors inview tracking)
 *   - `pageexit`→ fires second impression with subtype='pageexit' on unmount
 *
 * Duration tracking:
 *   - On each route change, reads elapsed time since the last pageStartTime
 *     via navigationHelperService.getPageLoadTime().
 *   - After firing the impression, resets pageStartTime so the next page's
 *     impression captures dwell time on the current page.
 *   - storeUrlHistory() records the URL for deduplication; same-URL navigations
 *     are suppressed inside the service itself.
 */
const useImpression = ({ type = "view", subtype, pageid, env, object = {}, visits, pageexit }: ImpressionData) => {
    const location = useLocation();
    const { pathname, search, hash } = location;
    const telemetry = useTelemetry();
    const telemetryRef = useRef(telemetry);
    useEffect(() => { telemetryRef.current = telemetry; }, [telemetry]);

    // Keep latest values accessible inside the pageexit cleanup without deps
    const visitsRef = useRef(visits);
    useEffect(() => { visitsRef.current = visits; }, [visits]);

    // Full URL (pathname + query string + hash) used for both uri and deduplication
    const fullUrl = pathname + search + hash;
    const fullUrlRef = useRef(fullUrl);
    useEffect(() => { fullUrlRef.current = fullUrl; }, [fullUrl]);

    // Default the page identification to the path name
    const effectivePageId = pageid || pathname;
    const effectivePageIdRef = useRef(effectivePageId);
    useEffect(() => { effectivePageIdRef.current = effectivePageId; }, [effectivePageId]);

    const objectRef = useRef(object);
    useEffect(() => { objectRef.current = object; }, [object]);

    const envRef = useRef(env);
    useEffect(() => { envRef.current = env; }, [env]);

    // Track latest pageexit value via ref so cleanup always reads the current value
    const pageexitRef = useRef(pageexit);
    useEffect(() => { pageexitRef.current = pageexit; }, [pageexit]);

    // ── Main impression effect — fires on each navigation ───────────────────
    useEffect(() => {
        // Guard: skip IMPRESSION when navigating to the same URL (e.g. refresh,
        // same-page link). storeUrlHistory returns false for duplicate URLs.
        const isNewUrl = navigationHelperService.storeUrlHistory(fullUrl);
        if (!isNewUrl) return;

        // Duration = seconds elapsed since last pageStartTime
        const duration = parseFloat(navigationHelperService.getPageLoadTime().toFixed(3));

        const edata: Record<string, unknown> = {
            type,
            pageid: effectivePageId,
            uri: fullUrl, // full URL including query string and hash
            duration
        };
        if (subtype) {
            edata.subtype = subtype;
        }
        // Include visits array when provided — mirrors edata.visits in SunbirdEd spec
        if (visits && visits.length > 0) {
            edata.visits = visits;
        }

        telemetryRef.current.impression(buildImpressionInput(edata, object, env));

        // Reset pageStartTime after firing so the NEXT page's impression captures
        // how long the user spent on this page
        navigationHelperService.resetPageStartTime();
    // location.key changes on every history push/replace, including same-pathname
    // navigations, ensuring a fresh impression fires on each distinct history entry.
    }, [effectivePageId, fullUrl, location.key]); // intentional: telemetry/env/visits accessed via ref

    // ── Pageexit effect — mirrors ngOnDestroy of TelemetryImpressionDirective ─
    // Always registers cleanup so it fires even when pageexit becomes true after
    // mount (e.g. after data loads). The ref is checked inside the cleanup.
    useEffect(() => {
        return () => {
            if (!pageexitRef.current) return;
            const exitEdata: Record<string, unknown> = {
                type,
                pageid: effectivePageIdRef.current,
                uri: fullUrlRef.current,
                subtype: 'pageexit',
            };
            const currentVisits = visitsRef.current;
            if (currentVisits && currentVisits.length > 0) {
                exitEdata.visits = currentVisits;
            }
            telemetryRef.current.impression(
                buildImpressionInput(exitEdata, objectRef.current, envRef.current)
            );
        };
    }, []); // intentional: runs once on mount, cleanup fires on unmount with latest values via refs
};

export default useImpression;

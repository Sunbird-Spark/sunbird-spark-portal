import { useEffect, useRef } from 'react';
import { useTelemetry } from '@/hooks/useTelemetry';

interface PageSessionOptions {
  pageid: string;
  type?: string;
  mode?: string;
  object?: { id: string; type: string; ver?: string };
}

/**
 * Fires a telemetry START event when the page mounts and an END event (with
 * elapsed duration) when it unmounts — mirroring the [appTelemetryStart] /
 * [appTelemetryEnd] directives used in SunbirdEd-portal's Angular course player.
 *
 * Usage:
 *   usePageSession({ pageid: 'content-player', object: { id: contentId, type: 'Content' } });
 */
export const usePageSession = ({
  pageid,
  type = 'view',
  mode = 'play',
  object,
}: PageSessionOptions) => {
  const telemetry = useTelemetry();
  const mountTimeRef = useRef<number>(Date.now());
  const sessionRef = useRef({ type, mode, pageid, object });

  useEffect(() => {
    sessionRef.current = { type, mode, pageid, object };
    mountTimeRef.current = Date.now();
    const s = sessionRef.current;

    telemetry.start(
      {},
      s.object?.id || s.pageid,
      s.object?.ver || '1.0',
      { type: s.type, mode: s.mode, pageid: s.pageid }
    );

    return () => {
      const s = sessionRef.current;
      const duration = parseFloat(
        ((Date.now() - mountTimeRef.current) / 1000).toFixed(3)
      );

      telemetry.end({
        edata: { type: s.type, mode: s.mode, pageid: s.pageid, duration },
        ...(s.object
          ? { object: { id: s.object.id, type: s.object.type, ver: s.object.ver || '1.0' } }
          : {}),
      });
    };
  }, [pageid, object?.id]);
};

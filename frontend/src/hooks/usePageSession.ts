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
const usePageSession = ({
  pageid,
  type = 'view',
  mode = 'play',
  object,
}: PageSessionOptions) => {
  const telemetry = useTelemetry();
  const mountTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    mountTimeRef.current = Date.now();

    telemetry.start(
      {},
      object?.id || pageid,
      object?.ver || '1.0',
      { type, mode, pageid }
    );

    return () => {
      const duration = parseFloat(
        ((Date.now() - mountTimeRef.current) / 1000).toFixed(3)
      );

      telemetry.end({
        edata: { type, mode, pageid, duration },
        ...(object
          ? { object: { id: object.id, type: object.type, ver: object.ver || '1.0' } }
          : {}),
      });
    };
  }, [pageid, object?.id]);
};

export default usePageSession;

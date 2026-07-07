/**
 * GenericEditor — native React content editor (replaces the legacy iframe editor).
 *
 * Mounts the standalone @project-sunbird/generic-editor-v2 library. Builds the editor
 * context from the portal's existing services (reusing GenericEditorService.buildEditorContext),
 * passes the active portal language (theme follows the portal's :root seed vars
 * automatically), forwards telemetry, and wires thumbnail/asset upload.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ContentEditor } from '@project-sunbird/generic-editor-v2';
import type { EditorContext, EditorEventPayload, TelemetryEvent } from '@project-sunbird/generic-editor-v2';
import '@project-sunbird/generic-editor-v2/dist/sunbird-generic-editor.css';
import { useAppI18n } from '@/hooks/useAppI18n';
import { useAuth } from '@/auth/AuthContext';
import { GenericEditorService, buildEditorConfig } from '@/services/editors/generic-editor';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';
import PageLoader from '@/components/common/PageLoader';

export interface GenericEditorComponentProps {
  contentId?: string;
  state?: string;
  framework?: string;
  contentStatus?: string;
  /** Large-content mode: restricts uploads to mp4/webm/zip with a 15 GB cap. */
  isLargeFileUpload?: boolean;
  onClose?: () => void;
  onError?: (error: string) => void;
}

const TELEMETRY_ENDPOINT = '/action/data/v3/telemetry';

/** Forward editor telemetry to the portal telemetry endpoint (best-effort). */
function postTelemetry(event: TelemetryEvent): void {
  try {
    fetch(TELEMETRY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        id: 'api.telemetry',
        ver: '3.0',
        ts: new Date().toISOString(),
        events: [event],
        params: { msgid: event.mid },
      }),
    }).catch(() => {});
  } catch {
    /* non-fatal */
  }
}

/** Upload an image asset (thumbnail/appIcon) → returns its artifactUrl. */
async function uploadAsset(file: File, creator?: string, createdBy?: string): Promise<string> {
  const createResp = await fetch('/action/asset/v3/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({
      request: {
        content: {
          name: file.name,
          mimeType: file.type || 'image/png',
          mediaType: 'image',
          contentType: 'Asset',
          primaryCategory: 'Asset',
          code: `asset-${Date.now()}`,
          ...(creator ? { creator } : {}),
          ...(createdBy ? { createdBy } : {}),
        },
      },
    }),
  });
  const created = await createResp.json();
  const assetId = created?.result?.identifier ?? created?.result?.node_id;
  if (!assetId) throw new Error('Asset create failed');

  const form = new FormData();
  form.append('file', file);
  const upResp = await fetch(`/action/asset/v3/upload/${encodeURIComponent(assetId)}`, {
    method: 'POST',
    credentials: 'same-origin',
    body: form,
  });
  const up = await upResp.json();
  const url = up?.result?.artifactUrl ?? up?.result?.content_url;
  if (!url) throw new Error('Asset upload failed');
  return String(url);
}

const GenericEditor: React.FC<GenericEditorComponentProps> = ({
  contentId,
  state,
  framework,
  contentStatus,
  isLargeFileUpload,
  onClose,
  onError,
}) => {
  const { currentCode, t } = useAppI18n();
  const { user } = useAuth();
  const [context, setContext] = useState<EditorContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep onError current without making it an effect dependency (avoids re-running
  // the context build whenever the parent recreates the callback).
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    const svc = new GenericEditorService();
    // Re-run resets to the loading state so a new contentId / late-resolved user
    // never leaves a stale context mounted.
    setError(null);
    setContext(null);

    (async () => {
      try {
        let details;
        if (contentId) {
          details = await svc.getContentDetails(contentId);
          if (cancelled) return;
          // Client-side access gate (UX/defense-in-depth only, not a security boundary).
          const userId = userAuthInfoService.getUserId() || '';
          if (!svc.validateRequest(details, userId, state)) {
            const msg = t('editors.noPermission');
            setError(msg);
            onErrorRef.current?.(msg);
            return;
          }
        }

        const c = await svc.buildEditorContext(
          { contentId, state, framework, contentStatus },
          details,
          isLargeFileUpload,
        );
        if (cancelled) return;

        const orgs = c.user?.organisations ?? {};
        const editorContext: EditorContext = {
          uid: c.user?.id ?? '',
          sid: c.sid,
          did: c.did,
          channel: c.channel,
          pdata: { id: c.pdata.id, pid: c.pdata.pid ?? 'sunbird-portal', ver: c.pdata.ver },
          framework: c.framework || framework,
          user: {
            id: c.user?.id ?? '',
            name: c.user?.name ?? '',
            rootOrgId: c.channel,
            organisationIds: Object.keys(orgs),
            organisationNames: Object.values(orgs) as string[],
            roles: user?.roles ?? [],
          },
        };
        setContext(editorContext);
      } catch (e) {
        if (cancelled) return;
        const msg = t('editors.initError');
        setError(msg);
        onErrorRef.current?.(String((e as Error)?.message ?? msg));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [contentId, state, framework, contentStatus, isLargeFileUpload, user, t]);

  const handleAsset = useCallback(
    (file: File) => uploadAsset(file, context?.user?.name, context?.user?.id),
    [context],
  );

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-xl text-center">
          <p className="text-gray-700 mb-6 font-rubik">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-sunbird-theme-accent text-white rounded-lg font-rubik font-medium"
          >
            {t('editors.goBack')}
          </button>
        </div>
      </div>
    );
  }

  if (!context) return <PageLoader message={t('editors.loading')} />;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <ContentEditor
        context={context}
        contentId={contentId}
        config={buildEditorConfig({ largeUpload: !!isLargeFileUpload, language: currentCode })}
        language={currentCode}
        onClose={onClose}
        onUploadAsset={handleAsset}
        onTelemetryEvent={postTelemetry}
        onEvent={(e: EditorEventPayload) => {
          if (e.eid === 'editor:closed') onClose?.();
        }}
      />
    </div>
  );
};

export default GenericEditor;
